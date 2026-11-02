import sqlite3
from pathlib import Path

RUTA = "data/progreso.db"


def conectar():

    Path(RUTA).parent.mkdir(exist_ok=True)
    # 2. abrir la conexión a RUTA
    conexion = sqlite3.connect(RUTA)
    # 3. crear la tabla si no existe
    conexion.execute(
        "CREATE TABLE IF NOT EXISTS progreso (leccion TEXT PRIMARY KEY, indice INTEGER)"
    )
    # 4. devolver la conexión
    return conexion


def guardar(leccion, indice):
    with conectar() as conexion:
        conexion.execute(
            "INSERT OR REPLACE INTO progreso VALUES (?, ?)", (leccion, indice)
        )


def leer(leccion):
    with conectar() as conexion:
        fila = conexion.execute(
            "SELECT indice FROM progreso WHERE leccion = ?", (leccion,)
        ).fetchone()
        print(fila)
        if fila is None:
            return 0
        return fila[0]
