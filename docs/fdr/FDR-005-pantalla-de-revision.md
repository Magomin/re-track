# FDR-005: Pantalla de revisión (elementos y barra con #)

**Status:** Draft (pantalla construida en el panel, `panel/revision.js`; falta la generación con IA que le da los datos, hoy solo los tiene en Storybook)
**Last reviewed:** 2026-11-24

## Overview

Es donde se ve lo que la IA saca de una canción y se le corrige. La IA detecta los elementos (drums, bass, pad, lead, arreglo…) y abajo hay una barra donde se menciona un elemento con `#` para decir qué está mal. Se llega tras «Generar» en la pantalla de nueva lección (FDR-004). Aspecto objetivo: `docs/design/revision/objetivo.html` (y su captura `objetivo.png`); se copia fielmente.

## Behavior

- Arriba, la canción con su carátula (la carátula VHS de FDR-003) y una línea de estado: «Detectando elementos · 3 de 5» o «5 elementos · 51 pasos».
- Una fila por elemento, con su dibujo y su color propios (ADR-014), su nombre con `#` y sus pasos. Mientras se genera dice «▸ Generando» en rojo; un elemento aún sin detectar se ve apagado.
- Abajo, la barra de comentario. Al escribir `#` sale la lista de elementos para elegir uno; el elemento mencionado queda escrito en su color.
- Al enviar, el comentario queda pegado debajo de su elemento, que se regenera como versión nueva (v2). La v1 se guarda y se puede volver a ella desde las etiquetas «v1 | v2» de la fila.
- La barra queda libre para otro comentario mientras un elemento se regenera.
- Un comentario sin `#` no se envía: la barra dice «No se ha enviado: falta señalar un elemento. Escribir # y elegir uno.» y el texto se queda escrito. Lo mismo si el envío falla.
- Un elemento de un tipo sin dibujo propio lleva el de por defecto: un rombo gris `#8a8a96`.

## Design Decisions

### 1. Lista de elementos y barra con #

**Decision:** Una sola pantalla con los elementos detectados y una barra de texto, en vez de un panel por elemento.
**Why:** Pedido por Matthieu el 2026-11-24, según su dibujo del 2026-11-03: que detecte los elementos de la canción y que una barra abajo permita mencionarlos con `#` y decir «esto está mal». Las cuatro propuestas anteriores se descartaron y se borraron (quedan en el historial de git, `docs/design/revision/propuestas.html`).
**Tradeoff:** El comentario va al elemento entero, no a un paso concreto.

### 2. Cada elemento se ve distinto

**Decision:** Dibujo y color propios por tipo de elemento; amarillo y rojo solo como señal.
**Why:** Matthieu, 2026-11-24: «dar personalidad a los elementos». Detalle y colores en ADR-014.
**Tradeoff:** El estado ya no puede ir en el color del hexágono; va aparte con su símbolo.

### 3. Corregir no borra

**Decision:** Un comentario crea una versión nueva del elemento y conserva la anterior.
**Why:** `docs/DESIGN.md`, «Visión ampliada»: nunca se pierde una lección que funcionaba.
**Tradeoff:** Hay que guardar y enseñar versiones.

### 4. Un comentario, un elemento

**Decision:** El comentario va al primer elemento mencionado; las demás menciones se quedan en el texto.
**Why:** Cada comentario crea una versión de un elemento y queda pegado bajo él; repartirlo entre varios dejaría la misma frase bajo cada uno, hablando de los otros.
**Tradeoff:** «#bass y #lead suenan muy altos» hay que escribirlo dos veces.

### 5. El panel no guarda la revisión

**Decision:** Elementos, versiones y comentarios los contesta el backend (`revision`, `comentar`, `elegir_version`; forma de los datos en la cabecera de `panel/revision.js`). El panel pregunta cada segundo mientras quede algo por detectar o generar.
**Why:** El panel no lleva lógica propia (`CONTEXT.md`, «Panel»), y las versiones tienen que sobrevivir a cerrar la ventana.
**Tradeoff:** Hasta que existan esos comandos en Rust, la pantalla solo se ve en Storybook; se entra con `verRevision(cancion)`.

## Related

- **ADRs:** ADR-013, ADR-014
- **FDRs:** FDR-003, FDR-004

## Open Questions

- Cómo se comparan elementos entre sí (ADR-014: hace falta, el cómo está sin decidir).
- Cómo se escucha un elemento antes de darlo por bueno.
- Qué se ve al terminar: cómo se pasa de aquí a la lección ya lista.
- Dibujo y color para los tipos que aún no tienen (voz, fx…).
