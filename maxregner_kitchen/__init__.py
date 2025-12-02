"""
MaxRegner Android Kitchen Tool
Ultra-Modern Pixel Firmware Porting Suite

A sophisticated GUI-based Android kitchen tool for porting and customizing
Pixel firmware with advanced features and modern interface design.

Author: MaxRegner Development Team
Version: 1.0.0
License: MIT
"""

__version__ = "1.0.0"
__author__ = "MaxRegner Development Team"
__license__ = "MIT"
__description__ = "Ultra-Modern Android Kitchen Tool for Pixel Firmware Porting"

# Core module imports
from .config import KitchenConfig
from .utils.logger import KitchenLogger
from .utils.progress import ProgressTracker

# Version information
VERSION_INFO = {
    "major": 1,
    "minor": 0,
    "patch": 0,
    "release": "stable",
    "build": "20231202"
}

def get_version():
    """Get formatted version string."""
    return f"{VERSION_INFO['major']}.{VERSION_INFO['minor']}.{VERSION_INFO['patch']}"

def get_full_version():
    """Get full version string with release info."""
    return f"{get_version()}-{VERSION_INFO['release']}.{VERSION_INFO['build']}"

# Application constants
APP_NAME = "MaxRegner Kitchen"
APP_TITLE = f"{APP_NAME} v{get_version()}"
ORGANIZATION = "MaxRegner Development"
DOMAIN = "maxregner.dev"

# Supported firmware types
SUPPORTED_FORMATS = [
    "factory_image",
    "ota_package", 
    "payload_bin",
    "fastboot_image",
    "custom_rom"
]

# Supported Pixel devices
SUPPORTED_DEVICES = [
    "pixel_7_pro",
    "pixel_7",
    "pixel_6_pro", 
    "pixel_6",
    "pixel_6a",
    "pixel_5",
    "pixel_4_xl",
    "pixel_4",
    "pixel_3_xl",
    "pixel_3"
]
