# Mission: Aprender desarrollo de software construyendo Re-track

## Why
Matthieu quiere poder construir y mantener software real por su cuenta (backend, tests, git) y usar Re-track, su "Duolingo para Ableton", como vehículo. Hoy sabe scripting Python; quiere pasar de "funciona en mi máquina" a código que entiende, prueba y versiona.

## Success looks like
- Escribe funciones de `retrack/` solo, con un test pytest verde por cada lógica nueva.
- Lee un traceback y encuentra la causa sin ayuda.
- Hace commits con mensajes que explican el cambio, y arregla un commit malo (`amend`, `restore`) sin miedo.
- v1 de Re-track jugable end-to-end: lección JSON → panel → verificación contra Live por socket → progreso en SQLite.

## Constraints
- Aprende haciendo, en el proyecto. Cada concepto entra cuando Re-track lo pide, no antes.
- Orden fijo por concepto: lección aislada primero (`learn/lessons/`), aplicación al proyecto después.
- Un paso por mensaje. Explicaciones cortas; él corre el código y pega la salida.
- Un commit por lección, no por paso.
- Español. Sin analogías con su trabajo pasado (scraping): el concepto directo.

## Out of scope
- Frontend más allá de tkinter mínimo.
- Teoría preventiva (OOP, async, patrones) antes de que el proyecto la necesite.
- Portfolio-driven development.
