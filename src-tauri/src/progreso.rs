// Progreso por módulo en SQLite (antes retrack/progreso.py). Misma tabla y mismo fichero,
// así el progreso guardado desde Python sigue valiendo. Clave = "leccion/modulo".
use rusqlite::{Connection, OptionalExtension, params};
use std::path::Path;

fn conectar(ruta: &Path) -> Result<Connection, String> {
    if let Some(carpeta) = ruta.parent() {
        std::fs::create_dir_all(carpeta).map_err(|e| e.to_string())?;
    }
    let conexion = Connection::open(ruta).map_err(|e| e.to_string())?;
    conexion
        .execute(
            "CREATE TABLE IF NOT EXISTS progreso (leccion TEXT PRIMARY KEY, indice INTEGER)",
            [],
        )
        .map_err(|e| e.to_string())?;
    Ok(conexion)
}

pub fn guardar(ruta: &Path, clave: &str, indice: usize) -> Result<(), String> {
    conectar(ruta)?
        .execute(
            "INSERT OR REPLACE INTO progreso VALUES (?1, ?2)",
            params![clave, indice as i64],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn leer(ruta: &Path, clave: &str) -> Result<usize, String> {
    let indice: Option<i64> = conectar(ruta)?
        .query_row(
            "SELECT indice FROM progreso WHERE leccion = ?1",
            [clave],
            |fila| fila.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(indice.unwrap_or(0) as usize)
}

pub fn borrar(ruta: &Path, clave: &str) -> Result<(), String> {
    conectar(ruta)?
        .execute("DELETE FROM progreso WHERE leccion = ?1", [clave])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn guardar_leer_borrar() {
        let ruta = std::env::temp_dir().join(format!("retrack-test-{}.db", std::process::id()));
        assert_eq!(leer(&ruta, "jungle/pad").unwrap(), 0); // nunca empezado
        guardar(&ruta, "jungle/pad", 3).unwrap();
        guardar(&ruta, "jungle/pad", 4).unwrap(); // sobrescribe, no duplica
        guardar(&ruta, "jungle/bass", 1).unwrap();
        assert_eq!(leer(&ruta, "jungle/pad").unwrap(), 4);
        borrar(&ruta, "jungle/pad").unwrap();
        assert_eq!(leer(&ruta, "jungle/pad").unwrap(), 0);
        assert_eq!(leer(&ruta, "jungle/bass").unwrap(), 1);
        std::fs::remove_file(&ruta).unwrap();
    }
}
