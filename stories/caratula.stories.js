import { panel } from "./soporte.js";

// La carátula de una lección (FDR-003) a sus tres tamaños: cartel, 64 px y fila de 40 px. Todavía no sale en ninguna
// pantalla (la coloca la de inicio): aquí se monta sobre el panel real, con una red de mentira.
export default { title: "Carátula" };

// Corre dentro del panel. red: "foto" (iTunes la encuentra), "nada" (no la encuentra), "caida" (sin conexión),
// "guardada" (se encontró antes y ahora no hay conexión).
async function montar(red) {
  const dibujo = Object.assign(document.createElement("canvas"), { width: 600, height: 600 });
  const c = dibujo.getContext("2d");
  const fondo = c.createLinearGradient(0, 0, 600, 600);
  fondo.addColorStop(0, "#1f6f5c");
  fondo.addColorStop(1, "#e8a13a");
  c.fillStyle = fondo;
  c.fillRect(0, 0, 600, 600);
  c.fillStyle = "#f4ead2";
  c.beginPath();
  c.arc(380, 250, 150, 0, 7);
  c.fill();
  c.fillStyle = "#14231f";
  c.fillRect(0, 430, 600, 170);
  const foto = await new Promise((listo) => dibujo.toBlob(listo, "image/jpeg"));

  let hayRed = red !== "caida";
  window.fetch = async (url) => {
    if (!hayRed) throw new TypeError("Failed to fetch");
    if (String(url).includes("itunes.apple.com"))
      return Response.json({ results: red === "nada" ? [] : [{ artworkUrl100: "https://is1-ssl.mzstatic.com/de-mentira/100x100bb.jpg" }] });
    return new Response(foto);
  };
  await caches.delete("caratulas");

  const pintar = async () => {
    const jungle = () => caratula({ titulo: "Jungle", cancion: "Jungle", artista: "Fred again.." });
    const cartel = jungle();
    cartel.style.cssText = "--lado:60px;width:auto;aspect-ratio:auto;height:196px;margin-bottom:14px";
    const fila = Object.assign(document.createElement("div"), { style: "display:flex;align-items:center;gap:14px" });
    const pequena = jungle();
    pequena.style.setProperty("--lado", "40px");
    fila.append(jungle(), pequena, "Jungle · Fred again..");
    document.getElementById("vista-modulos").replaceChildren(cartel, fila);
    await Promise.allSettled(fotos.values());
  };
  await pintar();
  if (red === "guardada") {
    hayRed = false;
    fotos.clear(); // como al volver a abrir la app
    await pintar();
  }
}
const con = (red) => panel({ monta: `(${montar})(${JSON.stringify(red)})` });

export const ConFoto = { name: "con foto", render: () => con("foto") };
export const NoSeEncuentra = { name: "canción que no se encuentra", render: () => con("nada") };
export const SinConexion = { name: "sin conexión", render: () => con("caida") };
export const Guardada = { name: "sin conexión, con la foto ya guardada", render: () => con("guardada") };
