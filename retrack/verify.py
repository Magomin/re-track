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


NOMBRES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def nombre_nota(pitch):
    # Convención de Live: C3 = 60, así que la octava es pitch // 12 - 2.
    return f"{NOMBRES[pitch % 12]}{pitch // 12 - 2}"


def en_rejilla(beat):
    # Redondea a semicorchea (0.25 beats): una nota dibujada a mano cae justo ahí.
    return round(beat * 4) / 4


def notas_de_pista(snapshot, nombre):
    # Set de (pitch, inicio, duracion): una nota cuenta solo si está en su sitio y dura lo que toca.
    notas = set()
    for pista in snapshot["tracks"]:
        if nombre.lower() == pista["name"].lower():
            for hueco in pista["clip_slots"]:
                if hueco["has_clip"]:
                    for nota in hueco["clip"]["notes"]:
                        notas.add(
                            (
                                nota["pitch"],
                                en_rejilla(nota["start_time"]),
                                en_rejilla(nota["duration"]),
                            )
                        )
    return notas


def notas_buscadas(valor):
    # En el JSON cada nota es {"pitch", "inicio", "duracion"}.
    buscadas = set()
    for nota in valor["notas"]:
        buscadas.add(
            (
                int(nota["pitch"]),
                en_rejilla(nota["inicio"]),
                en_rejilla(nota["duracion"]),
            )
        )
    return buscadas


def notas_en_clip(snapshot, valor):
    return notas_buscadas(valor) <= notas_de_pista(snapshot, valor["pista"])


def notas_que_faltan(snapshot, valor):
    faltan = notas_buscadas(valor) - notas_de_pista(snapshot, valor["pista"])
    resultado = []
    for pitch, inicio, duracion in sorted(faltan, key=lambda n: (n[1], n[0])):
        compas = int(inicio // 4) + 1
        resultado.append(
            {
                "nombre": nombre_nota(pitch),
                "compas": compas,
                "pitch": pitch,
                "inicio": inicio,
                "duracion": duracion,
            }
        )
    return resultado


CHECKS = {
    "track_existe": track_existe,
    "tempo_es": tempo_es,
    "device_en_pista": device_en_pista,
    "clip_en_pista": clip_en_pista,
    "notas_en_clip": notas_en_clip,
}
