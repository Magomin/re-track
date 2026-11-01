def track_existe(snapshot, nombre):
    for pista in snapshot["tracks"]:
        print(repr(nombre), repr(pista["name"]))
        if nombre == pista["name"]:
            print("pista", nombre, "existe!")
            return True
    return False
