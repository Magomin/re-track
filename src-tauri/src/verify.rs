// Comprueba un paso contra el snapshot de Live (antes retrack/verify.py).
// El match sobre Check obliga a cubrir todos los checks del schema: añadir uno sin su
// comprobación no compila (sustituye al test "checks y schema van a la par").
use crate::leccion::{Check, Nota};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::BTreeSet;

// Solo lo que miramos del snapshot de get_session_snapshot; el resto se ignora.
#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct Snapshot {
    pub session: Session,
    pub tracks: Vec<Pista>,
    // El master como una pista más (nombre "Master" en las lecciones): devices y fader.
    pub master_track: Option<Pista>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct Session {
    pub tempo: f64,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct Pista {
    pub name: String,
    pub devices: Vec<Device>,
    pub clip_slots: Vec<Hueco>,
    // El snapshot solo trae el valor bruto del fader; el dB lo pone `leer_volumen`.
    #[serde(skip)]
    pub volumen_db: Option<f64>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct Device {
    pub class_name: String,
    pub parameters: Vec<Parametro>,
    // Devices dentro de un rack (Instrument/Drum/Audio Effect Rack): ahí suele estar el sonido.
    pub chains: Vec<Cadena>,
}

#[derive(Debug, Default, Deserialize, Serialize)]
#[serde(default)]
pub struct Parametro {
    pub name: String,
    pub value: f64,
    // Rango del parámetro en Live (la escala de la barra del panel).
    pub min: f64,
    pub max: f64,
    // Lo que Live enseña en pantalla ("-6.0 dB", "1.20 kHz").
    pub value_string: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct Cadena {
    pub devices: Vec<Device>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct Hueco {
    pub has_clip: bool,
    pub clip: Option<Clip>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct Clip {
    pub notes: Vec<NotaLive>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct NotaLive {
    pub pitch: u8,
    pub start_time: f64,
    pub duration: f64,
}

#[derive(Debug, Serialize, PartialEq)]
pub struct Falta {
    pub nombre: String,
    pub compas: u32,
    pub pitch: u8,
    pub inicio: f64,
    pub duracion: f64,
}

pub fn cumple(check: &Check, snapshot: &Snapshot) -> bool {
    match check {
        Check::TrackExiste(nombre) => pista(snapshot, nombre).is_some(),
        // Tolerancia mínima: Live guarda el tempo como float (126.5 puede volver como 126.4999).
        Check::TempoEs(bpm) => (snapshot.session.tempo - bpm).abs() < 0.01,
        Check::DeviceEnPista {
            pista: nombre,
            device,
        } => devices(snapshot, nombre, device).next().is_some(),
        Check::ClipEnPista(nombre) => {
            pistas(snapshot, nombre).any(|p| p.clip_slots.iter().any(|h| h.has_clip))
        }
        Check::NotasEnClip {
            pista: nombre,
            notas,
        } => buscadas(notas).is_subset(&notas_de_pista(snapshot, nombre)),
        Check::ParametroEnRango {
            pista,
            device,
            parametro,
            min,
            max,
        } => {
            parametros(snapshot, pista, device, parametro).any(|p| (*min..=*max).contains(&p.value))
        }
        Check::VolumenEnRango {
            pista: nombre,
            min,
            max,
        } => pista(snapshot, nombre)
            .and_then(|p| p.volumen_db)
            .is_some_and(|db| (*min..=*max).contains(&db)),
    }
}

// Pide a Live el fader de la pista en dB (comando "mixer" sin cambios = solo lectura) y lo
// guarda en el snapshot. `mixer` = la llamada a Live, inyectada para poder probarlo sin Live.
pub fn leer_volumen(
    snapshot: &mut Snapshot,
    nombre: &str,
    mixer: impl FnOnce(Value) -> Result<Value, String>,
) -> Result<(), String> {
    let destino = if nombre.eq_ignore_ascii_case("master") {
        json!({"master": true})
    } else {
        let nombre_min = nombre.to_lowercase();
        match snapshot
            .tracks
            .iter()
            .position(|p| p.name.to_lowercase() == nombre_min)
        {
            Some(i) => json!({"track_index": i}),
            None => return Ok(()), // sin pista: el check ya falla y el detalle lo explica
        }
    };
    let texto = mixer(destino)?["volume"].as_str().unwrap_or("").to_string();
    let db = db_de_texto(&texto).ok_or(format!("Volumen de Live ilegible: {texto:?}"))?;
    if let Some(p) = pista_mut(snapshot, nombre) {
        p.volumen_db = Some(db);
    }
    Ok(())
}

// "-13.0 dB" -> -13.0; "-inf dB" -> -70 (el fondo de la escala del panel; JSON no admite -inf).
fn db_de_texto(texto: &str) -> Option<f64> {
    let numero = texto.trim().trim_end_matches("dB").trim();
    if numero == "-inf" {
        return Some(-70.0);
    }
    numero.parse::<f64>().ok().map(|db| db.max(-70.0))
}

// Para el panel: el fader como un parámetro (valor en dB y la escala de un fader de Live).
pub fn volumen_como_parametro(snapshot: &Snapshot, nombre: &str) -> Option<Parametro> {
    pista(snapshot, nombre)
        .and_then(|p| p.volumen_db)
        .map(|db| Parametro {
            name: "Volumen".into(),
            value: db,
            min: -40.0,
            max: 6.0,
            value_string: None,
        })
}

pub fn detalle_volumen(snapshot: &Snapshot, nombre: &str, min: f64, max: f64) -> String {
    match pista(snapshot, nombre).and_then(|p| p.volumen_db) {
        None => format!("No encuentro la pista {nombre}"),
        Some(db) if db < min => format!("Volumen de {nombre} ahora {db:.1} dB: súbelo"),
        Some(db) if db > max => format!("Volumen de {nombre} ahora {db:.1} dB: bájalo"),
        Some(db) => format!("Volumen de {nombre} ahora {db:.1} dB: ya está en su sitio"),
    }
}

// El parámetro tal como está en Live (valor y escala, para la aguja del panel).
pub fn leer_parametro<'a>(
    snapshot: &'a Snapshot,
    pista: &str,
    device: &str,
    parametro: &'a str,
) -> Option<&'a Parametro> {
    parametros(snapshot, pista, device, parametro).next()
}

// Texto para el panel cuando un parametro_en_rango no se cumple: hacia dónde girar el
// parámetro (el snapshot de Live 12 no trae el texto de pantalla, solo el valor bruto),
// o qué falta para poder leerlo.
pub fn detalle_parametro(
    snapshot: &Snapshot,
    pista: &str,
    device: &str,
    parametro: &str,
    min: f64,
    max: f64,
) -> String {
    if self::pista(snapshot, pista).is_none() {
        return format!("No encuentro la pista {pista}");
    }
    if devices(snapshot, pista, device).next().is_none() {
        return format!("No encuentro {device} en {pista}");
    }
    let Some(p) = parametros(snapshot, pista, device, parametro).next() else {
        return format!("{device} no tiene el parámetro {parametro}");
    };
    let ahora = match &p.value_string {
        Some(texto) => format!("{parametro} ahora {texto}"),
        None => parametro.to_string(),
    };
    if p.value < min {
        format!("{ahora}: súbelo")
    } else if p.value > max {
        format!("{ahora}: bájalo")
    } else {
        format!("{ahora}: ya está en su sitio")
    }
}

pub fn notas_que_faltan(snapshot: &Snapshot, nombre_pista: &str, notas: &[Nota]) -> Vec<Falta> {
    // BTreeSet ordenado por (inicio, pitch): las que faltan salen en orden de lectura.
    buscadas(notas)
        .difference(&notas_de_pista(snapshot, nombre_pista))
        .map(|&(inicio, pitch, duracion)| Falta {
            nombre: nombre_nota(pitch),
            compas: (inicio / 16) as u32 + 1,
            pitch,
            inicio: inicio as f64 / 4.0,
            duracion: duracion as f64 / 4.0,
        })
        .collect()
}

pub fn nombre_nota(pitch: u8) -> String {
    const NOMBRES: [&str; 12] = [
        "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
    ];
    // Convención de Live: C3 = 60, así que la octava es pitch / 12 - 2.
    format!(
        "{}{}",
        NOMBRES[(pitch % 12) as usize],
        pitch as i32 / 12 - 2
    )
}

fn pistas<'a>(snapshot: &'a Snapshot, nombre: &str) -> impl Iterator<Item = &'a Pista> {
    let nombre = nombre.to_lowercase();
    let master = snapshot
        .master_track
        .as_ref()
        .filter(|_| nombre == "master");
    snapshot
        .tracks
        .iter()
        .filter(move |p| p.name.to_lowercase() == nombre)
        .chain(master)
}

fn pista_mut<'a>(snapshot: &'a mut Snapshot, nombre: &str) -> Option<&'a mut Pista> {
    if nombre.eq_ignore_ascii_case("master") {
        return snapshot.master_track.as_mut();
    }
    let nombre = nombre.to_lowercase();
    snapshot
        .tracks
        .iter_mut()
        .find(|p| p.name.to_lowercase() == nombre)
}

