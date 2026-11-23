// Capa fina entre el panel y la lógica: cada comando traduce la petición del panel a una llamada
// a los módulos (leccion, progreso, live, verify), que no saben nada de Tauri.
mod leccion;
mod live;
mod progreso;
mod verify;

use leccion::Check;
use serde_json::{Value, json};
use std::collections::HashSet;
use std::path::PathBuf;

// shortcut: rutas fijadas al compilar (relativas a src-tauri/), valen para `tauri dev`;
// al empaquetar la app, lecciones/ va como resource y la base de datos al app_data_dir.
fn raiz() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..")
}

fn carpeta_lecciones() -> PathBuf {
    raiz().join("lecciones")
}

fn base_de_datos() -> PathBuf {
    raiz().join("data/progreso.db")
}

fn cargar(nombre: &str) -> Result<leccion::Leccion, String> {
    leccion::cargar(&carpeta_lecciones().join(format!("{nombre}.json")))
}

fn clave(leccion: &str, modulo: &str) -> String {
    format!("{leccion}/{modulo}")
}

fn buscar<'a>(
    contenido: &'a leccion::Leccion,
    leccion: &str,
    modulo: &str,
) -> Result<&'a leccion::Modulo, String> {
    contenido
        .buscar_modulo(modulo)
        .ok_or(format!("La lección {leccion} no tiene el módulo {modulo}"))
}

fn hechos(leccion: &str, modulo: &leccion::Modulo) -> Result<HashSet<String>, String> {
    progreso::hechos(&base_de_datos(), &clave(leccion, &modulo.id), &modulo.ids())
}

#[tauri::command]
fn lecciones() -> Result<Vec<String>, String> {
    leccion::listar(&carpeta_lecciones())
}

#[tauri::command]
fn modulos(leccion: String) -> Result<Value, String> {
    let contenido = cargar(&leccion)?;
    let mut resumen = Vec::new();
    for m in &contenido.modulos {
        let hechos = m.contar_hechos(&hechos(&leccion, m)?);
        resumen.push(
            json!({"id": m.id, "titulo": m.titulo, "total": m.pasos.len(), "hechos": hechos}),
        );
    }
    Ok(json!(resumen))
}

#[tauri::command]
fn pasos(leccion: String, modulo: String) -> Result<Value, String> {
    let contenido = cargar(&leccion)?;
    serde_json::to_value(&buscar(&contenido, &leccion, &modulo)?.pasos).map_err(|e| e.to_string())
}

// async: corre fuera del hilo de la ventana, así esperar a Live no congela el panel.
// `indice` = posición del paso que el panel está enseñando; devuelve el siguiente sin hacer.
#[tauri::command]
async fn comprobar(leccion: String, modulo: String, indice: usize) -> Result<Value, String> {
    let contenido = cargar(&leccion)?;
    let m = buscar(&contenido, &leccion, &modulo)?;
    let paso = m
        .pasos
        .get(indice)
        .ok_or(format!("No existe el paso {indice} de {leccion}/{modulo}"))?;
    let snapshot: verify::Snapshot =
        serde_json::from_value(live::send("get_session_snapshot", json!({}))?)
            .map_err(|e| format!("Snapshot de Live inesperado: {e}"))?;

    let hecho = verify::cumple(&paso.check, &snapshot);
    if hecho {
        progreso::marcar(&base_de_datos(), &clave(&leccion, &modulo), &paso.id)?;
    }
    let mut respuesta = json!({"hecho": hecho, "indice": m.siguiente(&hechos(&leccion, m)?)});
    if !hecho {
        match &paso.check {
            Check::NotasEnClip { pista, notas } => {
                respuesta["faltan"] = json!(verify::notas_que_faltan(&snapshot, pista, notas));
            }
            Check::ParametroEnRango {
                pista,
                device,
                parametro,
                min,
                max,
            } => {
                respuesta["detalle"] = json!(verify::detalle_parametro(
                    &snapshot, pista, device, parametro, *min, *max
                ));
                respuesta["actual"] =
                    json!(verify::leer_parametro(&snapshot, pista, device, parametro));
            }
            _ => {}
        }
    }
    Ok(respuesta)
}

#[tauri::command]
fn progreso(leccion: String, modulo: String) -> Result<Value, String> {
    let contenido = cargar(&leccion)?;
    let m = buscar(&contenido, &leccion, &modulo)?;
    Ok(json!({"indice": m.siguiente(&hechos(&leccion, m)?)}))
}

#[tauri::command]
fn reiniciar(leccion: String, modulo: String) -> Result<Value, String> {
    progreso::borrar(&base_de_datos(), &clave(&leccion, &modulo))?;
    Ok(json!({"indice": 0}))
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
