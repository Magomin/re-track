# ADR-007: Verificación por niveles: estructura, luego exactitud

**Date:** 2026-10-11

## Context

Un paso de una lección se da por hecho cuando el set de Live lo cumple
([ADR-002](ADR-002-integrado-en-ableton-por-remote-script.md)). Hay que
decidir cuánto se exige.

## Decision

Dos niveles, en este orden:

1. **Estructura**: el clip existe, el device está cargado.
2. **Exactitud**: notas exactas, parámetros dentro de tolerancia, dB
   objetivo.

Motivo no registrado.

## Consequences

Los checks de `src-tauri/src/leccion.rs` cubren los dos niveles:

- Estructura: `track_existe`, `device_en_pista`, `clip_en_pista`.
- Exactitud: `tempo_es`, `notas_en_clip`, `parametro_en_rango`
  ([ADR-010](ADR-010-un-check-generico-de-parametros.md)),
  `volumen_en_rango`, `clip_en_arreglo`.

Un módulo de lección va de lo primero a lo segundo: crea la pista, carga el
device, y después las notas y los valores.
