import jungle from "../lecciones/jungle.json";
import { panel } from "./soporte.js";

// Los cuatro momentos de docs/design/revision/objetivo.html y los estados que no salen en él.
export default { title: "Pantalla de revisión" };

// Lo que contestaría el backend: un elemento por módulo de jungle.json. `cambios`: { nombre: lo que cambia en ese elemento }.
// Sin «mezcla», que no es un elemento de la canción, salvo que se pida.
const datos = (cambios = {}, ids = ["drums", "bass", "pad", "lead", "arreglo"]) => ({
  titulo: jungle.titulo.split(" — ")[1],
  elementos: ids.map((id) => ({ nombre: id, tipo: id, estado: "ok", pasos: jungle.modulos.find((m) => m.id === id).pasos.length, ...cambios[id] })),
});
const COMENTARIO = "#bass está mal, el ataque es más corto";

export const Detectando = {
  name: "detectando elementos",
  render: () => panel({ revision: { datos: datos({ pad: { estado: "gen" }, lead: { estado: "no" }, arreglo: { estado: "no" } }) } }),
};
export const Detectados = { name: "elementos detectados", render: () => panel({ revision: { datos: datos() } }) };
export const AlEscribirAlmohadilla = { name: "al escribir #", render: () => panel({ revision: { datos: datos(), escribir: "#b" } }) };
export const Comentario = {
  name: "comentario con el elemento mencionado",
  render: () => panel({ revision: { datos: datos(), escribir: COMENTARIO } }),
};
export const Enviado = {
  name: "comentario enviado, el elemento se regenera",
  render: () => panel({ revision: { datos: datos(), escribir: COMENTARIO, teclas: ["Enter"] } }),
};
export const VersionNueva = {
  name: "versión nueva terminada",
  render: () => panel({ revision: { datos: datos({ bass: { versiones: 2, version: 2, comentario: "está mal, el ataque es más corto" } }) } }),
};
export const SinDibujoPropio = {
  name: "elemento sin dibujo propio",
  render: () => panel({ revision: { datos: datos({}, ["drums", "bass", "pad", "lead", "arreglo", "mezcla"]) } }),
};
export const SinElemento = {
  name: "comentario sin señalar elemento",
  render: () => panel({ revision: { datos: datos(), escribir: "el ataque es más corto", teclas: ["Enter"] } }),
};
export const NoEnviado = {
  name: "el comentario no se ha podido enviar",
  render: () => panel({ revision: { datos: datos(), escribir: COMENTARIO, teclas: ["Enter"], fallo: "la IA no contesta" } }),
};
