// Pantalla de revisión (FDR-005): los elementos que la IA detecta en una canción y una barra para comentarlos con #.
// Se carga después de panel.js y usa sus invoke, crea, svg, $ y verModulos. El panel no guarda nada: lo que se ve es
// lo que contesta el backend a `revision`, `comentar` y `elegir_version`.
//   revision { cancion } → { titulo, caratula?, elementos: [{ nombre, tipo, estado, pasos, version?, versiones?, comentario? }] }
//   estado: "ok" hecho · "gen" generándose · "no" aún sin detectar. `nombre` va sin espacios: es lo que se escribe tras #.
//   comentar { cancion, elemento, texto } y elegir_version { cancion, elemento, version } contestan la revisión nueva.
{
  // Catálogo de tipos de elemento (ADR-014): color y dibujo (24×24). Ni amarillo ni rojo, que son señal.
  const TIPOS_ELEMENTO = {
    drums: ["#00e5ff", `<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/><path d="M14 4h6v6h-6z" fill="currentColor"/>`], // cuatro pads, uno golpeado
    bass: ["#9d7bff", `<path d="M2 12C6 0 9 0 12 12s6 12 10 0"/>`], // una onda grave, ancha
    pad: ["#3dffb0", `<path d="M2 15C8 3 16 3 22 15M2 20h20"/>`], // una nota que crece despacio y se sostiene
    lead: ["#4d8dff", `<path d="M2 19l6-10 5 6 9-12"/>`], // una melodía que sube
    arreglo: ["#e6e6ec", `<path d="M2 6h9M14 6h8M2 12h5M10 12h12M2 18h14M19 18h3"/>`], // clips en una línea de tiempo
  };
  const TIPO_POR_DEFECTO = ["#8a8a96", `<path d="M12 3l9 9-9 9-9-9z"/>`]; // una pieza sin tipo conocido
  const tipoDe = (e) => TIPOS_ELEMENTO[e.tipo] ?? TIPO_POR_DEFECTO;
  function dibujoDe(e) {
    const dibujo = svg("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" });
    dibujo.innerHTML = tipoDe(e)[1]; // constantes de arriba, nunca datos
    return dibujo;
  }
  const conColor = (nodo, e) => (nodo.style.setProperty("--c", tipoDe(e)[0]), nodo);

  const vista = $("vista-revision");
  const campo = $("rev-comentario");
  const calco = $("rev-calco");
  const menu = $("rev-menu");
  const aviso = $("rev-aviso");

  let cancion = null; // null = no se está viendo la revisión
  let revision = { elementos: [] };
  let pintada = "";
  let opciones = []; // los elementos de la lista de #, en su orden
  let activa = 0;

  const buscar = (nombre) => revision.elementos.find((e) => e.nombre.toLowerCase() === nombre.toLowerCase());
  const avisar = (texto) => (aviso.textContent = texto ? `▸ ${texto}` : "");

  function pintarRevision(r) {
    revision = r;
    const clave = JSON.stringify(r);
    if (clave === pintada) return; // nada nuevo: no se quita el foco de una etiqueta de versión
    pintada = clave;
    const { elementos } = r;
    $("rev-titulo").textContent = r.titulo;
    const caratula = $("rev-caratula");
    caratula.className = r.caratula ? "rev-car" : "rev-car sin";
    caratula.style.backgroundImage = r.caratula ? `url("${r.caratula}")` : "";
    caratula.textContent = r.caratula ? "" : r.titulo[0];
    const detectados = elementos.filter((e) => e.estado !== "no").length;
    const pasos = elementos.reduce((s, e) => s + (e.pasos ?? 0), 0);
    $("rev-estado").textContent = detectados < elementos.length
      ? `Detectando elementos · ${detectados} de ${elementos.length}`
      : `${elementos.length} ${elementos.length === 1 ? "elemento" : "elementos"} · ${pasos} pasos`;
    $("rev-elementos").replaceChildren(...elementos.flatMap(filaDe));
    calcar();
  }

  function filaDe(e) {
    const fila = conColor(crea("div", `rev-el${e.estado === "no" ? " no" : ""}`), e);
    const hex = crea("span", "rev-hex");
    hex.append(dibujoDe(e));
    const nombre = crea("span", "rev-nombre");
    nombre.append(crea("i", "", "#"), e.nombre);
    const versiones = e.versiones ?? 1;
    let derecha;
    if (versiones > 1) {
      // Una etiqueta por versión: la elegida en amarillo; la que aún se genera lleva ▸.
      derecha = crea("span", "");
      for (let n = 1; n <= versiones; n++) {
        const generandose = n === versiones && e.estado === "gen";
        const chip = crea("button", `rev-chip${n === e.version ? " on" : ""}`, `${generandose ? "▸ " : ""}v${n}`);
        chip.type = "button";
        chip.setAttribute("aria-pressed", String(n === e.version));
        chip.setAttribute("aria-label", `#${e.nombre}, versión ${n}${generandose ? ", generándose" : ""}`);
        chip.addEventListener("click", () => elegirVersion(e.nombre, n));
        derecha.append(chip);
      }
    } else if (e.estado === "ok") derecha = crea("span", "rev-suave", `${e.pasos} pasos`);
    else if (e.estado === "gen") derecha = crea("span", "rev-est ro", "▸ Generando");
    else derecha = Object.assign(crea("span", "rev-suave", "…"), { title: "Aún sin detectar" });
    fila.append(hex, nombre, derecha);
    return e.comentario ? [fila, crea("div", "rev-nota", `«${e.comentario}»`)] : [fila];
  }

  async function elegirVersion(elemento, version) {
    try {
      pintarRevision(await invoke("elegir_version", { cancion, elemento, version }));
      avisar("");
    } catch (error) {
      avisar(`No se ha cambiado #${elemento} a la v${version}: ${error}. Se puede volver a pulsar la etiqueta.`);
    }
  }

  // --- La barra: un <input> con el texto transparente y, debajo, un calco que lo repite con cada mención en su color. ---
  const MENCION = /#([\p{L}\p{N}_-]+)/gu;
  const menciones = (texto) => [...texto.matchAll(MENCION)].map((m) => ({ m, e: buscar(m[1]) })).filter((x) => x.e);
  function calcar() {
    const texto = campo.value;
    const trozos = [];
    let desde = 0;
    for (const { m, e } of menciones(texto)) {
      trozos.push(texto.slice(desde, m.index), conColor(crea("i", "", m[0]), e));
      desde = m.index + m[0].length;
    }
    calco.replaceChildren(...trozos, texto.slice(desde));
    calco.style.transform = `translateX(${-campo.scrollLeft}px)`; // un texto largo se desplaza dentro del input
  }

  // El # que se está escribiendo justo antes del cursor, o null.
  const escribiendo = () => campo.value.slice(0, campo.selectionStart).match(/#([\p{L}\p{N}_-]*)$/u);
  function cerrarMenu() {
    opciones = [];
    menu.hidden = true;
    campo.setAttribute("aria-expanded", "false");
    campo.removeAttribute("aria-activedescendant");
  }
  function pintarMenu() {
    const m = escribiendo();
    if (!m) return cerrarMenu();
    const empieza = (e) => e.nombre.toLowerCase().startsWith(m[1].toLowerCase());
    const detectados = revision.elementos.filter((e) => e.estado !== "no");
    // Salen todos, con los que coinciden con lo escrito arriba; si ninguno coincide, no hay nada que elegir.
    opciones = [...detectados.filter(empieza), ...detectados.filter((e) => !empieza(e))];
    if (!detectados.some(empieza)) return cerrarMenu();
    activa = Math.min(activa, opciones.length - 1);
    menu.replaceChildren(...opciones.map((e, i) => {
      const opcion = conColor(crea("li", i === activa ? "on" : ""), e);
      opcion.id = `rev-opcion-${i}`;
      opcion.setAttribute("role", "option");
      opcion.setAttribute("aria-selected", String(i === activa));
      const nombre = crea("span", "");
      nombre.append(crea("i", "", "#"), e.nombre);
      opcion.append(dibujoDe(e), nombre);
      opcion.addEventListener("mousedown", (ev) => ev.preventDefault()); // el clic no le quita el foco a la barra
      opcion.addEventListener("click", () => elegir(e));
      return opcion;
    }));
    menu.hidden = false;
    campo.setAttribute("aria-expanded", "true");
    campo.setAttribute("aria-activedescendant", `rev-opcion-${activa}`);
  }
  // Sustituye el # a medio escribir por el nombre entero y deja el cursor detrás.
  function elegir(e) {
    const hasta = campo.selectionStart, desde = hasta - escribiendo()[0].length;
    campo.setRangeText(`#${e.nombre} `, desde, hasta, "end");
    cerrarMenu();
    calcar();
  }

  async function enviar() {
    const texto = campo.value;
    const [primera] = menciones(texto);
    if (!primera) return avisar("No se ha enviado: falta señalar un elemento. Escribir # y elegir uno.");
    const { m, e } = primera;
    const comentario = `${texto.slice(0, m.index)}${texto.slice(m.index + m[0].length)}`.replace(/\s+/g, " ").trim();
    if (!comentario) return avisar(`No se ha enviado: falta decir qué está mal en #${e.nombre}.`);
    try {
      pintarRevision(await invoke("comentar", { cancion, elemento: e.nombre, texto: comentario }));
      if (campo.value === texto) campo.value = ""; // la barra queda libre para otro comentario
      avisar("");
    } catch (error) {
      avisar(`No se ha enviado el comentario: ${error}. Sigue en la barra para volver a enviarlo.`);
    }
    calcar();
  }

  campo.addEventListener("input", () => {
    activa = 0;
    avisar("");
    calcar();
    pintarMenu();
  });
  campo.addEventListener("scroll", calcar);
  campo.addEventListener("click", pintarMenu);
  campo.addEventListener("blur", cerrarMenu);
  campo.addEventListener("keydown", (ev) => {
    const abierto = opciones.length > 0;
    if (ev.key === "Enter") {
      ev.preventDefault();
      if (abierto) elegir(opciones[activa]);
      else enviar();
    } else if (abierto && ev.key === "Tab") {
      ev.preventDefault();
      elegir(opciones[activa]);
    } else if (abierto && (ev.key === "ArrowDown" || ev.key === "ArrowUp")) {
      ev.preventDefault();
      activa = (activa + (ev.key === "ArrowDown" ? 1 : opciones.length - 1)) % opciones.length;
      pintarMenu();
    } else if (abierto && ev.key === "Escape") cerrarMenu();
  });
  $("rev-barra").addEventListener("submit", (ev) => {
    ev.preventDefault();
    enviar();
  });

  // Punto de entrada: lo llamará «Generar» de la pantalla de nueva lección (FDR-004).
  window.verRevision = async (nombre) => {
    pintarRevision(await invoke("revision", { cancion: nombre }));
    cancion = nombre;
    modulo = null; // panel.js sigue preguntando solo si Live contesta
    vistaModulos.hidden = true;
    vistaPaso.hidden = true;
    vista.hidden = false;
    document.body.classList.add("inicio", "revisando");
    ruta.textContent = "";
    progresoModulo.textContent = "";
    campo.focus();
  };
  $("salir-revision").addEventListener("click", () => {
    cancion = null;
    vista.hidden = true;
    document.body.classList.remove("revisando");
    verModulos(leccion);
  });

  // Mientras quede algo por detectar o generar, se pregunta cada segundo cómo va.
  let preguntando = false;
  setInterval(async () => {
    if (cancion === null || preguntando || revision.elementos.every((e) => e.estado === "ok")) return;
    preguntando = true;
    try {
      const r = await invoke("revision", { cancion });
      if (cancion !== null) pintarRevision(r);
    } catch (error) {
      avisar(`No se sabe cómo va la generación: ${error}. Se vuelve a preguntar cada segundo.`);
    } finally {
      preguntando = false;
    }
  }, 1000);
}
