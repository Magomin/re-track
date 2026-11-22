# Re-track — reglas del proyecto

App "Duolingo para Ableton": recrea un track con IA y genera lección interactiva verificada contra el estado real de Live. Diseño completo: `docs/DESIGN.md`.

## Modo: desarrollo rápido (sin lecciones)

2026-11-22: "ya no quiero que me hagas lessons, quiero desarrollar esto lo más rápido posible". Claude escribe todo el código (Rust y front), prueba y entrega; Matthieu prueba la app y decide. Sin lecciones ni quiz. El workspace `learn/` (lecciones 1-16) queda como histórico. La parte IA la querrá ver en profundidad más adelante.

## Stack y límites

- Rust + Tauri 2 (decidido 2026-11-15, rama `rust`; sustituye Python + FastAPI + Electron, que sigue en `main` como referencia hasta paridad). Backend en `src-tauri/` (comandos `#[tauri::command]` en `lib.rs`; la lógica en módulos sin nada de Tauri, para poder cambiar de UI). Front HTML/CSS/JS a pelo en `panel/`, llama con `window.__TAURI__.core.invoke`. Arrancar: `npm run tauri dev`. Rune (Anomaly) evaluado 2026-11-22 y descartado por ahora: pre-release, sin ventana siempre encima.
- Toolchain en D: (C: va justo): `RUSTUP_HOME=D:/rust/rustup`, `CARGO_HOME=D:/rust/cargo`, `CARGO_TARGET_DIR=D:/rust/target` (variables de usuario). Primera compilación de Tauri ~5 min.
ust
ustup`, `CARGO_HOME=D:
ust\cargo`, `CARGO_TARGET_DIR=D:
ust	arget` (variables de usuario). Primera compilación de Tauri ~5 min.
- Datos: JSON de lección (schema propio, pydantic) + SQLite para progreso.
- Ableton: Remote Script AbletonMCP, socket TCP `localhost:9877`, JSON `{"type": cmd, "params": {...}}`. Comandos y gotchas documentados en `C:\Users\domin\Desktop\musichelper\CLAUDE.md` (motor/laboratorio: pipeline remake, medición, render).
- Golden data v1: `musichelper/songs/fred-again-jungle/` (elements.md medido).
