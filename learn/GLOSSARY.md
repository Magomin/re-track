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
