from fastapi import FastAPI

from retrack.live import send
from retrack.player import CHECKS, cargar
from retrack.progreso import guardar, leer

app = FastAPI()


@app.get("/pasos/{leccion}")
def pasos(leccion: str):
    return cargar(f"lecciones/{leccion}.json")


@app.post("/comprobar/{leccion}/{indice}")
def comprobar(leccion: str, indice: int):
    lista = cargar(f"lecciones/{leccion}.json")
    paso = lista[indice]
    snapshot = send("get_session_snapshot")
    funcion = CHECKS[paso["check"]]
    hecho = funcion(snapshot, paso["valor"])
    if hecho:
        guardar(leccion, indice + 1)
    return {"hecho": hecho}


@app.get("/progreso/{leccion}")
def progreso(leccion: str):
    indice = leer(leccion)
    return {"indice": indice}