fn pista<'a>(snapshot: &'a Snapshot, nombre: &str) -> Option<&'a Pista> {
    pistas(snapshot, nombre).next()
}

// Todos los devices de la pista con ese class_name, también los que están dentro de racks.
fn devices<'a>(
    snapshot: &'a Snapshot,
    pista: &str,
    class_name: &str,
) -> impl Iterator<Item = &'a Device> {
    fn aplanar<'a>(lista: &'a [Device], salida: &mut Vec<&'a Device>) {
        for d in lista {
            salida.push(d);
            for cadena in &d.chains {
                aplanar(&cadena.devices, salida);
            }
        }
    }
    let mut todos = Vec::new();
    for p in pistas(snapshot, pista) {
        aplanar(&p.devices, &mut todos);
    }
    let class_name = class_name.to_lowercase();
    todos
        .into_iter()
        .filter(move |d| d.class_name.to_lowercase() == class_name)
}

fn parametros<'a>(
    snapshot: &'a Snapshot,
    pista: &str,
    device: &str,
    parametro: &'a str,
) -> impl Iterator<Item = &'a Parametro> {
    devices(snapshot, pista, device)
        .flat_map(|d| &d.parameters)
        .filter(move |p| p.name.eq_ignore_ascii_case(parametro))
}

// Beats en semicorcheas enteras (0.25 beats): una nota dibujada a mano cae justo ahí,
// y con enteros el set compara sin problemas de decimales.
fn en_rejilla(beat: f64) -> i64 {
    (beat * 4.0).round() as i64
}

