// Comprueba un paso contra el snapshot de Live (antes retrack/verify.py).
// El match sobre Check obliga a cubrir todos los checks del schema: añadir uno sin su
// comprobación no compila (sustituye al test "checks y schema van a la par").
use crate::leccion::{Check, Nota};
use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;

// Solo lo que miramos del snapshot de get_session_snapshot; el resto se ignora.
#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct Snapshot {
    pub session: Session,
    pub tracks: Vec<Pista>,
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
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct Device {
    pub class_name: String,
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
        } => pistas(snapshot, nombre).any(|p| {
            p.devices
                .iter()
                .any(|d| d.class_name.to_lowercase() == device.to_lowercase())
        }),
        Check::ClipEnPista(nombre) => {
            pistas(snapshot, nombre).any(|p| p.clip_slots.iter().any(|h| h.has_clip))
        }
        Check::NotasEnClip {
            pista: nombre,
            notas,
        } => buscadas(notas).is_subset(&notas_de_pista(snapshot, nombre)),
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
    snapshot
        .tracks
        .iter()
        .filter(move |p| p.name.to_lowercase() == nombre)
}

fn pista<'a>(snapshot: &'a Snapshot, nombre: &str) -> Option<&'a Pista> {
    pistas(snapshot, nombre).next()
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
}
