def track_existe(snapshot, nombre):
    for pista in snapshot["tracks"]:
        if nombre.lower() == pista["name"].lower():
            return True
    return False


def tempo_es(snapshot, bpm):

    return snapshot["session"]["tempo"] == bpm


def device_en_pista(snapshot, valor):
    for pista in snapshot["tracks"]:
        if valor["pista"].lower() == pista["name"].lower():
            for device in pista["devices"]:
                if valor["device"].lower() == device["class_name"].lower():
                    return True
    return False


def clip_en_pista(snapshot, nombre):
    for pista in snapshot["tracks"]:
        if nombre.lower() == pista["name"].lower():
            for hueco in pista["clip_slots"]:
                if hueco["has_clip"]:
                    return True
    return False


CHECKS = {
    "track_existe": track_existe,
    "tempo_es": tempo_es,
    "device_en_pista": device_en_pista,
    "clip_en_pista": clip_en_pista,
}
