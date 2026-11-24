import { panel } from "./soporte.js";

// Los estados de docs/design/ia/objetivo.html y los que el diseño no pinta (vacía, lo que aún no se puede, lo que falla).
export default { title: "Pantalla de nueva lección" };

// Lo que se pulsa: m: = un módulo de una canción, c: = una canción, q: = la ✕ de una pieza cogida.
const dosPiezas = ["m:jungle/bass", "c:around-the-world", "m:around-the-world/drums"];

export const Vacia = { name: "sin ninguna pieza cogida", render: () => panel({ receta: [] }) };
export const PrimeraCancion = { name: "dos piezas cogidas, Jungle abierta", render: () => panel({ receta: [...dosPiezas, "c:jungle"] }) };
export const OtraCancion = { name: "dos piezas cogidas, Around the World abierta", render: () => panel({ receta: dosPiezas }) };
export const PiezaQuitada = { name: "una pieza quitada con ✕", render: () => panel({ receta: [...dosPiezas, "q:jungle/bass"] }) };
export const MuchasPiezas = {
  name: "más piezas de las que caben",
  render: () => panel({ receta: ["pad", "lead", "bass", "drums", "arreglo", "mezcla"].map((m) => `m:jungle/${m}`) }),
};
export const Mezcladas = { name: "«Mezcladas» aún no se puede", render: () => panel({ receta: [...dosPiezas, "mezcladas"] }) };
export const SubirCancion = { name: "subir otra canción aún no se puede", render: () => panel({ receta: [...dosPiezas, "otra"] }) };
export const NoSeCrea = {
  name: "la lección no se pudo crear",
  render: () => panel({ receta: [...dosPiezas, "generar"], errorCrear: "No se crea la lección: C:/…/lecciones/receta-1.json: acceso denegado" }),
};
export const Creada = { name: "lección creada: se abre su pantalla de lecciones", render: () => panel({ receta: [...dosPiezas, "generar"] }) };
