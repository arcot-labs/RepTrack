from datetime import datetime

from app.utilities.date import get_utc_timestamp_str


def test_get_utc_timestamp_str_returns_expected_iso_utc_format():
    timestamp = datetime(2026, 3, 3, 12, 34, 56)

    assert get_utc_timestamp_str(timestamp) == "2026-03-03T12:34:56Z"
