import uuid
from datetime import UTC, datetime
from pathlib import Path

from fastapi import UploadFile

from app.models.schemas.storage import StoredFile


async def store_files(
    files: list[UploadFile], base_storage_dir: Path
) -> list[StoredFile]:
    storage_dir = base_storage_dir / datetime.now(UTC).strftime("%Y-%m")
    storage_dir.mkdir(parents=True, exist_ok=True)

    stored_files: list[StoredFile] = []
    for file in files:
        original_name = file.filename or "file"
        suffix = Path(original_name).suffix.lower()

        filename = f"{uuid.uuid4()}{suffix}"
        filepath = storage_dir / filename

        contents = await file.read()
        with open(filepath, "wb") as f:
            f.write(contents)

        rel_path = filepath.relative_to(base_storage_dir)
        stored_files.append(
            StoredFile(
                original_name=original_name,
                size=filepath.stat().st_size,
                path=str(rel_path),
            )
        )
    return stored_files
