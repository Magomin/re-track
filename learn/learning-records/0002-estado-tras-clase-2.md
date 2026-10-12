# Estado tras clases 1 y 2 (2026-10-11/12): qué es sólido y qué no

Sólido (lo escribió solo y funcionó): cadena dict → `json.dumps` → `.encode()` → socket → `.decode()` → `json.loads`; parámetros `cmd, params=None`; `with socket.create_connection(...) as conexion`.

Flojo (visto, no demostrado): `raise` y excepciones. Entendió que `KeyError: 'tempo'` "mentía" y preguntó bien por qué hacía falta `RuntimeError`, pero no supo colocar el `if status == "error": raise` solo tras cuatro intentos; lo escribí yo a petición ("hazlo tu"). Mutable default argument: vio la demo, dijo "entendido", sin evidencia. Retestar ambos en una lección corta antes de apoyarse en ellos.

Implicación: el orden "pedir que aplique → explicar si se atasca" falló. Nuevo orden: lección aislada con ejemplo que corre + quiz, y solo después la tarea en el proyecto.