// (inicio, pitch, duración): una nota cuenta solo si está en su sitio y dura lo que toca.
type NotaRejilla = (i64, u8, i64);

fn buscadas(notas: &[Nota]) -> BTreeSet<NotaRejilla> {
    notas
        .iter()
        .map(|n| (en_rejilla(n.inicio), n.pitch, en_rejilla(n.duracion)))
        .collect()
}

fn notas_de_pista(snapshot: &Snapshot, nombre: &str) -> BTreeSet<NotaRejilla> {
    pistas(snapshot, nombre)
        .flat_map(|p| &p.clip_slots)
        .filter(|h| h.has_clip)
        .filter_map(|h| h.clip.as_ref())
        .flat_map(|c| &c.notes)
        .map(|n| (en_rejilla(n.start_time), n.pitch, en_rejilla(n.duration)))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn snap(v: serde_json::Value) -> Snapshot {
        serde_json::from_value(v).unwrap()
    }

    fn base() -> Snapshot {
        snap(json!({
            "session": {"tempo": 134.0},
            "tracks": [
                {"name": "PAD", "devices": [{"name": "Mi pad", "class_name": "Operator"}],
                 "clip_slots": [{"has_clip": false}, {"has_clip": true}]},
                {"name": "2-MIDI", "devices": [], "clip_slots": [{"has_clip": false}]}
            ]
        }))
    }

    fn nota_live(pitch: u8, inicio: f64, duracion: f64) -> serde_json::Value {
        json!({"pitch": pitch, "start_time": inicio, "duration": duracion})
    }

    fn clip_pad() -> Snapshot {
        snap(json!({"tracks": [{"name": "PAD", "clip_slots": [
            {"has_clip": true, "clip": {"notes": [nota_live(52, 0.0, 4.0), nota_live(45, 0.0, 4.0)]}},
            {"has_clip": false, "clip": null},
            {"has_clip": true, "clip": {"notes": [nota_live(44, 4.0, 4.0)]}}
        ]}]}))
    }

    fn notas(pares: &[(u8, f64)]) -> Vec<Nota> {
        pares
            .iter()
            .map(|&(pitch, inicio)| Nota {
                pitch,
                inicio,
                duracion: 4.0,
            })
            .collect()
    }

    fn en_clip(pista: &str, n: &[(u8, f64)]) -> Check {
        Check::NotasEnClip {
            pista: pista.into(),
            notas: notas(n),
        }
    }

    #[test]
    fn track_y_tempo() {
        assert!(cumple(&Check::TrackExiste("pad".into()), &base()));
        assert!(!cumple(&Check::TrackExiste("BASS".into()), &base()));
        assert!(cumple(&Check::TempoEs(134.0), &base()));
        assert!(!cumple(&Check::TempoEs(124.0), &base()));
    }

    #[test]
    fn device_en_pista() {
        let check = |pista: &str, device: &str| Check::DeviceEnPista {
            pista: pista.into(),
            device: device.into(),
        };
        assert!(cumple(&check("pad", "Operator"), &base()));
        assert!(!cumple(&check("PAD", "Wavetable"), &base()));
        assert!(!cumple(&check("2-MIDI", "Operator"), &base()));
    }

    #[test]
    fn clip_en_pista() {
        assert!(cumple(&Check::ClipEnPista("PAD".into()), &base()));
        assert!(!cumple(&Check::ClipEnPista("2-MIDI".into()), &base()));
        assert!(!cumple(&Check::ClipEnPista("NOEXISTE".into()), &base()));
    }

    #[test]
    fn notas_en_clip() {
        assert!(cumple(
            &en_clip("pad", &[(45, 0.0), (52, 0.0)]),
            &clip_pad()
        ));
        assert!(cumple(&en_clip("PAD", &[(44, 4.0)]), &clip_pad()));
        assert!(!cumple(
            &en_clip("PAD", &[(44, 0.0), (51, 0.0)]),
            &clip_pad()
        ));
        assert!(!cumple(&en_clip("BASS", &[(45, 0.0)]), &clip_pad()));
    }

    #[test]
    fn nota_en_otro_compas_no_cuenta() {
        // G#1 está en el compás 2 (beat 4), pero el compás 3 la pide en el beat 8.
        assert!(!cumple(
            &en_clip("PAD", &[(44, 8.0), (52, 8.0)]),
            &clip_pad()
        ));
    }

    #[test]
    fn nota_un_poco_movida_cuenta_y_con_otra_duracion_no() {
        let movida = snap(json!({"tracks": [{"name": "PAD", "clip_slots": [
            {"has_clip": true, "clip": {"notes": [nota_live(45, 0.04, 4.0)]}}]}]}));
        assert!(cumple(&en_clip("PAD", &[(45, 0.0)]), &movida));
        let corta = snap(json!({"tracks": [{"name": "PAD", "clip_slots": [
            {"has_clip": true, "clip": {"notes": [nota_live(45, 0.0, 1.0)]}}]}]}));
        assert!(!cumple(&en_clip("PAD", &[(45, 0.0)]), &corta));
    }

    fn con_operator(osc_b: f64, en_rack: bool) -> Snapshot {
        let operator = json!({"class_name": "Operator", "parameters": [
            {"name": "Device On", "value": 1.0, "value_string": "On"},
            {"name": "Osc-B Level", "value": osc_b, "min": 0.0, "max": 1.0, "value_string": "-1.5 dB"}
        ]});
        let devices = if en_rack {
            json!([{"class_name": "InstrumentGroupDevice", "parameters": [],
                    "chains": [{"devices": [operator]}]}])
        } else {
            json!([operator])
        };
        snap(json!({"tracks": [{"name": "BASS", "devices": devices, "clip_slots": []}]}))
    }

    fn osc_b(min: f64, max: f64) -> Check {
        Check::ParametroEnRango {
            pista: "bass".into(),
            device: "operator".into(),
            parametro: "osc-b level".into(),
            min,
            max,
        }
    }

    #[test]
    fn parametro_en_rango() {
        assert!(cumple(&osc_b(0.8, 0.92), &con_operator(0.84, false)));
        assert!(cumple(&osc_b(0.8, 0.92), &con_operator(0.8, false))); // los bordes cuentan
        assert!(!cumple(&osc_b(0.8, 0.92), &con_operator(0.75, false)));
        assert!(cumple(&osc_b(0.8, 0.92), &con_operator(0.84, true))); // dentro de un rack
        assert!(!cumple(&osc_b(0.8, 0.92), &base())); // sin Operator con ese parámetro
    }

    #[test]
    fn valor_actual_del_parametro() {
        let snapshot = con_operator(0.84, true);
        let p = leer_parametro(&snapshot, "BASS", "Operator", "Osc-B Level").unwrap();
        assert_eq!((p.value, p.min, p.max), (0.84, 0.0, 1.0));
        assert!(leer_parametro(&base(), "BASS", "Operator", "Osc-B Level").is_none());
    }

    #[test]
    fn detalle_de_parametro() {
        let d = |s: &Snapshot, pista: &str| {
            detalle_parametro(s, pista, "Operator", "Osc-B Level", 0.8, 0.92)
        };
        assert_eq!(
            d(&con_operator(0.5, true), "BASS"),
            "Osc-B Level ahora -1.5 dB: súbelo"
        );
        assert_eq!(
            d(&con_operator(0.95, false), "BASS"),
            "Osc-B Level ahora -1.5 dB: bájalo"
        );
        assert_eq!(d(&base(), "BASS"), "No encuentro la pista BASS");
        assert_eq!(d(&base(), "2-MIDI"), "No encuentro Operator en 2-MIDI");
        let otro = detalle_parametro(
            &con_operator(0.5, false),
            "BASS",
            "Operator",
            "Filtro",
            0.0,
            1.0,
        );
        assert_eq!(otro, "Operator no tiene el parámetro Filtro");
        // Live 12: el snapshot no trae value_string
        let sin_texto = snap(
            json!({"tracks": [{"name": "PAD", "devices": [{"class_name": "Operator",
            "parameters": [{"name": "Ae Attack", "value": 0.0, "min": 0.0, "max": 1.0}]}]}]}),
        );
        assert_eq!(
            detalle_parametro(&sin_texto, "PAD", "Operator", "Ae Attack", 0.28, 0.35),
            "Ae Attack: súbelo"
        );
    }

    #[test]
    fn device_en_pista_tambien_dentro_de_un_rack() {
        let check = Check::DeviceEnPista {
            pista: "BASS".into(),
            device: "Operator".into(),
        };
        assert!(cumple(&check, &con_operator(0.5, true)));
    }

    #[test]
    fn nombre_de_nota() {
        assert_eq!(nombre_nota(60), "C3");
        assert_eq!(nombre_nota(45), "A1");
        assert_eq!(nombre_nota(44), "G#1");
        assert_eq!(nombre_nota(32), "G#0");
    }

    #[test]
    fn notas_que_faltan_en_orden() {
        let faltan = notas_que_faltan(
            &clip_pad(),
            "PAD",
            &notas(&[(52, 8.0), (44, 8.0), (45, 0.0)]),
        );
        let resumen: Vec<_> = faltan
            .iter()
            .map(|f| (f.nombre.as_str(), f.compas))
            .collect();
        assert_eq!(resumen, [("G#1", 3), ("E2", 3)]);
        assert_eq!(faltan[0].inicio, 8.0);
    }

    #[test]
    fn volumen_de_pista_y_master() {
        let mut s = snap(json!({
            "tracks": [{"name": "BASS"}, {"name": "PAD"}],
            "master_track": {"devices": [{"class_name": "Limiter"}]}
        }));
        let check = |pista: &str| Check::VolumenEnRango {
            pista: pista.into(),
            min: -14.0,
            max: -12.0,
        };
        // Antes de leer el fader no se da por bueno.
        assert!(!cumple(&check("PAD"), &s));
        leer_volumen(&mut s, "pad", |destino| {
            assert_eq!(destino, json!({"track_index": 1}));
            Ok(json!({"volume": "-13.0 dB"}))
        })
        .unwrap();
        assert!(cumple(&check("PAD"), &s));
        assert_eq!(volumen_como_parametro(&s, "PAD").unwrap().value, -13.0);

        leer_volumen(&mut s, "Master", |destino| {
            assert_eq!(destino, json!({"master": true}));
            Ok(json!({"volume": "-inf dB"}))
        })
        .unwrap();
        assert!(!cumple(&check("Master"), &s));
        assert_eq!(
            detalle_volumen(&s, "Master", -14.0, -12.0),
            "Volumen de Master ahora -70.0 dB: súbelo"
        );
        let limiter = Check::DeviceEnPista {
            pista: "Master".into(),
            device: "Limiter".into(),
        };
        assert!(cumple(&limiter, &s));

        // Pista que no existe: no se llama a Live.
        leer_volumen(&mut s, "LEAD", |_| panic!("no debería llamar a Live")).unwrap();
        assert_eq!(
            detalle_volumen(&s, "LEAD", -1.0, 1.0),
            "No encuentro la pista LEAD"
        );
        assert!(leer_volumen(&mut s, "PAD", |_| Ok(json!({"volume": "??"}))).is_err());
    }
}
