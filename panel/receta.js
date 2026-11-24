// Pantalla de nueva lección (Receta, FDR-004): se cogen piezas (módulos) de las canciones que hay y se monta una lección.
// Copia de docs/design/ia/objetivo.html. Va después de panel.js y usa sus utilidades (invoke, $, crea, verModulos).
const vistaReceta = $("vista-receta");
let canciones = []; // [{ leccion, titulo, modulos: [{ id, titulo, pasos }] }], del comando `canciones`
let abierta = ""; // la canción seleccionada: sus módulos salen debajo de ella
let piezas = []; // [{ leccion, modulo }], en el orden en que se harán
let aviso = ""; // lo último que no se pudo hacer; lo borra la siguiente acción

// «Fred again.. — Jungle» → «Jungle»; «Pad: el colchón de acordes» → «Pad».
const nombreCancion = (c) => c.titulo.split(" — ").pop();
const nombreModulo = (m) => m.titulo.split(":")[0];
// La carátula de reserva (la inicial sobre rayas); la foto de la canción llega con #51.
const caratula = (c) => crea("span", "car", nombreCancion(c)[0]);
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// Un botón de la pantalla. `foco` lo identifica entre repintados: quien va con teclado no pierde el sitio.
function botonReceta(clase, foco, alPulsar, ...hijos) {
  const boton = crea("button", clase);
  boton.dataset.foco = foco;
  boton.append(...hijos);
  boton.addEventListener("click", () => {
    aviso = "";
    alPulsar();
    pintarReceta();
  });
  return boton;
}

function cogerOSoltar(leccion, modulo) {
  const i = piezas.findIndex((p) => p.leccion === leccion && p.modulo === modulo);
  if (i < 0) piezas.push({ leccion, modulo });
  else piezas.splice(i, 1);
}

