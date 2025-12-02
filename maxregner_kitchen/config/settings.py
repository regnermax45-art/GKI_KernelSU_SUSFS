"""
Configuration Settings Management

Handles loading, saving, and managing application configuration settings,
user preferences, and runtime configuration for the MaxRegner Kitchen Tool.
"""

import json
import os
import shutil
from pathlib import Path
from typing import Dict, Any, Optional, Union
from dataclasses import dataclass, asdict
# Handle PyQt6 import with fallback
try:
    from PyQt6.QtCore import QSettings, QStandardPaths
    PYQT_AVAILABLE = True
except ImportError:
    # Fallback for when PyQt6 is not available
    QSettings = None
    QStandardPaths = None
    PYQT_AVAILABLE = False


@dataclass
class WindowGeometry:
    """Window geometry configuration."""
    width: int = 1400
    height: int = 900
    x: int = 100
    y: int = 100


@dataclass
class UIConfig:
    """UI configuration settings."""
    window_geometry: WindowGeometry
    splitter_sizes: list
    show_tooltips: bool = True
    animations_enabled: bool = True
    transparency_effects: bool = True
    font_size: int = 9
    icon_size: int = 24


@dataclass
class ApplicationConfig:
    """Application-level configuration."""
    theme: str = "dark"
    language: str = "en"
    auto_save: bool = True
    backup_enabled: bool = True
    max_backups: int = 5
    temp_cleanup: bool = True
    parallel_processing: bool = True
    max_threads: int = 4


@dataclass
class FirmwareConfig:
    """Firmware handling configuration."""
    extraction_path: str = "./extracted"
    output_path: str = "./output"
    temp_path: str = "./temp"
    verify_checksums: bool = True
    preserve_timestamps: bool = True
    compression_level: int = 6
    auto_detect_format: bool = True


@dataclass
class PortingConfig:
    """Porting operation configuration."""
    merge_strategy: str = "intelligent"
    conflict_resolution: str = "prompt"
    preserve_signatures: bool = False
    update_build_props: bool = True
    patch_sepolicy: bool = True
    optimize_images: bool = True
    remove_bloatware: bool = False
    custom_modifications: list = None


@dataclass
class SecurityConfig:
    """Security and signing configuration."""
    verify_signatures: bool = True
    allow_unsigned: bool = False
    custom_keys_path: str = "./keys"
    sign_output: bool = True
    avb_enabled: bool = True
    dm_verity: bool = False


@dataclass
class LoggingConfig:
    """Logging configuration."""
    level: str = "INFO"
    file_logging: bool = True
    console_logging: bool = True
    max_log_size: str = "10MB"
    log_rotation: bool = True
    detailed_progress: bool = True


@dataclass
class ToolsConfig:
    """External tools configuration."""
    adb_path: str = "adb"
    fastboot_path: str = "fastboot"
    java_path: str = "java"
    python_path: str = "python3"
    zip_path: str = "7z"
    payload_dumper: str = "./tools/payload-dumper-go"
    avbroot: str = "./tools/avbroot"
    magiskboot: str = "./tools/magiskboot"


