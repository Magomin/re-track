# ADR-011: Samples vía Splice, opcional y nunca sin OK del usuario

**Date:** 2026-10-11

La fila de `docs/DESIGN.md` no trae fecha, así que lleva la del grill; va
después de la decisión 9 (2026-11-02), de modo que puede ser posterior.

## Context

Una lección puede necesitar samples. musichelper ya tiene un sample-hunter
(sección C) que busca en Splice, pero no todo usuario tiene Splice.

## Decision

- Re-track detecta si hay Splice disponible, y un interruptor en ajustes lo
  activa o desactiva.
- Activado: la lección propone samples de Splice (sample-hunter de
  musichelper).
- Desactivado o sin Splice: solo librería local y Core Library.
- Nunca descarga sin OK del usuario.

Motivo no registrado.

## Consequences

- Entra en la v2 del roadmap, con el remake runner. Hoy no hay código de
  esto, ni pantalla de ajustes.
- Pide un check «sample cargado» (Simpler/Drum Rack), que requiere ampliar
  el Remote Script para exponer el fichero del sample: Live 12 lo da en la
  API, el snapshot actual no.
