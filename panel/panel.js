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
const live = $("live");
const progresoModulo = $("progreso-modulo");

const NOMBRES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const nombreNota = (pitch) => `${NOMBRES[pitch % 12]}${Math.floor(pitch / 12) - 2}`; // Live: C3 = 60
const dos = (n) => String(n).padStart(2, "0");
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2));

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
// Cambio de valor = efecto glitch: los dígitos se barajan ~0.3 s hasta el número real.
const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)");
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

// --- El espejo de Live (FDR-002): una plantilla por tipo de paso; la lección solo trae los datos. ---
// Trozos de texto: una cadena va en blanco, un array de un elemento va en amarillo (el objetivo).
function trozos(destino, partes) {
  destino.replaceChildren(...partes.map((p) => (Array.isArray(p) ? crea("b", "", String(p[0])) : String(p))));
}
// Live llama a algunos devices por su nombre de clase.
const NOMBRE_DEVICE = { StereoGain: "Utility", DrumGroupDevice: "Drum Rack", GlueCompressor: "Glue Compressor", InstrumentGroupDevice: "Instrument Rack" };
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
// El número del gesto, pegado al sitio del dibujo donde se hace. La clase g1/g2/g3 lo enciende en su turno de la demo;
// con `fijo`, el sitio se queda encendido todo el rato (algo aparece en él más tarde).
function marca(n, nodo, fijo = false) {
  nodo.prepend(crea("em", "n", String(n)));
  if (!fijo) nodo.classList.add(`g${n}`);
  return nodo;
}
// Una zona de la ventana de Live: su rótulo y lo que lleva dentro.
function zonaDe(clase, rotulo, ...nodos) {
  const zona = crea("div", clase);
  zona.append(...(rotulo ? [crea("span", "et", rotulo)] : []), ...nodos);
  return zona;
}
const relleno = (n) => Array.from({ length: n }, () => crea("i", "barra"));
// Las pistas de Live en una fila; la del paso va la primera, marcada con su número de gesto si lo tiene.
function filaPistas(live, pista = null, gesto = 0) {
  const fila = crea("div", "fila");
  const otras = (live?.pistas ?? []).filter((p) => !pista || !igual(p, pista)).slice(0, pista ? 3 : 4);
  if (pista) fila.append(gesto ? marca(gesto, pieza(pista, "aqui")) : pieza(pista, "aqui"));
  fila.append(...otras.map((p) => pieza(p)));
  if (!fila.children.length) fila.append(pieza("···"));
  return fila;
}
// La ventana de Ableton en miniatura, siempre con la misma geografía: barra de control arriba, navegador a la izquierda,
// la vista (Session o Arrangement) y abajo del todo el detalle. Cada plantilla detalla la zona donde se actúa.
function mapaLive(live, { control, nave, arriba, abajo }) {
  const mapa = crea("div", "mapa-live");
  mapa.append(
    control ?? crea("div", "control"),
    nave ?? zonaDe("nave", "Navegador", ...relleno(3)),
    arriba ?? zonaDe("pistas", "Pistas", filaPistas(live)),
    abajo ?? zonaDe("abajo", "Detalle · abajo del todo"),
  );
  return mapa;
}
// Una columna de la vista Session: cabecera y huecos. `huecos`: nodos <i>.
function columna(cabecera, huecos = [crea("i", ""), crea("i", "")]) {
  const col = crea("div", "");
  col.append(cabecera, ...huecos);
  return col;
}
// Dos textos en el mismo sitio: el de ahora se va y el objetivo entra con glitch en el gesto `n` de la demo.
function cambia(antes, despues, n) {
  const caja = crea("span", "cambia");
  caja.append(crea("span", `sale-${n}`, antes), crea("span", `entra-${n} meta`, despues));
  return caja;
}

