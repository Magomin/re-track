# ADR-013: Dirección visual: instrumento de medida con ambiente cyberpunk

**Date:** 2026-11-23

## Context

El panel necesitaba una dirección visual. La referencia es el arte de
Cyberpunk 2077 Phantom Liberty, cuyo logo y tipografía son marca de CD
Projekt.

## Decision

Instrumento de medida con ambiente cyberpunk, sin copiar el logo ni la
tipografía de la referencia.

- Fondo negro.
- Amarillo neón `#fcee0a` = objetivo / bien.
- Rojo `#ff2a3d` = falta / corrige.
- Magenta `#ff2fb0` solo en detalles glitch.
- Rajdhani (OFL, en `panel/fonts/`) en todo.
- Logo RE-TRACK: Rajdhani Bold inclinada con desplazamiento rojo/cian y
  corte glitch.
- Pasos `parametro_en_rango`: lectura grande del valor + barra con la zona
  objetivo y una aguja.

Motivo no registrado.

## Consequences

- El color lleva significado (amarillo = bien, rojo = corrige), así que una
  señal de color va siempre con una letra o un símbolo (`CLAUDE.md`,
  «Diseño»).
- El panel necesita el valor y la escala del parámetro, no solo si cumple:
  el backend los lee del snapshot (`leer_parametro`,
  `volumen_como_parametro` en `src-tauri/src/verify.rs`).
- La tipografía va dentro del repo y de la app, sin red.
