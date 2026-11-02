const API = "http://localhost:8000";
const LECCION = "primera";

// Viven fuera de las funciones para sobrevivir entre comprobaciones.
let pasos = [];
let indice = 0;
let ocupado = false;

const contador = document.getElementById("contador");
const instruccion = document.getElementById("instruccion");
const resultado = document.getElementById("resultado");

function pintar() {
  if (indice >= pasos.length) {
    contador.textContent = "";
    instruccion.textContent = "¡Lección completada!";
    resultado.textContent = "";
    clearInterval(reloj);
    return;
  }
  contador.textContent = `Paso ${indice + 1} de ${pasos.length}`;
  instruccion.textContent = pasos[indice].instruccion;
  resultado.textContent = "Esperando a que lo hagas en Live...";
}

async function empezar() {
  pasos = await (await fetch(`${API}/pasos/${LECCION}`)).json();
  indice = (await (await fetch(`${API}/progreso/${LECCION}`)).json()).indice;
  pintar();
}

// Cada segundo = una vuelta del while de jugar() en player.py, sin pulsar Enter.
async function comprobar() {
  if (ocupado || indice >= pasos.length) return; // no lanzar otra si la anterior no ha vuelto
  ocupado = true;
  try {
    const respuesta = await fetch(`${API}/comprobar/${LECCION}/${indice}`, { method: "POST" });
    const datos = await respuesta.json();
    if (datos.hecho) {
      indice++; // la API ya lo ha guardado en SQLite
      pintar();
    } else {
      resultado.textContent = "Esperando a que lo hagas en Live...";
    }
  } catch {
    resultado.textContent = "No encuentro la API (¿uvicorn y Ableton abiertos?)";
  }
  ocupado = false;
}

const reloj = setInterval(comprobar, 1000);
empezar().catch(() => {
  instruccion.textContent = "No encuentro la API. Arranca uvicorn y reabre el panel.";
});
