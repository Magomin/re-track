# FDR-001: Pantalla de lecciones (Ruta)

**Status:** Active
**Last reviewed:** 2026-11-24

## Overview

Se llega desde la pantalla de inicio (FDR-003), y «← Inicio» vuelve a ella: la lección dibujada como un camino de módulos, con lo que toca hacer ahora a un clic. Sustituye al desplegable de lecciones y la columna de botones. Aspecto objetivo: `docs/design/lecciones/objetivo.html` (y su captura `objetivo.png`); se copia fielmente.

## Behavior

- Cada módulo de la lección es un nodo del camino, en el orden del fichero de la lección. Un nodo hecho es amarillo con ■ y dice «OK»; el nodo donde toca seguir es rojo, más grande, con ▸; los pendientes llevan su número y van apagados. Junto a cada nodo: nombre, pasos hechos/total y la frase del módulo.
- El tramo de camino ya recorrido se pinta en amarillo, hasta el módulo en curso.
- Arriba, una lectura: el porcentaje de la lección.
- Abajo, una caja dice el siguiente paso (módulo, número de paso e instrucción corta) con el botón «Continuar», que abre ese paso. En una lección sin empezar el botón dice «Empezar».
- Pulsar cualquier nodo abre ese módulo en su primer paso sin hacer. Ningún módulo está bloqueado.
- Lección completada: todo el camino en amarillo y la caja pasa a «Lección completada» con el botón «Otra lección», que lleva a la pantalla de inicio.
- Sin Live: la pantalla se ve igual y se puede navegar; el pie avisa en rojo de que hay que abrir Ableton para comprobar los pasos.
- El nombre de la lección en la cabecera abre el desplegable de lecciones (la lista de lecciones está sin diseñar).
- Con más de seis módulos el camino sigue hacia abajo y se desplaza en vertical.

## Design Decisions

### 1. Camino de módulos (propuesta B)

**Decision:** La lección se dibuja como una ruta, no como arreglo (A), mesa de mezcla (C) ni lista con el siguiente paso en grande (D).
**Why:** Elegida por Matthieu el 2026-11-24 entre las cuatro propuestas de `docs/design/lecciones/propuestas.html`.
**Tradeoff:** El zigzag gasta ancho en una ventana de 460 px; una lección de más de seis módulos necesita desplazamiento.

### 2. El camino sugiere un orden, no lo impone

**Decision:** Ningún módulo se bloquea hasta terminar el anterior.
**Why:** Los módulos son piezas independientes que se podrán combinar entre canciones (visión de `docs/DESIGN.md`); bloquearlos lo contradice.
**Tradeoff:** Se pierde la sensación de «desbloquear» del modelo Duolingo.

### 3. Sin racha ni «hoy»

**Decision:** La pantalla no enseña la racha ni los pasos de hoy (#48); solo el porcentaje de la lección.
**Why:** Matthieu, 2026-11-24: no se entendían y sobraban.
**Tradeoff:** El día en que se superó cada paso se sigue guardando, pero ninguna pantalla lo usa.

### 4. Señal con símbolo

**Decision:** Amarillo, rojo y gris van siempre con ■, ▸ o un número.
**Why:** Regla de diseño del proyecto (`CLAUDE.md`, «Diseño»); el color solo no basta. Colores y tipografía: ADR-013.
**Tradeoff:** Ninguno relevante.

## Related

- **ADRs:** ADR-012, ADR-013

## Open Questions

- Lista de lecciones: diseñada como pantalla de inicio (FDR-003), sin construir.
- Qué se ve al superar un paso y al completar un módulo: sin diseñar.
