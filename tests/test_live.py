import pytest

from retrack.live import parse


def test_parse_success():
    texto = '{"status": "success", "result": {"tempo": 123.0}}'
    result = parse(texto)
    assert result["tempo"] == 123.0


def test_parse_error():
    texto = '{"status": "error", "result": {}, "message": "Unknown command: no_existe"}'
    with pytest.raises(RuntimeError):
        parse(texto)
