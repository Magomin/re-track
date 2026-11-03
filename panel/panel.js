const API = "http://localhost:8000";

// Viven fuera de las funciones para sobrevivir entre comprobaciones.
let leccion = "";
let modulo = null; // null = estamos en la lista de módulos
let pasos = [];
let indice = 0;
let ocupado = false;

const selector = document.getElementById("leccion");
const vistaModulos = document.getElementById("vista-modulos");
const vistaPaso = document.getElementById("vista-paso");
const listaModulos = document.getElementById("modulos");
const tituloModulo = document.getElementById("titulo-modulo");
const contador = document.getElementById("contador");
const instruccion = document.getElementById("instruccion");
const resultado = document.getElementById("resultado");
const roll = document.getElementById("roll");

const NOMBRES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const nombreNota = (pitch) => `${NOMBRES[pitch % 12]}${Math.floor(pitch / 12) - 2}`; // Live: C3 = 60

function svg(etiqueta, atributos, texto) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", etiqueta);
  for (const [k, v] of Object.entries(atributos)) el.setAttribute(k, v);
  if (texto) el.textContent = texto;
  return el;
}

// Mini piano roll: notas de este paso en naranja (gris si ya están puestas),
// las de pasos anteriores de la misma pista en gris oscuro para dar contexto.
function dibujarRoll(faltan = null) {
  roll.replaceChildren();
  const paso = pasos[indice];
  if (!paso || paso.check !== "notas_en_clip") {
    roll.hidden = true;
    return;
  }
  const anteriores = pasos
    .slice(0, indice)
    .filter((p) => p.check === "notas_en_clip" && p.valor.pista === paso.valor.pista)
    .flatMap((p) => p.valor.notas);
  const actuales = paso.valor.notas;
  const todas = [...anteriores, ...actuales];

  const pitches = [...new Set(todas.map((n) => n.pitch))].sort((a, b) => b - a);
  const beats = Math.max(4, Math.ceil(Math.max(...todas.map((n) => n.inicio + n.duracion)) / 4) * 4);
  const izq = 34, fila = 18, ancho = 400, alto = pitches.length * fila + 16;
  const x = (beat) => izq + (beat / beats) * (ancho - izq);
  const y = (pitch) => 16 + pitches.indexOf(pitch) * fila;
  roll.setAttribute("viewBox", `0 0 ${ancho} ${alto}`);

  for (const p of pitches) {
    roll.append(svg("rect", { x: izq, y: y(p), width: ancho - izq, height: fila - 1, fill: "#262626" }));
    roll.append(svg("text", { x: 2, y: y(p) + 13 }, nombreNota(p)));
  }
  for (let b = 0; b <= beats; b++) {
    const compas = b % 4 === 0;
    roll.append(svg("line", { x1: x(b), x2: x(b), y1: 14, y2: alto, stroke: compas ? "#666" : "#333" }));
    if (compas && b < beats) roll.append(svg("text", { x: x(b) + 3, y: 11 }, String(b / 4 + 1)));
  }
  const pintarNota = (n, color) =>
    roll.append(svg("rect", { x: x(n.inicio) + 1, y: y(n.pitch) + 2, width: x(n.inicio + n.duracion) - x(n.inicio) - 2, height: fila - 5, rx: 2, fill: color }));
  for (const n of anteriores) pintarNota(n, "#555");
  for (const n of actuales) {
    const falta = faltan === null || faltan.some((f) => f.pitch === n.pitch && f.inicio === n.inicio);
    pintarNota(n, falta ? "#ff764d" : "#7a9a5a");
  }
  roll.hidden = false;
}

async function pedir(ruta, opciones) {
  return (await fetch(`${API}${ruta}`, opciones)).json();
}

function pintar() {
  if (indice >= pasos.length) {
    contador.textContent = "";
    instruccion.textContent = "¡Módulo completado!";
    resultado.textContent = "";
    dibujarRoll();
    return;
  }
  contador.textContent = `Paso ${indice + 1} de ${pasos.length}`;
  instruccion.textContent = pasos[indice].instruccion;
  resultado.textContent = "Esperando a que lo hagas en Live...";
  dibujarRoll();
}

// Lista de módulos de la lección: salen del JSON, el panel no conoce ninguno de antemano.
async function verModulos(nombre) {
  leccion = nombre;
  modulo = null;
  vistaPaso.hidden = true;
  vistaModulos.hidden = false;
  listaModulos.replaceChildren();
  for (const m of await pedir(`/modulos/${leccion}`)) {
    const hecho = m.hechos >= m.total;
    const boton = document.createElement("button");
    boton.className = hecho ? "modulo hecho" : "modulo";
    const titulo = document.createElement("span");
    titulo.textContent = m.titulo;
    const estado = document.createElement("span");
    estado.className = "estado";
    estado.textContent = hecho ? "✓" : `${m.hechos}/${m.total}`;
    boton.append(titulo, estado);
    boton.addEventListener("click", () => abrirModulo(m.id, m.titulo));
    listaModulos.append(boton);
  }
}

// Entra en un módulo y salta al paso guardado en SQLite.
async function abrirModulo(id, titulo) {
  modulo = id;
  tituloModulo.textContent = titulo;
  pasos = await pedir(`/pasos/${leccion}/${modulo}`);
  indice = (await pedir(`/progreso/${leccion}/${modulo}`)).indice;
  vistaModulos.hidden = true;
  vistaPaso.hidden = false;
  pintar();
}

async function empezar() {
  const nombres = await pedir("/lecciones");
  for (const nombre of nombres) selector.add(new Option(nombre, nombre));
  selector.addEventListener("change", () => verModulos(selector.value));
  document.getElementById("volver").addEventListener("click", () => verModulos(leccion));
  document.getElementById("reiniciar").addEventListener("click", async () => {
    if (!confirm(`¿Empezar "${tituloModulo.textContent}" desde el paso 1?`)) return;
    await pedir(`/progreso/${leccion}/${modulo}`, { method: "DELETE" });
    await abrirModulo(modulo, tituloModulo.textContent);
  });
  await verModulos(nombres[0]);
}

// Cada segundo = una vuelta del while del antiguo player, sin pulsar Enter.
async function comprobar() {
  if (ocupado || modulo === null || indice >= pasos.length) return; // no lanzar otra si la anterior no ha vuelto
  ocupado = true;
  const pedido = `${leccion}/${modulo}`; // si cambias de módulo a mitad, se descarta la respuesta vieja
  try {
    const datos = await pedir(`/comprobar/${leccion}/${modulo}/${indice}`, { method: "POST" });
    if (pedido !== `${leccion}/${modulo}`) return;
    if (datos.hecho) {
      indice++; // la API ya lo ha guardado en SQLite
      pintar();
    } else if (datos.faltan) {
      resultado.textContent = `Faltan: ${datos.faltan.map((f) => `${f.nombre} (compás ${f.compas}, ${f.duracion} beats)`).join(", ")}`;
      dibujarRoll(datos.faltan);
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
