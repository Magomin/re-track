// Tauri inyecta window.__TAURI__ (withGlobalTauri); invoke llama a un #[tauri::command] de src-tauri/src/lib.rs.
const { invoke } = window.__TAURI__.core;
const ventana = window.__TAURI__.window.getCurrentWindow();

// Viven fuera de las funciones para sobrevivir entre comprobaciones.
let leccion = "";
let modulo = null; // null = estamos en la lista de módulos
let tituloModulo = "";
let pasos = [];
let indice = 0;
let ocupado = false;

const $ = (id) => document.getElementById(id);
const selector = $("leccion");
const vistaModulos = $("vista-modulos");
const vistaPaso = $("vista-paso");
const listaModulos = $("modulos");
const ruta = $("ruta");
const instruccion = $("instruccion");
const resultado = $("resultado");
const roll = $("roll");
const live = $("live");
const progresoModulo = $("progreso-modulo");

const NOMBRES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const nombreNota = (pitch) => `${NOMBRES[pitch % 12]}${Math.floor(pitch / 12) - 2}`; // Live: C3 = 60
const dos = (n) => String(n).padStart(2, "0");
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2));
// Pasos con lectura y aguja: un parámetro de device o el fader de una pista (en dB).
const conMedida = (paso) => paso && (paso.check === "parametro_en_rango" || paso.check === "volumen_en_rango");

function svg(etiqueta, atributos, texto) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", etiqueta);
  for (const [k, v] of Object.entries(atributos)) el.setAttribute(k, v);
  if (texto) el.textContent = texto;
  return el;
}

function estadoLive(conectado) {
  live.className = conectado ? "si" : "no";
  live.textContent = conectado ? "Live conectado" : "Sin Live";
}

// Mini piano roll: notas que faltan en rojo, las ya puestas en amarillo apagado,
// las de pasos anteriores de la misma pista en gris para dar contexto.
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
  const izq = 34, fila = 18, ancho = 428, alto = pitches.length * fila + 16;
  const x = (beat) => izq + (beat / beats) * (ancho - izq);
  const y = (pitch) => 16 + pitches.indexOf(pitch) * fila;
  roll.setAttribute("viewBox", `0 0 ${ancho} ${alto}`);

  for (const p of pitches) {
    roll.append(svg("rect", { x: izq, y: y(p), width: ancho - izq, height: fila - 1, fill: "#111114" }));
    roll.append(svg("text", { x: 2, y: y(p) + 13 }, nombreNota(p)));
  }
  for (let b = 0; b <= beats; b++) {
    const compas = b % 4 === 0;
    roll.append(svg("line", { x1: x(b), x2: x(b), y1: 14, y2: alto, stroke: compas ? "#3a3a44" : "#1c1c22" }));
    if (compas && b < beats) roll.append(svg("text", { x: x(b) + 3, y: 11 }, String(b / 4 + 1)));
  }
  const pintarNota = (n, atributos) =>
    roll.append(svg("rect", { x: x(n.inicio) + 1, y: y(n.pitch) + 2, width: x(n.inicio + n.duracion) - x(n.inicio) - 2, height: fila - 5, ...atributos }));
  for (const n of anteriores) pintarNota(n, { fill: "#2a2a30" });
  for (const n of actuales) {
    const falta = faltan === null || faltan.some((f) => f.pitch === n.pitch && f.inicio === n.inicio);
    pintarNota(n, falta ? { fill: "#ff2a3d", opacity: 0.85 } : { fill: "rgba(252,238,10,.2)", stroke: "#fcee0a" });
  }
  roll.hidden = false;
}

