import socket, json


def send(cmd,params=None):
    if params is None:
        params = {}

    conection=socket.create_connection(("localhost", 9877))
    texto =json.dumps({"type":cmd,"params":params})
    datos= texto.encode()
    conection.sendall(datos)
    respuesta= conection.recv(65536)

    texto = respuesta.decode()
    resultado = json.loads(texto)
    
    return resultado



def f(x, lista=None):

    if lista is None:
        lista=[]
    lista.append(x)
    return lista

print(f(1))
print(f(2))
