from fastapi import FastAPI

from retrack.live import send
from retrack.player import CHECKS, cargar

app = FastAPI()


@app.get("/pasos/{leccion}")
def pasos(leccion: str):
    return cargar(f"lecciones/{leccion}.json")


@app.get("/comprobar/{leccion}/{indice}")
def comprobar(leccion: str, indice: int):
    lista = cargar(f"lecciones/{leccion}.json")
    paso = lista[indice]
    snapshot = send("get_session_snapshot")
    funcion = CHECKS[paso["check"]]
    return {"hecho": funcion(snapshot, paso["valor"])}
