# FDR-002: Pantalla de paso (Espejo de Live)

**Status:** Active
**Last reviewed:** 2026-11-24

## Overview

Es la pantalla en la que se pasa casi todo el tiempo: un paso de la lección, comprobado contra Live cada segundo. En vez de una frase, dibuja el trozo de Ableton donde hay que actuar y señala el sitio exacto. Aspecto objetivo: `docs/design/paso/objetivo.html` (y su captura `objetivo.png`); se copia fielmente.

## Behavior

- Hay una plantilla por tipo de comprobación, ocho en total: tempo, pista, device, clip, notas, parámetro, fader y arreglo. La lección solo trae los datos del paso; la plantilla la elige el panel. Una lección nueva, escrita a mano o generada, no trae pantallas.
- Todas comparten el marco: los tramos del módulo en la barra de arriba (hecho en amarillo, el paso actual en rojo), un título que dice la orden, el espejo, una línea con el gesto o lo que falta, y el porqué.
- El título sale de los datos del paso («Tempo a 134 BPM», «Operator en la pista PAD»), no del texto libre de la lección.
- El espejo dibuja la zona de Live que toca, con su nombre en una pestaña: en gris lo que Live tiene ahora, con marco rojo el sitio donde actuar, en amarillo lo que hay que conseguir.
- Lo gris es el estado real de Live, leído en cada comprobación: el tempo actual, las pistas que existen, los clips ya colocados.
- Cuando el paso pide varios gestos y su orden importa (poner un device: elegir la pista, buscarlo, soltarlo abajo), van numerados: el número aparece en el dibujo, en el sitio donde se hace, y en la lista de gestos.
- El espejo es siempre la ventana de Ableton en miniatura, con la misma geografía: barra de control arriba, navegador a la izquierda, la vista (Session o Arrangement) y el detalle abajo del todo. Cada tipo de paso detalla la zona donde se actúa.
- Cada paso son tres gestos numerados; el número aparece en el dibujo y en la lista. Una demo en bucle los enciende por turno y enseña el resultado: el tempo cambia, la pista nace y recibe su nombre, el device viaja del navegador a su sitio, el clip aparece, el tramo del arreglo se rellena.
- Parámetro y fader llevan la lectura de Live con su aguja y la zona objetivo dentro del mapa; las notas, el piano roll con lo que falta en rojo.
- Glitch: lo que aparece entra con glitch, un rasgado cruza el espejo al cambiar de gesto y el título entra con glitch en cada paso nuevo. Con movimiento reducido en el sistema, nada se mueve y se ve el estado final.
- El porqué ocupa dos líneas como mucho (entero al pasar el ratón); si Live no contesta, el error ocupa su sitio.
- El texto de la lección queda como el porqué del paso, debajo del espejo.
- Si falta algo previo (la pista, el device), la línea bajo el espejo lo dice en vez del gesto.

## Design Decisions

### 1. Espejo de Live (propuesta C)

**Decision:** Cada paso dibuja el trozo de Ableton donde se actúa, no una lectura genérica (A), una orden en grande (B) ni dos lecturas enfrentadas (D).
**Why:** Elegida por Matthieu el 2026-11-24 entre las cuatro propuestas de `docs/design/paso/propuestas.html`: la pantalla de solo texto no era atractiva, y esta es la única que enseña dónde se hace.
**Tradeoff:** Ocho dibujos que mantener; si Ableton cambia su interfaz, el espejo se queda viejo.

### 2. Una plantilla por tipo de comprobación

**Decision:** El dibujo depende del tipo de paso, nunca de la lección.
**Why:** Las lecciones se generarán con IA; así cualquiera hereda las pantallas sin describirlas.
**Tradeoff:** Un paso que no encaje en ningún tipo pide un tipo nuevo y su plantilla.

### 3. La marca va encima de Live

**Decision:** El espejo es un esquema con la dirección visual de Re-track (ADR-013), no una captura ni una imitación de los colores de Ableton.
**Why:** Se tiene que leer en una ventana de 460 px y con el código de color de la app: rojo = toca aquí, amarillo = objetivo.
**Tradeoff:** No es idéntico a lo que se ve en Live; hay que reconocer la zona por su forma y su nombre.

### 4. El espejo de parámetro es genérico

**Decision:** Un parámetro se dibuja como su control entre los controles vecinos del device, con la aguja y la zona objetivo dentro; no hay un dibujo por device.
**Why:** `parametro_en_rango` vale para cualquier device nativo (ADR-010).
**Tradeoff:** No reproduce la disposición real de cada device.

## Related

- **ADRs:** ADR-010, ADR-013
- **FDRs:** FDR-001

## Open Questions

- Qué se ve al superar un paso y al completar un módulo.
- El fader se dibuja como barra horizontal, no como el fader vertical del mezclador.
- El parámetro se dibuja solo, sin los controles vecinos del device.
