# ADR-012: Tono de las lecciones: profe técnico

**Date:** 2026-11-23

## Context

Cada paso lleva una `instruccion` que el panel enseña. Las lecciones de
beatspark llevan un `message` «con personalidad» (`docs/DESIGN.md`).

## Decision

Profe técnico: sobrio y preciso. Cada instrucción es acción + dato medido +
razón técnica en una frase:

> Osc-B Level → 0,80–0,92. El sub de Fred = G#0 + 2.º armónico (−7 dB)

Sin adornos, emojis ni hype. Los datos salen de `elements.md`.

Motivo no registrado.

## Consequences

- Una instrucción no se puede escribir sin el dato medido: primero la
  medición en musichelper, después el paso.
- `lecciones/jungle.json` está escrito así («Tempo a 134 BPM, medido sobre
  el grid del kick del original.»).
