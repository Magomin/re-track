# ADR-010: El sonido se verifica con un check genérico de parámetros

**Date:** 2026-10-11

La fila de `docs/DESIGN.md` no trae fecha, así que lleva la del grill; va
después de la decisión 9 (2026-11-02), de modo que puede ser posterior.

## Context

Las lecciones usan solo devices nativos
([ADR-009](ADR-009-solo-devices-nativos-de-ableton.md)), y verificar el
sonido es verificar sus parámetros. La alternativa nombrada en
`docs/DESIGN.md` es la exploración manual device por device.

## Decision

Un solo check genérico de parámetros, válido para cualquier device nativo:
`class_name` del device + `name` del parámetro + rango.

Qué parámetro y qué valor lo decide el pipeline de musichelper midiendo
(`elements.md`), no una exploración manual por device.

## Consequences

- Es el check `parametro_en_rango` de `src-tauri/src/leccion.rs`: `pista`,
  `device`, `parametro`, `min`, `max`.
- El rango va en el valor bruto de Live, no en el texto de pantalla: el
  snapshot de Live 12 no trae `value_string`, y el panel dice «súbelo» o
  «bájalo».
- Encuentra el device también dentro de un rack.
- El fader de una pista no es un parámetro de device: tiene su propio
  check, `volumen_en_rango`, en dB.
