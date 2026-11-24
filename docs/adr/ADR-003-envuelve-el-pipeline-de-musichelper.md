# ADR-003: Re-track envuelve el pipeline de musichelper

**Date:** 2026-10-11

## Context

El pipeline que recrea una canción ya existe en `musichelper`
(scout, demucs, medición, render). Re-track necesita ese trabajo para
generar lecciones.

## Decision

Re-track envuelve el pipeline de musichelper existente; no lo reescribe.
Reescrituras selectivas, como ejercicios.

Motivo no registrado.

## Consequences

- Los comandos del socket y sus gotchas están documentados en
  `C:\Users\domin\Desktop\musichelper\CLAUDE.md`, no aquí (`CLAUDE.md`).
- El golden data de la v1 vive en `musichelper/songs/fred-again-jungle/`
  (`elements.md` medido).
- «Reescrituras como ejercicios» venía del modo de lecciones, apagado el
  2026-11-22 (ver [ADR-005](ADR-005-protocolo-de-ensenanza.md)).
