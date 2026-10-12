# Sabe escribir un test pytest básico (preparar / ejecutar / comprobar)

Tras la lección 0001 escribió `test_parse_success` solo: guardó el retorno de `parse()` en una variable y comparó con `assert`, 1 passed. Luego lo puso en rojo a propósito (`999`) y leyó la línea `E` (`assert 123.0 == 999.0`). Evidencia suficiente: assert y descubrimiento de tests son sólidos.

Implicación: la siguiente lección puede apoyarse en esto. Falta `pytest.raises` (testear que `parse` peta con `status: error`); es el paso natural y cierra la cobertura de `parse`.
