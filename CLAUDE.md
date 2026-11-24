# Re-track — reglas del proyecto

App "Duolingo para Ableton": recrea un track con IA y genera lección interactiva verificada contra el estado real de Live. Diseño completo: `docs/DESIGN.md`.

## Modo: desarrollo rápido (sin lecciones)

2026-11-22: "ya no quiero que me hagas lessons, quiero desarrollar esto lo más rápido posible". Claude escribe todo el código (Rust y front), prueba y entrega; Matthieu prueba la app y decide. Sin lecciones ni quiz. El workspace `learn/` (lecciones 1-16) queda como histórico. La parte IA la querrá ver en profundidad más adelante.

## Stack y límites

- Rust + Tauri 2 (decidido 2026-11-15, sustituye Python + FastAPI + Electron; paridad alcanzada 2026-11-22 y Python borrado, queda en el historial de git). Backend en `src-tauri/` (comandos `#[tauri::command]` en `lib.rs`; la lógica en módulos sin nada de Tauri, para poder cambiar de UI). Front HTML/CSS/JS a pelo en `panel/`, llama con `window.__TAURI__.core.invoke`. Arrancar en desarrollo: `npm run tauri dev` (lecciones y `data/progreso.db` del repo). App instalada: `npm run tauri build` → `D:/rust/target/release/bundle/nsis/Re-track_<versión>_x64-setup.exe` (se instala en `%LOCALAPPDATA%/Re-track`; lecciones empaquetadas dentro, progreso en `%APPDATA%/dev.magomin.retrack/progreso.db`, copiado del repo la primera vez). Cambiar una lección = recompilar e instalar de nuevo. Rune (Anomaly) evaluado 2026-11-22 y descartado por ahora: pre-release, sin ventana siempre encima.
- Toolchain en D: (C: va justo): `RUSTUP_HOME=D:/rust/rustup`, `CARGO_HOME=D:/rust/cargo`, `CARGO_TARGET_DIR=D:/rust/target` (variables de usuario). Primera compilación de Tauri ~5 min.
- Datos: JSON de lección (schema en `src-tauri/src/leccion.rs`, serde: un check desconocido o un `valor` mal formado no carga) + SQLite en `data/progreso.db` (clave `leccion/modulo`). Una lección creada en la app (`receta-N`) va a `data/lecciones/` (instalada: `%APPDATA%/dev.magomin.retrack/lecciones/`), nunca a `lecciones/` (ADR-015).
- Lecciones: cada paso lleva `id` fijo (el progreso va por id; tabla `hechos`). Pasos nuevos en un módulo con progreso antiguo: al final, la migración marca los N primeros. `parametro_en_rango`: nombres de parámetro de Live (`Ae Attack`, `Osc-B Level`, `Glide On`; catálogo en `musichelper/reference/beatspark/src/data/device-catalog.json`), rango en valor bruto. El snapshot de Live 12 no trae `value_string`.
- Socket a Live: `127.0.0.1`, no `localhost` (AbletonMCP solo escucha IPv4; en Windows probar `::1` antes cuesta ~2 s por llamada).
- Verificar: `cargo test` / `cargo clippy --all-targets -- -D warnings` / `cargo fmt --check` en `src-tauri/` (lo mismo que el CI).
- Ableton: Remote Script AbletonMCP, socket TCP `localhost:9877`, JSON `{"type": cmd, "params": {...}}`. Comandos y gotchas documentados en `C:\Users\domin\Desktop\musichelper\CLAUDE.md` (motor/laboratorio: pipeline remake, medición, render).
- Golden data v1: `musichelper/songs/fred-again-jungle/` (elements.md medido).

## Flujo

- Un issue → una rama `<tipo>/<N>-slug` desde `main` → un PR con `Closes #N`, descrito según `.github/pull_request_template.md`.
- Antes del código: un plan corto en `.context/<N>/plan.md` que Matthieu aprueba. Una respuesta a una pregunta dentro del plan no es el sí al plan.
- Al tercer «no, así no» o al tercer check rojo seguido: escribir `.context/<N>/handoff.md` (qué pide el issue, qué se probó y por qué falló, ficheros y líneas) y proponer una sesión nueva que parta de él.
- La sesión que abrió el PR lo fusiona cuando todos los checks están en verde, y después le dice a Matthieu qué probar en la app.
- El trabajo pendiente vive en los issues de GitHub. Una idea rechazada va a `.out-of-scope/<tema>.md`.

## Zona sensible

Un PR que toca uno de estos lo nombra y dice en una frase qué sigue funcionando.

- `src-tauri/src/leccion.rs`: el schema de lección; un cambio puede dejar sin cargar las lecciones que ya existen.
- Los `id` de paso en `lecciones/*.json`: el progreso va por id; renombrar uno borra lo hecho por el usuario.
- `src-tauri/src/progreso.rs`: las tablas SQLite y la migración del formato antiguo; el fichero de la app instalada no se regenera.
- `src-tauri/src/live.rs`: el protocolo del socket a Live.
- `src-tauri/tauri.conf.json`: ventana, CSP y qué se empaqueta.
- `.github/workflows/`: el CI.

## Diseño

- Una pantalla nueva se diseña antes de construirla: cuatro propuestas de la pantalla entera, con datos creíbles, al tamaño real de la ventana (460×460, también al 150 %), pasadas por las skills `design-taste-frontend` (su run de app-screen), `emil-design-eng` y `apple-design`, con una recomendación.
- El aspecto elegido vive en `docs/design/` y se copia fielmente.
- Cada elemento y cada estado tiene una story de Storybook que pinta el código real; los estados se llaman como los diría un usuario.
- Un aspecto o un movimiento se enseña (GIF + story) antes de escribir sus tests.
- Una pregunta de diseño llega como UNA imagen con todas las opciones lado a lado.
- Movimiento: anima solo `transform` y `opacity`, duraciones en variables CSS con nombre, respeta `prefers-reduced-motion`; una acción de teclado responde sin animación.
- Un color de señal lleva siempre una letra o un símbolo.

## Tests y textos

- Un test tiene que poder fallar: comprueba lo que vería su usuario.
- Un error se arregla en la capa más barata que lo atrapa (diseño que no lo permite > tipo o test > app en marcha > prosa), y el mensaje del fallo dice el arreglo.
- Una acción fallida dice qué no pasó, por qué y qué hacer.
- El producto habla como producto, en impersonal («No se encuentra la pista BASS»).

## Docs

- Glosario: `CONTEXT.md`; el código se nombra con sus palabras.
- Decisiones: `docs/adr/` (`INDEX.md`).
- Un FDR por funcionalidad visible para el usuario, en `docs/fdr/`, escrito cuando se diseña.
- Este fichero lleva solo reglas; la historia va en los ADR.

## Catálogo (Storybook)

- `npm run storybook` → http://localhost:6006. Las stories (`stories/*.stories.js`) montan el panel real con un `window.__TAURI__` de mentira (`stories/soporte.js`); los datos salen de `lecciones/jungle.json`.
- Un elemento o estado nuevo trae su story en el mismo PR. El job `stories` del CI las abre todas y falla si alguna no arranca o escribe un error en consola.
- Al terminar, parar el servidor: un proceso vivo bloquea `node_modules`.
