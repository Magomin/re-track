# Re-track — diseño (grill 2026-10-11)

## Visión

Subes una canción → la IA la reverse-engineerea y la recrea en Ableton → la app te lleva paso a paso a reconstruirla tú, con lecciones interactivas verificadas contra el estado REAL de tu set (no píxeles). Herramienta personal primero; producto después si la v1 sirve.

### Visión ampliada (2026-11-03, esquema de Matthieu)

Re-track = **tutoriales a la carta hechos con piezas de canciones**.

- **Módulos por elemento**: una canción es un curso partido en módulos (Bass, Pad, Arrangement…), cada uno con sus pasos y su check de completado. Ej. Jungle ≈ 40 pasos: Bass 6, Pad 20, Arrangement 14.
- **Lego**: cada módulo verificado es una pieza reutilizable con id fijo (`jungle/bass`). El usuario elige piezas de varias canciones ("bass de Jungle + drums de Around the World + arreglo estilo Daft Punk").
- **Slider back to back | mix**:
  - *back to back*: encadena las lecciones de las piezas elegidas, sin inventar nada. Requiere adaptarlas a un tempo/tonalidad común (Live tiene un solo tempo) → cada módulo lleva su tempo y tonalidad.
  - *mix*: un agente compone una pista nueva con las piezas, el usuario la escucha y la valida, y solo entonces el agente genera el tutorial de cómo la hizo.
- **Feedback referenciado**: comentarios pegados a un módulo ("#bass de jungle no es así, es más así") durante la generación o sobre lecciones ya hechas → genera una corrección.
- **Versiones de módulo**: corregir o explorar crea `bass v2` sin borrar `v1`; nunca se pierde una lección que funcionaba.

Implicación inmediata: el schema pasa a `Leccion → modulos[] (id, version, tempo, tonalidad) → pasos[]`, y el progreso se guarda por módulo.

## Decisiones cerradas

| # | Decisión |
|---|---|
| 1 | Herramienta personal primero; productizar solo si la v1 funciona |
| 2 | Integrado en Ableton: verificación por Remote Script/socket; UI = panel Python always-on-top → overlay transparente por zonas (v2) → pixel-matching fino solo si hace falta (v3) |
| 3 | Envuelve el pipeline musichelper existente (scout/demucs/medición/render); reescrituras selectivas como ejercicios |
| 4 | Stack Python. Foco de aprendizaje: backend, testing, git/CI. Frontend: Electron (JS) sobre API HTTP Python (FastAPI). Cambiado de tkinter el 2026-11-02 a petición de Matthieu (sabe JS, quiere arquitectura front + API) |
| 5 | Protocolo enseñanza: ver CLAUDE.md (regla maestra) |
| 6 | Orden: **lesson player primero** (Jungle como golden data) → **remake runner** después (`claude -p` headless detrás de interfaz `AIProvider`; BYOK futuro cuando usuarios traigan su API key) |
| 7 | Verificación por niveles: estructura (clip existe, device cargado) → exactitud (notas exactas, params en tolerancia, dB objetivo) |
| 8 | Repo público. Sin auth/pagos/multiusuario en v1 |
| 9 | **Solo devices nativos de Ableton** en las lecciones (2026-11-02, Matthieu: "mejor para el usuario", cualquiera con Live puede seguirlas). Sin VST. |
| 10 | Verificación de sonido con **un check genérico de parámetros** (`class_name` del device + `name` del parámetro + rango), válido para cualquier device nativo. Qué parámetro y qué valor lo decide el pipeline de musichelper midiendo (elements.md), no exploración manual por device. |
| 11 | **Samples vía Splice opcional**: Re-track detecta si hay Splice disponible y un interruptor en ajustes lo activa o desactiva. Activado → la lección propone samples de Splice (sample-hunter de musichelper, sección C). Desactivado o sin Splice → solo librería local y Core Library. Nunca descarga sin OK del usuario. |

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

- **v1 — lesson player**: carga lección JSON (Jungle) → API FastAPI (checks en Python) → panel Electron always-on-top muestra paso y llama a la API → verifica contra Live por socket → progreso en SQLite. Una lección jugable end-to-end.
- **v1.5a — módulos**: schema con módulos (id fijo + versión + tempo/tonalidad), progreso por módulo, Jungle partido en Bass / Pad / Arrangement.
- **v1.5 — Jungle suena**: check `parametro_en_rango` (decisión 10) + notas de BASS y LEAD. Valores legibles en el panel (dB/Hz) con el `chain_device` del Remote Script de musichelper, que devuelve el texto de display de Live y llega a devices dentro de racks. Progreso por id de paso, no por posición (hoy se descoloca al insertar pasos).
- **v1.5b — segunda canción**: valida que el formato generaliza. RE fino de beatspark si hace falta (su schema completo en `step-types.js`).
- **v2 — remake runner**: `claude -p` headless corre el pipeline remake y emite lesson JSON; cola de jobs, retries. Overlay por zonas. Incluye sample-hunter con el interruptor de Splice (decisión 11) y un check "sample cargado" (Simpler/Drum Rack): requiere ampliar el Remote Script para exponer el fichero del sample (Live 12 lo da en la API; el snapshot actual no).
- **v2.5 — feedback y versiones**: comentarios referenciados a un módulo → el agente genera una versión nueva del módulo, la anterior se conserva.
- **v3 — tutoriales a la carta**: Lego de módulos de varias canciones con slider back to back (encadenar + adaptar tempo/tonalidad) / mix (agente compone, el usuario valida, se genera el tutorial).
- **v3+ — producto**: BYOK, overlays finos, más DAWs… solo si v1/v2 se usan de verdad.
