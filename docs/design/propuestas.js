// Datos de muestra comunes a las hojas. [pasos, hechos] por módulo; c = carátula encontrada (aquí, la del buscador de iTunes).
const ART = "https://is1-ssl.mzstatic.com/image/thumb/";
const L = [
  { t: "Jungle", a: "Fred again..", m: [[10, 10], [7, 7], [8, 6], [8, 0], [13, 0], [6, 0]], c: ART + "Music211/v4/54/b0/c7/54b0c752-7959-63f9-5185-80ebc2862325/5054197195013.jpg/600x600bb.jpg" },
  { t: "Around the World", a: "Daft Punk", m: [[9, 0], [6, 0], [7, 0], [8, 0], [12, 0]], c: ART + "Features115/v4/34/8d/c7/348dc71c-d75e-9baf-671a-994e9e74b018/dj.pimdxdmf.jpg/600x600bb.jpg" },
  { t: "Primera lección", a: "Re-track", m: [[3, 3]] }, // sin carátula: sale la inicial
];
const car = (l, px, extra = "") => `<span class="car ${l.c ? "" : "sin"}" style="${px ? `width:${px}px;font-size:${px / 2}px;` : ""}${l.c ? `background-image:url(${l.c});` : ""}${extra}">${l.c ? "" : l.t[0]}</span>`;
const cab = (ruta = "") => `<div class="cab"><span class="logo">RE-TRACK</span><span class="ruta">${ruta}</span>
  <span class="vent">―</span><span class="vent">✕</span></div><div class="glitch"></div>`;
const pie = `<div class="pie"><span class="am">■ Live conectado</span></div>`;
const celda = (letra, nombre, idea, html, ruta) =>
  `<div class="celda"><h2>${letra} · ${nombre}<small>${idea}</small></h2><div class="app">${cab(ruta)}<div class="aire">${html}</div>${pie}</div></div>`;
