# FDR-005: Pantalla de revisión (elementos y barra con #)

**Status:** Draft (diseñada, sin construir)
**Last reviewed:** 2026-11-24

## Overview

Es donde se ve lo que la IA saca de una canción y se le corrige. La IA detecta los elementos (drums, bass, pad, lead, arreglo…) y abajo hay una barra donde se menciona un elemento con `#` para decir qué está mal. Se llega tras «Generar» en la pantalla de nueva lección (FDR-004). Aspecto objetivo: `docs/design/revision/objetivo.html` (y su captura `objetivo.png`); se copia fielmente.

## Behavior

- Arriba, la canción con su carátula (la carátula VHS de FDR-003) y una línea de estado: «Detectando elementos · 3 de 5» o «5 elementos · 51 pasos».
- Una fila por elemento, con su dibujo y su color propios (ADR-014), su nombre con `#` y sus pasos. Mientras se genera dice «▸ Generando» en rojo; un elemento aún sin detectar se ve apagado.
- Abajo, la barra de comentario. Al escribir `#` sale la lista de elementos para elegir uno; el elemento mencionado queda escrito en su color.
- Al enviar, el comentario queda pegado debajo de su elemento, que se regenera como versión nueva (v2). La v1 se guarda y se puede volver a ella desde las etiquetas «v1 | v2» de la fila.
- La barra queda libre para otro comentario mientras un elemento se regenera.

## Design Decisions

### 1. Lista de elementos y barra con #

**Decision:** Una sola pantalla con los elementos detectados y una barra de texto, en vez de un panel por elemento.
**Why:** Pedido por Matthieu el 2026-11-24, según su dibujo del 2026-11-03: que detecte los elementos de la canción y que una barra abajo permita mencionarlos con `#` y decir «esto está mal». Las cuatro propuestas anteriores (`propuestas.html`) quedan descartadas.
**Tradeoff:** El comentario va al elemento entero, no a un paso concreto.

### 2. Cada elemento se ve distinto

**Decision:** Dibujo y color propios por tipo de elemento; amarillo y rojo solo como señal.
**Why:** Matthieu, 2026-11-24: «dar personalidad a los elementos». Detalle y colores en ADR-014.
**Tradeoff:** El estado ya no puede ir en el color del hexágono; va aparte con su símbolo.

### 3. Corregir no borra

**Decision:** Un comentario crea una versión nueva del elemento y conserva la anterior.
**Why:** `docs/DESIGN.md`, «Visión ampliada»: nunca se pierde una lección que funcionaba.
**Tradeoff:** Hay que guardar y enseñar versiones.

## Related

- **ADRs:** ADR-013, ADR-014
- **FDRs:** FDR-003, FDR-004

## Open Questions

- Cómo se comparan elementos entre sí (ADR-014: hace falta, el cómo está sin decidir).
- Cómo se escucha un elemento antes de darlo por bueno.
- Qué se ve al terminar: cómo se pasa de aquí a la lección ya lista.
- Dibujo y color para los tipos que aún no tienen (voz, fx…).
