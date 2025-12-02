"""
Advanced Logging System

Comprehensive logging system with multiple output targets, filtering,
formatting, and real-time GUI integration for the MaxRegner Kitchen Tool.
"""

import logging
import logging.handlers
import os
import sys
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Optional, Callable, Dict, Any
from PyQt6.QtCore import QObject, pyqtSignal


class LogLevel(Enum):
    """Log level enumeration."""
    DEBUG = logging.DEBUG
    INFO = logging.INFO
    WARNING = logging.WARNING
    ERROR = logging.ERROR
    CRITICAL = logging.CRITICAL


class ColoredFormatter(logging.Formatter):
    """Colored console formatter for better readability."""
    
    # ANSI color codes
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
        'RESET': '\033[0m'        # Reset
    }
    
    def format(self, record):
        """Format log record with colors."""
        log_color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
        reset_color = self.COLORS['RESET']
        
        # Add color to level name
        record.levelname = f"{log_color}{record.levelname}{reset_color}"
        
        return super().format(record)


class GuiLogHandler(logging.Handler, QObject):
    """Custom log handler that emits Qt signals for GUI integration."""
    
    log_message = pyqtSignal(str, str, str)  # level, message, timestamp
    
    def __init__(self):
        logging.Handler.__init__(self)
        QObject.__init__(self)
    
    def emit(self, record):
        """Emit log record as Qt signal."""
        try:
            message = self.format(record)
            timestamp = datetime.fromtimestamp(record.created).strftime('%H:%M:%S')
            self.log_message.emit(record.levelname, message, timestamp)
        except Exception:
            self.handleError(record)


