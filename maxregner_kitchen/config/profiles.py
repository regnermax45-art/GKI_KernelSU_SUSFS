"""
Device Profiles Management

Handles device-specific configurations, profiles, and compatibility
settings for different Pixel devices in the MaxRegner Kitchen Tool.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from pathlib import Path
import json


@dataclass
class DeviceProfile:
    """Device profile configuration."""
    codename: str
    display_name: str
    arch: str
    api_level: int
    security_patch: str
    bootloader: str
    radio: str
    partitions: Dict[str, int]
    features: List[str]
    
    def __post_init__(self):
        """Post-initialization validation."""
        if not self.codename:
            raise ValueError("Device codename is required")
        if not self.display_name:
            self.display_name = self.codename.title()


class DeviceProfileManager:
    """Manager for device profiles and compatibility."""
    
    def __init__(self):
        self.profiles: Dict[str, DeviceProfile] = {}
        self.load_default_profiles()
    
    def load_default_profiles(self):
        """Load default device profiles."""
        # Pixel 7 Pro
        self.add_profile(DeviceProfile(
            codename="cheetah",
            display_name="Pixel 7 Pro",
            arch="arm64",
            api_level=33,
            security_patch="2023-12-05",
            bootloader="cheetah-1.0",
            radio="g5123b-114922-230831-B-10191138",
            partitions={
                "system": 3221225472,
                "vendor": 805306368,
                "product": 536870912,
                "system_ext": 268435456,
                "boot": 67108864,
                "dtbo": 8388608,
                "vbmeta": 65536
            },
            features=[
                "avb", "dm_verity", "apex", 
                "dynamic_partitions", "virtual_ab"
            ]
        ))
        
        # Pixel 7
        self.add_profile(DeviceProfile(
            codename="panther",
            display_name="Pixel 7",
            arch="arm64",
            api_level=33,
            security_patch="2023-12-05",
            bootloader="panther-1.0",
            radio="g5123b-114922-230831-B-10191138",
            partitions={
                "system": 3221225472,
                "vendor": 805306368,
                "product": 536870912,
                "system_ext": 268435456,
                "boot": 67108864,
                "dtbo": 8388608,
                "vbmeta": 65536
            },
            features=[
                "avb", "dm_verity", "apex",
                "dynamic_partitions", "virtual_ab"
            ]
        ))
    
    def add_profile(self, profile: DeviceProfile):
        """Add a device profile."""
        self.profiles[profile.codename] = profile
    
    def get_profile(self, codename: str) -> Optional[DeviceProfile]:
        """Get device profile by codename."""
        return self.profiles.get(codename)
    
    def get_all_profiles(self) -> Dict[str, DeviceProfile]:
        """Get all device profiles."""
        return self.profiles.copy()
    
    def is_compatible(self, source_codename: str, target_codename: str) -> bool:
        """Check if two devices are compatible for porting."""
        source = self.get_profile(source_codename)
        target = self.get_profile(target_codename)
        
        if not source or not target:
            return False
        
        # Same architecture required
        if source.arch != target.arch:
            return False
        
        # Similar API level (within 2 versions)
        if abs(source.api_level - target.api_level) > 2:
            return False
        
        # Check for common features
        common_features = set(source.features) & set(target.features)
        if len(common_features) < 3:  # Require at least 3 common features
            return False
        
        return True
