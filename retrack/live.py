import json
import socket


def parse(texto):
    resultado = json.loads(texto)
    if resultado["status"] == "error":
        raise RuntimeError(resultado["message"])
    return resultado["result"]


def send(cmd, params=None):
    if params is None:
        params = {}

    with socket.create_connection(("localhost", 9877)) as conexion:
        texto = json.dumps({"type": cmd, "params": params})

        datos = texto.encode()
        conexion.sendall(datos)

        buffer = b""

        while True:
            respuesta = conexion.recv(65536)
            if respuesta == b"":
                raise ConnectionError("Live cerro la conexión")
            buffer += respuesta
            try:
                return parse(buffer)

            except json.JSONDecodeError:
                pass
