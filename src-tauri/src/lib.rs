// Capa fina entre el panel y la lógica: cada comando traduce la petición del panel a una llamada
// a los módulos (leccion.rs, ...), que no saben nada de Tauri.
mod leccion;

use serde_json::{Value, json};
use std::path::PathBuf;

const PENDIENTE: &str = "Comando sin implementar todavía";

// shortcut: ruta fijada al compilar (src-tauri/../lecciones), vale para `tauri dev`;
// al empaquetar la app hay que meter lecciones/ como resource y leerla de ahí.
fn carpeta_lecciones() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../lecciones")
}

fn cargar(nombre: &str) -> Result<leccion::Leccion, String> {
    leccion::cargar(&carpeta_lecciones().join(format!("{nombre}.json")))
}

#[tauri::command]
fn lecciones() -> Result<Vec<String>, String> {
    leccion::listar(&carpeta_lecciones())
}

#[tauri::command]
fn modulos(leccion: String) -> Result<Value, String> {
    let contenido = cargar(&leccion)?;
    let resumen: Vec<Value> = contenido
        .modulos
        .iter()
        // hechos: 0 hasta que el progreso pase a Rust (paso 2)
        .map(|m| json!({"id": m.id, "titulo": m.titulo, "total": m.pasos.len(), "hechos": 0}))
        .collect();
    Ok(json!(resumen))
}

#[tauri::command]
fn pasos(leccion: String, modulo: String) -> Result<Value, String> {
    let contenido = cargar(&leccion)?;
    let encontrado = contenido
        .buscar_modulo(&modulo)
        .ok_or(format!("La lección {leccion} no tiene el módulo {modulo}"))?;
    serde_json::to_value(&encontrado.pasos).map_err(|e| e.to_string())
}

#[tauri::command]
fn comprobar(leccion: String, modulo: String, indice: usize) -> Result<Value, String> {
    let _ = (leccion, modulo, indice);
    Err(PENDIENTE.into())
}

#[tauri::command]
fn progreso(leccion: String, modulo: String) -> Result<Value, String> {
    let _ = (leccion, modulo);
    Err(PENDIENTE.into())
}

#[tauri::command]
fn reiniciar(leccion: String, modulo: String) -> Result<Value, String> {
    let _ = (leccion, modulo);
    Err(PENDIENTE.into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            lecciones, modulos, pasos, comprobar, progreso, reiniciar
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
