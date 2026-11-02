import json

import pytest
from pydantic import ValidationError

from retrack.leccion import cargar


def escribir(tmp_path, datos):
    ruta = tmp_path / "leccion.json"
    ruta.write_text(json.dumps(datos), encoding="utf-8")
    return ruta


def test_leccion_buena_se_carga(tmp_path):
    ruta = escribir(
        tmp_path,
        {
            "titulo": "T",
            "pasos": [{"instruccion": "x", "check": "tempo_es", "valor": 124}],
        },
    )
    leccion = cargar(ruta)
    assert leccion.pasos[0].check == "tempo_es"
    assert leccion.pasos[0].valor == 124.0


def test_check_que_no_existe_no_entra(tmp_path):
    ruta = escribir(
        tmp_path,
        {
            "titulo": "T",
            "pasos": [{"instruccion": "x", "check": "tempo_e", "valor": 124}],
        },
    )
    with pytest.raises(ValidationError):
        cargar(ruta)


def test_la_leccion_real_es_valida():
    cargar("lecciones/primera.json")


def test_jungle_es_valida():
    cargar("lecciones/jungle.json")
