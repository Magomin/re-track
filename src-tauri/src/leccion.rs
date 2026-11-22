// El schema de una lección (antes retrack/leccion.py con pydantic).
// Sin nada de Tauri: esta pieza no sabe quién la llama (panel, tests, otra UI).
use serde::{Deserialize, Serialize};
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
    DeviceEnPista { pista: String, device: String },
    ClipEnPista(String),
    NotasEnClip { pista: String, notas: Vec<Nota> },
}

#[derive(Debug, Deserialize, Serialize, PartialEq)]
pub struct Nota {
    pub pitch: u8,
    pub inicio: f64,
    pub duracion: f64,
}

pub fn cargar(ruta: &Path) -> Result<Leccion, String> {
    let texto = std::fs::read_to_string(ruta).map_err(|e| format!("{}: {e}", ruta.display()))?;
    serde_json::from_str(&texto).map_err(|e| format!("{}: {e}", ruta.display()))
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

#[cfg(test)]
mod tests {
    use super::*;

    fn leer(pasos: &str) -> Result<Leccion, serde_json::Error> {
        serde_json::from_str(&format!(
            r#"{{"titulo": "T", "modulos": [{{"id": "bass", "titulo": "Bass", "tempo": 124, "tonalidad": "C", "pasos": {pasos}}}]}}"#
        ))
    }

    #[test]
    fn leccion_buena_se_carga() {
        let leccion = leer(r#"[{"instruccion": "x", "check": "tempo_es", "valor": 124}]"#).unwrap();
        let modulo = &leccion.modulos[0];
        assert_eq!(modulo.version, 1); // no viene en el JSON: vale el defecto
        assert!(matches!(modulo.pasos[0].check, Check::TempoEs(t) if t == 124.0));
    }

    #[test]
    fn check_que_no_existe_no_entra() {
        assert!(leer(r#"[{"instruccion": "x", "check": "tempo_e", "valor": 124}]"#).is_err());
    }

    #[test]
    fn valor_con_forma_equivocada_no_entra() {
        assert!(leer(r#"[{"instruccion": "x", "check": "tempo_es", "valor": "rapido"}]"#).is_err());
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
            let original: serde_json::Value = serde_json::from_str(&std::fs::read_to_string(&ruta).unwrap()).unwrap();
            for (m, m_original) in leccion.modulos.iter().zip(original["modulos"].as_array().unwrap()) {
                for (p, p_original) in m.pasos.iter().zip(m_original["pasos"].as_array().unwrap()) {
                    let enviado = serde_json::to_value(p).unwrap();
                    assert_eq!(enviado["check"], p_original["check"]);
                    assert_eq!(enviado["instruccion"], p_original["instruccion"]);
                }
            }
        }
    }
}
