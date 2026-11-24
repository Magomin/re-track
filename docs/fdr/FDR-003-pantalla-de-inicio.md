# FDR-003: Pantalla de inicio (Cartel)

**Status:** Active (construida en #50 con la carátula de reserva; la foto y las mezclas, pendientes de #51 y #54)
**Last reviewed:** 2026-11-24

## Overview

Es lo primero que se ve al abrir Re-track: la lección donde se dejó, con su carátula llenando media pantalla, y debajo las demás lecciones. Aspecto objetivo: `docs/design/inicio/objetivo.html` (y su captura `objetivo.png`); se copia fielmente.

## Behavior

- Arriba, el cartel: la carátula de la lección en curso a todo el ancho, su nombre, el porcentaje, el paso que toca («Bass · paso 7 de 8») y el botón «Continuar», que abre ese paso.
- Debajo, una fila por cada una de las demás lecciones: carátula pequeña, nombre, artista y porcentaje (o «■ OK» si está completada). Pulsar una fila abre su pantalla de lecciones (FDR-001).
- La última fila, «+ Nueva lección», abre la pantalla de nueva lección (IA). Mientras esa pantalla no exista (#52), la fila está apagada y dice «Próximamente».
- La lección en curso es la última en la que se superó un paso. Si esa ya está completada, la primera que esté a medias; si no hay ninguna, la primera sin empezar.
- Sin ninguna lección empezada, el cartel enseña la primera con «▸ Por empezar», «0 % · Pad · paso 1 de 10» y el botón «Empezar».
- Con todas completadas, el cartel enseña la última tocada con «■ Completada» y el botón «Repasar», que abre su pantalla de lecciones.
- Desde la pantalla de lecciones se vuelve con «← Inicio».
- Carátula: la app busca la foto de la canción por su cuenta y la guarda; la primera vez hace falta conexión. Toda carátula se «digitaliza»: líneas de VHS, una franja corrida y un filo rojo y cian. Si no se encuentra foto, sale la inicial de la lección en amarillo sobre un fondo rayado.
- Lección mezclada (piezas de varias canciones): su carátula junta las de sus canciones cortadas como una pizza, una porción por canción. Con dos, el corte es la diagonal. Bajo el nombre van las canciones de las que sale.
- Con más lecciones de las que caben, las filas se desplazan en vertical; el cartel se queda.

## Design Decisions

### 1. Cartel (propuesta D de la tercera ronda)

**Decision:** La lección en curso ocupa media pantalla con su carátula; las demás van en filas.
**Why:** Elegida por Matthieu el 2026-11-24 («la D está guapísima») entre las cuatro de `docs/design/inicio/propuestas.html`. Dos rondas anteriores se descartaron: la primera por apretada, la segunda por poco práctica.
**Tradeoff:** Caben tres filas sin desplazar; con muchas lecciones hay que bajar.

### 2. Carátula con líneas de VHS

**Decision:** Cada lección se reconoce por la foto de su canción, tratada siempre igual; sin foto, la inicial.
**Why:** Pedido por Matthieu el 2026-11-24: que salga la foto de la canción, digitalizada con líneas simples de VHS, buscada por la app, y algo por defecto con la inicial si no aparece.
**Tradeoff:** Hace falta una fuente de carátulas y conexión la primera vez.

### 3. Mezclas cortadas como una pizza

**Decision:** Una lección hecha de varias canciones enseña todas sus carátulas en porciones iguales.
**Why:** Idea de Matthieu, 2026-11-24: partir por la diagonal con dos y seguir cortando con más.
**Tradeoff:** A partir de cinco o seis porciones, en la fila pequeña (40 px) cada carátula deja de reconocerse.

### 4. Fotos del buscador de iTunes, con copia en el equipo

**Decision:** La carátula se pide al buscador de iTunes por «artista canción» (primer resultado, a 600×600) y la foto se guarda en el almacén del panel (Cache API del WebView); la búsqueda y la copia las hace el panel (`panel/caratula.js`).
**Why:** Es la fuente de las hojas de diseño, no pide cuenta ni clave, y sus imágenes se dejan leer desde el panel. Con la copia, la foto sigue saliendo sin conexión; una canción que no aparece o un fallo de red no se guardan, y se reintenta al abrir la app. Hacerlo en Rust pedía dos dependencias nuevas para el mismo resultado (#51).
**Tradeoff:** Se coge el primer resultado, que puede ser otra versión de la canción, y no hay forma de corregirlo a mano. La copia vive en los datos del WebView: se pierde si se borran.

### 5. «Donde se dejó» es el último paso superado

**Decision:** El cartel enseña la lección del último paso superado, no la primera de la lista ni la más avanzada.
**Why:** Es lo que dice el rótulo «Donde se dejó». Decidido al construir (#50), con Matthieu fuera; sustituye a la racha y a los pasos de hoy, que nadie leía desde #48.
**Tradeoff:** Abrir una lección sin superar ningún paso no la convierte en la del cartel.

## Related

- **ADRs:** ADR-013
- **FDRs:** FDR-001 (a donde lleva cada fila)

## Open Questions

- Cómo corregir a mano una carátula cuando el buscador da con otra versión de la canción.
- Cuántas porciones como máximo antes de resumir («+3»).
