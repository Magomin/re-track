def track_existe(snapshot, nombre):
    for pista in snapshot["tracks"]:
        if nombre.lower() == pista["name"].lower():
            return True
    return False


def tempo_es(snapshot, bpm):

    return snapshot["session"]["tempo"] == bpm
