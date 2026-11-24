import { panel } from "./soporte.js";

// La pantalla de inicio (el Cartel): docs/design/inicio/objetivo.html, con la carátula de reserva.
export default { title: "Pantalla de inicio" };

const aMedias = { pad: 10, lead: 7, bass: 6 };
const todo = { pad: 10, lead: 7, bass: 8, drums: 8, arreglo: 13, mezcla: 6 };
const around = { nombre: "around", titulo: "Daft Punk — Around the World", total: 42, hechos: 0 };
const primera = (hechos) => ({ nombre: "primera", titulo: "Primera lección", total: 3, hechos });

export const AMedias = { name: "una lección a medias", render: () => panel({ pantalla: "inicio", hechos: aMedias, otras: [around, primera(3)] }) };
export const NingunaEmpezada = { name: "ninguna lección empezada", render: () => panel({ pantalla: "inicio", otras: [primera(0)], ultima: null }) };
export const TodasCompletadas = { name: "todas completadas", render: () => panel({ pantalla: "inicio", hechos: todo }) };
export const MuchasLecciones = {
  name: "más lecciones de las que caben",
  render: () =>
    panel({
      pantalla: "inicio",
      hechos: aMedias,
      otras: [around, { nombre: "one", titulo: "Daft Punk — One More Time", total: 38, hechos: 12 }, { nombre: "delilah", titulo: "Fred again.. — Delilah (pull me out of this)", total: 47, hechos: 0 }, primera(3)],
    }),
};
export const NombreLargo = { name: "nombre largo en el cartel", render: () => panel({ pantalla: "inicio", hechos: aMedias, titulo: "Daft Punk — Around the World" }) };
export const SinLive = { name: "sin Live", render: () => panel({ pantalla: "inicio", hechos: aMedias, sinLive: true }) };
