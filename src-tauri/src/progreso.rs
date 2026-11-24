// Progreso en SQLite: qué pasos (por id) ha hecho el usuario en cada módulo.
// Clave del módulo = "leccion/modulo". Mismo fichero que usaba la versión Python.
use rusqlite::{Connection, OptionalExtension, params};
use std::collections::HashSet;
use std::path::Path;

fn conectar(ruta: &Path) -> Result<Connection, String> {
    if let Some(carpeta) = ruta.parent() {
        std::fs::create_dir_all(carpeta).map_err(|e| e.to_string())?;
    }
    let conexion = Connection::open(ruta).map_err(|e| e.to_string())?;
    conexion
        .execute_batch(
            "CREATE TABLE IF NOT EXISTS hechos (modulo TEXT, paso TEXT, cuando TEXT, PRIMARY KEY (modulo, paso));
             -- Formato anterior (índice por posición). Se lee una vez para migrar y se borra.
             CREATE TABLE IF NOT EXISTS progreso (leccion TEXT PRIMARY KEY, indice INTEGER);",
        )
        .map_err(|e| e.to_string())?;
    // Bases de antes de la racha: se les añade `cuando` (día local en que se superó el paso).
    // Lo ya hecho se queda con NULL: sigue hecho, pero no cuenta para la racha.
    let tiene_cuando: i64 = conexion
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('hechos') WHERE name = 'cuando'",
            [],
            |fila| fila.get(0),
        )
        .map_err(|e| e.to_string())?;
    if tiene_cuando == 0 {
        conexion
            .execute("ALTER TABLE hechos ADD COLUMN cuando TEXT", [])
            .map_err(|e| e.to_string())?;
    }
    Ok(conexion)
}

