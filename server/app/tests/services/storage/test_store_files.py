from datetime import UTC, datetime
from io import BytesIO
from pathlib import Path

from fastapi import UploadFile

from app.services.storage import store_files


async def test_store_files_writes_file_and_returns_metadata(
    anyio_backend: str, tmp_path: Path
):
    _ = anyio_backend
    base_storage_dir = tmp_path / "feedback"
    file = UploadFile(filename="file.txt", file=BytesIO(b"hello"))

    stored_files = await store_files([file], base_storage_dir)

    assert len(stored_files) == 1
    stored = stored_files[0]
    month_dir = datetime.now(UTC).strftime("%Y-%m")

    assert stored.original_name == "file.txt"
    assert stored.size == 5
    assert stored.path.startswith(f"{month_dir}/")
    assert stored.path.endswith(".txt")
    assert (base_storage_dir / stored.path).read_bytes() == b"hello"


async def test_store_files_defaults_missing_filename(
    anyio_backend: str, tmp_path: Path
):
    _ = anyio_backend
    base_storage_dir = tmp_path / "feedback"
    file = UploadFile(filename=None, file=BytesIO(b"x"))

    stored_files = await store_files([file], base_storage_dir)

    assert len(stored_files) == 1
    stored = stored_files[0]

    assert stored.original_name == "file"
    assert stored.size == 1
    assert "/" in stored.path


async def test_store_files_returns_empty_list_for_no_files(
    anyio_backend: str, tmp_path: Path
):
    _ = anyio_backend
    base_storage_dir = tmp_path / "feedback"

    stored_files = await store_files([], base_storage_dir)

    assert stored_files == []
    assert base_storage_dir.exists() is False
