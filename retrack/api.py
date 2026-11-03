from pathlib import Path

from fastapi import FastAPI

from retrack.leccion import buscar_modulo, cargar
from retrack.live import send
from retrack.progreso import borrar, guardar, leer
from retrack.verify import CHECKS, notas_que_faltan

app = FastAPI()


@app.get("/lecciones")
def lecciones():
    nombres = []
    for ruta in Path("lecciones").glob("*.json"):
        nombres.append(ruta.stem)
    return nombres


@app.get("/modulos/{leccion}")
def ver_modulos(leccion: str):
    contenido = cargar(f"lecciones/{leccion}.json")
    modulos = []
    for modulo in contenido.modulos:
        modulos.append(
            {
                "id": modulo.id,
                "titulo": modulo.titulo,
                "total": len(modulo.pasos),
                "hechos": leer(f"{leccion}/{modulo.id}"),
            }
        )
    return modulos


@app.get("/pasos/{leccion}/{modulo}")
def ver_pasos(leccion: str, modulo: str):
    contenido = cargar(f"lecciones/{leccion}.json")
    return buscar_modulo(contenido, modulo).pasos


@app.post("/comprobar/{leccion}/{modulo}/{indice}")
def comprobar(leccion: str, modulo: str, indice: int):
    contenido = cargar(f"lecciones/{leccion}.json")
    paso = buscar_modulo(contenido, modulo).pasos[indice]
    snapshot = send("get_session_snapshot")
    funcion = CHECKS[paso.check]
    hecho = funcion(snapshot, paso.valor)
    if hecho:
        guardar(f"{leccion}/{modulo}", indice + 1)
    respuesta = {"hecho": hecho}
    if paso.check == "notas_en_clip" and not hecho:
        respuesta["faltan"] = notas_que_faltan(snapshot, paso.valor)
    return respuesta


@app.get("/progreso/{leccion}/{modulo}")
def progreso(leccion: str, modulo: str):
    return {"indice": leer(f"{leccion}/{modulo}")}


@app.delete("/progreso/{leccion}/{modulo}")
def reiniciar(leccion: str, modulo: str):
    borrar(f"{leccion}/{modulo}")
    return {"indice": 0}
