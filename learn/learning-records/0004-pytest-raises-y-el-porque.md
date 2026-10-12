# Sabe testear que una función peta (pytest.raises) y entiende para qué sirve ese test

Lección 0002. Primer intento: copió el JSON de success y puso `ValueError`; leyó `DID NOT RAISE` pero no vio la causa. Se perdió el porqué ("no entiendo el porque estamos haciendo esto"). Lo que lo desbloqueó: explicar que `parse` tiene dos comportamientos y el test 2 vigila el segundo, y luego la demo de comentar el `raise` en `live.py` y ver el test 2 en rojo. Tras eso escribió el test correcto solo (JSON de error + `RuntimeError`), 2 passed, commit `ce3d68c`.

Evidencia: distinguió `raise` (lanza, en live.py) de `pytest.raises` (espera, en el test) por pregunta propia.

Implicación: con él, el porqué tiene que ir ANTES de la mecánica, y mejor con una demo que rompe algo y lo ve en rojo. Las lecciones futuras deben abrir con "qué pasa si no tienes esto" y un experimento que lo muestre.
