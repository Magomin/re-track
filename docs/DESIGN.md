# Re-track — documento de diseño

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

## Decisiones

Las decisiones cerradas viven en `docs/adr/` (índice: `docs/adr/INDEX.md`); el vocabulario, en `CONTEXT.md`; cada funcionalidad visible, en `docs/fdr/`.

## Dirección visual

Instrumento de medida con ambiente cyberpunk (ADR-013). Los valores viven en `panel/index.html`:

| Papel | Valor |
|---|---|
| Fondo / superficie / línea | `#08080a` / `#111114` / `#26262c` |
| Objetivo, hecho, bien | amarillo `#fcee0a`, con ■ |
| Falta, corrige, siguiente | rojo `#ff2a3d`, con ▸ ▲ ▼ |
| Detalle glitch | magenta `#ff2fb0`, cian `#00e5ff` solo en el desplazamiento del logo |
| Texto / secundario | `#c9c9cf` / `#6c6c78` |
| Tipografía | Rajdhani 500/600/700 en todo; cifras tabulares |
| Formas | esquina superior derecha cortada en cajas y botones; hexágono para los nodos de módulo |

Ventana: 460×460, siempre encima, sin marco. Toda pantalla cabe ahí sin desplazamiento salvo listas largas.

## Pantallas de la versión final

| Pantalla | Qué responde | Estado |
|---|---|---|
| Lecciones (Ruta) | ¿Qué toca ahora y cuánto llevo? | Diseñada: `docs/design/lecciones/objetivo.html`, FDR-001. Construida (#29) |
| Inicio (lista de lecciones) | ¿Qué canciones hay y cómo voy en cada una? | Elegida la D (Cartel), 2026-11-24: `docs/design/inicio/objetivo.html`, FDR-003; sin construir |
| Paso | ¿Qué hago en Live y me falta mucho? | Rediseñada: `docs/design/paso/objetivo.html`, FDR-002 (Espejo de Live, una plantilla por tipo de paso). Construida (#34, #35, #40). Falta el momento «paso superado» |
| Módulo completado | ¿Qué he construido y qué viene? | Sin diseñar (hoy: una línea de texto) |
| Ajustes | Splice sí/no (ADR-011) | Sin diseñar; llega con el remake runner |
| Nueva lección (IA) | Generar una lección: subir una canción (v2) o elegir piezas de varias, back to back o mix (v3) | Cuatro propuestas: `docs/design/ia/propuestas.html`; falta elegir |

Cada pantalla nueva pasa por cuatro propuestas antes de construirse (`CLAUDE.md`, «Diseño»).

## Reglas de juego

Decididas con la pantalla de lecciones (FDR-001):

- **Progreso**: pasos superados sobre el total, por módulo y por lección. Un paso solo se supera cuando Live lo confirma.
- **Orden libre**: el camino sugiere un orden; ningún módulo se bloquea.

Por decidir, cada una con sus propuestas a la vista:

- Qué pasa en pantalla al superar un paso y al completar un módulo.
- Precisión: premiar cuánto se acerca el valor al medido en el original, no solo entrar en el rango.
- Puntos, niveles o retos diarios, y cómo conviven con el tono sobrio de las lecciones (ADR-012).

## Feedback

Lo que ya existe en el paso: la lectura grande con su objetivo, la aguja sobre la zona, «▲ Súbelo / ▼ Bájalo / ■ En su sitio», las notas que faltan en rojo en el piano roll, y el glitch del número al cambiar el valor. Un fallo dice qué no pasó, por qué y qué hacer.

Movimiento: solo `transform` y `opacity`, duraciones en variables CSS con nombre, sin animación en acciones de teclado, y todo se apaga con «reducir movimiento».

## Lo aprendido del RE de beatspark (v0.4.2, Electron, macOS-only)

- Misma arquitectura de fondo: Remote Script Python + OSC (9000/9001) mandando snapshots del set; la app evalúa predicados. Nuestro socket 9877 ya hace esto y más (escribe, mixer, envelopes).
- Formato de lección JSON: metadata (curso, dificultad, minutos, `startingState` = .als de arranque) + `steps: [{step, type, stage, message (markdown con personalidad), highlight (ID semántico, ej. "device-param-Threshold"), target/param/trackMatch, panelPosition}]` + `stageColors`. ~67 tipos de paso `wait_*` (wait_midi_note, wait_device_param, wait_clip_loop_length, wait_bpm…). Base de inspiración para nuestro schema.
- Sus highlights → coordenadas vía macOS Accessibility (ax-probe) + OCR (modelos ONNX) = por eso macOS-only y frágil. Nosotros: estado por socket, panel sin coordenadas en v1.
- Sus lecciones se GRABAN de un humano (lesson-recorder, `"generated": true` + sourceRecording); @anthropic-ai/sdk bundleado sin uso visible. NO generan desde canciones arbitrarias → nuestro diferenciador confirmado.
- Detalles útiles: step types `info`/`play`/`complete` sin verificación; `trackMatch` por nombre en vez de índice fijo; starter .als por lección; logging a fichero.

## Roadmap

- **v1 — lesson player** (hecho): carga lección JSON (Jungle) → checks en Rust → panel Tauri siempre encima muestra el paso → verifica contra Live por socket → progreso en SQLite.
- **v1.5a — módulos**: schema con módulos (id fijo + versión + tempo/tonalidad), progreso por módulo, Jungle partido en Bass / Pad / Arrangement.
- **v1.5 — Jungle suena** (hecho 2026-11-22: progreso por id de paso con migración, check `parametro_en_rango` con racks, pasos nuevos en Pad/Lead/Bass; el snapshot de Live 12 no trae el texto de pantalla, así que el panel dice súbelo/bájalo. Pendiente: valores legibles vía `str_for_value` en el Remote Script): check `parametro_en_rango` (decisión 10) + notas de BASS y LEAD. Valores legibles en el panel (dB/Hz) con el `chain_device` del Remote Script de musichelper, que devuelve el texto de display de Live y llega a devices dentro de racks. Progreso por id de paso, no por posición (hoy se descoloca al insertar pasos).
- **v1.5b — segunda canción**: valida que el formato generaliza. RE fino de beatspark si hace falta (su schema completo en `step-types.js`).
- **v2 — remake runner**: `claude -p` headless corre el pipeline remake y emite lesson JSON; cola de jobs, retries. Overlay por zonas. Incluye sample-hunter con el interruptor de Splice (decisión 11) y un check "sample cargado" (Simpler/Drum Rack): requiere ampliar el Remote Script para exponer el fichero del sample (Live 12 lo da en la API; el snapshot actual no).
- **v2.5 — feedback y versiones**: comentarios referenciados a un módulo → el agente genera una versión nueva del módulo, la anterior se conserva.
- **v3 — tutoriales a la carta**: Lego de módulos de varias canciones con slider back to back (encadenar + adaptar tempo/tonalidad) / mix (agente compone, el usuario valida, se genera el tutorial).
- **v3+ — producto**: BYOK, overlays finos, más DAWs… solo si v1/v2 se usan de verdad.
