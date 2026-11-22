# Re-track — reglas del proyecto

App "Duolingo para Ableton": recrea un track con IA y genera lección interactiva verificada contra el estado real de Live. Diseño completo: `docs/DESIGN.md`.

## REGLA MAESTRA: proyecto de aprendizaje de *principios*, no de lenguaje

Cambio 2026-11-22 (al pasar a Rust): "quiero desarrollar esto con Rust, pero no quiero aprender Rust; quiero aprender lo esencial del desarrollo con sus principios. La parte IA sí la querré ver en profundidad, pero luego."

- **Claude escribe el código** (Rust y front). Matthieu no escribe sintaxis de Rust ni se le enseña.
- **Lo que se enseña son principios de desarrollo**, independientes del lenguaje, cuando el proyecto los toca: separar lógica de interfaz, contratos entre piezas, errores como valores, datos y schema, estado y persistencia, tests como red, git/PR/CI, versionado, diseño de módulos. Ejemplo siempre sobre el código real del proyecto, no sobre sintaxis.
- **Papel de Matthieu:** decide (las decisiones de diseño con su trade-off se las planteo a él), entiende el cambio a nivel de principio, lo prueba en la app, y lleva el flujo git (rama, PR, merge).
- **Lección corta** en `learn/lessons/NNNN-slug.html` (formato `/teach`) solo cuando aparece un principio nuevo, con el diff real como ejemplo y quiz. Antes o junto al PR que lo usa; no por cada cambio.
- **IA (generación de lecciones con LLM, pipeline)**: profundidad completa más adelante, cuando toque; no antes.
- Un paso por mensaje, comandos de uno en uno y copiables. Un commit/PR por bloque de trabajo, no por paso.
- Workspace `learn/`: `MISSION.md`, `NOTES.md` (leer al empezar), `RESOURCES.md`, `learning-records/`, `lessons/`, `assets/`.

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