pub fn marcar(ruta: &Path, modulo: &str, paso: &str) -> Result<(), String> {
    conectar(ruta)?
        .execute(
            "INSERT OR IGNORE INTO hechos VALUES (?1, ?2, date('now', 'localtime'))",
            params![modulo, paso],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

// La clave ("leccion/modulo") del último paso superado: de ahí sale la lección «donde se dejó».
// rowid = orden de inserción; `cuando` solo guarda el día.
pub fn ultimo(ruta: &Path) -> Result<Option<String>, String> {
    conectar(ruta)?
        .query_row(
            "SELECT modulo FROM hechos ORDER BY rowid DESC LIMIT 1",
            [],
            |fila| fila.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())
}

// `orden` = ids del módulo en orden: si hay progreso del formato anterior ("voy por el paso N"),
// los N primeros pasan a hechos.
pub fn hechos(ruta: &Path, modulo: &str, orden: &[String]) -> Result<HashSet<String>, String> {
    let mut conexion = conectar(ruta)?;
    let antiguo: Option<i64> = conexion
        .query_row(
            "SELECT indice FROM progreso WHERE leccion = ?1",
            [modulo],
            |fila| fila.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    if let Some(indice) = antiguo {
        let tx = conexion.transaction().map_err(|e| e.to_string())?;
        for paso in orden.iter().take(indice.max(0) as usize) {
            tx.execute(
                "INSERT OR IGNORE INTO hechos (modulo, paso) VALUES (?1, ?2)",
                params![modulo, paso],
            )
            .map_err(|e| e.to_string())?;
        }
        tx.execute("DELETE FROM progreso WHERE leccion = ?1", [modulo])
            .map_err(|e| e.to_string())?;
        tx.commit().map_err(|e| e.to_string())?;
    }

    let mut consulta = conexion
        .prepare("SELECT paso FROM hechos WHERE modulo = ?1")
        .map_err(|e| e.to_string())?;
    let filas = consulta
        .query_map([modulo], |fila| fila.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    filas.collect::<Result<_, _>>().map_err(|e| e.to_string())
}

pub fn borrar(ruta: &Path, modulo: &str) -> Result<(), String> {
    let conexion = conectar(ruta)?;
    for tabla in [
        "DELETE FROM hechos WHERE modulo = ?1",
        "DELETE FROM progreso WHERE leccion = ?1",
    ] {
        conexion
            .execute(tabla, [modulo])
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ruta(nombre: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!("retrack-test-{nombre}-{}.db", std::process::id()))
    }

    fn ids(v: &[&str]) -> Vec<String> {
        v.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn marcar_leer_borrar() {
        let ruta = ruta("basico");
        let orden = ids(&["tempo", "pista"]);
        assert!(hechos(&ruta, "jungle/pad", &orden).unwrap().is_empty()); // nunca empezado
        marcar(&ruta, "jungle/pad", "tempo").unwrap();
        marcar(&ruta, "jungle/pad", "tempo").unwrap(); // dos veces no duplica
        marcar(&ruta, "jungle/bass", "tempo").unwrap();
        assert_eq!(
            hechos(&ruta, "jungle/pad", &orden).unwrap(),
            ["tempo".to_string()].into()
        );
        borrar(&ruta, "jungle/pad").unwrap();
        assert!(hechos(&ruta, "jungle/pad", &orden).unwrap().is_empty());
        assert_eq!(hechos(&ruta, "jungle/bass", &orden).unwrap().len(), 1);
        std::fs::remove_file(&ruta).unwrap();
    }

    #[test]
    fn una_base_sin_fechas_conserva_lo_hecho() {
        let ruta = ruta("sin-fechas");
        let antigua = Connection::open(&ruta).unwrap();
        antigua
            .execute_batch(
                "CREATE TABLE hechos (modulo TEXT, paso TEXT, PRIMARY KEY (modulo, paso));
                 INSERT INTO hechos VALUES ('jungle/pad', 'tempo');",
            )
            .unwrap();
        drop(antigua);

        let orden = ids(&["tempo", "pista"]);
        assert_eq!(hechos(&ruta, "jungle/pad", &orden).unwrap().len(), 1);
        marcar(&ruta, "jungle/pad", "pista").unwrap();
        assert_eq!(hechos(&ruta, "jungle/pad", &orden).unwrap().len(), 2);
        std::fs::remove_file(&ruta).unwrap();
    }

    #[test]
    fn el_ultimo_es_el_modulo_del_paso_mas_reciente() {
        let ruta = ruta("ultimo");
        assert_eq!(ultimo(&ruta).unwrap(), None); // nada empezado
        marcar(&ruta, "jungle/pad", "tempo").unwrap();
        marcar(&ruta, "primera/base", "pista-bass").unwrap();
        assert_eq!(ultimo(&ruta).unwrap().as_deref(), Some("primera/base"));
        marcar(&ruta, "jungle/pad", "pista").unwrap();
        assert_eq!(ultimo(&ruta).unwrap().as_deref(), Some("jungle/pad"));
        std::fs::remove_file(&ruta).unwrap();
    }

    #[test]
    fn migra_el_indice_del_formato_anterior_una_sola_vez() {
        let ruta = ruta("migra");
        let conexion = conectar(&ruta).unwrap();
        conexion
            .execute("INSERT INTO progreso VALUES ('jungle/pad', 2)", [])
            .unwrap();
        conexion
            .execute("INSERT INTO progreso VALUES ('jungle', 13)", [])
            .unwrap(); // clave de antes de los módulos: no se toca
        drop(conexion);

        let orden = ids(&["tempo", "pista", "operator"]);
        let esperado: HashSet<String> = ids(&["tempo", "pista"]).into_iter().collect();
        assert_eq!(hechos(&ruta, "jungle/pad", &orden).unwrap(), esperado);
        // Ya migrado: la fila vieja no vuelve a aplicarse aunque se reinicie el módulo.
        borrar(&ruta, "jungle/pad").unwrap();
        assert!(hechos(&ruta, "jungle/pad", &orden).unwrap().is_empty());
        std::fs::remove_file(&ruta).unwrap();
    }
}