// Cambio de valor = efecto glitch: los dígitos se barajan ~0.3 s hasta el número real.
const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)");
let ultimoValor = null;
let animacion = 0;
function glitchNumero(el, final) {
  cancelAnimationFrame(animacion);
  if (sinMovimiento.matches) {
    el.textContent = final;
    return;
  }
  el.classList.remove("glitch-on");
  void el.offsetWidth; // reinicia la animación CSS aunque llegue otro cambio a mitad
  el.classList.add("glitch-on");
  const signos = "0123456789#/_-";
  const inicio = performance.now();
  const fotograma = (ahora) => {
    const avance = (ahora - inicio) / 300;
    if (avance >= 1) {
      el.textContent = final;
      return;
    }
    // De izquierda a derecha, cada carácter se queda fijo cuando le llega su turno.
    el.textContent = [...final]
      .map((c, i) => (i / final.length < avance || c === "." ? c : signos[Math.floor(Math.random() * signos.length)]))
      .join("");
    animacion = requestAnimationFrame(fotograma);
  };
  animacion = requestAnimationFrame(fotograma);
}

// Pasos parametro_en_rango / volumen_en_rango: lectura grande del valor y barra con la zona objetivo.
// `actual` = el parámetro tal como lo devuelve Rust ({value, min, max}) o null si aún no se ha leído.
function dibujarMedida(actual = null) {
  const paso = pasos[indice];
  const medida = $("medida");
  if (!actual) ultimoValor = null; // paso nuevo o sin lectura: el siguiente valor entra sin glitch
  if (!conMedida(paso)) {
    medida.hidden = true;
    return;
  }
  const { min, max } = paso.valor;
  const volumen = paso.check === "volumen_en_rango";
  const parametro = volumen ? `Volumen ${paso.valor.pista} (dB)` : paso.valor.parametro;
  const escalaMin = actual && actual.max > actual.min ? actual.min : 0;
  const escalaMax = actual && actual.max > actual.min ? actual.max : 1;
  const pos = (v) => `${((v - escalaMin) / (escalaMax - escalaMin)) * 100}%`;

  $("parametro").textContent = parametro;
  const objetivo = min === max ? num(min) : volumen ? `${num(min)} … ${num(max)} dB` : `${num(min)}–${num(max)}`;
  const texto = actual ? (volumen ? actual.value.toFixed(1) : num(actual.value)) : "—";
  const numero = Object.assign(document.createElement("span"), { id: "numero", textContent: ultimoValor ?? texto });
  $("valor").replaceChildren(numero, " ", Object.assign(document.createElement("small"), { textContent: `→ ${objetivo}` }));
  // Solo anima si cambia un valor ya leído (no al entrar en el paso ni en la primera lectura).
  if (actual && ultimoValor !== null && ultimoValor !== "—" && texto !== ultimoValor) glitchNumero(numero, texto);
  else numero.textContent = texto;
  ultimoValor = actual ? texto : null;
  $("zona").style.left = pos(min);
  $("zona").style.width = `max(2px, calc(${pos(max)} - ${pos(min)}))`;
  const aguja = $("aguja");
  const accion = $("accion");
  aguja.hidden = !actual;
  accion.textContent = "";
  if (actual) {
    const dentro = actual.value >= min && actual.value <= max;
    aguja.style.left = pos(actual.value);
    aguja.className = dentro ? "ok" : "";
    accion.className = dentro ? "ok" : "";
    accion.textContent = dentro ? "■ En su sitio" : actual.value < min ? "▲ Súbelo" : "▼ Bájalo";
  }
  // Objetivo de un solo valor (interruptores como "Glide On"): la barra no aporta, basta la lectura.
  $("medidor").hidden = min === max;
  $("escalas").hidden = min === max;
  $("escala-min").textContent = num(escalaMin);
  $("escala-mid").textContent = num((escalaMin + escalaMax) / 2);
  $("escala-max").textContent = num(escalaMax);
  medida.hidden = false;
}

function pintar() {
  const completo = indice >= pasos.length;
  ruta.textContent = `${leccion} // ${modulo} · ${completo ? "OK" : `${dos(indice + 1)}/${dos(pasos.length)}`}`;
  progresoModulo.textContent = `${tituloModulo.split(":")[0]} ${Math.min(indice, pasos.length)}/${pasos.length}`;
  const paso = pasos[indice];
  instruccion.className = conMedida(paso) ? "porque" : "";
  instruccion.textContent = completo ? "Módulo completado." : paso.instruccion;
  resultado.className = "espera";
  resultado.textContent = completo ? "" : "Esperando a Live…";
  dibujarMedida();
  dibujarRoll();
}

