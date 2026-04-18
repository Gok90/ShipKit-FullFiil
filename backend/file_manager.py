from pathlib import Path
from datetime import datetime
import shutil
from typing import Optional, List

# Base paths
BASE_DIR = Path(__file__).parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
DATA_DIR = BASE_DIR / "data"

# Ensure directories exist
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

def get_batch_folder(batch_id: str, date: Optional[datetime] = None) -> Path:
    """Get or create folder for a batch: uploads/2026-04-16/batch-id/"""
    if date is None:
        date = datetime.now()
    
    date_str = date.strftime("%Y-%m-%d")
    batch_folder = UPLOADS_DIR / date_str / batch_id
    batch_folder.mkdir(parents=True, exist_ok=True)
    return batch_folder

def save_upload(batch_id: str, filename: str, file_data: bytes, date: Optional[datetime] = None) -> Path:
    """Save uploaded file to organized folder"""
    folder = get_batch_folder(batch_id, date)
    file_path = folder / filename
    
    with open(file_path, 'wb') as f:
        f.write(file_data)
    
    return file_path

def get_batch_files(batch_id: str, date: Optional[datetime] = None) -> List[Path]:
    """Get all files in a batch folder"""
    folder = get_batch_folder(batch_id, date)
    if folder.exists():
        return list(folder.glob("*"))
    return []

def list_uploads_by_date(date: Optional[datetime] = None) -> dict:
    """List all uploads organized by date"""
    if date is None:
        date = datetime.now()
    
    date_str = date.strftime("%Y-%m-%d")
    date_folder = UPLOADS_DIR / date_str
    
    result = {}
    if date_folder.exists():
        for batch_folder in sorted(date_folder.iterdir()):
            if batch_folder.is_dir():
                batch_id = batch_folder.name
                result[batch_id] = list(batch_folder.glob("*"))
    
    return result

def delete_batch(batch_id: str, date: Optional[datetime] = None) -> bool:
    """Delete entire batch folder"""
    folder = get_batch_folder(batch_id, date)
    if folder.exists():
        shutil.rmtree(folder)
        return True
    return False

def get_upload_path(batch_id: str, filename: str, date: Optional[datetime] = None) -> Path:
    """Get the full path to an uploaded file"""
    folder = get_batch_folder(batch_id, date)
    return folder / filename

def archive_batch(batch_id: str, source_date: Optional[datetime] = None, target_date: Optional[datetime] = None) -> Path:
    """Move batch to archive or different date folder"""
    if source_date is None:
        source_date = datetime.now()
    if target_date is None:
        target_date = datetime.now()
    
    source_folder = get_batch_folder(batch_id, source_date)
    target_folder = get_batch_folder(batch_id, target_date)
    
    if source_folder.exists() and source_folder != target_folder:
        shutil.move(str(source_folder), str(target_folder))
    
    return target_folder
