// Monta el panel real (panel/index.html + panel.css + panel.js) en un iframe de 460×460, el tamaño de la ventana,
// con un window.__TAURI__ de mentira que contesta lo que diga la story. Un iframe por story: panel.js arranca
// un setInterval y guarda estado en globales.
import jungle from "../lecciones/jungle.json";

export const modulo = (id) => jungle.modulos.find((m) => m.id === id);

// Lo que contesta el comando `canciones` (pantalla de nueva lección): Jungle, de su JSON, y una segunda de muestra.
const CANCIONES = [
  { leccion: "jungle", titulo: jungle.titulo, modulos: jungle.modulos.map((m) => ({ id: m.id, titulo: m.titulo, pasos: m.pasos.length })) },
  {
    leccion: "around-the-world",
    titulo: "Daft Punk — Around the World",
    modulos: [
      { id: "drums", titulo: "Drums: el bombo a negras", pasos: 6 },
      { id: "bass", titulo: "Bass: la línea que no para", pasos: 9 },
      { id: "synth", titulo: "Synth: el talkbox", pasos: 7 },
    ],
  },
];

// hechos: { idDeMódulo: pasos hechos }. Lo que no se nombra va a 0.
export const resumen = (hechos = {}) =>
  jungle.modulos.map((m) => ({ id: m.id, titulo: m.titulo, total: m.pasos.length, hechos: hechos[m.id] ?? 0 }));

// Dentro del iframe, antes de panel.js. `h` = los datos de la story.
function falsoTauri(h) {
  window.__TAURI__ = {
    window: { getCurrentWindow: () => ({ minimize() {}, close() {} }) },
    core: {
      invoke: async (comando, args) => {
        if (comando === "comprobar" && h.error) throw h.error;
        if (comando === "lecciones") return ["jungle", "primera"];
        if (comando === "modulos") return h.modulos;
        if (comando === "conectado") return !h.sinLive;
        if (comando === "canciones") return h.canciones;
        if (comando === "crear_leccion" && h.errorCrear) throw h.errorCrear;
        if (comando === "crear_leccion") return "receta-1";
        if (comando === "pasos") return h.pasos[args.modulo];
        if (comando === "progreso") return { indice: args.modulo === h.abrir ? h.indice : (h.hechos[args.modulo] ?? 0) };
        if (comando === "comprobar") return { hecho: false, indice: h.indice, ...h.comprobar };
        throw `La story no contesta a ${comando}`;
      },
    },
  };
  // Entra en el módulo y lanza una comprobación, sin esperar al segundo del setInterval.
  window.addEventListener("load", async () => {
    while (!document.querySelector(".cta")) await new Promise((r) => setTimeout(r, 10));
    if (h.abrir) {
      await abrirModulo(h.abrir, h.titulo);
      await comprobar();
      if (h.pulsar) document.querySelector(h.pulsar).click();
    }
    if (h.receta) {
      await abrirReceta();
      for (const foco of h.receta) document.querySelector(`[data-foco="${foco}"]`).click();
    }
    document.body.dataset.lista = "si"; // el test de stories espera a esto
  });
}

// hechos, sinLive: lo que enseña la pantalla de lecciones.
// pulsar: selector de un botón que se pulsa al final.
// abrir: id del módulo en el que entra; indice: paso que enseña; comprobar: lo que contesta Live; error: lo que falla.
// receta: abre la pantalla de nueva lección y pulsa, en orden, los botones con esos data-foco; errorCrear: lo que falla al generar.
export function panel({ hechos = {}, sinLive = false, abrir, indice = 0, comprobar = {}, error, pulsar, receta, errorCrear } = {}) {
  const pasos = Object.fromEntries(jungle.modulos.map((m) => [m.id, m.pasos]));
  const h = { modulos: resumen(hechos), hechos, sinLive, abrir, titulo: abrir && modulo(abrir).titulo, pasos, indice, comprobar, error, pulsar, receta, errorCrear, canciones: CANCIONES };
  const marco = document.createElement("iframe");
  marco.title = "Panel de Re-track";
  marco.style.cssText = "width:460px;height:460px;border:0;display:block";
  const base = new URL("panel/", document.baseURI);
  fetch(new URL("index.html", base))
    .then((r) => r.text())
    .then((html) => {
      marco.srcdoc = html
        .replace("<head>", `<head><base href="${base}">`)
        .replace('<script src="panel.js">', `<script>(${falsoTauri})(${JSON.stringify(h)})</script><script src="panel.js">`);
    });
  return marco;
}

export const indiceDe = (idModulo, idPaso) => modulo(idModulo).pasos.findIndex((p) => p.id === idPaso);
