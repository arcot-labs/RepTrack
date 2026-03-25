from app.core.dependencies import build_ms_client


def test_build_ms_client_cached():
    host = "localhost"
    port = 7700
    master_key = "masterkey"

    client_a = build_ms_client(host, port, master_key)
    client_b = build_ms_client(host, port, master_key)

    assert client_a is client_b
