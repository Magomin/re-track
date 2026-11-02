from retrack import progreso


def test_leccion_nueva_empieza_en_cero(tmp_path, monkeypatch):
    monkeypatch.setattr(progreso, "RUTA", str(tmp_path / "data" / "p.db"))
    assert progreso.leer("primera") == 0


def test_guardar_y_leer(tmp_path, monkeypatch):
    monkeypatch.setattr(progreso, "RUTA", str(tmp_path / "data" / "p.db"))
    progreso.guardar("primera", 1)
    progreso.guardar("primera", 2)
    assert progreso.leer("primera") == 2
    assert progreso.leer("jungle") == 0


def test_borrar_vuelve_a_cero(tmp_path, monkeypatch):
    monkeypatch.setattr(progreso, "RUTA", str(tmp_path / "data" / "p.db"))
    progreso.guardar("primera", 2)
    progreso.guardar("jungle", 5)
    progreso.borrar("primera")
    assert progreso.leer("primera") == 0
    assert progreso.leer("jungle") == 5
