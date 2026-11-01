def track_existe(snapshot, nombre):
    for pista in snapshot["tracks"]:
        if nombre.lower() == pista["name"].lower():
            return True
    return False