class KitchenLogger(QObject):
    """Advanced logging system for the MaxRegner Kitchen Tool."""
    
    # Qt signals for GUI integration
    log_updated = pyqtSignal(str, str, str)  # level, message, timestamp
    progress_updated = pyqtSignal(int, str)  # percentage, status
    
    def __init__(self, name: str = "MaxRegnerKitchen", 
                 log_dir: Optional[Path] = None):
        super().__init__()
        
        self.name = name
        self.log_dir = log_dir or Path("logs")
        self.log_dir.mkdir(exist_ok=True)
        
        # Create main logger
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.DEBUG)
        
        # Prevent duplicate handlers
        if self.logger.handlers:
            self.logger.handlers.clear()
        
        # Set up handlers
        self._setup_file_handler()
        self._setup_console_handler()
        self._setup_gui_handler()
        
        # Operation tracking
        self.current_operation = ""
        self.operation_start_time = None
        self.operation_steps = 0
        self.completed_steps = 0
        
        # Statistics
        self.stats = {
            'debug': 0,
            'info': 0,
            'warning': 0,
            'error': 0,
            'critical': 0
        }
    
    def _setup_file_handler(self):
        """Set up rotating file handler."""
        log_file = self.log_dir / f"{self.name.lower()}.log"
        
        # Rotating file handler (10MB max, keep 5 backups)
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        
        file_formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)s | %(funcName)s:%(lineno)d | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        file_handler.setFormatter(file_formatter)
        file_handler.setLevel(logging.DEBUG)
        self.logger.addHandler(file_handler)
    
    def _setup_console_handler(self):
        """Set up colored console handler."""
        console_handler = logging.StreamHandler(sys.stdout)
        
        # Use colored formatter for console
        console_formatter = ColoredFormatter(
            '%(asctime)s | %(levelname)s | %(message)s',
            datefmt='%H:%M:%S'
        )
        
        console_handler.setFormatter(console_formatter)
        console_handler.setLevel(logging.INFO)
        self.logger.addHandler(console_handler)
    
    def _setup_gui_handler(self):
        """Set up GUI integration handler."""
        self.gui_handler = GuiLogHandler()
        
        gui_formatter = logging.Formatter('%(message)s')
        self.gui_handler.setFormatter(gui_formatter)
        self.gui_handler.setLevel(logging.INFO)
        
        # Connect GUI handler signals to our signals
        self.gui_handler.log_message.connect(self._on_gui_log_message)
        
        self.logger.addHandler(self.gui_handler)
    
    def _on_gui_log_message(self, level: str, message: str, timestamp: str):
        """Handle GUI log message and emit our signal."""
        self.log_updated.emit(level, message, timestamp)
        
        # Update statistics
        level_lower = level.lower().replace('\033[32m', '').replace('\033[0m', '')
        if level_lower in self.stats:
            self.stats[level_lower] += 1
    
    def set_level(self, level: LogLevel):
        """Set logging level."""
        self.logger.setLevel(level.value)
        
        # Update console handler level
        for handler in self.logger.handlers:
            if isinstance(handler, logging.StreamHandler) and handler.stream == sys.stdout:
                handler.setLevel(level.value)
    
    def debug(self, message: str, **kwargs):
        """Log debug message."""
        self.logger.debug(message, **kwargs)
    
    def info(self, message: str, **kwargs):
        """Log info message."""
        self.logger.info(message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log warning message."""
        self.logger.warning(message, **kwargs)
    
    def error(self, message: str, **kwargs):
        """Log error message."""
        self.logger.error(message, **kwargs)
    
    def critical(self, message: str, **kwargs):
        """Log critical message."""
        self.logger.critical(message, **kwargs)
    
    def exception(self, message: str, **kwargs):
        """Log exception with traceback."""
        self.logger.exception(message, **kwargs)
    
    def start_operation(self, operation_name: str, total_steps: int = 100):
        """Start a new operation with progress tracking."""
        self.current_operation = operation_name
        self.operation_start_time = datetime.now()
        self.operation_steps = total_steps
        self.completed_steps = 0
        
        self.info(f"Starting operation: {operation_name}")
        self.progress_updated.emit(0, f"Starting {operation_name}...")
    
    def update_progress(self, steps_completed: int, status: str = ""):
        """Update operation progress."""
        self.completed_steps = min(steps_completed, self.operation_steps)
        percentage = int((self.completed_steps / self.operation_steps) * 100)
        
        if status:
            self.info(f"Progress: {percentage}% - {status}")
        
        progress_status = status or f"{self.current_operation} - {percentage}%"
        self.progress_updated.emit(percentage, progress_status)
    
    def complete_operation(self, success: bool = True, message: str = ""):
        """Complete the current operation."""
        if not self.current_operation:
            return
        
        duration = datetime.now() - self.operation_start_time if self.operation_start_time else None
        duration_str = f" in {duration.total_seconds():.2f}s" if duration else ""
        
        if success:
            final_message = message or f"Completed {self.current_operation}{duration_str}"
            self.info(final_message)
            self.progress_updated.emit(100, f"Completed: {self.current_operation}")
        else:
            final_message = message or f"Failed {self.current_operation}{duration_str}"
            self.error(final_message)
            self.progress_updated.emit(-1, f"Failed: {self.current_operation}")
        
        # Reset operation tracking
        self.current_operation = ""
        self.operation_start_time = None
        self.operation_steps = 0
        self.completed_steps = 0
    
    def log_system_info(self):
        """Log system information."""
        import platform
        import psutil
        
        self.info("=== System Information ===")
        self.info(f"Platform: {platform.platform()}")
        self.info(f"Python: {platform.python_version()}")
        self.info(f"Architecture: {platform.architecture()[0]}")
        self.info(f"Processor: {platform.processor()}")
        self.info(f"CPU Cores: {psutil.cpu_count()}")
        self.info(f"Memory: {psutil.virtual_memory().total // (1024**3)} GB")
        self.info(f"Disk Space: {psutil.disk_usage('/').free // (1024**3)} GB free")
        self.info("=" * 30)
    
    def log_configuration(self, config: Dict[str, Any]):
        """Log configuration settings."""
        self.info("=== Configuration ===")
        for section, settings in config.items():
            self.info(f"[{section.upper()}]")
            if isinstance(settings, dict):
                for key, value in settings.items():
                    # Hide sensitive information
                    if 'password' in key.lower() or 'key' in key.lower():
                        value = "***"
                    self.info(f"  {key}: {value}")
            else:
                self.info(f"  {settings}")
        self.info("=" * 20)
    
    def get_statistics(self) -> Dict[str, int]:
        """Get logging statistics."""
        return self.stats.copy()
    
    def clear_statistics(self):
        """Clear logging statistics."""
        for key in self.stats:
            self.stats[key] = 0
    
    def create_context_logger(self, context: str) -> 'ContextLogger':
        """Create a context-specific logger."""
        return ContextLogger(self, context)
    
    def flush(self):
        """Flush all handlers."""
        for handler in self.logger.handlers:
            handler.flush()
    
    def close(self):
        """Close all handlers."""
        for handler in self.logger.handlers:
            handler.close()
        self.logger.handlers.clear()


class ContextLogger:
    """Context-specific logger that prefixes messages with context."""
    
    def __init__(self, parent_logger: KitchenLogger, context: str):
        self.parent = parent_logger
        self.context = context
    
    def _format_message(self, message: str) -> str:
        """Format message with context prefix."""
        return f"[{self.context}] {message}"
    
    def debug(self, message: str, **kwargs):
        """Log debug message with context."""
        self.parent.debug(self._format_message(message), **kwargs)
    
    def info(self, message: str, **kwargs):
        """Log info message with context."""
        self.parent.info(self._format_message(message), **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log warning message with context."""
        self.parent.warning(self._format_message(message), **kwargs)
    
    def error(self, message: str, **kwargs):
        """Log error message with context."""
        self.parent.error(self._format_message(message), **kwargs)
    
    def critical(self, message: str, **kwargs):
        """Log critical message with context."""
        self.parent.critical(self._format_message(message), **kwargs)
    
    def exception(self, message: str, **kwargs):
        """Log exception with context."""
        self.parent.exception(self._format_message(message), **kwargs)