// Lectura con aguja: el valor de Live sobre la zona objetivo. Devuelve el nodo y cómo moverlo sin repintar.
function medidor(paso, actual, nombre = null) {
  const { min, max } = paso.valor;
  const numero = crea("span", "", "—");
  numero.id = "numero";
  const lectura = crea("div", "lectura-grande");
  lectura.append(numero, " ", crea("small", "", `→ ${objetivoDe(paso)}`));
  const zona = crea("div", "obj"), aguja = crea("div", "aguja"), carro = crea("div", "carro");
  carro.append(aguja);
  const barra = crea("div", "medidor");
  barra.append(zona, carro);
  barra.hidden = min === max; // un interruptor (Glide On): la barra no aporta, basta la lectura
  const caja = crea("div", "medida");
  if (nombre) lectura.prepend(nombre);
  caja.append(lectura, barra);
  let ultimo = null;
  const ajusta = (a) => {
    carro.hidden = !a;
    if (!a) return;
    const ancho = a.max > a.min ? a.max - a.min : 1, base = a.max > a.min ? a.min : 0;
    const pos = (x) => ((x - base) / ancho) * 100;
    zona.style.left = `${pos(min)}%`;
    zona.style.width = `max(3px, ${pos(max) - pos(min)}%)`;
    carro.style.transform = `translateX(${pos(a.value)}%)`; // el carro mide lo que la barra: su % es el de la escala
    aguja.className = a.value >= min && a.value <= max ? "aguja ok" : "aguja";
    const texto = esVolumen(paso) ? a.value.toFixed(1) : num(a.value);
    // Solo anima si cambia un valor ya leído (no en la primera lectura).
    if (ultimo !== null && texto !== ultimo) glitchNumero(numero, texto);
    else numero.textContent = texto;
    ultimo = texto;
  };
  ajusta(actual);
  return { caja, ajusta };
}
// Hacia dónde hay que mover el valor: -1 subir, 1 bajar, 0 en su sitio, null sin lectura.
const lado = (paso, a) => (!a ? null : a.value < paso.valor.min ? -1 : a.value > paso.valor.max ? 1 : 0);
const ordenDe = (l) => (l === null ? "Muévelo" : l < 0 ? "▲ Súbelo" : l > 0 ? "▼ Bájalo" : "■ En su sitio:");

// Piano roll: notas que faltan en rojo discontinuo, las ya puestas en amarillo, las de pasos anteriores en gris.
function pianoRoll(paso, faltan) {
  const anteriores = pasos
    .slice(0, indice)
    .filter((p) => p.check === "notas_en_clip" && p.valor.pista === paso.valor.pista)
    .flatMap((p) => p.valor.notas);
  const actuales = paso.valor.notas;
  const todas = [...anteriores, ...actuales];
  const pitches = [...new Set(todas.map((n) => n.pitch))].sort((a, b) => b - a);
  const beats = Math.max(4, Math.ceil(Math.max(...todas.map((n) => n.inicio + n.duracion)) / 4) * 4);
  const izq = 30, fila = 10, ancho = 290, alto = pitches.length * fila + 12;
  const x = (beat) => izq + (beat / beats) * (ancho - izq);
  const y = (pitch) => 12 + pitches.indexOf(pitch) * fila;
  const roll = svg("svg", { viewBox: `0 0 ${ancho} ${alto}`, class: "roll" });
  for (const p of pitches) {
    roll.append(svg("rect", { x: izq, y: y(p), width: ancho - izq, height: fila - 1, fill: "#111114" }));
    roll.append(svg("text", { x: 1, y: y(p) + 8 }, nombreNota(p)));
  }
  for (let b = 0; b <= beats; b++) {
    const compas = b % 4 === 0;
    roll.append(svg("line", { x1: x(b), x2: x(b), y1: 11, y2: alto, stroke: compas ? "#3a3a44" : "#1c1c22" }));
    if (compas && b < beats) roll.append(svg("text", { x: x(b) + 2, y: 9 }, String(b / 4 + 1)));
  }
  const nota = (n, atributos) =>
    roll.append(svg("rect", { x: x(n.inicio) + 1, y: y(n.pitch) + 1, width: x(n.inicio + n.duracion) - x(n.inicio) - 2, height: fila - 3, ...atributos }));
  for (const n of anteriores) nota(n, { fill: "#2a2a30" });
  for (const n of actuales) {
    const falta = !faltan || faltan.some((f) => f.pitch === n.pitch && f.inicio === n.inicio);
    nota(n, falta ? { fill: "rgba(255,42,61,.25)", stroke: "#ff2a3d", "stroke-dasharray": "4 2", class: "g3" } : { fill: "rgba(252,238,10,.2)", stroke: "#fcee0a" });
  }
  return roll;
}

