from retrack.leccion import Paso
from retrack.verify import (
    CHECKS,
    clip_en_pista,
    device_en_pista,
    nombre_nota,
    notas_en_clip,
    notas_que_faltan,
)

SNAPSHOT = {
    "tracks": [
        {
            "name": "PAD",
            "devices": [{"name": "Mi pad", "class_name": "Operator"}],
            "clip_slots": [{"has_clip": False}, {"has_clip": True}],
        },
        {"name": "2-MIDI", "devices": [], "clip_slots": [{"has_clip": False}]},
    ]
}


def test_device_en_pista():
    assert device_en_pista(SNAPSHOT, {"pista": "pad", "device": "Operator"})
    assert not device_en_pista(SNAPSHOT, {"pista": "PAD", "device": "Wavetable"})
    assert not device_en_pista(SNAPSHOT, {"pista": "2-MIDI", "device": "Operator"})


def test_clip_en_pista():
    assert clip_en_pista(SNAPSHOT, "PAD")
    assert not clip_en_pista(SNAPSHOT, "2-MIDI")
    assert not clip_en_pista(SNAPSHOT, "NOEXISTE")


def test_checks_y_schema_van_a_la_par():
    permitidos = set(Paso.model_fields["check"].annotation.__args__)
    assert permitidos == set(CHECKS)


def notas(*pares):
    return [{"pitch": p, "inicio": i, "duracion": 4} for p, i in pares]


def nota_live(pitch, inicio, duracion=4.0):
    return {"pitch": pitch, "start_time": inicio, "duration": duracion}


CLIP_PAD = {
    "tracks": [
        {
            "name": "PAD",
            "clip_slots": [
                {
                    "has_clip": True,
                    "clip": {"notes": [nota_live(52, 0.0), nota_live(45, 0.0)]},
                },
                {"has_clip": False, "clip": None},
                {"has_clip": True, "clip": {"notes": [nota_live(44, 4.0)]}},
            ],
        }
    ]
}


def test_notas_en_clip():
    assert notas_en_clip(CLIP_PAD, {"pista": "pad", "notas": notas((45, 0), (52, 0))})
    assert notas_en_clip(CLIP_PAD, {"pista": "PAD", "notas": notas((44, 4))})
    assert not notas_en_clip(
        CLIP_PAD, {"pista": "PAD", "notas": notas((44, 0), (51, 0))}
    )
    assert not notas_en_clip(CLIP_PAD, {"pista": "BASS", "notas": notas((45, 0))})


def test_nota_en_otro_compas_no_cuenta():
    # El bug de la partida: G#1 está en el compás 2 (beat 4), pero el compás 3 la pide en el beat 8.
    assert not notas_en_clip(
        CLIP_PAD, {"pista": "PAD", "notas": notas((44, 8), (52, 8))}
    )


def test_nota_un_poco_movida_cuenta():
    clip = {
        "tracks": [
            {
                "name": "PAD",
                "clip_slots": [
                    {"has_clip": True, "clip": {"notes": [nota_live(45, 0.04)]}}
                ],
            }
        ]
    }
    assert notas_en_clip(clip, {"pista": "PAD", "notas": notas((45, 0))})


def test_nota_con_otra_duracion_no_cuenta():
    clip = {
        "tracks": [
            {
                "name": "PAD",
                "clip_slots": [
                    {"has_clip": True, "clip": {"notes": [nota_live(45, 0.0, 1.0)]}}
                ],
            }
        ]
    }
    assert not notas_en_clip(clip, {"pista": "PAD", "notas": notas((45, 0))})


def test_nombre_nota():
    assert nombre_nota(60) == "C3"
    assert nombre_nota(45) == "A1"
    assert nombre_nota(44) == "G#1"
    assert nombre_nota(32) == "G#0"


def test_notas_que_faltan():
    valor = {"pista": "PAD", "notas": notas((52, 8), (44, 8), (45, 0))}
    faltan = notas_que_faltan(CLIP_PAD, valor)
    assert [(f["nombre"], f["compas"]) for f in faltan] == [("G#1", 3), ("E2", 3)]
