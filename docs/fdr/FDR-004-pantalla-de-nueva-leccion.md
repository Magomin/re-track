# FDR-004: Pantalla de nueva lección (Receta)

**Status:** Draft (diseñada, sin construir)
**Last reviewed:** 2026-11-24

## Overview

Aquí se monta una lección nueva con piezas (módulos) de las canciones que ya hay, o soltando una canción nueva. Se llega desde «+ Nueva lección» en la pantalla de inicio (FDR-003). Aspecto objetivo: `docs/design/ia/objetivo.html` (y su captura `objetivo.png`); se copia fielmente.

## Behavior

- A la izquierda, «Canciones»: cada canción con su carátula (misma carátula VHS que en inicio). Al tocar una, sus módulos salen justo debajo de ella como botones; los de la canción que estaba abierta se cierran. Una canción cerrada dice cuántas piezas se le han cogido.
- Un módulo sin coger lleva «+»; cogido, va en amarillo con ■. Tocarlo lo añade a la lección o lo quita.
- La última fila, «+ Otra canción · mp3 o wav», recibe una canción nueva.
- A la derecha, «La lección»: las piezas cogidas, numeradas en el orden en que se harán, con la canción de la que salen, sus pasos y una ✕ para quitarlas.
- Abajo, el interruptor «Una detrás de otra | Mezcladas», la cuenta de piezas y pasos, y el botón «Generar», que lleva a la pantalla de revisión.

## Design Decisions

### 1. Receta (propuesta D de la tercera ronda)

**Decision:** Dos columnas: de dónde se coge y qué se va montando.
**Why:** Elegida por Matthieu el 2026-11-24 entre las cuatro de `docs/design/ia/propuestas.html`.
**Tradeoff:** En 460 px las columnas son estrechas; un nombre largo de canción parte en dos líneas.

### 2. Los módulos salen debajo de la canción seleccionada

**Decision:** Los módulos a elegir se despliegan pegados a su canción, no al final de la lista.
**Why:** Corrección de Matthieu al elegir la D, 2026-11-24.
**Tradeoff:** Solo se ven los módulos de una canción a la vez.

## Related

- **ADRs:** ADR-013
- **FDRs:** FDR-003 (de donde se llega). La pantalla de revisión (comentar lo generado) tiene cuatro propuestas en `docs/design/revision/propuestas.html`, sin elegir.

## Open Questions

- Qué pasa al soltar una canción nueva mientras se genera su lección.
- Cómo se reordenan las piezas de «La lección».
- «Mezcladas»: qué se enseña mientras el agente compone la pista.
