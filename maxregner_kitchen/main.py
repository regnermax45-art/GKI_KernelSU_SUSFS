#!/usr/bin/env python3
"""
MaxRegner Android Kitchen Tool - Main Application Entry Point

Ultra-modern GUI application for Pixel firmware porting and customization.
Features advanced porting algorithms, modern UI design, and comprehensive
firmware manipulation capabilities.
"""

import sys
import os
import argparse
import traceback
from pathlib import Path

# Handle PyQt6 import with fallback
try:
    from PyQt6.QtWidgets import QApplication, QMessageBox, QSplashScreen
    from PyQt6.QtCore import Qt, QTimer, QThread, pyqtSignal
    from PyQt6.QtGui import QPixmap, QFont, QPalette, QColor
    PYQT_AVAILABLE = True
except ImportError as e:
    print(f"PyQt6 not available: {e}")
    print("Please install PyQt6 using: pip install PyQt6==6.7.1")
    PYQT_AVAILABLE = False

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from maxregner_kitchen import APP_NAME, APP_TITLE, get_full_version
from maxregner_kitchen.config import KitchenConfig
from maxregner_kitchen.utils.logger import KitchenLogger
from maxregner_kitchen.gui.main_window import MainWindow


class SplashScreen(QSplashScreen):
    """Custom splash screen with loading animation."""
    
    def __init__(self):
        # Create a simple splash screen pixmap
        pixmap = QPixmap(600, 400)
        pixmap.fill(QColor(30, 30, 30))
        super().__init__(pixmap)
        
        self.setWindowFlags(Qt.WindowType.SplashScreen | Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        
        # Show loading message
        self.showMessage(
            f"Loading {APP_TITLE}...\nInitializing components...",
            Qt.AlignmentFlag.AlignCenter | Qt.AlignmentFlag.AlignBottom,
            QColor(255, 255, 255)
        )


class ApplicationInitializer(QThread):
    """Background thread for application initialization."""
    
    progress_updated = pyqtSignal(str)
    initialization_complete = pyqtSignal()
    error_occurred = pyqtSignal(str)
    
    def __init__(self):
        super().__init__()
        self.config = None
        self.logger = None
    
    def run(self):
        """Initialize application components in background."""
        try:
            # Initialize configuration
            self.progress_updated.emit("Loading configuration...")
            self.config = KitchenConfig()
            
            # Initialize logger
            self.progress_updated.emit("Setting up logging system...")
            self.logger = KitchenLogger()
            
            # Validate system requirements
            self.progress_updated.emit("Validating system requirements...")
            self._validate_system()
            
            # Load device profiles
            self.progress_updated.emit("Loading device profiles...")
            self._load_device_profiles()
            
            # Initialize tools
            self.progress_updated.emit("Initializing tools...")
            self._initialize_tools()
            
            self.progress_updated.emit("Ready!")
            self.initialization_complete.emit()
            
        except Exception as e:
            self.error_occurred.emit(str(e))
    
    def _validate_system(self):
        """Validate system requirements."""
        # Check Python version
        if sys.version_info < (3, 8):
            raise RuntimeError("Python 3.8 or higher is required")
        
        # Check available disk space (minimum 5GB)
        import shutil
        free_space = shutil.disk_usage('.').free
        if free_space < 5 * 1024 * 1024 * 1024:  # 5GB
            raise RuntimeError("Insufficient disk space (minimum 5GB required)")
    
    def _load_device_profiles(self):
        """Load device-specific profiles."""
        # This would load device configurations
        pass
    
    def _initialize_tools(self):
        """Initialize external tools and dependencies."""
        # This would check for and initialize external tools
        pass


class MaxRegnerKitchen:
    """Main application class."""
    
    def __init__(self):
        self.app = None
        self.main_window = None
        self.splash = None
        self.initializer = None
        self.config = None
        self.logger = None
    
    def setup_application(self):
        """Set up the Qt application with custom styling."""
        self.app = QApplication(sys.argv)
        self.app.setApplicationName(APP_NAME)
        self.app.setApplicationVersion(get_full_version())
        self.app.setOrganizationName("MaxRegner Development")
        
        # Set application icon (would be loaded from resources)
        # self.app.setWindowIcon(QIcon(":/icons/app_icon.png"))
        
        # Apply dark theme
        self._apply_dark_theme()
        
        # Set custom font
        font = QFont("Segoe UI", 9)
        self.app.setFont(font)
    
    def _apply_dark_theme(self):
        """Apply modern dark theme to the application."""
        dark_palette = QPalette()
        
        # Window colors
        dark_palette.setColor(QPalette.ColorRole.Window, QColor(53, 53, 53))
        dark_palette.setColor(QPalette.ColorRole.WindowText, QColor(255, 255, 255))
        
        # Base colors
        dark_palette.setColor(QPalette.ColorRole.Base, QColor(25, 25, 25))
        dark_palette.setColor(QPalette.ColorRole.AlternateBase, QColor(53, 53, 53))
        
        # Text colors
        dark_palette.setColor(QPalette.ColorRole.Text, QColor(255, 255, 255))
        dark_palette.setColor(QPalette.ColorRole.BrightText, QColor(255, 0, 0))
        
        # Button colors
        dark_palette.setColor(QPalette.ColorRole.Button, QColor(53, 53, 53))
        dark_palette.setColor(QPalette.ColorRole.ButtonText, QColor(255, 255, 255))
        
        # Highlight colors
        dark_palette.setColor(QPalette.ColorRole.Highlight, QColor(42, 130, 218))
        dark_palette.setColor(QPalette.ColorRole.HighlightedText, QColor(0, 0, 0))
        
        self.app.setPalette(dark_palette)
    
    def show_splash_screen(self):
        """Show splash screen during initialization."""
        self.splash = SplashScreen()
        self.splash.show()
        
        # Start background initialization
        self.initializer = ApplicationInitializer()
        self.initializer.progress_updated.connect(self._update_splash_message)
        self.initializer.initialization_complete.connect(self._on_initialization_complete)
        self.initializer.error_occurred.connect(self._on_initialization_error)
        self.initializer.start()
    
    def _update_splash_message(self, message):
        """Update splash screen message."""
        if self.splash:
            self.splash.showMessage(
                f"Loading {APP_TITLE}...\n{message}",
                Qt.AlignmentFlag.AlignCenter | Qt.AlignmentFlag.AlignBottom,
                QColor(255, 255, 255)
            )
    
    def _on_initialization_complete(self):
        """Handle successful initialization."""
        self.config = self.initializer.config
        self.logger = self.initializer.logger
        
        # Close splash screen and show main window
        QTimer.singleShot(1000, self._show_main_window)
    
    def _on_initialization_error(self, error_message):
        """Handle initialization error."""
        if self.splash:
            self.splash.close()
        
        QMessageBox.critical(
            None,
            "Initialization Error",
            f"Failed to initialize {APP_NAME}:\n\n{error_message}"
        )
        sys.exit(1)
    
    def _show_main_window(self):
        """Show the main application window."""
        if self.splash:
            self.splash.close()
        
        self.main_window = MainWindow(self.config, self.logger)
        self.main_window.show()
    
    def run(self):
        """Run the application."""
        try:
            self.setup_application()
            self.show_splash_screen()
            return self.app.exec()
        except Exception as e:
            self._handle_critical_error(e)
            return 1
    
    def _handle_critical_error(self, error):
        """Handle critical application errors."""
        error_msg = f"Critical error in {APP_NAME}:\n\n{str(error)}\n\nTraceback:\n{traceback.format_exc()}"
        
        if self.app:
            QMessageBox.critical(None, "Critical Error", error_msg)
        else:
            print(f"CRITICAL ERROR: {error_msg}", file=sys.stderr)


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description=f"{APP_NAME} - Ultra-Modern Android Kitchen Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Examples:
  {sys.argv[0]}                    # Launch GUI application
  {sys.argv[0]} --debug           # Launch with debug logging
  {sys.argv[0]} --config custom   # Use custom configuration
        """
    )
    
    parser.add_argument(
        "--version",
        action="version",
        version=f"{APP_NAME} {get_full_version()}"
    )
    
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    
    parser.add_argument(
        "--config",
        type=str,
        default="default",
        help="Configuration profile to use"
    )
    
    parser.add_argument(
        "--no-splash",
        action="store_true",
        help="Skip splash screen"
    )
    
    return parser.parse_args()


def main():
    """Main entry point."""
    # Check if PyQt6 is available
    if not PYQT_AVAILABLE:
        print("\n" + "="*60)
        print("ERROR: PyQt6 is not installed or not working properly!")
        print("="*60)
        print("\nTo fix this on Windows, please run:")
        print("1. pip install --upgrade pip")
        print("2. pip install PyQt6==6.7.1")
        print("\nIf you still have issues, try:")
        print("3. pip install --only-binary=all PyQt6==6.7.1")
        print("\nOr install from conda:")
        print("4. conda install pyqt")
        print("="*60)
        sys.exit(1)
    
    # Parse command line arguments
    args = parse_arguments()
    
    # Set up environment
    if args.debug:
        os.environ["MAXREGNER_DEBUG"] = "1"
    
    # Create and run application
    kitchen = MaxRegnerKitchen()
    
    try:
        exit_code = kitchen.run()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\nApplication interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
