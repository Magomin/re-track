from retrack.live import parse
import pytest


def test_parse_success():
    texto ='{"status": "success", "result": {"tempo": 123.0}}'
    result= parse(texto)
    assert result["result"]["tempo"]==123.0


def test_parse_error():
    texto = '{"status": "error", "result": {}, "message": "Unknown command: no_existe"}'
    with pytest.raises(RuntimeError):
        result = parse(texto)

