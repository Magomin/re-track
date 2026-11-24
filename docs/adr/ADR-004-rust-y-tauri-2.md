# ADR-004: Stack Rust + Tauri 2, lógica en módulos sin Tauri

**Date:** 2026-11-22

## Context

El stack cambió dos veces antes de este: primero tkinter, después Python +
FastAPI + Electron (`docs/DESIGN.md`, fila 4). `CLAUDE.md` da el cambio a
Rust + Tauri 2 por decidido el 2026-11-15, con paridad alcanzada el
2026-11-22, día en que se borró el Python (queda en el historial de git).
La fecha de este ADR es la de la fila de `docs/DESIGN.md`.

Rune (Anomaly) se evaluó el 2026-11-22.

Motivo del cambio de Python a Rust: no registrado.

## Decision

- Stack Rust + Tauri 2. Sustituye a Python + FastAPI + Electron, que había
  sustituido a tkinter; y con ello a la parte «panel Python» de
  [ADR-002](ADR-002-integrado-en-ableton-por-remote-script.md).
- La lógica va en módulos Rust sin nada de Tauri, «para poder cambiar de
  UI» (`CLAUDE.md`). Los comandos `#[tauri::command]` están en
  `src-tauri/src/lib.rs`.
- El panel es HTML/CSS/JS a pelo en `panel/` y llama con
  `window.__TAURI__.core.invoke`.
- Rune (Anomaly) descartado por ahora: pre-release, sin ventana siempre
  encima.

## Consequences

- Toolchain en D: (`RUSTUP_HOME`, `CARGO_HOME`, `CARGO_TARGET_DIR`); la
  primera compilación de Tauri tarda unos 5 minutos.
- El schema de lección es serde (`src-tauri/src/leccion.rs`): un check
  desconocido o un `valor` mal formado no carga.
- Las lecciones van empaquetadas en la app instalada: cambiar una lección es
  recompilar e instalar de nuevo.
- Verificar es `cargo test`, `cargo clippy --all-targets -- -D warnings` y
  `cargo fmt --check` en `src-tauri/`, lo mismo que el CI.
- El roadmap «v1» de `docs/DESIGN.md` todavía describe la API FastAPI y el
  panel Electron: es historia, no el estado actual.
