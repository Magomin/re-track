from fastapi import FastAPI

from retrack.leccion import cargar
from retrack.live import send
from retrack.progreso import guardar, leer
from retrack.verify import CHECKS

app = FastAPI()


@app.get("/pasos/{leccion}")
def ver_pasos(leccion: str):
    return cargar(f"lecciones/{leccion}.json").pasos


@app.post("/comprobar/{leccion}/{indice}")
def comprobar(leccion: str, indice: int):
    contenido = cargar(f"lecciones/{leccion}.json")
    paso = contenido.pasos[indice]
    snapshot = send("get_session_snapshot")
    funcion = CHECKS[paso.check]
    hecho = funcion(snapshot, paso.valor)
    if hecho:
        guardar(leccion, indice + 1)
    return {"hecho": hecho}


@app.get("/progreso/{leccion}")
def progreso(leccion: str):
    indice = leer(leccion)
    return {"indice": indice}
