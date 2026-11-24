# ADR-009: Solo devices nativos de Ableton en las lecciones

**Date:** 2026-11-02

## Context

Una lección pide cargar instrumentos y efectos. Con un VST, solo quien lo
tenga puede seguirla.

## Decision

Las lecciones usan solo devices nativos de Ableton. Sin VST.

Matthieu, 2026-11-02: «mejor para el usuario»; cualquiera con Live puede
seguirlas.

## Consequences

- Los parámetros se nombran como Live los nombra (`Ae Attack`,
  `Osc-B Level`, `Glide On`); el catálogo está en
  `musichelper/reference/beatspark/src/data/device-catalog.json`.
- Un solo check sirve para el sonido de cualquier device
  ([ADR-010](ADR-010-un-check-generico-de-parametros.md)).
- Un sonido del original que solo dé un VST hay que aproximarlo con devices
  nativos.
