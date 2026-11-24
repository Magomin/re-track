# Decisiones de arquitectura

Una fila por ADR, en el orden en que se tomaron. Un ADR nuevo toma el número
siguiente, `ADR-NNN-slug.md`, y su fila aquí. ADR-001 a ADR-013 salen de la
tabla «Decisiones cerradas» de `docs/DESIGN.md` (misma numeración); su fecha
es la que da esa tabla, o la del grill (2026-10-11) cuando la fila no trae
ninguna.

| # | Decisión | Fecha |
|---|----------|-------|
| [ADR-001](ADR-001-herramienta-personal-primero.md) | Herramienta personal primero; producto solo si la v1 funciona | 2026-10-11 |
| [ADR-002](ADR-002-integrado-en-ableton-por-remote-script.md) | Integrado en Ableton: verificación por Remote Script/socket y panel siempre encima -- *en parte sustituido por ADR-004 (el panel ya no es Python)* | 2026-10-11 |
| [ADR-003](ADR-003-envuelve-el-pipeline-de-musichelper.md) | Re-track envuelve el pipeline de musichelper | 2026-10-11 |
| [ADR-004](ADR-004-rust-y-tauri-2.md) | Stack Rust + Tauri 2, lógica en módulos sin Tauri -- *sustituye a tkinter y a Python + FastAPI + Electron* | 2026-11-22 |
| [ADR-005](ADR-005-protocolo-de-ensenanza.md) | Protocolo de enseñanza: la regla maestra de CLAUDE.md -- *sustituido el 2026-11-22 por el modo «desarrollo rápido»* | 2026-10-11 |
| [ADR-006](ADR-006-lesson-player-antes-que-remake-runner.md) | Lesson player primero, remake runner después | 2026-10-11 |
| [ADR-007](ADR-007-verificacion-por-niveles.md) | Verificación por niveles: estructura, luego exactitud | 2026-10-11 |
| [ADR-008](ADR-008-repo-publico-sin-cuentas-en-v1.md) | Repo público; sin auth, pagos ni multiusuario en v1 | 2026-10-11 |
| [ADR-009](ADR-009-solo-devices-nativos-de-ableton.md) | Solo devices nativos de Ableton en las lecciones | 2026-11-02 |
| [ADR-010](ADR-010-un-check-generico-de-parametros.md) | El sonido se verifica con un check genérico de parámetros | 2026-10-11 |
| [ADR-011](ADR-011-samples-via-splice-opcional.md) | Samples vía Splice, opcional y nunca sin OK del usuario | 2026-10-11 |
| [ADR-012](ADR-012-tono-profe-tecnico.md) | Tono de las lecciones: profe técnico | 2026-11-23 |
| [ADR-013](ADR-013-instrumento-de-medida-cyberpunk.md) | Dirección visual: instrumento de medida con ambiente cyberpunk | 2026-11-23 |
