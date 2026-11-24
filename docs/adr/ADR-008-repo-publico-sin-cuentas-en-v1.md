# ADR-008: Repo público; sin auth, pagos ni multiusuario en v1

**Date:** 2026-10-11

## Context

Re-track es una herramienta personal antes que un producto
([ADR-001](ADR-001-herramienta-personal-primero.md)).

## Decision

El repo es público. La v1 no tiene auth, pagos ni multiusuario.

Motivo de que el repo sea público: no registrado.

## Consequences

- El progreso es un SQLite local de un solo usuario (`data/progreso.db`;
  en la app instalada, `%APPDATA%/dev.magomin.retrack/progreso.db`).
- Lo que entra en el repo lo puede leer cualquiera: la dirección visual
  toma el arte de Cyberpunk 2077 como referencia «sin copiar su logo ni su
  tipografía, que son marca de CD Projekt», y la tipografía es Rajdhani, OFL
  ([ADR-013](ADR-013-instrumento-de-medida-cyberpunk.md)).
