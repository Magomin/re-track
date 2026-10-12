from retrack.live import parse


def test_parse_success():
    texto ='{"status": "success", "result": {"tempo": 123.0}}'
    result= parse(texto)
    assert result["result"]["tempo"]==123.0


