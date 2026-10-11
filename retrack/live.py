import socket, json


def send():

    conection=socket.create_connection(("localhost", 9877))
    texto =json.dumps({"type":"get_session_info","params":{}})
    datos= texto.encode()
    conection.sendall(datos)
    respuesta= conection.recv(65536)

    datos = respuesta.decode()
    texto = json.loads(datos)
    
    return texto