import socket, json



def parse(texto):
    resultado = json.loads(texto)
    if resultado["status"] == "error":
        raise RuntimeError(resultado["message"])
    return resultado


def send(cmd,params=None):
    if params is None:
        params = {}

    with socket.create_connection(("localhost", 9877)) as conexion:
    
        texto =json.dumps({"type":cmd,"params":params})
    
        datos= texto.encode()
        conexion.sendall(datos)
        respuesta= conexion.recv(65536)

        texto = respuesta.decode()

        return parse(texto)

  
            

        



