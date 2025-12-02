"""
Default Configuration Values

Default configuration constants and values for the MaxRegner Kitchen Tool.
"""

from pathlib import Path
import json

# Load defaults from JSON file
def load_defaults():
    """Load default configuration from JSON file."""
    defaults_file = Path(__file__).parent / "defaults.json"
    
    try:
        with open(defaults_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return get_fallback_defaults()

def get_fallback_defaults():
    """Get fallback defaults if JSON file is not available."""
    return {
        "application": {
            "theme": "dark",
            "language": "en",
            "auto_save": True,
            "backup_enabled": True,
            "max_backups": 5,
            "temp_cleanup": True,
            "parallel_processing": True,
            "max_threads": 4
        },
        "ui": {
            "window_geometry": {
                "width": 1400,
                "height": 900,
                "x": 100,
                "y": 100
            },
            "splitter_sizes": [300, 800, 300],
            "show_tooltips": True,
            "animations_enabled": True,
            "transparency_effects": True,
            "font_size": 9,
            "icon_size": 24
        },
        "firmware": {
            "extraction_path": "./extracted",
            "output_path": "./output",
            "temp_path": "./temp",
            "verify_checksums": True,
            "preserve_timestamps": True,
            "compression_level": 6,
            "auto_detect_format": True
        }
    }

# Load defaults
DEFAULT_CONFIG = load_defaults()

# Device profiles
DEVICE_PROFILES = DEFAULT_CONFIG.get("device_profiles", {})

# Porting presets
PORTING_PRESETS = DEFAULT_CONFIG.get("porting_presets", {})
