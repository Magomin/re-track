import { indiceDe, panel } from "./soporte.js";

// Los pasos que dibujan el trozo de Live donde se actúa (docs/design/paso/objetivo.html, FDR-002).
export default { title: "Paso · espejo de Live" };

// Lo que Live tiene ahora, tal como lo devuelve `comprobar` en `live`. Un set nuevo trae estas cuatro pistas.
const live = (cambios = {}) => ({
  live: { tempo: 120, pistas: ["1-MIDI", "2-MIDI", "3-Audio", "4-Audio"], devices: null, huecos: null, arreglo: null, ...cambios },
});
const enPad = (cambios) => live({ pistas: ["PAD", "2-MIDI", "3-Audio", "4-Audio"], devices: [], huecos: [false, false, false, false], arreglo: [], ...cambios });
const paso = (modulo, id, comprobar) => panel({ abrir: modulo, indice: indiceDe(modulo, id), comprobar });

export const Tempo = { name: "tempo por debajo", render: () => paso("pad", "tempo", live()) };
export const TempoAlto = { name: "tempo por encima", render: () => paso("pad", "tempo", live({ tempo: 140 })) };
export const Pista = { name: "falta crear la pista", render: () => paso("pad", "pista", live()) };
export const MuchasPistas = {
  name: "falta crear la pista, con muchas en Live",
  render: () => paso("bass", "pista", live({ pistas: ["PAD", "LEAD", "3-Audio", "4-Audio", "5-MIDI", "6-MIDI"] })),
};
export const Device = { name: "falta el device", render: () => paso("pad", "operator", enPad()) };
export const DeviceConEfecto = { name: "falta el instrumento y la pista ya tiene un efecto", render: () => paso("pad", "operator", enPad({ devices: ["StereoGain"] })) };
export const DeviceSinPista = { name: "falta el device y también la pista", render: () => paso("pad", "operator", live()) };
export const DeviceDeEfecto = {
  name: "falta un efecto en el master",
  render: () => paso("mezcla", "limiter", live({ devices: ["GlueCompressor"], huecos: [], arreglo: [] })),
};
export const Clip = { name: "falta el clip", render: () => paso("pad", "clip", enPad({ devices: ["Operator"] })) };
export const Arreglo = {
  name: "falta el clip en el arreglo",
  render: () => paso("arreglo", "pad-vuelta", { ...enPad({ arreglo: [[2, 10]] }), detalle: "No hay clip de PAD entre 26 y 42 en el Arrangement" }),
};
export const ArregloCorto = {
  name: "el clip del arreglo se queda corto",
  render: () => paso("arreglo", "drop3-bass", { ...enPad({ arreglo: [[46, 54], [56, 66], [84, 90]] }), detalle: "BASS suena de 84 a 90; tiene que ir de 84 a 92" }),
};
export const SinRespuesta = { name: "Live aún no ha contestado", render: () => paso("pad", "tempo", {}) };
