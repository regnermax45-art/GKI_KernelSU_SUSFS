"""
Helper Utilities

Common utility functions for file operations, system checks,
and validation in the MaxRegner Kitchen Tool.
"""

import os
import shutil
import hashlib
import platform
from pathlib import Path
from typing import Optional, List, Dict, Any


class FileUtils:
    """File operation utilities."""
    
    @staticmethod
    def calculate_checksum(file_path: Path, algorithm: str = "sha256") -> str:
        """Calculate file checksum."""
        hash_obj = hashlib.new(algorithm)
        
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_obj.update(chunk)
        
        return hash_obj.hexdigest()
    
    @staticmethod
    def get_file_size(file_path: Path) -> int:
        """Get file size in bytes."""
        return file_path.stat().st_size if file_path.exists() else 0
    
    @staticmethod
    def format_size(size_bytes: int) -> str:
        """Format size in human-readable format."""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} PB"
    
    @staticmethod
    def ensure_directory(path: Path) -> bool:
        """Ensure directory exists."""
        try:
            path.mkdir(parents=True, exist_ok=True)
            return True
        except Exception:
            return False


class SystemUtils:
    """System operation utilities."""
    
    @staticmethod
    def get_platform_info() -> Dict[str, str]:
        """Get platform information."""
        return {
            "system": platform.system(),
            "release": platform.release(),
            "version": platform.version(),
            "machine": platform.machine(),
            "processor": platform.processor(),
            "python_version": platform.python_version()
        }
    
    @staticmethod
    def check_tool_availability(tool_name: str) -> bool:
        """Check if external tool is available."""
        return shutil.which(tool_name) is not None
    
    @staticmethod
    def get_free_space(path: Path) -> int:
        """Get free disk space in bytes."""
        return shutil.disk_usage(path).free


class ValidationUtils:
    """Validation utilities."""
    
    @staticmethod
    def is_valid_firmware_file(file_path: Path) -> bool:
        """Check if file is a valid firmware file."""
        if not file_path.exists():
            return False
        
        valid_extensions = ['.zip', '.img', '.bin', '.tar', '.gz']
        return file_path.suffix.lower() in valid_extensions
    
    @staticmethod
    def validate_pixel_firmware(file_path: Path) -> Dict[str, Any]:
        """Validate Pixel firmware file."""
        result = {
            "valid": False,
            "type": "unknown",
            "device": "unknown",
            "version": "unknown",
            "errors": []
        }
        
        if not file_path.exists():
            result["errors"].append("File does not exist")
            return result
        
        filename = file_path.name.lower()
        
        # Basic validation based on filename patterns
        if "factory" in filename:
            result["type"] = "factory_image"
        elif "ota" in filename:
            result["type"] = "ota_package"
        elif filename.endswith(".bin"):
            result["type"] = "payload_bin"
        
        # Device detection
        device_patterns = {
            "cheetah": "Pixel 7 Pro",
            "panther": "Pixel 7",
            "raven": "Pixel 6 Pro",
            "oriole": "Pixel 6",
            "bluejay": "Pixel 6a"
        }
        
        for codename, display_name in device_patterns.items():
            if codename in filename:
                result["device"] = display_name
                break
        
        result["valid"] = result["type"] != "unknown"
        return result
