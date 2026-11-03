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


class Modulo(BaseModel):
    id: str  # "bass": texto corto, se usa en las URLs y en "jungle/bass"
    titulo: str  # "Bass del drop": texto para enseñar en el panel
    version: int = 1  # 1, 2, 3...: entero; el "= 1" lo hace opcional
    tempo: float  # 134.0: float, porque hay tempos con decimales (126.5)
    tonalidad: str  # "G#m": texto
    pasos: list[Paso]  # la lista de pasos: el molde de dentro, como antes en Leccion


class Leccion(BaseModel):
    titulo: str
    modulos: list[Modulo]


def cargar(ruta):

    with open(ruta, encoding="utf-8") as archivo:
        datos = json.load(archivo)

    return Leccion.model_validate(datos)


def buscar_modulo(leccion, id):
    for modulo in leccion.modulos:
        if modulo.id == id:
            return modulo
    return None
