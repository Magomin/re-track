import json
from typing import Literal

from pydantic import BaseModel


class Paso(BaseModel):
    instruccion: str
    check: Literal[
        "track_existe", "tempo_es", "device_en_pista", "clip_en_pista", "notas_en_clip"
    ]
    # notas_en_clip: {"pista": "PAD", "notas": [{"pitch": 45, "inicio": 0, "duracion": 4}, ...]}
    valor: str | float | dict[str, str | list[dict[str, float]]]


class Leccion(BaseModel):
    titulo: str
    pasos: list[Paso]


def cargar(ruta):

    with open(ruta, encoding="utf-8") as archivo:
        datos = json.load(archivo)

    return Leccion.model_validate(datos)