function pintarReceta() {
  const foco = document.activeElement?.dataset.foco;

  const lista = crea("div", "");
  lista.append(crea("span", "et", "Canciones"));
  for (const c of canciones) {
    const cogidas = piezas.filter((p) => p.leccion === c.leccion).length;
    const estaAbierta = c.leccion === abierta;
    const texto = crea("span", "gr");
    texto.append(
      crea("b", "", nombreCancion(c)),
      crea("small", "", !estaAbierta && cogidas ? `■ ${plural(cogidas, "pieza cogida", "piezas cogidas")}` : ""),
    );
    const fila = botonReceta(`can ${estaAbierta ? "on" : ""}`, `c:${c.leccion}`, () => (abierta = c.leccion), caratula(c), texto);
    fila.setAttribute("aria-expanded", String(estaAbierta));
    lista.append(fila);
    if (!estaAbierta) continue;
    const mods = crea("div", "mods");
    for (const m of c.modulos) {
      const cogido = piezas.some((p) => p.leccion === c.leccion && p.modulo === m.id);
      const chip = botonReceta("chip", `m:${c.leccion}/${m.id}`, () => cogerOSoltar(c.leccion, m.id), `${cogido ? "■" : "+"} ${nombreModulo(m)}`);
      chip.setAttribute("aria-pressed", String(cogido));
      mods.append(chip);
    }
    lista.append(mods);
  }
  const textoOtra = crea("span", "gr");
  textoOtra.append(crea("b", "", "Otra canción"), crea("small", "", "mp3 o wav"));
  lista.append(
    botonReceta("can otra", "otra", () => (aviso = "No se añade la canción: subir un mp3 o wav llega con la generación con IA. Coge piezas de las canciones de la lista."), crea("span", "car", "+"), textoOtra),
  );

  const leccionNueva = crea("div", "");
  leccionNueva.append(crea("span", "et", "La lección"));
  let pasosTotales = 0;
  piezas.forEach((p, i) => {
    const c = canciones.find((x) => x.leccion === p.leccion);
    const m = c.modulos.find((x) => x.id === p.modulo);
    pasosTotales += m.pasos;
    const texto = crea("span", "gr");
    texto.append(crea("b", "", nombreModulo(m)), crea("small", "", nombreCancion(c)));
    const quitar = botonReceta("quitar", `q:${p.leccion}/${p.modulo}`, () => cogerOSoltar(p.leccion, p.modulo), "✕");
    quitar.setAttribute("aria-label", `Quitar ${nombreModulo(m)} de ${nombreCancion(c)}`);
    const fila = crea("div", "cogida");
    fila.append(crea("span", "am", String(i + 1)), texto, Object.assign(crea("span", "", String(m.pasos)), { title: plural(m.pasos, "paso", "pasos") }), quitar);
    leccionNueva.append(fila);
  });
  if (!piezas.length) leccionNueva.append(crea("p", "vacia", "Toca un módulo de una canción para cogerlo."));

  const cols = crea("div", "cols");
  cols.append(lista, leccionNueva);

  // «Mezcladas» necesita al agente que compone la pista: hasta entonces solo se monta una detrás de otra.
  const seguidas = botonReceta("", "seguidas", () => {}, "■ Una detrás de otra");
  seguidas.setAttribute("aria-pressed", "true");
  const mezcladas = botonReceta("", "mezcladas", () => (aviso = "«Mezcladas» no se puede elegir todavía: llega con la generación con IA. La lección se monta una detrás de otra."), "Mezcladas");
  mezcladas.setAttribute("aria-pressed", "false");
  const modo = crea("div", "dos");
  modo.append(seguidas, mezcladas);

  const cuenta = crea("span", aviso ? "cuenta ro" : "cuenta");
  cuenta.setAttribute("role", "status");
  cuenta.textContent = aviso ? `▸ ${aviso}` : piezas.length ? `■ ${plural(piezas.length, "pieza", "piezas")} · ${plural(pasosTotales, "paso", "pasos")}` : "Ninguna pieza cogida";
  const generar = crea("button", "cta", "Generar ▸");
  generar.dataset.foco = "generar";
  generar.disabled = !piezas.length;
  generar.addEventListener("click", async () => {
    generar.disabled = true; // un segundo clic no crea otra lección
    try {
      const nombre = await invoke("crear_leccion", { piezas });
      selector.add(new Option(nombre, nombre));
      await cerrarReceta(nombre);
    } catch (error) {
      aviso = String(error); // el Err(String) del comando Rust: qué no pasó y qué hacer
      pintarReceta();
    }
  });
  const fin = crea("div", "fin");
  fin.append(cuenta, generar);
  const abajo = crea("div", "abajo");
  abajo.append(modo, fin);

  vistaReceta.replaceChildren(cols, abajo);
  if (foco) vistaReceta.querySelector(`[data-foco="${CSS.escape(foco)}"]`)?.focus();
}

async function abrirReceta() {
  piezas = [];
  aviso = "";
  try {
    canciones = await invoke("canciones");
  } catch (error) {
    canciones = [];
    aviso = `No se pueden leer las canciones: ${error}`;
  }
  abierta = canciones[0]?.leccion ?? "";
  modulo = null; // como en la pantalla de lecciones: solo se pregunta si Live contesta
  vistaModulos.hidden = true;
  vistaPaso.hidden = true;
  vistaReceta.hidden = false;
  document.body.classList.add("inicio", "receta");
  progresoModulo.textContent = "";
  pintarReceta();
}

// Sale a la pantalla de lecciones de `nombre`. Cuando exista la pantalla de inicio (#50), «← Inicio» irá a ella.
function cerrarReceta(nombre = leccion) {
  vistaReceta.hidden = true;
  document.body.classList.remove("receta");
  return verModulos(nombre);
}

$("nueva-leccion").addEventListener("click", abrirReceta);
$("a-inicio").addEventListener("click", () => cerrarReceta());
