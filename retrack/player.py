# CHECKS: dict que relaciona cada nombre de check con su función
# cargar(ruta): abre el JSON y devuelve la lista de pasos
# jugar(ruta):
#   cargar los pasos
#   para cada paso:
#     imprimir "Paso N de TOTAL: instrucción"
#     repetir hasta que esté hecho:
#       esperar Enter
#       pedir snapshot nuevo
#       buscar la función en CHECKS y llamarla con (snapshot, valor)
#       si True: "✔ Hecho" y salir de la repetición
#       si no: "Todavía no"
#   imprimir "¡Lección completada!"

import json

from retrack.live import send
from retrack.verify import tempo_es, track_existe

CHECKS = {"track_existe": track_existe, "tempo_es": tempo_es}


def cargar(ruta):
    with open(ruta, encoding="utf-8") as archivo:
        pasos = json.load(archivo)

    return pasos


def jugar(ruta):

    pasos = cargar(ruta)
    for numero, paso in enumerate(pasos, start=1):
        print(f"Paso {numero} de {len(pasos)}: {paso['instruccion']}")
        while True:
            input("Pulsa Enter cuando lo hayas hecho...")
            snapshot = send("get_session_snapshot")
            funcion = CHECKS[paso["check"]]
            if funcion(snapshot, paso["valor"]):
                print(" hecho")
                break
            print(" Todavia no.")

    print("¡Lección completada!")
