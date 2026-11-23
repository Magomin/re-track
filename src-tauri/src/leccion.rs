// El schema de una lección (antes retrack/leccion.py con pydantic).
// Sin nada de Tauri: esta pieza no sabe quién la llama (panel, tests, otra UI).
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::Path;

#[derive(Debug, Deserialize, Serialize)]
pub struct Leccion {
    pub titulo: String,
    pub modulos: Vec<Modulo>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Modulo {
    pub id: String,
    pub titulo: String,
    #[serde(default = "version_1")]
    pub version: u32,
    pub tempo: f64,
    pub tonalidad: String,
    pub pasos: Vec<Paso>,
}

fn version_1() -> u32 {
    1
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Paso {
    // Fijo para siempre: el progreso se guarda por id, así insertar o reordenar pasos
    // no descoloca lo que el usuario ya hizo.
    pub id: String,
    pub instruccion: String,
    #[serde(flatten)]
    pub check: Check,
}

// Cada check trae su propio tipo de "valor": un check desconocido o un valor con la forma
// equivocada no pasa al cargar, igual que el Literal de pydantic.
#[derive(Debug, Deserialize, Serialize)]
#[serde(tag = "check", content = "valor", rename_all = "snake_case")]
pub enum Check {
    TrackExiste(String),
    TempoEs(f64),
    DeviceEnPista {
        pista: String,
        device: String,
    },
    ClipEnPista(String),
    NotasEnClip {
        pista: String,
        notas: Vec<Nota>,
    },
    // Decisión 10 del diseño: un check genérico para cualquier parámetro de un device nativo.
    // device = class_name de Live ("Operator"), parametro = nombre de Live ("Osc-B Level"),
    // min/max en el valor bruto de Live (el que mide musichelper), no en el texto de pantalla.
    ParametroEnRango {
        pista: String,
        device: String,
        parametro: String,
        min: f64,
        max: f64,
    },
    // Fader de la pista en dB, tal como lo enseña Live. pista = "Master" para el master.
    VolumenEnRango {
        pista: String,
        min: f64,
        max: f64,
    },
}

#[derive(Debug, Deserialize, Serialize, PartialEq)]
pub struct Nota {
    pub pitch: u8,
    pub inicio: f64,
    pub duracion: f64,
}

pub fn cargar(ruta: &Path) -> Result<Leccion, String> {
    let texto = std::fs::read_to_string(ruta).map_err(|e| format!("{}: {e}", ruta.display()))?;
    desde_texto(&texto).map_err(|e| format!("{}: {e}", ruta.display()))
}

pub fn desde_texto(texto: &str) -> Result<Leccion, String> {
    let leccion: Leccion = serde_json::from_str(texto).map_err(|e| e.to_string())?;
    for modulo in &leccion.modulos {
        let mut vistos = HashSet::new();
        for paso in &modulo.pasos {
            if !vistos.insert(&paso.id) {
                return Err(format!(
                    "el módulo {} repite el id de paso {}",
                    modulo.id, paso.id
                ));
            }
        }
        if let Some(paso) = modulo.pasos.iter().find(|p| match &p.check {
            Check::ParametroEnRango { min, max, .. } | Check::VolumenEnRango { min, max, .. } => {
                min > max
            }
            _ => false,
        }) {
            return Err(format!("el paso {} tiene min > max", paso.id));
        }
    }
    Ok(leccion)
}

// Nombres de las lecciones de una carpeta ("jungle", "primera"), ordenados.
pub fn listar(carpeta: &Path) -> Result<Vec<String>, String> {
    let mut nombres = Vec::new();
    for entrada in std::fs::read_dir(carpeta).map_err(|e| format!("{}: {e}", carpeta.display()))? {
        let ruta = entrada.map_err(|e| e.to_string())?.path();
        if ruta.extension().is_some_and(|ext| ext == "json") {
            nombres.push(ruta.file_stem().unwrap().to_string_lossy().into_owned());
        }
    }
    nombres.sort();
    Ok(nombres)
}

impl Leccion {
    pub fn buscar_modulo(&self, id: &str) -> Option<&Modulo> {
        self.modulos.iter().find(|m| m.id == id)
    }
}

impl Modulo {
    pub fn ids(&self) -> Vec<String> {
        self.pasos.iter().map(|p| p.id.clone()).collect()
    }

    // Posición del primer paso sin hacer (= pasos.len() si está completo).
    pub fn siguiente(&self, hechos: &HashSet<String>) -> usize {
        self.pasos
            .iter()
            .position(|p| !hechos.contains(&p.id))
            .unwrap_or(self.pasos.len())
    }

    // Solo cuenta ids que siguen en el módulo: un paso borrado del JSON deja de contar.
    pub fn contar_hechos(&self, hechos: &HashSet<String>) -> usize {
        self.pasos.iter().filter(|p| hechos.contains(&p.id)).count()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn leer(pasos: &str) -> Result<Leccion, String> {
        desde_texto(&format!(
            r#"{{"titulo": "T", "modulos": [{{"id": "bass", "titulo": "Bass", "tempo": 124, "tonalidad": "C", "pasos": {pasos}}}]}}"#
        ))
    }

    #[test]
    fn leccion_buena_se_carga() {
        let leccion =
            leer(r#"[{"id": "t", "instruccion": "x", "check": "tempo_es", "valor": 124}]"#)
                .unwrap();
        let modulo = &leccion.modulos[0];
        assert_eq!(modulo.version, 1); // no viene en el JSON: vale el defecto
        assert!(matches!(modulo.pasos[0].check, Check::TempoEs(t) if t == 124.0));
    }

    #[test]
    fn check_que_no_existe_no_entra() {
        assert!(
            leer(r#"[{"id": "t", "instruccion": "x", "check": "tempo_e", "valor": 124}]"#).is_err()
        );
    }

    #[test]
    fn valor_con_forma_equivocada_no_entra() {
        assert!(
            leer(r#"[{"id": "t", "instruccion": "x", "check": "tempo_es", "valor": "rapido"}]"#)
                .is_err()
        );
    }

    #[test]
    fn paso_sin_id_o_con_id_repetido_no_entra() {
        assert!(leer(r#"[{"instruccion": "x", "check": "tempo_es", "valor": 124}]"#).is_err());
        let repetido = leer(
            r#"[{"id": "t", "instruccion": "x", "check": "tempo_es", "valor": 124},
                {"id": "t", "instruccion": "y", "check": "track_existe", "valor": "BASS"}]"#,
        );
        assert!(repetido.unwrap_err().contains("repite el id de paso t"));
    }

    #[test]
    fn parametro_en_rango_se_carga_y_min_mayor_que_max_no() {
        let bueno = leer(
            r#"[{"id": "b", "instruccion": "x", "check": "parametro_en_rango",
                 "valor": {"pista": "BASS", "device": "Operator", "parametro": "Osc-B Level", "min": 0.8, "max": 0.92}}]"#,
        );
        assert!(bueno.is_ok());
        let al_reves = leer(
            r#"[{"id": "b", "instruccion": "x", "check": "parametro_en_rango",
                 "valor": {"pista": "BASS", "device": "Operator", "parametro": "Osc-B Level", "min": 0.92, "max": 0.8}}]"#,
        );
        assert!(al_reves.unwrap_err().contains("min > max"));
    }

    #[test]
    fn siguiente_y_hechos_van_por_id() {
        let leccion = leer(
            r#"[{"id": "a", "instruccion": "x", "check": "tempo_es", "valor": 124},
                {"id": "nuevo", "instruccion": "x", "check": "tempo_es", "valor": 124},
                {"id": "b", "instruccion": "x", "check": "tempo_es", "valor": 124}]"#,
        )
        .unwrap();
        let modulo = &leccion.modulos[0];
        // "a" y "b" hechos antes de que se insertara "nuevo" en medio; "viejo" ya no existe.
        let hechos: HashSet<String> = ["a", "b", "viejo"].map(String::from).into();
        assert_eq!(modulo.siguiente(&hechos), 1);
        assert_eq!(modulo.contar_hechos(&hechos), 2);
        let todos: HashSet<String> = ["a", "nuevo", "b"].map(String::from).into();
        assert_eq!(modulo.siguiente(&todos), 3);
    }

    #[test]
    fn buscar_modulo() {
        let leccion = leer("[]").unwrap();
        assert_eq!(leccion.buscar_modulo("bass").unwrap().titulo, "Bass");
        assert!(leccion.buscar_modulo("riser").is_none());
    }

    #[test]
    fn las_lecciones_reales_son_validas_y_vuelven_igual_al_panel() {
        let carpeta = Path::new(env!("CARGO_MANIFEST_DIR")).join("../lecciones");
        let nombres = listar(&carpeta).unwrap();
        assert_eq!(nombres, ["jungle", "primera"]);
        for nombre in nombres {
            let ruta = carpeta.join(format!("{nombre}.json"));
            let leccion = cargar(&ruta).unwrap();
            // El panel lee check/valor tal cual venían en el JSON: al reenviarlo no debe cambiar la forma.
            let original: serde_json::Value =
                serde_json::from_str(&std::fs::read_to_string(&ruta).unwrap()).unwrap();
            for (m, m_original) in leccion
                .modulos
                .iter()
                .zip(original["modulos"].as_array().unwrap())
            {
                for (p, p_original) in m.pasos.iter().zip(m_original["pasos"].as_array().unwrap()) {
                    let enviado = serde_json::to_value(p).unwrap();
                    assert_eq!(enviado["id"], p_original["id"]);
                    assert_eq!(enviado["check"], p_original["check"]);
                    assert_eq!(enviado["instruccion"], p_original["instruccion"]);
                }
            }
        }
    }
}