// Cada plantilla recibe el valor del paso y lo que contestó `comprobar` (d.live, d.detalle, d.actual, d.faltan; vacío si
// Live aún no ha contestado) y devuelve { zona, dibujo, gestos | globo, demo, despues, ajusta }.
const ESPEJOS = {
  tempo_es(v, d) {
    const ahora = d.live ? d.live.tempo.toFixed(2) : "—";
    const caja = marca(1, pieza("", "aqui lectura"), true);
    caja.append(cambia(ahora, Number(v).toFixed(2), 2), crea("i", "flash-3"));
    const control = crea("div", "control grande");
    control.append(pieza("Link"), pieza("Tap"), caja, pieza("4 / 4"), pieza("●"), crea("span", "hueco"), pieza("▶"), pieza("■"));
    return {
      zona: "Barra de control · arriba del todo",
      dibujo: [mapaLive(d.live, { control })],
      gestos: [[`Doble clic en el tempo${d.live ? ` (ahora ${ahora})` : ""}`], ["Escribe ", [num(v)]], ["Pulsa Enter"]],
      demo: true,
    };
  },
  track_existe(v, d) {
    const hay = d.live?.pistas ?? [];
    // Caben tres pistas de Live y la nueva; si hay más, la tercera dice cuántas quedan fuera.
    const visibles = hay.length > 3 ? [...hay.slice(0, 2), `+${hay.length - 2} más`] : hay;
    const cabecera = marca(1, pieza("", "falta"), true);
    cabecera.append(cambia(`${hay.length + 1}-MIDI`, v, 3));
    const nueva = columna(cabecera);
    nueva.className = "nueva entra-1";
    const sesion = crea("div", "sesion");
    sesion.append(...visibles.map((p) => columna(pieza(p))), nueva);
    return {
      zona: "Vista Session · las pistas",
      dibujo: [mapaLive(d.live, { arriba: zonaDe("pistas", "Pistas", sesion) })],
      gestos: [["Ctrl+Shift+T: nace una pista MIDI"], ["Ctrl+R: se puede renombrar"], ["Escribe ", [v], " y pulsa Enter"]],
      demo: true,
    };
  },
  // Tres gestos y su orden: elegir la pista, encontrar el device y soltarlo abajo. El device viaja animado a su destino.
  device_en_pista(v, d) {
    const nombre = nombreDevice(v.device);
    const instrumento = INSTRUMENTOS.includes(nombre);
    const i = INSTRUMENTOS.indexOf(nombre);
    const vecinos = instrumento ? INSTRUMENTOS.slice(Math.max(0, i - 1), i + 2) : ["···", nombre, "···"];
    const origen = marca(2, crea("span", "aqui", nombre));
    const nave = zonaDe("nave", "Navegador", ...vecinos.map((x) => (x === nombre ? origen : crea("span", "", x))));

    // Abajo, los devices de la pista tal como están en Live. Un instrumento va siempre el primero; un efecto, detrás.
    const hay = (d.live?.devices ?? []).map(nombreDevice);
    const destino = marca(3, pieza(hay.length ? nombre : "Drop an Instrument or Sample Here", "falta"));
    destino.append(crea("i", "destello"));
    const cadena = crea("div", "cadena");
    const resto = hay.map((x) => pieza(x));
    cadena.append(...(instrumento ? [destino, ...resto] : [...resto, destino]));
    const fantasma = crea("div", "fantasma");
    fantasma.append(crea("span", "", `${nombre} ▸`));
    const mapa = mapaLive(d.live, {
      nave,
      arriba: zonaDe("pistas", "Pistas", filaPistas(d.live, v.pista, 1)),
      abajo: zonaDe("abajo", `Devices de ${v.pista} · abajo del todo`, cadena),
    });
    mapa.append(fantasma);

    const sinPista = Boolean(d.live) && !d.live.devices;
    const junto = !hay.length ? [] : [instrumento ? `, delante de ${hay[0]}` : `, detrás de ${hay.at(-1)}`];
    return {
      zona: "Tu ventana de Ableton, en pequeño",
      dibujo: [mapa],
      globo: [`▸ Falta la pista ${v.pista}`],
      gestos: sinPista ? null : [
        ["Clic en la pista ", [v.pista]],
        ["Busca ", [nombre], " en el navegador (Ctrl+Alt+B)"],
        ["Arrástralo ", ["abajo del todo"], ...junto],
      ],
      demo: !sinPista,
      // Con el dibujo ya en pantalla: de dónde sale el device y cuánto tiene que viajar.
      despues() {
        const m = mapa.getBoundingClientRect(), o = origen.getBoundingClientRect(), z = destino.getBoundingClientRect();
        fantasma.style.left = `${o.left - m.left}px`;
        fantasma.style.top = `${o.top - m.top}px`;
        mapa.style.setProperty("--dx", `${z.left - o.left + (z.width - fantasma.offsetWidth) / 2}px`);
        mapa.style.setProperty("--dy", `${z.top - o.top + (z.height - o.height) / 2}px`);
      },
    };
  },
  clip_en_pista(v, d) {
    const llenos = (d.live?.huecos ?? []).slice(0, 3);
    while (llenos.length < 3) llenos.push(false);
    const libre = llenos.indexOf(false); // el primer hueco vacío es donde se crea el clip
    const huecos = llenos.map((lleno, i) => {
      if (i !== libre) return crea("i", lleno ? "lleno" : "");
      const hueco = marca(2, crea("i", "falta"), true);
      hueco.append(crea("b", "entra-3 clip", "clip"));
      return hueco;
    });
    const otras = (d.live?.pistas ?? []).filter((p) => !igual(p, v)).slice(0, 3);
    const sesion = crea("div", "sesion");
    sesion.append(columna(pieza(v, "aqui"), huecos), ...otras.map((p) => columna(pieza(p), [crea("i", ""), crea("i", ""), crea("i", "")])));
    const sinPista = Boolean(d.live) && !d.live.huecos;
    return {
      zona: `Vista Session · los huecos de ${v}`,
      dibujo: [mapaLive(d.live, { arriba: zonaDe("pistas", "Pistas", sesion) })],
      globo: [`▸ Falta la pista ${v}`],
      gestos: sinPista ? null : [["Vista Session (Tab)"], ["Un hueco vacío de ", [v]], ["Doble clic: nace el clip"]],
      demo: !sinPista,
    };
  },
  clip_en_arreglo(v, d) {
    const clips = d.live?.arreglo ?? [];
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
    const falta = tramo(v.desde, v.hasta, "falta");
    falta.append(crea("u", "entra-3", `${v.desde} – ${v.hasta}`));
    const carril = crea("div", "carril");
    carril.append(...clips.map((c) => tramo(c[0], c[1], "hay")), falta);
    const arreglo = crea("div", "arreglo");
    arreglo.append(crea("span", ""), regla, crea("span", "", v.pista), carril);
    const sinPista = (d.detalle ?? "").startsWith("No encuentro");
    return {
      zona: "Vista Arrangement",
      dibujo: [mapaLive(d.live, { arriba: zonaDe("pistas", "Arrangement · la línea de tiempo", arreglo) })],
      globo: [`▸ ${d.detalle}`],
      gestos: sinPista ? null : [
        ["Vista Arrangement (Tab)"],
        ["Clip de ", [v.pista], ` desde el compás ${v.desde}`],
        // Si ya hay un clip pero mal colocado, Rust dice de dónde a dónde suena.
        (d.detalle ?? "").includes("suena") ? [d.detalle] : ["Que acabe en el ", [v.hasta], " · Ctrl+D lo duplica"],
      ],
      demo: !sinPista,
    };
  },
  parametro_en_rango(v, d) {
    return conAguja(this.paso, d, {
      zona: `${nombreDevice(v.device)} · pista ${v.pista}`,
      arriba: (live) => zonaDe("pistas", "", filaPistas(live, v.pista, 1)),
      abajo: (caja) => zonaDe("abajo", `${nombreDevice(v.device)} de ${v.pista} · abajo del todo`, caja),
      nombre: marca(2, crea("span", "control-nombre", v.parametro)),
      gestos: [["Clic en la pista ", [v.pista]], ["Abajo, en ", [nombreDevice(v.device)], `: ${v.parametro}`]],
    });
  },
  volumen_en_rango(v, d) {
    return conAguja(this.paso, d, {
      zona: "Mezclador · vista Session",
      arriba: (live, caja) => zonaDe("pistas", "Pistas · sus faders", filaPistas(live, v.pista, 2), caja),
      nombre: crea("span", "control-nombre", "Fader"),
      gestos: [["Vista Session (Tab)"], ["El fader de ", [v.pista], " (dB)"]],
    });
  },
  notas_en_clip(v, d) {
    const faltan = d.faltan ? [...new Set(d.faltan.map((f) => f.nombre))].join(" · ") : "";
    const abajo = zonaDe("abajo", `Piano roll de ${v.pista} · abajo del todo`, pianoRoll(this.paso, d.faltan ?? null));
    marca(2, abajo.firstChild);
    return {
      zona: `Piano roll · clip de ${v.pista}`,
      dibujo: [mapaLive(d.live, { arriba: zonaDe("pistas", "", filaPistas(d.live, v.pista, 1)), abajo })],
      gestos: [["Doble clic en el clip de ", [v.pista]], ["Abajo se abre el piano roll"], faltan ? ["Faltan ", [faltan]] : ["Dibuja las notas rojas (B: lápiz)"]],
      demo: true,
    };
  },
};
// Parámetro y fader comparten la lectura con aguja; cambia la zona de Live donde vive.
function conAguja(paso, d, { zona, arriba, abajo, gestos, nombre }) {
  const sinLectura = Boolean(d.detalle) && !d.actual; // falta la pista, el device o el parámetro: Rust dice cuál
  const { caja, ajusta } = medidor(paso, d.actual ?? null, nombre);
  const l = lado(paso, d.actual);
  return {
    zona,
    dibujo: [mapaLive(d.live, { arriba: arriba(d.live, abajo ? null : caja), abajo: abajo?.(caja) })],
    globo: [`▸ ${d.detalle}`],
    gestos: sinLectura ? null : [...gestos, [`${ordenDe(l)} ${l === 0 ? "" : "hasta "}`, [objetivoDe(paso)]]],
    demo: !sinLectura,
    ajusta: (datos) => ajusta(datos.actual ?? null),
  };
}

