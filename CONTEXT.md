# Re-track

«Duolingo para Ableton»: recrea un track con IA y genera una lección
interactiva verificada contra el estado real de Live. El código se nombra
con estas palabras; las decisiones están en `docs/adr/`.

## Lenguaje

### Lección

**Lección**:
Una canción convertida en curso: un título y sus módulos. Un fichero JSON en `lecciones/` (`jungle.json`), con el schema de `src-tauri/src/leccion.rs`; su nombre de fichero es su id (`jungle`). Una lección creada en la app (`receta-1`) vive aparte, en `data/lecciones/` ([ADR-015](docs/adr/ADR-015-lecciones-creadas-en-carpeta-propia.md)).
_Evitar_: curso, tutorial (eso es lo que se compone con piezas en la visión), lesson

**Módulo**:
Un elemento de la canción dentro de una lección (Pad, Bass, Arreglo, Mezcla…): `id` fijo, título, versión, tempo, tonalidad y sus pasos. Se identifica como `leccion/modulo` (`jungle/bass`), que es también la clave de su progreso.
_Evitar_: elemento, capítulo, sección, stage

**Paso**:
Una acción que el usuario hace en Live: un `id` fijo para siempre dentro de su módulo, una `instruccion` y un check. El progreso va por ese id, así que insertar o reordenar pasos no descoloca lo ya hecho.
_Evitar_: step, tarea, ejercicio

**Instrucción**:
La frase del paso que enseña el panel, en tono de profe técnico: acción + dato medido + razón técnica ([ADR-012](docs/adr/ADR-012-tono-profe-tecnico.md)).
_Evitar_: mensaje, texto, descripción

**Pista**:
Una pista del set de Live, buscada por nombre sin distinguir mayúsculas; `Master` es el master.
_Evitar_: track (solo sobrevive en el nombre del check `track_existe`), canal

**Device**:
Un instrumento o efecto nativo de Live en una pista, nombrado por su `class_name` (`Operator`); cuenta también si está dentro de un rack ([ADR-009](docs/adr/ADR-009-solo-devices-nativos-de-ableton.md)).
_Evitar_: plugin, VST, dispositivo, instrumento

### Verificación

**Check**:
La condición que el set de Live tiene que cumplir para dar un paso por hecho: un tipo (`check`) y su `valor`. Un tipo desconocido o un valor mal formado no carga. Va por niveles, estructura y luego exactitud ([ADR-007](docs/adr/ADR-007-verificacion-por-niveles.md)).
_Evitar_: predicado, validación, test, comprobación (comprobar es la acción: el comando `comprobar`)

Los tipos de check que existen:

- **`track_existe`**: hay una pista con ese nombre.
- **`tempo_es`**: el tempo del set es ese BPM.
- **`device_en_pista`**: la pista tiene un device con ese `class_name`.
- **`clip_en_pista`**: la pista tiene al menos un clip en la vista Session.
- **`notas_en_clip`**: los clips de Session de la pista tienen todas las notas pedidas, cada una en su sitio y con su duración (rejilla de semicorchea); las notas de más no molestan.
- **`parametro_en_rango`**: un parámetro de un device de la pista está entre `min` y `max`, bordes incluidos, en el valor bruto de Live ([ADR-010](docs/adr/ADR-010-un-check-generico-de-parametros.md)).
- **`volumen_en_rango`**: el fader de la pista está entre `min` y `max`, en dB.
- **`clip_en_arreglo`**: los clips de la pista en el Arrangement ocupan justo los compases `desde` → `hasta` (`hasta` no incluido); dos clips pegados cuentan como uno.

**Detalle**:
Lo que el panel dice cuando un check no se cumple: qué falta y hacia dónde ir («Osc-B Level: súbelo», «No encuentro la pista BASS»).
_Evitar_: error, pista (es otra cosa aquí), hint

**Snapshot**:
El estado del set que Live devuelve por el socket (`get_session_snapshot`): tempo, pistas, devices con sus parámetros, clips y notas. Contra él se evalúa cada check; nunca contra la pantalla. El de Live 12 no trae el texto de pantalla de un parámetro (`value_string`).
_Evitar_: estado, dump, captura (una captura es una imagen)

**Remote Script**:
AbletonMCP, el script que corre dentro de Live y contesta por TCP en `127.0.0.1:9877` con JSON `{"type": cmd, "params": {...}}` ([ADR-002](docs/adr/ADR-002-integrado-en-ableton-por-remote-script.md)).
_Evitar_: plugin, servidor, MCP a secas

**Golden data**:
La canción medida que sirve de referencia para la v1: `musichelper/songs/fred-again-jungle/`, con su `elements.md`. De ahí salen los valores de la lección Jungle.
_Evitar_: fixture, datos de prueba, dataset

### Progreso

**Hecho**:
Un paso que el usuario ya cumplió: una fila `(modulo, paso)` en la tabla `hechos`. Un id de paso que ya no está en el módulo deja de contar.
_Evitar_: completado, done, check (es otra cosa)

**Progreso**:
Los hechos de un módulo, guardados en SQLite (`data/progreso.db`; en la app instalada, `%APPDATA%/dev.magomin.retrack/progreso.db`) con clave `leccion/modulo`. El formato anterior, «voy por el paso N», se migra la primera vez que se lee: los N primeros pasos pasan a hechos.
_Evitar_: avance, estado, partida guardada

### Aplicación

**Panel**:
La ventana de Re-track: 460×460, siempre encima de Live, sin marco. HTML/CSS/JS en `panel/`, sin lógica propia: llama a los comandos del backend con `invoke` ([ADR-004](docs/adr/ADR-004-rust-y-tauri-2.md)).
_Evitar_: front, UI, overlay (el overlay por zonas es otra cosa, de la v2), ventana

### Visión (2026-11-03, todavía sin código)

**Versión de módulo**:
Corregir o explorar un módulo crea `bass v2` sin borrar `v1`: nunca se pierde una lección que funcionaba. Hoy solo existe el campo `version` del módulo, que vale 1 si el JSON no lo trae.
_Evitar_: revisión, variante, copia

**Pieza** (Lego):
Un módulo verificado visto como parte reutilizable, con su id fijo (`jungle/bass`), que el usuario combina con piezas de otras canciones. Ya tiene código: se cogen en la pantalla de nueva lección (FDR-004) y la lección creada lleva una copia de cada una ([ADR-015](docs/adr/ADR-015-lecciones-creadas-en-carpeta-propia.md)).
_Evitar_: bloque, componente, preset

**Back to back**:
En el panel, «Una detrás de otra» (hoy encadena las piezas tal cual, sin adaptar tempo ni tonalidad). Extremo del slider que encadena las lecciones de las piezas elegidas sin inventar nada, adaptadas a un tempo y una tonalidad comunes (Live tiene un solo tempo); por eso cada módulo lleva los suyos.
_Evitar_: playlist, cola, secuencia

**Mix**:
En el panel, «Mezcladas» (sin construir). El otro extremo del slider: un agente compone una pista nueva con las piezas, el usuario la escucha y la valida, y solo entonces el agente genera el tutorial de cómo la hizo.
_Evitar_: mezcla (es el módulo de niveles y master de una lección), mashup, remix
