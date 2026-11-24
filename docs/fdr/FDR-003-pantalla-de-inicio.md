# FDR-003: Pantalla de inicio (Cartel)

**Status:** Draft (diseñada, sin construir)
**Last reviewed:** 2026-11-24

## Overview

Es lo primero que se ve al abrir Re-track: la lección donde se dejó, con su carátula llenando media pantalla, y debajo las demás lecciones. Aspecto objetivo: `docs/design/inicio/objetivo.html` (y su captura `objetivo.png`); se copia fielmente.

## Behavior

- Arriba, el cartel: la carátula de la lección en curso a todo el ancho, su nombre, el porcentaje, el paso que toca («Bass · paso 7 de 8») y el botón «Continuar», que abre ese paso.
- Debajo, una fila por cada una de las demás lecciones: carátula pequeña, nombre, artista y porcentaje (o «■ OK» si está completada). Pulsar una fila abre su pantalla de lecciones (FDR-001).
- La última fila, «+ Nueva lección», abre la pantalla de nueva lección (IA).
- Carátula: la app busca la foto de la canción por su cuenta. Toda carátula se «digitaliza»: líneas de VHS, una franja corrida y un filo rojo y cian. Si no se encuentra foto, sale la inicial de la lección en amarillo sobre un fondo rayado.
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

## Related

- **ADRs:** ADR-013
- **FDRs:** FDR-001 (a donde lleva cada fila)

## Open Questions

- De dónde salen las carátulas (en las hojas, el buscador de iTunes) y si se guarda una copia en el equipo.
- Cuántas porciones como máximo antes de resumir («+3»).
- Sin ninguna lección empezada: qué enseña el cartel.
