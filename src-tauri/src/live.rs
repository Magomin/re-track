// Cliente del Remote Script AbletonMCP (antes retrack/live.py): TCP localhost:9877,
// envía {"type", "params"} y lee hasta tener un JSON completo (puede llegar en trozos).
use serde_json::{Value, json};
use std::io::{Read, Write};
use std::net::TcpStream;
use std::time::Duration;

pub fn send(cmd: &str, params: Value) -> Result<Value, String> {
    // 127.0.0.1 y no "localhost": AbletonMCP solo escucha en IPv4, y en Windows probar antes ::1
    // cuesta ~2 s por comprobación.
    let mut conexion = TcpStream::connect(("127.0.0.1", 9877))
        .map_err(|e| format!("No conecto con Ableton (¿Live abierto con AbletonMCP?): {e}"))?;
    conexion.set_read_timeout(Some(Duration::from_secs(10))).map_err(|e| e.to_string())?;
    conexion
        .write_all(json!({"type": cmd, "params": params}).to_string().as_bytes())
        .map_err(|e| e.to_string())?;

    let mut buffer = Vec::new();
    let mut trozo = [0u8; 65536];
    loop {
        let n = conexion.read(&mut trozo).map_err(|e| format!("Live no contesta: {e}"))?;
        if n == 0 {
            return Err("Live cerró la conexión".into());
        }
        buffer.extend_from_slice(&trozo[..n]);
        match serde_json::from_slice::<Value>(&buffer) {
            Ok(respuesta) => return parse(respuesta),
            Err(e) if e.is_eof() => continue, // JSON a medias: falta otro trozo
            Err(e) => return Err(format!("Respuesta de Live ilegible: {e}")),
        }
    }
}

pub fn parse(respuesta: Value) -> Result<Value, String> {
    if respuesta["status"] == "error" {
        return Err(respuesta["message"].as_str().unwrap_or("Error de Live").to_string());
    }
    Ok(respuesta["result"].clone())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_success() {
        let r = parse(json!({"status": "success", "result": {"tempo": 123.0}})).unwrap();
        assert_eq!(r["tempo"], 123.0);
    }

    #[test]
    fn parse_error() {
        let r = parse(json!({"status": "error", "result": {}, "message": "Unknown command: no_existe"}));
        assert_eq!(r.unwrap_err(), "Unknown command: no_existe");
    }
}
