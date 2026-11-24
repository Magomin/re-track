import { panel } from "./soporte.js";

export default { title: "Lista de módulos" };

export const SinEmpezar = { name: "lección sin empezar", render: () => panel() };
export const Empezada = { name: "lección empezada", render: () => panel({ hechos: { pad: 10, lead: 7, bass: 6 } }) };
export const TodoHecho = {
  name: "todo hecho",
  render: () => panel({ hechos: { pad: 10, lead: 7, bass: 8, drums: 8, arreglo: 13, mezcla: 6 } }),
};
