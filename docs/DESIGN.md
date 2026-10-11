# Re-track — diseño (grill 2026-10-11)

## Visión

Subes una canción → la IA la reverse-engineerea y la recrea en Ableton → la app te lleva paso a paso a reconstruirla tú, con lecciones interactivas verificadas contra el estado REAL de tu set (no píxeles). Herramienta personal primero; producto después si la v1 sirve.

## Decisiones cerradas

| # | Decisión |
|---|---|
| 1 | Herramienta personal primero; productizar solo si la v1 funciona |
| 2 | Integrado en Ableton: verificación por Remote Script/socket; UI = panel Python always-on-top → overlay transparente por zonas (v2) → pixel-matching fino solo si hace falta (v3) |
| 3 | Envuelve el pipeline musichelper existente (scout/demucs/medición/render); reescrituras selectivas como ejercicios |
| 4 | Stack Python. Foco de aprendizaje: backend, testing, git/CI. Frontend mínimo (tkinter) |
| 5 | Protocolo enseñanza: ver CLAUDE.md (regla maestra) |
| 6 | Orden: **lesson player primero** (Jungle como golden data) → **remake runner** después (`claude -p` headless detrás de interfaz `AIProvider`; BYOK futuro cuando usuarios traigan su API key) |
| 7 | Verificación por niveles: estructura (clip existe, device cargado) → exactitud (notas exactas, params en tolerancia, dB objetivo) |
| 8 | Repo público. Sin auth/pagos/multiusuario en v1 |

## Lo aprendido del RE de beatspark (v0.4.2, Electron, macOS-only)

- Misma arquitectura de fondo: Remote Script Python + OSC (9000/9001) mandando snapshots del set; la app evalúa predicados. Nuestro socket 9877 ya hace esto y más (escribe, mixer, envelopes).
- Formato de lección JSON: metadata (curso, dificultad, minutos, `startingState` = .als de arranque) + `steps: [{step, type, stage, message (markdown con personalidad), highlight (ID semántico, ej. "device-param-Threshold"), target/param/trackMatch, panelPosition}]` + `stageColors`. ~67 tipos de paso `wait_*` (wait_midi_note, wait_device_param, wait_clip_loop_length, wait_bpm…). Base de inspiración para nuestro schema.
- Sus highlights → coordenadas vía macOS Accessibility (ax-probe) + OCR (modelos ONNX) = por eso macOS-only y frágil. Nosotros: estado por socket, panel sin coordenadas en v1.
- Sus lecciones se GRABAN de un humano (lesson-recorder, `"generated": true` + sourceRecording); @anthropic-ai/sdk bundleado sin uso visible. NO generan desde canciones arbitrarias → nuestro diferenciador confirmado.
- Detalles útiles: step types `info`/`play`/`complete` sin verificación; `trackMatch` por nombre en vez de índice fijo; starter .als por lección; logging a fichero.

## Syllabus (del vídeo + adaptado; cada tema entra cuando el proyecto lo pide)

1. Estructura de proyecto y git — día 1
2. Contratos tipados: schema de lección + comandos socket (pydantic) — semanas 1-2
3. pytest — desde la primera lógica
4. GitHub Actions: pytest on push — semanas 2-3
5. SQLite para progreso; migración de schema cuando el formato de lección cambie
6. Evals: cmp.py como harness, Jungle como golden dataset
7. Runner v2: jobs largos, retries, fallos parciales, dead-letter
8. Observabilidad: logging a fichero primero; telemetría solo con runner en producción

Descartado: portfolio-driven development, OpenAPI/GraphQL (no hay HTTP), Postgres (SQLite basta), Docker (app escritorio), OpenTelemetry v1.

## Roadmap

- **v1 — lesson player**: carga lección JSON (Jungle) → panel tkinter muestra paso → verifica contra Live por socket → progreso en SQLite. Una lección jugable end-to-end.
- **v1.5 — segunda canción**: valida que el formato generaliza. RE fino de beatspark si hace falta (su schema completo en `step-types.js`).
- **v2 — remake runner**: `claude -p` headless corre el pipeline remake y emite lesson JSON; cola de jobs, retries. Overlay por zonas.
- **v3 — producto**: BYOK, overlays finos, más DAWs… solo si v1/v2 se usan de verdad.
