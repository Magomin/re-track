// Capa fina entre el panel y la lógica: cada comando traduce la petición del panel a una llamada
// a los módulos (leccion, progreso, live, verify), que no saben nada de Tauri.
mod leccion;
mod live;
mod progreso;
mod receta;
mod verify;

use leccion::Check;
use serde_json::{Value, json};
use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::OnceLock;
use tauri::Manager;

// Carpeta de lecciones, base de datos y carpeta de lecciones creadas (ADR-015); se fijan una vez al
// arrancar (ver `rutas`).
static RUTAS: OnceLock<(PathBuf, PathBuf, PathBuf)> = OnceLock::new();

// La carpeta del repo, fijada al compilar: solo existe en el PC donde se compiló.
fn raiz() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..")
}

// `tauri dev`: lecciones y progreso del repo (editar un JSON se ve sin recompilar).
// App instalada: lecciones empaquetadas como resource y progreso en la carpeta de datos de la app.
// Las lecciones creadas en la app van aparte, junto al progreso: reinstalar no las borra.
fn rutas(app: &tauri::App) -> Result<(PathBuf, PathBuf, PathBuf), Box<dyn std::error::Error>> {
    if cfg!(debug_assertions) {
        return Ok((
            raiz().join("lecciones"),
            raiz().join("data/progreso.db"),
            raiz().join("data/lecciones"),
        ));
    }
    let datos = app.path().app_data_dir()?;
    std::fs::create_dir_all(&datos)?;
    let db = datos.join("progreso.db");
    // Primera vez: se trae el progreso de `tauri dev` si la app se compiló en este PC.
    let del_repo = raiz().join("data/progreso.db");
    if !db.exists() && del_repo.exists() {
        std::fs::copy(&del_repo, &db)?;
    }
    Ok((
        app.path().resource_dir()?.join("lecciones"),
        db,
        datos.join("lecciones"),
    ))
}

fn carpeta_lecciones() -> PathBuf {
    RUTAS.get().expect("rutas fijadas en setup").0.clone()
}

fn base_de_datos() -> PathBuf {
    RUTAS.get().expect("rutas fijadas en setup").1.clone()
}

fn carpeta_creadas() -> PathBuf {
    RUTAS.get().expect("rutas fijadas en setup").2.clone()
}

// Una lección creada en la app se busca en su carpeta; cualquier otra, entre las que trae la app.
fn cargar(nombre: &str) -> Result<leccion::Leccion, String> {
    let fichero = format!("{nombre}.json");
    let creada = carpeta_creadas().join(&fichero);
    if creada.exists() {
        return leccion::cargar(&creada);
    }
    leccion::cargar(&carpeta_lecciones().join(fichero))
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
    let mut nombres = leccion::listar(&carpeta_lecciones())?;
    // La carpeta de creadas no existe hasta que se crea la primera.
    if carpeta_creadas().exists() {
        nombres.extend(leccion::listar(&carpeta_creadas())?);
    }
    Ok(nombres)
}

// Pantalla de nueva lección (FDR-004): las canciones que trae la app y sus módulos, que son las piezas a coger.
#[tauri::command]
fn canciones() -> Result<Value, String> {
    let mut lista = Vec::new();
    for nombre in leccion::listar(&carpeta_lecciones())? {
        let contenido = leccion::cargar(&carpeta_lecciones().join(format!("{nombre}.json")))?;
        let modulos: Vec<Value> = contenido
            .modulos
            .iter()
            .map(|m| json!({"id": m.id, "titulo": m.titulo, "pasos": m.pasos.len()}))
            .collect();
        lista.push(json!({"leccion": nombre, "titulo": contenido.titulo, "modulos": modulos}));
    }
    Ok(json!(lista))
}

// Crea la lección con las piezas en su orden y devuelve su nombre.
#[tauri::command]
fn crear_leccion(piezas: Vec<receta::Pieza>) -> Result<String, String> {
    receta::crear(&carpeta_lecciones(), &carpeta_creadas(), &piezas)
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
    let mut snapshot: verify::Snapshot =
        serde_json::from_value(live::send("get_session_snapshot", json!({}))?)
            .map_err(|e| format!("Snapshot de Live inesperado: {e}"))?;

    if let Check::VolumenEnRango { pista, .. } = &paso.check {
        verify::leer_volumen(&mut snapshot, pista, |destino| live::send("mixer", destino))?;
    }
    let hecho = verify::cumple(&paso.check, &snapshot);
    if hecho {
        progreso::marcar(&base_de_datos(), &clave(&leccion, &modulo), &paso.id)?;
    }
    let mut respuesta = json!({"hecho": hecho, "indice": m.siguiente(&hechos(&leccion, m)?),
        "live": verify::ahora(&paso.check, &snapshot)});
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
            Check::ClipEnArreglo {
                pista,
                desde,
                hasta,
            } => {
                respuesta["detalle"] =
                    json!(verify::detalle_arreglo(&snapshot, pista, *desde, *hasta));
            }
            Check::VolumenEnRango { pista, min, max } => {
                respuesta["detalle"] = json!(verify::detalle_volumen(&snapshot, pista, *min, *max));
                respuesta["actual"] = json!(verify::volumen_como_parametro(&snapshot, pista));
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

// Pantalla de inicio (FDR-003): cada lección con su avance, y la última en la que se superó un paso.
#[tauri::command]
fn inicio() -> Result<Value, String> {
    let mut filas = Vec::new();
    for nombre in leccion::listar(&carpeta_lecciones())? {
        let contenido = cargar(&nombre)?;
        let (mut total, mut suma) = (0, 0);
        for m in &contenido.modulos {
            total += m.pasos.len();
            suma += m.contar_hechos(&hechos(&nombre, m)?);
        }
        filas.push(
            json!({"nombre": nombre, "titulo": contenido.titulo, "total": total, "hechos": suma}),
        );
    }
    let ultima = progreso::ultimo(&base_de_datos())?.and_then(|clave| {
        clave
            .split_once('/')
            .map(|(leccion, _)| leccion.to_string())
    });
    Ok(json!({"lecciones": filas, "ultima": ultima}))
}

// Para la pantalla de lecciones, que no comprueba ningún paso: ¿contesta Live?
#[tauri::command]
async fn conectado() -> bool {
    live::send("get_session_snapshot", json!({})).is_ok()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            RUTAS.set(rutas(app)?).ok();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            lecciones,
            modulos,
            pasos,
            comprobar,
            progreso,
            reiniciar,
            inicio,
            conectado,
            canciones,
            crear_leccion
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
