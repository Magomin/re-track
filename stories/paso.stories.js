import { indiceDe, modulo, panel } from "./soporte.js";

export default { title: "Paso" };

// Osc-B Level del BASS: objetivo 0.80–0.92 sobre una escala de 0 a 1.
const oscB = (value) => ({
  abrir: "bass",
  indice: indiceDe("bass", "osc-b"),
  hechos: { pad: 10, lead: 7, bass: 6 },
  comprobar: value === null ? {} : { detalle: "fuera de rango", actual: { value, min: 0, max: 1 } },
});
export const FaltaSubir = { name: "falta subir", render: () => panel(oscB(0.52)) };
export const FaltaBajar = { name: "falta bajar", render: () => panel(oscB(0.97)) };
export const EnSuSitio = { name: "en su sitio", render: () => panel(oscB(0.86)) };
export const SinLectura = { name: "aún sin lectura", render: () => panel(oscB(null)) };

export const Interruptor = {
  name: "interruptor apagado",
  render: () => panel({ abrir: "bass", indice: indiceDe("bass", "glide"), comprobar: { detalle: "apagado", actual: { value: 0, min: 0, max: 1 } } }),
};
export const Fader = {
  name: "fader demasiado alto",
  render: () => panel({ abrir: "mezcla", indice: indiceDe("mezcla", "pad-volumen"), comprobar: { detalle: "alto", actual: { value: -6.2, min: -70, max: 6 } } }),
};

const c2 = indiceDe("pad", "notas-c2");
export const FaltanNotas = {
  name: "faltan notas",
  render: () => panel({ abrir: "pad", indice: c2, comprobar: { faltan: [{ pitch: 49, inicio: 6, duracion: 2, nombre: "C#2", compas: 2 }] } }),
};
export const NotasSinPoner = { name: "notas sin poner", render: () => panel({ abrir: "pad", indice: c2 }) };

export const FaltaLaPista = {
  name: "falta la pista",
  render: () => panel({ abrir: "bass", indice: indiceDe("bass", "osc-b"), comprobar: { detalle: "No se encuentra la pista BASS" } }),
};
export const ModuloCompletado = { name: "módulo completado", render: () => panel({ abrir: "lead", indice: modulo("lead").pasos.length }) };
export const SinLive = {
  name: "sin Live",
  render: () => panel({ abrir: "pad", indice: 1, error: "No conecto con Ableton (¿Live abierto con AbletonMCP?): conexión rechazada" }),
};