// Lo último dibujado. Si Live contesta lo mismo que hace un segundo no se repinta (la demo no vuelve a empezar);
// si solo cambia el valor leído, se mueve la aguja sobre el mismo dibujo.
let espejo = { clave: "", ajusta: null };
function dibujarEspejo(d = {}) {
  const paso = pasos[indice];
  if (!paso) {
    $("espejo").hidden = true;
    return;
  }
  const clave = JSON.stringify([leccion, modulo, indice, d.live, d.detalle, d.faltan, Boolean(d.actual), lado(paso, d.actual)]);
  if (clave === espejo.clave) {
    espejo.ajusta?.(d);
    return;
  }
  const { zona, dibujo, globo, gestos, demo, despues, ajusta } = ESPEJOS[paso.check].call({ paso }, paso.valor, d);
  espejo = { clave, ajusta };
  $("espejo").hidden = false;
  $("zona-live").textContent = zona;
  // La demo arranca al final, con las distancias de `despues` ya puestas: WebView2 se queda con las del arranque.
  $("espejo").classList.remove("demo");
  $("dibujo").replaceChildren(...dibujo);
  // Los gestos van numerados y en su orden; si falta algo previo (la pista, el device), una sola línea lo dice.
  if (gestos) {
    $("globo").replaceChildren(...gestos.map((g, i) => {
      const linea = crea("div", "gesto");
      trozos(linea, g);
      return marca(i + 1, linea);
    }));
  } else trozos($("globo"), globo);
  despues?.();
  $("espejo").classList.toggle("demo", Boolean(demo));
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
  const titulo = $("titulo");
  trozos(titulo, completo ? [["■ Módulo completado"]] : tituloDe(paso));
  // Paso nuevo: el título entra con glitch.
  titulo.classList.remove("glitch-on");
  void titulo.offsetWidth;
  titulo.classList.add("glitch-on");
  instruccion.textContent = completo ? "" : paso.instruccion; // el título dice la orden; esto es el porqué
  instruccion.title = instruccion.textContent; // se corta a dos líneas: entero, al pasar el ratón
  instruccion.hidden = false;
  resultado.textContent = "";
  espejo = { clave: "", ajusta: null };
  dibujarEspejo();
}

