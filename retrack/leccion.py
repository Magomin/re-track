import json
from typing import Literal

from pydantic import BaseModel


class Paso(BaseModel):
    instruccion: str
    check: Literal["track_existe", "tempo_es", "device_en_pista", "clip_en_pista"]
    valor: str | float | dict[str, str]


class Leccion(BaseModel):
    titulo: str
    pasos: list[Paso]


def cargar(ruta):

    with open(ruta, encoding="utf-8") as archivo:
        datos = json.load(archivo)

    return Leccion.model_validate(datos)
