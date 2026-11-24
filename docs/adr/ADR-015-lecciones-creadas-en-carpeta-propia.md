# ADR-015: Una lección creada en la app copia sus módulos y vive en carpeta propia

**Date:** 2026-11-24

## Context

La pantalla de nueva lección (FDR-004) monta una lección con piezas
(módulos) de las canciones que ya hay. Hasta ahora toda lección era un JSON
de `lecciones/`, que en la app instalada va empaquetado dentro del
programa: reinstalar lo sustituye entero. Además, dos canciones pueden
tener un módulo con el mismo id (`bass`), y el progreso se guarda con la
clave `leccion/modulo`.

## Decision

- Una lección creada es un JSON con el mismo schema que las demás
  (`leccion.rs` no cambia): **copia** los módulos elegidos, no los
  referencia.
- Vive aparte de las que trae la app: `data/lecciones/` en desarrollo y
  `%APPDATA%/dev.magomin.retrack/lecciones/` en la app instalada, junto al
  progreso. Se llama `receta-N`, el primer número libre.
- El id de cada módulo copiado pasa a `cancion-modulo` (`jungle-bass`). La
  lección nueva empieza sin nada hecho, aunque la pieza ya se hubiera
  completado en su canción.
- En «Canciones» solo salen las lecciones que trae la app; una lección
  creada no es fuente de piezas.

Alternativas descartadas: guardar referencias (`jungle/bass`) y resolverlas
al cargar, que cambia el schema y deja una lección rota si su canción
cambia; escribir en `lecciones/`, que en la app instalada se pierde al
reinstalar y en el repo ensucia git.

## Consequences

- Corregir un módulo en su canción no corrige las copias ya creadas.
- La lección creada no guarda de qué canciones sale más que en su título
  («Fred again.. — Jungle + Primera lección») y en el id de sus módulos; la carátula en
  porciones de FDR-003 necesitará ese dato.
- Las versiones de módulo (`bass v2`) y la comparación de elementos
  (ADR-014) tendrán que decidir si una copia sigue a su original.
- Cada pieza conserva su tempo y su tonalidad: adaptar las piezas a unos
  comunes («Back to back» del glosario) queda sin hacer.
