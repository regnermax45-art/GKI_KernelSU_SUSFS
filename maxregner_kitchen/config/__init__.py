"""
Configuration Management Module

Handles application configuration, user preferences, device profiles,
and porting presets for the MaxRegner Kitchen Tool.
"""

from .settings import KitchenConfig, ConfigManager
from .profiles import DeviceProfile, DeviceProfileManager
from .defaults import DEFAULT_CONFIG, DEVICE_PROFILES

__all__ = [
    'KitchenConfig',
    'ConfigManager', 
    'DeviceProfile',
    'DeviceProfileManager',
    'DEFAULT_CONFIG',
    'DEVICE_PROFILES'
]
