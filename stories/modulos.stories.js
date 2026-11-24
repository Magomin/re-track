import { panel } from "./soporte.js";

// Los cuatro estados de docs/design/lecciones/objetivo.html.
export default { title: "Pantalla de lecciones" };

const aMedias = { pad: 10, lead: 7, bass: 6 };
export const Empezada = { name: "lección empezada", render: () => panel({ hechos: aMedias, racha: 4, hoy: 6 }) };
export const SinEmpezar = { name: "lección sin empezar", render: () => panel() };
export const Completada = {
  name: "lección completada",
  render: () => panel({ hechos: { pad: 10, lead: 7, bass: 8, drums: 8, arreglo: 13, mezcla: 6 }, racha: 9, hoy: 4 }),
};
export const SinLive = { name: "sin Live", render: () => panel({ hechos: aMedias, racha: 4, sinLive: true }) };
