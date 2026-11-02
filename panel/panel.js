const API = "http://localhost:8000";

// Viven fuera de las funciones para sobrevivir entre comprobaciones.
let leccion = "";
let pasos = [];
let indice = 0;
let ocupado = false;

const selector = document.getElementById("leccion");
const contador = document.getElementById("contador");
const instruccion = document.getElementById("instruccion");
const resultado = document.getElementById("resultado");

async function pedir(ruta, opciones) {
  return (await fetch(`${API}${ruta}`, opciones)).json();
}

function pintar() {
  if (indice >= pasos.length) {
    contador.textContent = "";
    instruccion.textContent = "¡Lección completada!";
    resultado.textContent = "";
    return;
  }
  contador.textContent = `Paso ${indice + 1} de ${pasos.length}`;
  instruccion.textContent = pasos[indice].instruccion;
  resultado.textContent = "Esperando a que lo hagas en Live...";
}

// Carga una lección y salta al paso guardado en SQLite.
async function abrir(nombre) {
  leccion = nombre;
  pasos = await pedir(`/pasos/${leccion}`);
  indice = (await pedir(`/progreso/${leccion}`)).indice;
  pintar();
}

async function empezar() {
  const nombres = await pedir("/lecciones");
  for (const nombre of nombres) selector.add(new Option(nombre, nombre));
  selector.addEventListener("change", () => abrir(selector.value));
  await abrir(nombres[0]);
}

// Cada segundo = una vuelta del while del antiguo player, sin pulsar Enter.
async function comprobar() {
  if (ocupado || indice >= pasos.length) return; // no lanzar otra si la anterior no ha vuelto
  ocupado = true;
  const pedida = leccion; // si cambias de lección a mitad, se descarta la respuesta vieja
  try {
    const datos = await pedir(`/comprobar/${leccion}/${indice}`, { method: "POST" });
    if (pedida !== leccion) return;
    if (datos.hecho) {
      indice++; // la API ya lo ha guardado en SQLite
      pintar();
    } else {
      resultado.textContent = "Esperando a que lo hagas en Live...";
    }
  } catch {
    resultado.textContent = "No encuentro la API (¿uvicorn y Ableton abiertos?)";
  } finally {
    ocupado = false;
  }
}

setInterval(comprobar, 1000);
empezar().catch(() => {
  instruccion.textContent = "No encuentro la API. Arranca uvicorn y reabre el panel.";
});
