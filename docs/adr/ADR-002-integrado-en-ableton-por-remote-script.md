# ADR-002: Integrado en Ableton: verificación por Remote Script/socket y panel siempre encima

**Date:** 2026-10-11

## Context

Las lecciones se verifican «contra el estado REAL de tu set (no píxeles)»
(`docs/DESIGN.md`, Visión). El RE de beatspark enseñó la alternativa: sus
highlights salen de coordenadas vía macOS Accessibility y OCR, «por eso
macOS-only y frágil». El socket 9877 del Remote Script AbletonMCP ya manda
snapshots del set y además escribe, lee el mixer y los envelopes.

## Decision

Re-track va integrado en Ableton:

- La verificación es por Remote Script/socket: se lee el estado del set, no
  la pantalla.
- La UI es un panel siempre encima de Live. Después, un overlay transparente
  por zonas (v2), y pixel-matching fino solo si hace falta (v3).

La fila original decía «panel Python always-on-top». Esa parte está
sustituida por [ADR-004](ADR-004-rust-y-tauri-2.md): el panel es
HTML/CSS/JS en una ventana Tauri. La verificación por socket y el orden
panel → overlay → pixel-matching siguen en pie.

## Consequences

- Live tiene que estar abierto con el Remote Script AbletonMCP; sin él no se
  comprueba nada.
- El socket es `127.0.0.1:9877`, JSON `{"type": cmd, "params": {...}}`
  (`CLAUDE.md`; `src-tauri/src/live.rs`).
- Solo se puede comprobar lo que el snapshot trae: el de Live 12 no trae el
  texto de pantalla de un parámetro ni el fichero de un sample; cada cosa
  nueva pide ampliar el Remote Script (`docs/DESIGN.md`, roadmap v1.5 y v2).
- El panel de la v1 no usa coordenadas de la ventana de Live.