// Lista de módulos de la lección: salen del JSON, el panel no conoce ninguno de antemano.
async function verModulos(nombre) {
  leccion = nombre;
  modulo = null;
  ruta.textContent = leccion;
  progresoModulo.textContent = "";
  vistaPaso.hidden = true;
  vistaModulos.hidden = false;
  listaModulos.replaceChildren();
  for (const m of await invoke("modulos", { leccion })) {
    const hecho = m.hechos >= m.total;
    const boton = document.createElement("button");
    boton.className = hecho ? "modulo hecho" : "modulo";
    const titulo = document.createElement("span");
    titulo.textContent = m.titulo;
    const estado = document.createElement("span");
    estado.className = "estado";
    estado.textContent = hecho ? "■ OK" : `${m.hechos}/${m.total}`;
    boton.append(titulo, estado);
    boton.addEventListener("click", () => abrirModulo(m.id, m.titulo));
    listaModulos.append(boton);
  }
}

// Entra en un módulo y salta al primer paso sin hacer (SQLite).
async function abrirModulo(id, titulo) {
  modulo = id;
  tituloModulo = titulo;
  pasos = await invoke("pasos", { leccion, modulo });
  indice = (await invoke("progreso", { leccion, modulo })).indice;
  vistaModulos.hidden = true;
  vistaPaso.hidden = false;
  pintar();
}

async function empezar() {
  $("minimizar").addEventListener("click", () => ventana.minimize());
  $("cerrar").addEventListener("click", () => ventana.close());
  const nombres = await invoke("lecciones");
  for (const nombre of nombres) selector.add(new Option(nombre, nombre));
  selector.addEventListener("change", () => verModulos(selector.value));
  $("volver").addEventListener("click", () => verModulos(leccion));
  $("reiniciar").addEventListener("click", async () => {
    if (!confirm(`¿Empezar "${tituloModulo}" desde el paso 1?`)) return;
    await invoke("reiniciar", { leccion, modulo });
    await abrirModulo(modulo, tituloModulo);
  });
  await verModulos(nombres[0]);
}

// Cada segundo se comprueba el paso actual contra Live.
async function comprobar() {
  if (ocupado || modulo === null || indice >= pasos.length) return; // no lanzar otra si la anterior no ha vuelto
  ocupado = true;
  const pedido = `${leccion}/${modulo}`; // si cambias de módulo a mitad, se descarta la respuesta vieja
  try {
    const datos = await invoke("comprobar", { leccion, modulo, indice });
    estadoLive(true);
    if (pedido !== `${leccion}/${modulo}`) return;
    if (datos.hecho) {
      indice = datos.indice; // el siguiente sin hacer (Rust ya lo ha guardado en SQLite)
      pintar();
    } else if (datos.detalle) {
      dibujarMedida(datos.actual); // parámetro o volumen: aguja sobre el valor actual en Live
      resultado.className = datos.actual ? "espera" : "";
      resultado.textContent = datos.actual ? "" : datos.detalle; // sin parámetro: qué falta (pista, device…)
    } else if (datos.faltan) {
      resultado.className = "";
      resultado.textContent = `Faltan: ${datos.faltan.map((f) => `${f.nombre} (compás ${f.compas}, ${f.duracion} beats)`).join(" · ")}`;
      dibujarRoll(datos.faltan);
    } else {
      resultado.className = "espera";
      resultado.textContent = "Esperando a Live…";
    }
  } catch (error) {
    const sinLive = String(error).startsWith("No conecto con Ableton");
    estadoLive(!sinLive);
    resultado.className = "";
    resultado.textContent = String(error); // el Err(String) del comando Rust
  } finally {
    ocupado = false;
  }
}

setInterval(comprobar, 1000);
empezar().catch((error) => {
  listaModulos.textContent = String(error); // la vista de módulos es la única visible al arrancar
});
