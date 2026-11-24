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
const mapa = $("mapa");
const barraNav = document.querySelector(".barra-nav");
const siguiente = $("siguiente");
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

function crea(etiqueta, clase, texto = "") {
  return Object.assign(document.createElement(etiqueta), { className: clase, textContent: texto });
}

// En la pantalla de lecciones el aviso dice además qué hacer: ahí no hay otro mensaje que lo explique.
function estadoLive(conectado) {
  live.className = conectado ? "si" : "no";
  live.textContent = conectado ? "Live conectado" : modulo === null ? "Sin Live · abre Ableton para comprobar los pasos" : "Sin Live";
}

const esVolumen = (paso) => paso.check === "volumen_en_rango";
function objetivoDe(paso) {
  const { min, max } = paso.valor;
  return min === max ? num(min) : esVolumen(paso) ? `${num(min)} … ${num(max)} dB` : `${num(min)}–${num(max)}`;
}
// El paso en una línea, para la caja «Siguiente»: lo que se mide, o la primera frase de la instrucción.
function enCorto(paso) {
  if (!conMedida(paso)) return paso.instruccion.split(/[.:,]\s/)[0].replace(/\.$/, "");
  return `${esVolumen(paso) ? `Volumen ${paso.valor.pista}` : paso.valor.parametro} → ${objetivoDe(paso)}`;
}

