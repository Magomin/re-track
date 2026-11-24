# ADR-005: Protocolo de enseñanza: la regla maestra de CLAUDE.md

**Date:** 2026-10-11

## Context

Re-track empezó también como proyecto para aprender: `docs/DESIGN.md` trae
un syllabus («cada tema entra cuando el proyecto lo pide») y el workspace
`learn/` guarda las lecciones 1-16.

## Decision

El protocolo de enseñanza es el que diga `CLAUDE.md` (su «regla maestra»).
La fila de `docs/DESIGN.md` no dice más que eso.

**Sustituido el 2026-11-22** por la sección «Modo: desarrollo rápido (sin
lecciones)» de `CLAUDE.md`: «ya no quiero que me hagas lessons, quiero
desarrollar esto lo más rápido posible». Claude escribe todo el código,
prueba y entrega; Matthieu prueba la app y decide. Sin lecciones ni quiz.

## Consequences

- El texto de la regla maestra ya no está en `CLAUDE.md`; queda en el
  historial de git.
- `learn/` queda como histórico (y fuera del repo: `.gitignore`).
- El syllabus de `docs/DESIGN.md` queda como registro, no como plan.
- La parte IA, Matthieu la querrá ver en profundidad más adelante
  (`CLAUDE.md`).
