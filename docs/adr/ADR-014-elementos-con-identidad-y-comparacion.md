# ADR-014: Cada elemento tiene identidad propia, y habrá que poder compararlos

**Date:** 2026-11-24

## Context

Una canción se parte en elementos (drums, bass, pad, lead, arreglo…), que
son las piezas con las que se montan las lecciones. Al diseñar la pantalla
de revisión (`docs/design/revision/objetivo.html`), donde la IA detecta los
elementos y se le comenta cada uno mencionándolo con `#`, todos se veían
iguales. Matthieu, 2026-11-24: hay que dar personalidad a los elementos,
que se vea diferente cada uno; y, sin saber todavía cómo, la app tendrá
que facilitar la comparación entre elementos.

## Decision

- Cada tipo de elemento tiene un dibujo y un color propios, los mismos en
  toda la app (lista de elementos, mención con `#`, piezas de una lección).
- Amarillo `#fcee0a` y rojo `#ff2a3d` siguen siendo solo señal (ADR-013):
  ningún elemento los usa. El magenta sigue reservado al glitch.
- El color nunca va solo: el dibujo y el nombre lo acompañan siempre.
- Primera asignación, de muestra hasta que se construya: drums cian
  `#00e5ff` (cuatro pads), bass violeta `#9d7bff` (onda grave), pad verde
  `#3dffb0` (una nota que crece), lead azul `#4d8dff` (melodía que sube),
  arreglo blanco roto `#e6e6ec` (clips en una línea de tiempo).
- La app tiene que facilitar comparar elementos entre sí. **El cómo está
  sin decidir**; no se diseña ni se construye nada todavía. Qué se compara
  (dos versiones de un mismo elemento, el mismo elemento en dos canciones,
  o elementos distintos) también está abierto.

## Consequences

- El estado de un elemento (hecho, generándose) ya no puede ir en el color
  de su hexágono, que ahora dice qué elemento es: va aparte, con su símbolo
  (■, ▸).
- Hace falta un catálogo cerrado de tipos de elemento, con un dibujo y un
  color por defecto para el que no encaje en ninguno.
- Los datos de un elemento (pasos, parámetros, versión) tienen que quedar
  guardados de forma que dos elementos se puedan poner lado a lado; lo que
  se decida para los módulos y sus versiones debe tenerlo en cuenta.
- Cuando se decida cómo se compara, va en un ADR nuevo que cite este.
