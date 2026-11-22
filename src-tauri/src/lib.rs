// Los mismos 6 endpoints que tenía retrack/api.py, ahora como comandos que el panel llama con invoke().
// Cada uno es un hueco que se rellena en las lecciones (16 en adelante); la lógica irá en
// módulos propios (leccion.rs, verify.rs, progreso.rs, live.rs) sin nada de Tauri dentro.
use serde_json::Value;

const PENDIENTE: &str = "Comando sin implementar todavía (lección 16)";

#[tauri::command]
fn lecciones() -> Result<Value, String> {
    Err(PENDIENTE.into())
}

#[tauri::command]
fn modulos(leccion: String) -> Result<Value, String> {
    let _ = leccion;
    Err(PENDIENTE.into())
}

#[tauri::command]
fn pasos(leccion: String, modulo: String) -> Result<Value, String> {
    let _ = (leccion, modulo);
    Err(PENDIENTE.into())
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