class ConfigManager:
    """Configuration manager for handling settings persistence."""
    
    def __init__(self, app_name: str = "MaxRegnerKitchen"):
        self.app_name = app_name
        
        if PYQT_AVAILABLE and QSettings and QStandardPaths:
            self.settings = QSettings(QSettings.Format.IniFormat, 
                                     QSettings.Scope.UserScope,
                                     "MaxRegner", app_name)
            
            # Set up configuration directories
            self.config_dir = Path(QStandardPaths.writableLocation(
                QStandardPaths.StandardLocation.AppConfigLocation))
        else:
            # Fallback when PyQt6 is not available
            self.settings = None
            # Use a simple config directory in user home
            import os
            home_dir = Path.home()
            self.config_dir = home_dir / ".maxregner_kitchen"
        
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self.config_file = self.config_dir / "config.json"
        self.backup_dir = self.config_dir / "backups"
        self.backup_dir.mkdir(exist_ok=True)
    
    def load_defaults(self) -> Dict[str, Any]:
        """Load default configuration from JSON file."""
        defaults_file = Path(__file__).parent / "defaults.json"
        
        try:
            with open(defaults_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Warning: Could not load defaults: {e}")
            return self._get_fallback_defaults()
    
    def _get_fallback_defaults(self) -> Dict[str, Any]:
        """Get fallback defaults if JSON file is not available."""
        return {
            "application": asdict(ApplicationConfig()),
            "ui": asdict(UIConfig(
                window_geometry=WindowGeometry(),
                splitter_sizes=[300, 800, 300]
            )),
            "firmware": asdict(FirmwareConfig()),
            "porting": asdict(PortingConfig(custom_modifications=[])),
            "security": asdict(SecurityConfig()),
            "logging": asdict(LoggingConfig()),
            "tools": asdict(ToolsConfig())
        }
    
    def load_config(self) -> Dict[str, Any]:
        """Load configuration from file or create default."""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                
                # Merge with defaults to ensure all keys exist
                defaults = self.load_defaults()
                return self._merge_configs(defaults, config)
                
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error loading config: {e}")
                return self.load_defaults()
        else:
            # Create default config file
            defaults = self.load_defaults()
            self.save_config(defaults)
            return defaults
    
    def save_config(self, config: Dict[str, Any]) -> bool:
        """Save configuration to file with backup."""
        try:
            # Create backup if config exists
            if self.config_file.exists():
                self._create_backup()
            
            # Save new configuration
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            
            return True
            
        except (IOError, json.JSONEncodeError) as e:
            print(f"Error saving config: {e}")
            return False
    
    def _create_backup(self):
        """Create a backup of the current configuration."""
        import datetime
        
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = self.backup_dir / f"config_backup_{timestamp}.json"
        
        try:
            shutil.copy2(self.config_file, backup_file)
            
            # Clean up old backups (keep only max_backups)
            self._cleanup_backups()
            
        except IOError as e:
            print(f"Warning: Could not create backup: {e}")
    
    def _cleanup_backups(self, max_backups: int = 5):
        """Clean up old backup files."""
        backup_files = sorted(self.backup_dir.glob("config_backup_*.json"))
        
        if len(backup_files) > max_backups:
            for old_backup in backup_files[:-max_backups]:
                try:
                    old_backup.unlink()
                except OSError:
                    pass
    
    def _merge_configs(self, defaults: Dict[str, Any], 
                      user_config: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively merge user config with defaults."""
        result = defaults.copy()
        
        for key, value in user_config.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._merge_configs(result[key], value)
            else:
                result[key] = value
        
        return result
    
    def get_qt_setting(self, key: str, default: Any = None) -> Any:
        """Get setting from Qt settings storage."""
        return self.settings.value(key, default)
    
    def set_qt_setting(self, key: str, value: Any):
        """Set setting in Qt settings storage."""
        self.settings.setValue(key, value)
        self.settings.sync()


class KitchenConfig:
    """Main configuration class for the MaxRegner Kitchen Tool."""
    
    def __init__(self, config_name: str = "default"):
        self.config_name = config_name
        self.manager = ConfigManager()
        self._config_data = self.manager.load_config()
        
        # Create typed configuration objects
        self._create_config_objects()
    
    def _create_config_objects(self):
        """Create typed configuration objects from loaded data."""
        try:
            # Application config
            app_data = self._config_data.get("application", {})
            self.application = ApplicationConfig(**app_data)
            
            # UI config
            ui_data = self._config_data.get("ui", {})
            geometry_data = ui_data.get("window_geometry", {})
            geometry = WindowGeometry(**geometry_data)
            
            self.ui = UIConfig(
                window_geometry=geometry,
                splitter_sizes=ui_data.get("splitter_sizes", [300, 800, 300]),
                show_tooltips=ui_data.get("show_tooltips", True),
                animations_enabled=ui_data.get("animations_enabled", True),
                transparency_effects=ui_data.get("transparency_effects", True),
                font_size=ui_data.get("font_size", 9),
                icon_size=ui_data.get("icon_size", 24)
            )
            
            # Firmware config
            firmware_data = self._config_data.get("firmware", {})
            self.firmware = FirmwareConfig(**firmware_data)
            
            # Porting config
            porting_data = self._config_data.get("porting", {})
            if porting_data.get("custom_modifications") is None:
                porting_data["custom_modifications"] = []
            self.porting = PortingConfig(**porting_data)
            
            # Security config
            security_data = self._config_data.get("security", {})
            self.security = SecurityConfig(**security_data)
            
            # Logging config
            logging_data = self._config_data.get("logging", {})
            self.logging = LoggingConfig(**logging_data)
            
            # Tools config
            tools_data = self._config_data.get("tools", {})
            self.tools = ToolsConfig(**tools_data)
            
        except Exception as e:
            print(f"Error creating config objects: {e}")
            # Fall back to defaults
            self._create_default_objects()
    
    def _create_default_objects(self):
        """Create default configuration objects."""
        self.application = ApplicationConfig()
        self.ui = UIConfig(
            window_geometry=WindowGeometry(),
            splitter_sizes=[300, 800, 300]
        )
        self.firmware = FirmwareConfig()
        self.porting = PortingConfig(custom_modifications=[])
        self.security = SecurityConfig()
        self.logging = LoggingConfig()
        self.tools = ToolsConfig()
    
    def save(self) -> bool:
        """Save current configuration to file."""
        config_data = {
            "application": asdict(self.application),
            "ui": asdict(self.ui),
            "firmware": asdict(self.firmware),
            "porting": asdict(self.porting),
            "security": asdict(self.security),
            "logging": asdict(self.logging),
            "tools": asdict(self.tools)
        }
        
        return self.manager.save_config(config_data)
    
    def reload(self):
        """Reload configuration from file."""
        self._config_data = self.manager.load_config()
        self._create_config_objects()
    
    def reset_to_defaults(self):
        """Reset configuration to defaults."""
        self._config_data = self.manager.load_defaults()
        self._create_config_objects()
        self.save()
    
    def get_device_profiles(self) -> Dict[str, Any]:
        """Get device profiles from configuration."""
        return self._config_data.get("device_profiles", {})
    
    def get_porting_presets(self) -> Dict[str, Any]:
        """Get porting presets from configuration."""
        return self._config_data.get("porting_presets", {})
    
    def get_raw_config(self) -> Dict[str, Any]:
        """Get raw configuration data."""
        return self._config_data.copy()
    
    def update_raw_config(self, key: str, value: Any):
        """Update raw configuration data."""
        self._config_data[key] = value
    
    def create_working_directories(self):
        """Create necessary working directories."""
        directories = [
            self.firmware.extraction_path,
            self.firmware.output_path,
            self.firmware.temp_path,
            self.security.custom_keys_path
        ]
        
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)
    
    def validate_tools(self) -> Dict[str, bool]:
        """Validate availability of external tools."""
        tools_status = {}
        
        tools_to_check = {
            "adb": self.tools.adb_path,
            "fastboot": self.tools.fastboot_path,
            "java": self.tools.java_path,
            "python": self.tools.python_path,
            "7zip": self.tools.zip_path
        }
        
        for tool_name, tool_path in tools_to_check.items():
            tools_status[tool_name] = shutil.which(tool_path) is not None
        
        return tools_status
