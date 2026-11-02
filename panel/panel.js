const API = "http://localhost:8000";
const LECCION = "primera";

// Viven fuera de las funciones para sobrevivir entre clics.
let pasos = [];
let indice = 0;

const contador = document.getElementById("contador");
const instruccion = document.getElementById("instruccion");
const resultado = document.getElementById("resultado");
const boton = document.getElementById("comprobar");

function pintar() {
  contador.textContent = `Paso ${indice + 1} de ${pasos.length}`;
  instruccion.textContent = pasos[indice].instruccion;
  resultado.textContent = "";
}

async function empezar() {
  const respuesta = await fetch(`${API}/pasos/${LECCION}`);
  pasos = await respuesta.json();
  pintar();
}

// Cada clic = una vuelta del while de jugar() en player.py.
boton.addEventListener("click", async () => {
  boton.disabled = true;
  resultado.textContent = "Comprobando...";
  try {
    const respuesta = await fetch(`${API}/comprobar/${LECCION}/${indice}`);
    const datos = await respuesta.json();
    if (!datos.hecho) {
      resultado.textContent = "Todavía no";
      boton.disabled = false;
      return;
    }
    indice++;
    if (indice === pasos.length) {
      contador.textContent = "";
      instruccion.textContent = "¡Lección completada!";
      resultado.textContent = "";
      return; // el botón se queda apagado
    }
    pintar();
  } catch {
    resultado.textContent = "No encuentro la API";
  }
  boton.disabled = false;
});

empezar();
