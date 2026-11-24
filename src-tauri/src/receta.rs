// Monta una lección nueva con piezas (módulos) de canciones que ya existen, una detrás de otra (FDR-004).
// Sin nada de Tauri. La lección creada copia los módulos y vive en su propia carpeta (ADR-015).
use crate::leccion::{self, Leccion};
use serde::Deserialize;
use std::collections::HashSet;
use std::path::Path;

// Una pieza cogida en el panel: el módulo `modulo` de la canción `leccion` ("jungle", "bass").
#[derive(Debug, Deserialize)]
pub struct Pieza {
    pub leccion: String,
    pub modulo: String,
}

// Crea la lección en `creadas` con las piezas en su orden y devuelve su nombre ("receta-1").
// `canciones` = carpeta de las lecciones que trae la app, de donde salen las piezas.
pub fn crear(canciones: &Path, creadas: &Path, piezas: &[Pieza]) -> Result<String, String> {
    if piezas.is_empty() {
        return Err(
            "No se crea la lección: no hay ninguna pieza cogida. Toca un módulo de una canción."
                .into(),
        );
    }
    // El nombre de canción llega del panel: solo vale uno de la carpeta, nunca una ruta.
    let disponibles = leccion::listar(canciones)?;
    let mut vistas = HashSet::new();
    let mut titulos: Vec<String> = Vec::new();
    let mut modulos = Vec::new();
    for pieza in piezas {
        let (cancion, id) = (&pieza.leccion, &pieza.modulo);
        if !vistas.insert((cancion, id)) {
            return Err(format!(
                "No se crea la lección: la pieza {cancion}/{id} está dos veces. Quita una."
            ));
        }
        if !disponibles.contains(cancion) {
            return Err(format!(
                "No se crea la lección: no existe la canción {cancion}. Elige otra pieza."
            ));
        }
        let mut origen = leccion::cargar(&canciones.join(format!("{cancion}.json")))?;
        let posicion = origen
            .modulos
            .iter()
            .position(|m| &m.id == id)
            .ok_or(format!(
                "No se crea la lección: la canción {cancion} no tiene el módulo {id}. Elige otra pieza."
            ))?;
        let mut modulo = origen.modulos.swap_remove(posicion);
        // Dos canciones pueden tener un módulo "bass": el id lleva la canción para no compartir progreso.
        modulo.id = format!("{cancion}-{id}");
        modulos.push(modulo);
        if !titulos.contains(&origen.titulo) {
            titulos.push(origen.titulo);
        }
    }
    let nueva = Leccion {
        titulo: titulos.join(" + "),
        modulos,
    };
    let texto = serde_json::to_string_pretty(&nueva).map_err(|e| e.to_string())?;

    std::fs::create_dir_all(creadas).map_err(|e| format!("{}: {e}", creadas.display()))?;
    // El primer "receta-N" libre en las dos carpetas: nunca se pisa una lección que ya existe.
    let nombre = (1..)
        .map(|n| format!("receta-{n}"))
        .find(|nombre| {
            let fichero = format!("{nombre}.json");
            !creadas.join(&fichero).exists() && !canciones.join(&fichero).exists()
        })
        .expect("siempre queda un número libre");
    let ruta = creadas.join(format!("{nombre}.json"));
    std::fs::write(&ruta, texto)
        .map_err(|e| format!("No se crea la lección: {}: {e}", ruta.display()))?;
    Ok(nombre)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn canciones() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../lecciones")
    }

    // Una carpeta vacía por test.
    fn creadas(nombre: &str) -> PathBuf {
        let carpeta =
            std::env::temp_dir().join(format!("retrack-receta-{nombre}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&carpeta);
        carpeta
    }

    fn pieza(leccion: &str, modulo: &str) -> Pieza {
        Pieza {
            leccion: leccion.into(),
            modulo: modulo.into(),
        }
    }

    #[test]
    fn la_leccion_creada_se_carga_con_sus_piezas_en_orden() {
        let carpeta = creadas("orden");
        let piezas = [pieza("jungle", "bass"), pieza("primera", "base")];
        let nombre = crear(&canciones(), &carpeta, &piezas).unwrap();
        assert_eq!(nombre, "receta-1");

        let creada = leccion::cargar(&carpeta.join("receta-1.json")).unwrap();
        let ids: Vec<&str> = creada.modulos.iter().map(|m| m.id.as_str()).collect();
        assert_eq!(ids, ["jungle-bass", "primera-base"]);
        assert_eq!(creada.titulo, "Fred again.. — Jungle + Primera lección");
        // Los pasos son los del módulo de origen, con sus ids.
        let jungle = leccion::cargar(&canciones().join("jungle.json")).unwrap();
        assert_eq!(
            creada.modulos[0].ids(),
            jungle.buscar_modulo("bass").unwrap().ids()
        );
        std::fs::remove_dir_all(&carpeta).unwrap();
    }

    #[test]
    fn la_segunda_no_pisa_a_la_primera() {
        let carpeta = creadas("segunda");
        crear(&canciones(), &carpeta, &[pieza("jungle", "pad")]).unwrap();
        let nombre = crear(&canciones(), &carpeta, &[pieza("jungle", "lead")]).unwrap();
        assert_eq!(nombre, "receta-2");
        let primera = leccion::cargar(&carpeta.join("receta-1.json")).unwrap();
        assert_eq!(primera.modulos[0].id, "jungle-pad");
        std::fs::remove_dir_all(&carpeta).unwrap();
    }

    #[test]
    fn sin_piezas_repetida_o_desconocida_no_crea_nada_y_dice_por_que() {
        let carpeta = creadas("errores");
        let sin = crear(&canciones(), &carpeta, &[]).unwrap_err();
        assert!(sin.contains("no hay ninguna pieza cogida"), "{sin}");
        let dos = [pieza("jungle", "bass"), pieza("jungle", "bass")];
        let repetida = crear(&canciones(), &carpeta, &dos).unwrap_err();
        assert!(
            repetida.contains("jungle/bass está dos veces"),
            "{repetida}"
        );
        let sin_modulo = crear(&canciones(), &carpeta, &[pieza("jungle", "riser")]).unwrap_err();
        assert!(
            sin_modulo.contains("no tiene el módulo riser"),
            "{sin_modulo}"
        );
        let fuera = crear(&canciones(), &carpeta, &[pieza("../Cargo", "x")]).unwrap_err();
        assert!(fuera.contains("no existe la canción ../Cargo"), "{fuera}");
        assert!(!carpeta.exists(), "un error no deja ficheros");
    }
}
