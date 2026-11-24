// Carátula de una lección (FDR-003): nace con la inicial y, si el buscador de iTunes da con la foto de la canción,
// la cambia por ella. El aspecto VHS lo pone caratula.css.
const fotos = new Map(); // una búsqueda por canción mientras la app está abierta, aunque se pinte en varios sitios

// La foto se guarda en el equipo (Cache API del WebView) bajo la dirección de su búsqueda: la segunda vez no hace falta conexión.
async function pedir(url) {
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error(`${new URL(url).host} contesta ${respuesta.status}`);
  return respuesta;
}
async function buscarFoto(cancion, artista) {
  const busqueda = `https://itunes.apple.com/search?${new URLSearchParams({ term: `${artista} ${cancion}`.trim(), entity: "song", limit: 1 })}`;
  const copia = await caches.open("caratulas");
  let foto = await copia.match(busqueda);
  if (!foto) {
    const [hallada] = (await (await pedir(busqueda)).json()).results;
    if (!hallada) return null; // no se guarda: se vuelve a buscar la próxima vez que se abra la app
    foto = await pedir(hallada.artworkUrl100.replace("100x100", "600x600")); // el cartel mide 460 px, 690 al 150 %
    await copia.put(busqueda, foto.clone());
  }
  return URL.createObjectURL(await foto.blob());
}

// titulo: de donde sale la inicial. cancion y artista: lo que se busca; una lección sin canción se queda con la inicial.
function caratula({ titulo, cancion = "", artista = "" }) {
  const el = Object.assign(document.createElement("span"), { className: "car sin", textContent: (titulo.trim()[0] ?? "?").toUpperCase() });
  el.setAttribute("aria-hidden", "true"); // adorno: el nombre de la lección va escrito al lado
  if (!cancion) return el;
  const clave = `${artista}\n${cancion}`;
  if (!fotos.has(clave)) fotos.set(clave, buscarFoto(cancion, artista));
  fotos.get(clave).then(
    (foto) => {
      if (!foto) return;
      el.className = "car";
      el.textContent = "";
      el.style.backgroundImage = `url(${foto})`;
    },
    (error) => {
      fotos.delete(clave); // sin conexión: la próxima vez que se pinte se vuelve a intentar
      console.warn(`No se ha podido buscar la carátula de «${cancion}»: ${error.message}. Se queda la inicial; con conexión, sale al volver a esta pantalla.`);
    },
  );
  return el;
}
