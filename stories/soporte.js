// Monta el panel real (panel/index.html + panel.css + panel.js) en un iframe de 460×460, el tamaño de la ventana,
// con un window.__TAURI__ de mentira que contesta lo que diga la story. Un iframe por story: panel.js arranca
// un setInterval y guarda estado en globales.
import jungle from "../lecciones/jungle.json";

export const modulo = (id) => jungle.modulos.find((m) => m.id === id);

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
    if (h.monta) await (0, eval)(h.monta);
    document.body.dataset.lista = "si"; // el test de stories espera a esto
  });
}

// hechos, sinLive: lo que enseña la pantalla de lecciones.
// pulsar: selector de un botón que se pulsa al final.
// abrir: id del módulo en el que entra; indice: paso que enseña; comprobar: lo que contesta Live; error: lo que falla.
// monta: código (texto) que se ejecuta dentro del panel ya arrancado, para enseñar una pieza que aún no sale en ninguna pantalla.
export function panel({ hechos = {}, sinLive = false, abrir, indice = 0, comprobar = {}, error, pulsar, monta } = {}) {
  const pasos = Object.fromEntries(jungle.modulos.map((m) => [m.id, m.pasos]));
  const h = { modulos: resumen(hechos), hechos, sinLive, abrir, titulo: abrir && modulo(abrir).titulo, pasos, indice, comprobar, error, pulsar, monta };
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
