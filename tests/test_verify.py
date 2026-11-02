from retrack.leccion import Paso
from retrack.verify import CHECKS, clip_en_pista, device_en_pista

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
