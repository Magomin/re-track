# Re-track learning: glosario

Vocabulario del proyecto. Entra un término cuando Matthieu lo ha usado bien, no antes.

## Tests

**Test**:
Función que llama a tu código con datos conocidos y comprueba el resultado con `assert`. Vive en `tests/test_*.py`, se llama `test_*`.
_Avoid_: prueba manual, "lo corro y miro"

**assert**:
Sentencia que para el programa con `AssertionError` si la expresión es falsa. Si es verdadera no hace nada.
_Avoid_: comprobar con `if ... return`

**Línea E**:
En la salida de pytest, la línea que muestra el valor real frente al esperado. Se lee primero.

**pytest.raises**:
Bloque `with` en un test que espera un error de un tipo concreto. Si llega, el test pasa; si no, falla con `DID NOT RAISE`.
_Avoid_: confundir con `raise` (que lanza el error, en el código de la app)

## Errores

**raise**:
Sentencia que para el programa a propósito con un tipo de error y un mensaje que dice la causa real. Va donde se detecta el problema.
_Avoid_: `print` del error y seguir, devolver `None`

## Git y CI

**Integración continua (CI)**:
Tests (y otros checks) que corren solos en un servidor con cada push, en una máquina limpia. Resultado visible junto al commit.
_Avoid_: "GitHub Actions" como sinónimo (es una herramienta de CI, no el concepto)

**Workflow**:
Fichero YAML en `.github/workflows/` que dice cuándo corre un job, en qué máquina y con qué pasos.
