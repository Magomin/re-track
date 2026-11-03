import json

import pytest
from pydantic import ValidationError

from retrack.leccion import buscar_modulo, cargar


def escribir(tmp_path, pasos):
    datos = {
        "titulo": "T",
        "modulos": [
            {
                "id": "bass",
                "titulo": "Bass",
                "tempo": 124,
                "tonalidad": "C",
                "pasos": pasos,
            }
        ],
    }
    ruta = tmp_path / "leccion.json"
    ruta.write_text(json.dumps(datos), encoding="utf-8")
    return ruta


def test_leccion_buena_se_carga(tmp_path):
    ruta = escribir(tmp_path, [{"instruccion": "x", "check": "tempo_es", "valor": 124}])
    leccion = cargar(ruta)
    modulo = leccion.modulos[0]
    assert modulo.version == 1  # no viene en el JSON: vale el defecto
    assert modulo.pasos[0].check == "tempo_es"
    assert modulo.pasos[0].valor == 124.0


def test_check_que_no_existe_no_entra(tmp_path):
    ruta = escribir(tmp_path, [{"instruccion": "x", "check": "tempo_e", "valor": 124}])
    with pytest.raises(ValidationError):
        cargar(ruta)


def test_buscar_modulo(tmp_path):
    leccion = cargar(escribir(tmp_path, []))
    assert buscar_modulo(leccion, "bass").titulo == "Bass"
    assert buscar_modulo(leccion, "riser") is None


def test_las_lecciones_reales_son_validas():
    for nombre in ["primera", "jungle"]:
        cargar(f"lecciones/{nombre}.json")