// Mini piano roll: notas que faltan en rojo, las ya puestas en amarillo apagado,
// las de pasos anteriores de la misma pista en gris para dar contexto.
function dibujarRoll(faltan = null) {
  roll.replaceChildren();
  const paso = pasos[indice];
  if (!paso || paso.check !== "notas_en_clip") {
    roll.toggleAttribute("hidden", true); // un <svg> no tiene la propiedad .hidden de HTML
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
  roll.toggleAttribute("hidden", false);
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
  const volumen = esVolumen(paso);
  const parametro = volumen ? `Volumen ${paso.valor.pista} (dB)` : paso.valor.parametro;
  const escalaMin = actual && actual.max > actual.min ? actual.min : 0;
  const escalaMax = actual && actual.max > actual.min ? actual.max : 1;
  const pos = (v) => `${((v - escalaMin) / (escalaMax - escalaMin)) * 100}%`;

  $("parametro").textContent = parametro;
  const objetivo = objetivoDe(paso);
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


// --- El espejo de Live (FDR-002): una plantilla por tipo de paso; la lección solo trae los datos. ---
// Trozos de texto: una cadena va en blanco, un array de un elemento va en amarillo (el objetivo).
function trozos(destino, partes) {
  destino.replaceChildren(...partes.map((p) => (Array.isArray(p) ? crea("b", "", String(p[0])) : String(p))));
}
// Live llama a algunos devices por su nombre de clase.
const NOMBRE_DEVICE = { DrumGroupDevice: "Drum Rack", GlueCompressor: "Glue Compressor", InstrumentGroupDevice: "Instrument Rack" };
const nombreDevice = (clase) => NOMBRE_DEVICE[clase] ?? clase;
const INSTRUMENTOS = ["Analog", "Drift", "Electric", "Operator", "Sampler", "Wavetable"];
const igual = (a, b) => a.toLowerCase() === b.toLowerCase(); // Rust compara los nombres de pista sin mayúsculas

function tituloDe(paso) {
  const v = paso.valor;
  switch (paso.check) {
    case "tempo_es": return ["Tempo a ", [`${num(v)} BPM`]];
    case "track_existe": return ["Pista llamada ", [v]];
    case "device_en_pista": return [[nombreDevice(v.device)], ` en la pista ${v.pista}`];
    case "clip_en_pista": return ["Clip en la pista ", [v]];
    case "clip_en_arreglo": return [`${v.pista} del compás `, [v.desde], " al ", [v.hasta]];
    case "notas_en_clip": return [`Notas en ${v.pista}: `, [[...new Set(v.notas.map((n) => nombreNota(n.pitch)))].join(" · ")]];
    default: return [`${esVolumen(paso) ? `Fader de ${v.pista}` : v.parametro} → `, [objetivoDe(paso)]];
  }
}

const pieza = (texto, clase = "") => crea("span", `pieza ${clase}`, texto);
// Una columna de la vista Session: cabecera y cuatro huecos. `huecos`: "lleno", "falta" o "".
function columna(nombre, clase, huecos = ["", "", "", ""]) {
  const col = crea("div", clase);
  col.append(pieza(nombre, clase === "nueva" ? "falta" : ""), ...huecos.map((h) => crea("i", h, h === "falta" ? "+ CLIP" : "")));
  return col;
}

// Cada plantilla devuelve { zona, dibujo: [nodos], globo: trozos }. `live` = lo que Live tiene ahora, o null si aún no ha contestado.
const ESPEJOS = {
  tempo_es(v, live) {
    const fila = crea("div", "fila");
    fila.append(pieza("Link"), pieza("Tap"), pieza(live ? live.tempo.toFixed(2) : "—", "aqui lectura"), pieza("4 / 4"), pieza("●"), crea("span", "hueco"), pieza("▶"), pieza("■"));
    const falta = live ? v - live.tempo : 0;
    return {
      zona: "Barra de control · arriba a la izquierda",
      dibujo: [fila],
      globo: [live ? `${falta > 0 ? "▲ Súbelo" : "▼ Bájalo"} ${num(Math.abs(falta))}: doble clic y escribe ` : "▸ Doble clic en el tempo y escribe ", [num(v)]],
    };
  },
  track_existe(v, live) {
    const sesion = crea("div", "sesion");
    const hay = live?.pistas ?? [];
    // Caben cuatro pistas de Live y la que falta; si hay más, la cuarta dice cuántas quedan fuera.
    const visibles = hay.length > 4 ? [...hay.slice(0, 3), `+${hay.length - 3} más`] : hay;
    sesion.append(...visibles.map((p) => columna(p, "")), columna(v, "nueva"));
    return { zona: "Vista Session · las pistas", dibujo: [sesion], globo: ["▸ Ctrl+Shift+T crea la pista · Ctrl+R la nombra ", [v]] };
  },
  device_en_pista(v, live) {
    const nombre = nombreDevice(v.device);
    const lista = crea("div", "lista");
    const vecinos = INSTRUMENTOS.includes(nombre) ? INSTRUMENTOS : ["···", nombre, "···"];
    lista.append(crea("span", "et", INSTRUMENTOS.includes(nombre) ? "Instrumentos" : "Navegador"),
      ...vecinos.map((d) => (d === nombre ? crea("span", "aqui", `▸ ${d}`) : crea("span", "", d))));
    const soltar = crea("div", "soltar falta", `Suéltalo en ${v.pista}`);
    if (live?.devices?.length) soltar.append(crea("small", "", `ya tiene: ${live.devices.map(nombreDevice).join(", ")}`));
    const dos = crea("div", "dos");
    dos.append(lista, crea("span", "ro", "▸▸"), soltar);
    return {
      zona: `Navegador → pista ${v.pista}`,
      dibujo: [dos],
      globo: live && !live.devices ? [`▸ Falta la pista ${v.pista}`] : ["▸ Arrastra ", [nombre], ` del navegador a la pista ${v.pista}`],
    };
  },
  clip_en_pista(v, live) {
    const sesion = crea("div", "sesion");
    const huecos = (live?.huecos ?? []).slice(0, 4).map((lleno) => (lleno ? "lleno" : ""));
    while (huecos.length < 4) huecos.push("");
    huecos[huecos.indexOf("")] = "falta"; // el primer hueco vacío es donde se crea el clip
    const otras = (live?.pistas ?? []).filter((p) => !igual(p, v)).slice(0, 4);
    sesion.append(columna(v, "", huecos), ...otras.map((p) => columna(p, "")));
    return {
      zona: `Vista Session · los huecos de ${v}`,
      dibujo: [sesion],
      globo: live && !live.huecos ? [`▸ Falta la pista ${v}`] : ["▸ Doble clic en un hueco vacío de ", [v]],
    };
  },
  clip_en_arreglo(v, live, detalle) {
    const clips = live?.arreglo ?? [];
    // La regla llega al menos al compás 49 y siempre cubre el tramo pedido y lo que ya hay.
    const fin = Math.max(49, ...clips.map((c) => c[1]), v.hasta) + 1;
    const x = (compas) => `${((compas - 1) / (fin - 1)) * 100}%`;
    const tramo = (desde, hasta, clase, texto = "") => {
      const b = crea("b", clase, texto);
      b.style.left = x(desde);
      b.style.width = `calc(${x(hasta)} - ${x(desde)})`;
      return b;
    };
    const regla = crea("div", "regla");
    const cada = fin > 65 ? 16 : 8;
    for (let c = 1; c < fin; c += cada) regla.append(Object.assign(crea("span", "", String(c)), { style: `left:${x(c)}` }));
    const carril = crea("div", "carril");
    carril.append(...clips.map((c) => tramo(c[0], c[1], "hay")), tramo(v.desde, v.hasta, "falta", `${v.desde} – ${v.hasta}`));
    const arreglo = crea("div", "arreglo");
    arreglo.append(crea("span", ""), regla, crea("span", "", v.pista), carril);
    return {
      zona: "Vista Arrangement",
      dibujo: [arreglo],
      globo: detalle ? [`▸ ${detalle}`] : ["▸ Falta ", [v.pista], ` de ${v.desde} a ${v.hasta} · Ctrl+D duplica el clip`],
    };
  },
};

function dibujarEspejo(live = null, detalle = "") {
  const paso = pasos[indice];
  const plantilla = paso && ESPEJOS[paso.check];
  $("espejo").hidden = !plantilla;
  if (!plantilla) return;
  const { zona, dibujo, globo } = plantilla(paso.valor, live, detalle);
  $("zona-live").textContent = zona;
  $("dibujo").replaceChildren(...dibujo);
  trozos($("globo"), globo);
}

function pintar() {
  barraNav.classList.remove("confirmando"); // otro paso u otro módulo: la pregunta de reinicio ya no vale
  const completo = indice >= pasos.length;
  ruta.textContent = `${leccion} // ${modulo} · ${completo ? "OK" : `${dos(indice + 1)}/${dos(pasos.length)}`}`;
  progresoModulo.textContent = `${tituloModulo.split(":")[0]} ${Math.min(indice, pasos.length)}/${pasos.length}`;
  const paso = pasos[indice];
  // El progreso va por id: `indice` es el primer paso sin hacer, y los tramos lo pintan como «hasta aquí».
  $("tramos").replaceChildren(...pasos.map((_, i) => crea("i", i < indice ? "on" : i === indice ? "sig" : "")));
  $("haz").hidden = completo;
  trozos($("titulo"), completo ? [["■ Módulo completado"]] : tituloDe(paso));
  // Con el título diciendo la orden, el texto de la lección es el porqué; en las notas aún lleva el cómo (#35).
  instruccion.className = completo || paso.check === "notas_en_clip" ? "" : "porque";
  instruccion.textContent = completo ? "" : paso.instruccion;
  const conEspejo = !completo && paso.check in ESPEJOS;
  resultado.className = "espera";
  resultado.textContent = completo || conEspejo ? "" : "Esperando a Live…";
  dibujarEspejo();
  dibujarMedida();
  dibujarRoll();
}

// Pantalla de lecciones: la lección como un camino de módulos (FDR-001). Todo sale del JSON de la lección.
const X_PARADA = [40, 100, 160, 100]; // el zigzag se repite cada cuatro módulos
const paradaEn = (i) => [X_PARADA[i % 4], 24 + 43 * i];
function lectura(id, numero, unidad) {
  $(id).replaceChildren(String(numero), " ", crea("small", "", unidad));
}

async function verModulos(nombre) {
  leccion = nombre;
  modulo = null;
  selector.value = leccion;
  const [modulos, { racha, hoy }] = await Promise.all([invoke("modulos", { leccion }), invoke("resumen")]);
  const total = modulos.reduce((s, m) => s + m.total, 0);
  const suma = modulos.reduce((s, m) => s + m.hechos, 0);
  const actual = modulos.find((m) => m.hechos < m.total);
  const nombreDe = (m) => m.titulo.split(":")[0];

  lectura("racha", racha, racha === 1 ? "día" : "días");
  lectura("hoy", hoy, hoy === 1 ? "paso" : "pasos");
  $("avance-de").textContent = leccion;
  $("avance").textContent = `${total ? Math.round((suma / total) * 100) : 0} %`;
  $("avance").className = suma ? "am" : "";

  const alto = 43 * modulos.length + 4;
  const camino = crea("div", "");
  camino.id = "camino";
  camino.style.height = `${alto}px`;
  const trazo = svg("svg", { width: 428, height: alto });
  const linea = (hasta, color) =>
    svg("polyline", { points: modulos.slice(0, hasta).map((_, i) => paradaEn(i).join(",")).join(" "), fill: "none", stroke: color, "stroke-width": 6 });
  trazo.append(linea(modulos.length, "#26262c"));
  // El tramo amarillo llega hasta el módulo en curso.
  trazo.append(linea(actual ? modulos.indexOf(actual) + 1 : modulos.length, "#fcee0a"));
  camino.append(trazo);
  modulos.forEach((m, i) => {
    const hecho = m.hechos >= m.total;
    const [x, y] = paradaEn(i);
    const parada = crea("button", `parada ${hecho ? "on" : m === actual ? "sig" : ""}`);
    parada.style.left = `${x}px`;
    parada.style.top = `${y}px`;
    const rotulo = crea("span", "rot");
    const titulo = crea("b", "", `${nombreDe(m)} `);
    titulo.append(crea("span", "", hecho ? "OK" : `${m.hechos}/${m.total}`));
    rotulo.append(titulo, m.titulo.split(": ")[1] ?? "");
    parada.append(crea("span", "nodo", hecho ? "■" : m === actual ? "▸" : String(i + 1)), rotulo);
    parada.addEventListener("click", () => abrirModulo(m.id, m.titulo));
    camino.append(parada);
  });
  mapa.replaceChildren(camino);

  const texto = crea("div", "");
  const boton = crea("button", "cta");
  if (actual) {
    const [susPasos, { indice: i }] = await Promise.all([
      invoke("pasos", { leccion, modulo: actual.id }),
      invoke("progreso", { leccion, modulo: actual.id }),
    ]);
    texto.append(crea("span", "et ro", `▸ Siguiente · ${nombreDe(actual)} · paso ${dos(i + 1)}/${dos(actual.total)}`), crea("strong", "", enCorto(susPasos[i])));
    boton.textContent = `${suma ? "Continuar" : "Empezar"} ▸`;
    boton.addEventListener("click", () => abrirModulo(actual.id, actual.titulo));
  } else {
    texto.append(
      crea("span", "et am", `■ Lección completada · ${suma}/${total}`),
      crea("strong", "", `${leccion[0].toUpperCase()}${leccion.slice(1)} está reconstruida entera.`),
    );
    boton.textContent = "Otra lección ▸";
    boton.addEventListener("click", () => selector.showPicker());
  }
  siguiente.className = actual ? "sig-caja" : "sig-caja ok";
  siguiente.replaceChildren(texto, boton);

  ruta.textContent = "";
  progresoModulo.textContent = `${suma}/${total} pasos`;
  vistaPaso.hidden = true;
  vistaModulos.hidden = false;
  document.body.classList.add("inicio");
  sondearLive();
}

// En la pantalla de lecciones no se comprueba ningún paso: se pregunta solo si Live contesta.
async function sondearLive() {
  if (ocupado || modulo !== null) return;
  ocupado = true;
  try {
    const conectado = await invoke("conectado");
    if (modulo === null) estadoLive(conectado);
  } catch {
    estadoLive(false);
  } finally {
    ocupado = false;
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
  document.body.classList.remove("inicio");
  pintar();
}

async function empezar() {
  $("minimizar").addEventListener("click", () => ventana.minimize());
  $("cerrar").addEventListener("click", () => ventana.close());
  const nombres = await invoke("lecciones");
  for (const nombre of nombres) selector.add(new Option(nombre, nombre));
  selector.addEventListener("change", () => verModulos(selector.value));
  $("volver").addEventListener("click", () => verModulos(leccion));
  $("reiniciar").addEventListener("click", () => {
    barraNav.classList.add("confirmando");
    $("no-reiniciar").focus();
  });
  $("no-reiniciar").addEventListener("click", () => {
    barraNav.classList.remove("confirmando");
    $("reiniciar").focus();
  });
  $("si-reiniciar").addEventListener("click", async () => {
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
    } else if (pasos[indice].check in ESPEJOS) {
      dibujarEspejo(datos.live, datos.detalle); // lo que Live tiene ahora, dentro del dibujo
      resultado.textContent = "";
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

setInterval(() => (modulo === null ? sondearLive() : comprobar()), 1000);
empezar().catch((error) => {
  mapa.textContent = String(error); // la pantalla de lecciones es la única visible al arrancar
});
