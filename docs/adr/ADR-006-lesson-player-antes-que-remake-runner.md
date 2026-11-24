# ADR-006: Lesson player primero, remake runner después

**Date:** 2026-10-11

## Context

Re-track tiene dos mitades: el lesson player (carga una lección y la
verifica contra Live) y el remake runner (la IA recrea una canción y emite
la lección). Había que elegir cuál se construye primero.

## Decision

- **Lesson player primero**, con Jungle como golden data.
- **Remake runner después**: `claude -p` headless detrás de una interfaz
  `AIProvider`. BYOK en el futuro, cuando haya usuarios que traigan su API
  key.

Motivo del orden: no registrado.

## Consequences

- Hasta el runner, las lecciones se escriben a mano a partir de lo medido
  en `musichelper/songs/fred-again-jungle/elements.md`.
- El runner es la v2 del roadmap: cola de jobs, retries, overlay por zonas.
- `AIProvider` no existe todavía en el código.
