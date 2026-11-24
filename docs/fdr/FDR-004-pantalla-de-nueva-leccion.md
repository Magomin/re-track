# FDR-004: Pantalla de nueva lección (Receta)

**Status:** Active (construida con piezas que ya existen; subir una canción y «Mezcladas», sin construir)
**Last reviewed:** 2026-11-24

## Overview

Aquí se monta una lección nueva con piezas (módulos) de las canciones que ya hay, o soltando una canción nueva. Se llega desde «+ Nueva lección» en la pantalla de inicio (FDR-003). Aspecto objetivo: `docs/design/ia/objetivo.html` (y su captura `objetivo.png`); se copia fielmente.

## Behavior

- A la izquierda, «Canciones»: cada canción con su carátula (misma carátula VHS que en inicio). Al tocar una, sus módulos salen justo debajo de ella como botones; los de la canción que estaba abierta se cierran. Una canción cerrada dice cuántas piezas se le han cogido.
- Un módulo sin coger lleva «+»; cogido, va en amarillo con ■. Tocarlo lo añade a la lección o lo quita.
- «Canciones» son las lecciones que trae la app; una lección creada aquí no sale en la lista.
- La última fila, «+ Otra canción · mp3 o wav», recibe una canción nueva. Sin construir: al tocarla, la línea de abajo dice que aún no se puede y que se cojan piezas de la lista.
- A la derecha, «La lección»: las piezas cogidas, numeradas en el orden en que se harán, con la canción de la que salen, sus pasos y una ✕ para quitarlas. Sin ninguna pieza, «Generar» está apagado.
- Abajo, el interruptor «Una detrás de otra | Mezcladas», la cuenta de piezas y pasos, y el botón «Generar», que lleva a la pantalla de revisión.
- Con «Una detrás de otra» y piezas que ya existen no hay nada que revisar: «Generar» crea la lección (`receta-1`, `receta-2`…) y abre su pantalla de lecciones (FDR-001), sin nada hecho. «Mezcladas» está sin construir: al tocarla, la línea de abajo lo dice.
- Si la lección no se puede crear, la línea de abajo dice qué no pasó y por qué, en rojo con ▸; las piezas cogidas se quedan.

## Design Decisions

### 1. Receta (propuesta D de la tercera ronda)

**Decision:** Dos columnas: de dónde se coge y qué se va montando.
**Why:** Elegida por Matthieu el 2026-11-24 entre las cuatro de `docs/design/ia/propuestas.html`.
**Tradeoff:** En 460 px las columnas son estrechas; un nombre largo de canción parte en dos líneas.

### 2. Los módulos salen debajo de la canción seleccionada

**Decision:** Los módulos a elegir se despliegan pegados a su canción, no al final de la lista.
**Why:** Corrección de Matthieu al elegir la D, 2026-11-24.
**Tradeoff:** Solo se ven los módulos de una canción a la vez.

### 3. Las piezas no se reordenan

**Decision:** Las piezas van en el orden en que se cogen. Para cambiarlo, se quita una y se vuelve a coger.
**Why:** Decidido por Claude al construir la pantalla (2026-11-24, #52), con Matthieu fuera: con dos o tres piezas, quitar y volver a coger cuesta dos toques, y arrastrar en 460 px pide diseño propio.
**Tradeoff:** Con muchas piezas, mover la primera al final obliga a rehacer la lista. Pendiente de que Matthieu lo confirme.

### 4. La lección creada copia sus piezas

**Decision:** La lección nueva lleva una copia de cada módulo y vive aparte de las que trae la app (ADR-015).
**Why:** No cambia el schema de lección y reinstalar la app no la borra.
**Tradeoff:** Corregir un módulo en su canción no corrige la copia.

## Related

- **ADRs:** ADR-013, ADR-015
- **FDRs:** FDR-003 (de donde se llega). FDR-005 (la pantalla de revisión, a donde lleva «Generar»).

## Open Questions

- Qué pasa al soltar una canción nueva mientras se genera su lección.
- Si las piezas de «La lección» tienen que poder reordenarse sin quitarlas (decisión 3).
- Adaptar las piezas a un tempo y una tonalidad comunes: hoy cada una conserva los suyos.
- «Mezcladas»: qué se enseña mientras el agente compone la pista.