// Pantalla de lecciones: la lección como un camino de módulos (FDR-001). Todo sale del JSON de la lección.
const X_PARADA = [40, 100, 160, 100]; // el zigzag se repite cada cuatro módulos
const paradaEn = (i) => [X_PARADA[i % 4], 24 + 43 * i];

async function verModulos(nombre) {
  leccion = nombre;
  modulo = null;
  selector.value = leccion;
  const modulos = await invoke("modulos", { leccion });
  const total = modulos.reduce((s, m) => s + m.total, 0);
  const suma = modulos.reduce((s, m) => s + m.hechos, 0);
  const actual = modulos.find((m) => m.hechos < m.total);
  const nombreDe = (m) => m.titulo.split(":")[0];

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
  const hasta = actual ? modulos.indexOf(actual) + 1 : modulos.length;
  // Dos ecos del tramo recorrido, cian y magenta: solo se ven un instante, desplazados (glitch de panel.css).
  for (const [color, eco] of [["#00e5ff", "eco"], ["#ff2fb0", "eco eco-b"]]) {
    const linea_eco = linea(hasta, color);
    linea_eco.setAttribute("class", eco);
    trazo.append(linea_eco);
  }
  trazo.append(linea(hasta, "#fcee0a"));
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
    texto.append(crea("span", "et ro", `▸ Siguiente · ${nombreDe(actual)} · paso ${dos(i + 1)}/${dos(actual.total)}`), crea("strong", "", tituloDe(susPasos[i]).flat().join("")));  // la misma orden que titula la pantalla de paso
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
    } else {
      dibujarEspejo(datos); // lo que Live tiene ahora, dentro del dibujo
      instruccion.hidden = false;
      resultado.textContent = "";
    }
  } catch (error) {
    const sinLive = String(error).startsWith("No conecto con Ableton");
    estadoLive(!sinLive);
    resultado.className = "";
    resultado.textContent = String(error); // el Err(String) del comando Rust
    instruccion.hidden = true; // el error ocupa el sitio del porqué: los dos no caben
  } finally {
    ocupado = false;
  }
}

setInterval(() => (modulo === null ? sondearLive() : comprobar()), 1000);
empezar().catch((error) => {
  mapa.textContent = String(error); // la pantalla de lecciones es la única visible al arrancar
});
