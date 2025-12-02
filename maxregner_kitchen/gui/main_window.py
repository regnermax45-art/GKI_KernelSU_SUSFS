"""
Main Window - Ultra Modern GUI for MaxRegner Kitchen Tool

Features sophisticated interface with drag-and-drop firmware input,
real-time progress tracking, and comprehensive porting workflow.
"""

import os
from pathlib import Path
from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QGridLayout,
    QTabWidget, QSplitter, QGroupBox, QLabel, QPushButton, QLineEdit,
    QTextEdit, QPlainTextEdit, QProgressBar, QComboBox, QCheckBox, QListWidget,
    QTreeWidget, QTreeWidgetItem, QFileDialog, QMessageBox,
    QStatusBar, QMenuBar, QToolBar, QDockWidget, QFrame
)
from PyQt6.QtCore import Qt, QTimer, pyqtSignal, QThread, QSize
from PyQt6.QtGui import QAction, QIcon, QFont, QPixmap, QDragEnterEvent, QDropEvent

from maxregner_kitchen import APP_TITLE, get_version
from maxregner_kitchen.config import KitchenConfig
from maxregner_kitchen.utils.logger import KitchenLogger
from maxregner_kitchen.utils.progress import ProgressTracker
from maxregner_kitchen.porting.engine import PortingEngine
from maxregner_kitchen.config.profiles import get_device_profile


class PortingThread(QThread):
    """Thread for running firmware porting process."""
    
    progress_updated = pyqtSignal(str, int)  # message, percentage
    porting_finished = pyqtSignal(object)    # PortingResult
    
    def __init__(self, source_path, target_path, target_device, output_path, logger):
        super().__init__()
        self.source_path = Path(source_path)
        self.target_path = Path(target_path) if target_path else None
        self.target_device = target_device
        self.output_path = Path(output_path)
        self.logger = logger
        self.progress_tracker = ProgressTracker()
        self.porting_engine = PortingEngine(logger, self.progress_tracker)
    
    def run(self):
        """Run the porting process in background thread."""
        try:
            # Get target device profile
            target_profile = get_device_profile(self.target_device)
            if not target_profile:
                self.logger.error(f"Unknown target device: {self.target_device}")
                return
            
            # Progress callback
            def progress_callback(message, percentage):
                self.progress_updated.emit(message, int(percentage))
            
            # Start porting
            result = self.porting_engine.start_porting(
                self.source_path,
                self.target_path or self.source_path,  # Use source as target if no target specified
                target_profile,
                self.output_path,
                progress_callback
            )
            
            self.porting_finished.emit(result)
            
        except Exception as e:
            self.logger.error(f"Porting thread error: {str(e)}")
            # Create error result
            from maxregner_kitchen.porting.engine import PortingResult
            error_result = PortingResult(
                success=False,
                output_path=None,
                source_info=None,
                target_info=None,
                ported_images={},
                errors=[str(e)],
                warnings=[],
                processing_time=0.0
            )
            self.porting_finished.emit(error_result)


class FirmwareInputWidget(QFrame):
    """Modern firmware input widget with drag-and-drop support."""
    
    firmware_selected = pyqtSignal(str, str)  # path, firmware_type
    
    def __init__(self, title: str, parent=None):
        super().__init__(parent)
        self.title = title
        self.firmware_path = ""
        self.setup_ui()
        self.setAcceptDrops(True)
    
    def setup_ui(self):
        """Set up the UI components."""
        self.setFrameStyle(QFrame.Shape.StyledPanel)
        self.setStyleSheet("""
            QFrame {
                background-color: #2d2d2d;
                border: 2px dashed #606060;
                border-radius: 8px;
                padding: 16px;
            }
            QFrame:hover {
                border-color: #0078d4;
                background-color: #353535;
            }
        """)
        
        layout = QVBoxLayout(self)
        
        # Title
        title_label = QLabel(self.title)
        title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title_label.setStyleSheet("font-size: 14pt; font-weight: bold; color: #ffffff;")
        layout.addWidget(title_label)
        
        # Drop area
        self.drop_label = QLabel("📱 Drag & Drop Firmware Here\nor Click to Browse")
        self.drop_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.drop_label.setStyleSheet("""
            QLabel {
                font-size: 12pt;
                color: #b3b3b3;
                padding: 40px;
                border: none;
            }
        """)
        layout.addWidget(self.drop_label)
        
        # File info
        self.file_info = QLabel("")
        self.file_info.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.file_info.setStyleSheet("color: #4caf50; font-weight: bold;")
        layout.addWidget(self.file_info)
        
        # Browse button
        self.browse_btn = QPushButton("Browse Files")
        self.browse_btn.clicked.connect(self.browse_file)
        layout.addWidget(self.browse_btn)
    
    def dragEnterEvent(self, event: QDragEnterEvent):
        """Handle drag enter event."""
        if event.mimeData().hasUrls():
            event.acceptProposedAction()
    
    def dropEvent(self, event: QDropEvent):
        """Handle drop event."""
        files = [url.toLocalFile() for url in event.mimeData().urls()]
        if files:
            self.set_firmware(files[0])
    
    def mousePressEvent(self, event):
        """Handle mouse press for click-to-browse."""
        if event.button() == Qt.MouseButton.LeftButton:
            self.browse_file()
    
    def browse_file(self):
        """Open file browser."""
        file_path, _ = QFileDialog.getOpenFileName(
            self,
            f"Select {self.title}",
            "",
            "Firmware Files (*.zip *.img *.bin *.tar *.gz);;All Files (*)"
        )
        if file_path:
            self.set_firmware(file_path)
    
    def set_firmware(self, path: str):
        """Set firmware path and update UI."""
        self.firmware_path = path
        filename = Path(path).name
        self.file_info.setText(f"✅ {filename}")
        self.drop_label.setText(f"📱 {filename}\nReady for processing")
        
        # Detect firmware type (simplified)
        firmware_type = "unknown"
        if "factory" in filename.lower():
            firmware_type = "factory_image"
        elif "ota" in filename.lower():
            firmware_type = "ota_package"
        elif filename.endswith(".bin"):
            firmware_type = "payload_bin"
        
        self.firmware_selected.emit(path, firmware_type)


class ProgressWidget(QWidget):
    """Advanced progress tracking widget."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_ui()
    
    def setup_ui(self):
        """Set up progress UI."""
        layout = QVBoxLayout(self)
        
        # Progress bar
        self.progress_bar = QProgressBar()
        self.progress_bar.setTextVisible(True)
        layout.addWidget(self.progress_bar)
        
        # Status label
        self.status_label = QLabel("Ready")
        self.status_label.setStyleSheet("color: #b3b3b3; font-size: 10pt;")
        layout.addWidget(self.status_label)
        
        # ETA label
        self.eta_label = QLabel("")
        self.eta_label.setStyleSheet("color: #b3b3b3; font-size: 9pt;")
        layout.addWidget(self.eta_label)
    
    def update_progress(self, percentage: int, message: str, eta: str = ""):
        """Update progress display."""
        self.progress_bar.setValue(percentage)
        self.status_label.setText(message)
        self.eta_label.setText(f"ETA: {eta}" if eta else "")


class LogWidget(QPlainTextEdit):
    """Enhanced log display widget."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_ui()
    
    def setup_ui(self):
        """Set up log widget."""
        self.setReadOnly(True)
        self.setMaximumBlockCount(1000)  # Limit log entries
        font = QFont("Consolas", 9)
        self.setFont(font)
    
    def add_log(self, level: str, message: str, timestamp: str):
        """Add log entry with formatting."""
        color_map = {
            "DEBUG": "#b3b3b3",
            "INFO": "#4caf50", 
            "WARNING": "#ff9800",
            "ERROR": "#f44336",
            "CRITICAL": "#e91e63"
        }
        
        color = color_map.get(level, "#ffffff")
        formatted_msg = f'[{timestamp}] {level}: {message}'
        self.appendPlainText(formatted_msg)


class MainWindow(QMainWindow):
    """Ultra-modern main window for MaxRegner Kitchen Tool."""
    
    def __init__(self, config: KitchenConfig, logger: KitchenLogger):
        super().__init__()
        self.config = config
        self.logger = logger
        
        # State
        self.firmware1_path = ""
        self.firmware2_path = ""
        self.output_path = ""
        self.porting_thread = None
        
        self.setup_ui()
        self.setup_connections()
        self.load_stylesheet()
        
        # Connect logger
        self.logger.log_updated.connect(self.log_widget.add_log)
        self.logger.progress_updated.connect(self.progress_widget.update_progress)
    
    def setup_ui(self):
        """Set up the main UI."""
        self.setWindowTitle(APP_TITLE)
        self.setMinimumSize(1200, 800)
        
        # Apply window geometry from config
        geom = self.config.ui.window_geometry
        self.setGeometry(geom.x, geom.y, geom.width, geom.height)
        
        # Create central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Main layout
        main_layout = QHBoxLayout(central_widget)
        
        # Create splitter for resizable panels
        splitter = QSplitter(Qt.Orientation.Horizontal)
        main_layout.addWidget(splitter)
        
        # Left panel - Firmware inputs
        left_panel = self.create_input_panel()
        splitter.addWidget(left_panel)
        
        # Center panel - Main workflow
        center_panel = self.create_workflow_panel()
        splitter.addWidget(center_panel)
        
        # Right panel - Logs and progress
        right_panel = self.create_info_panel()
        splitter.addWidget(right_panel)
        
        # Set splitter sizes
        splitter.setSizes(self.config.ui.splitter_sizes)
        
        # Create menu bar
        self.create_menu_bar()
        
        # Create tool bar
        self.create_tool_bar()
        
        # Create status bar
        self.create_status_bar()
    
    def create_input_panel(self) -> QWidget:
        """Create firmware input panel."""
        panel = QWidget()
        layout = QVBoxLayout(panel)
        
        # Panel title
        title = QLabel("📱 Firmware Inputs")
        title.setStyleSheet("font-size: 16pt; font-weight: bold; padding: 8px;")
        layout.addWidget(title)
        
        # Firmware 1 input
        self.firmware1_widget = FirmwareInputWidget("Source Firmware")
        layout.addWidget(self.firmware1_widget)
        
        # Firmware 2 input
        self.firmware2_widget = FirmwareInputWidget("Target Firmware")
        layout.addWidget(self.firmware2_widget)
        
        # Device selection
        device_group = QGroupBox("Target Device")
        device_layout = QVBoxLayout(device_group)
        
        self.device_combo = QComboBox()
        self.device_combo.addItems([
            "Pixel 7 Pro (cheetah)",
            "Pixel 7 (panther)", 
            "Pixel 6 Pro (raven)",
            "Pixel 6 (oriole)",
            "Pixel 6a (bluejay)"
        ])
        device_layout.addWidget(self.device_combo)
        
        layout.addWidget(device_group)
        
        # Porting preset
        preset_group = QGroupBox("Porting Preset")
        preset_layout = QVBoxLayout(preset_group)
        
        self.preset_combo = QComboBox()
        self.preset_combo.addItems([
            "Basic Port",
            "Advanced Port",
            "Custom ROM"
        ])
        preset_layout.addWidget(self.preset_combo)
        
        layout.addWidget(preset_group)
        
        layout.addStretch()
        return panel
    
    def create_workflow_panel(self) -> QWidget:
        """Create main workflow panel."""
        panel = QWidget()
        layout = QVBoxLayout(panel)
        
        # Panel title
        title = QLabel("🔧 Porting Workflow")
        title.setStyleSheet("font-size: 16pt; font-weight: bold; padding: 8px;")
        layout.addWidget(title)
        
        # Tab widget for different stages
        self.tab_widget = QTabWidget()
        
        # Configuration tab
        config_tab = self.create_config_tab()
        self.tab_widget.addTab(config_tab, "⚙️ Configuration")
        
        # Processing tab
        process_tab = self.create_process_tab()
        self.tab_widget.addTab(process_tab, "🔄 Processing")
        
        # Output tab
        output_tab = self.create_output_tab()
        self.tab_widget.addTab(output_tab, "📦 Output")
        
        layout.addWidget(self.tab_widget)
        
        # Control buttons
        button_layout = QHBoxLayout()
        
        self.start_btn = QPushButton("🚀 Start Porting")
        self.start_btn.setProperty("class", "primary")
        self.start_btn.clicked.connect(self.start_porting)
        button_layout.addWidget(self.start_btn)
        
        self.pause_btn = QPushButton("⏸️ Pause")
        self.pause_btn.setEnabled(False)
        button_layout.addWidget(self.pause_btn)
        
        self.stop_btn = QPushButton("⏹️ Stop")
        self.stop_btn.setProperty("class", "danger")
        self.stop_btn.setEnabled(False)
        button_layout.addWidget(self.stop_btn)
        
        layout.addLayout(button_layout)
        
        return panel
    
    def create_config_tab(self) -> QWidget:
        """Create configuration tab."""
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        # Porting options
        options_group = QGroupBox("Porting Options")
        options_layout = QGridLayout(options_group)
        
        self.merge_system_cb = QCheckBox("Merge System Partition")
        self.merge_system_cb.setChecked(True)
        options_layout.addWidget(self.merge_system_cb, 0, 0)
        
        self.merge_vendor_cb = QCheckBox("Merge Vendor Partition")
        self.merge_vendor_cb.setChecked(True)
        options_layout.addWidget(self.merge_vendor_cb, 0, 1)
        
        self.update_props_cb = QCheckBox("Update Build Properties")
        self.update_props_cb.setChecked(True)
        options_layout.addWidget(self.update_props_cb, 1, 0)
        
        self.patch_sepolicy_cb = QCheckBox("Patch SEPolicy")
        self.patch_sepolicy_cb.setChecked(False)
        options_layout.addWidget(self.patch_sepolicy_cb, 1, 1)
        
        layout.addWidget(options_group)
        
        # Advanced options
        advanced_group = QGroupBox("Advanced Options")
        advanced_layout = QGridLayout(advanced_group)
        
        self.optimize_images_cb = QCheckBox("Optimize Images")
        advanced_layout.addWidget(self.optimize_images_cb, 0, 0)
        
        self.remove_bloat_cb = QCheckBox("Remove Bloatware")
        advanced_layout.addWidget(self.remove_bloat_cb, 0, 1)
        
        self.add_root_cb = QCheckBox("Add Root Support")
        advanced_layout.addWidget(self.add_root_cb, 1, 0)
        
        self.sign_output_cb = QCheckBox("Sign Output")
        self.sign_output_cb.setChecked(True)
        advanced_layout.addWidget(self.sign_output_cb, 1, 1)
        
        layout.addWidget(advanced_group)
        
        layout.addStretch()
        return tab
    
    def create_process_tab(self) -> QWidget:
        """Create processing tab."""
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        # Progress widget
        self.progress_widget = ProgressWidget()
        layout.addWidget(self.progress_widget)
        
        # Process steps
        steps_group = QGroupBox("Processing Steps")
        steps_layout = QVBoxLayout(steps_group)
        
        self.steps_tree = QTreeWidget()
        self.steps_tree.setHeaderLabels(["Step", "Status", "Duration"])
        
        # Add sample steps
        steps = [
            "Extract Source Firmware",
            "Extract Target Firmware", 
            "Analyze Partitions",
            "Merge System Components",
            "Merge Vendor Components",
            "Update Build Properties",
            "Apply Custom Modifications",
            "Repackage ROM",
            "Sign Output",
            "Generate Checksums"
        ]
        
        for step in steps:
            item = QTreeWidgetItem([step, "Pending", ""])
            self.steps_tree.addTopLevelItem(item)
        
        steps_layout.addWidget(self.steps_tree)
        layout.addWidget(steps_group)
        
        return tab
    
    def create_output_tab(self) -> QWidget:
        """Create output tab."""
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        # Output path
        path_group = QGroupBox("Output Configuration")
        path_layout = QHBoxLayout(path_group)
        
        self.output_path_edit = QLineEdit()
        self.output_path_edit.setText(self.config.firmware.output_path)
        path_layout.addWidget(self.output_path_edit)
        
        browse_output_btn = QPushButton("Browse")
        browse_output_btn.clicked.connect(self.browse_output_path)
        path_layout.addWidget(browse_output_btn)
        
        layout.addWidget(path_group)
        
        # Output files
        files_group = QGroupBox("Generated Files")
        files_layout = QVBoxLayout(files_group)
        
        self.output_files_list = QListWidget()
        files_layout.addWidget(self.output_files_list)
        
        layout.addWidget(files_group)
        
        # Actions
        actions_layout = QHBoxLayout()
        
        self.open_output_btn = QPushButton("📂 Open Output Folder")
        self.open_output_btn.clicked.connect(self.open_output_folder)
        actions_layout.addWidget(self.open_output_btn)
        
        self.flash_btn = QPushButton("📱 Flash to Device")
        self.flash_btn.setProperty("class", "success")
        actions_layout.addWidget(self.flash_btn)
        
        layout.addLayout(actions_layout)
        
        return tab
    
    def create_info_panel(self) -> QWidget:
        """Create information panel."""
        panel = QWidget()
        layout = QVBoxLayout(panel)
        
        # Panel title
        title = QLabel("📊 Information")
        title.setStyleSheet("font-size: 16pt; font-weight: bold; padding: 8px;")
        layout.addWidget(title)
        
        # Log widget
        log_group = QGroupBox("Activity Log")
        log_layout = QVBoxLayout(log_group)
        
        self.log_widget = LogWidget()
        log_layout.addWidget(self.log_widget)
        
        layout.addWidget(log_group)
        
        return panel
    
    def create_menu_bar(self):
        """Create menu bar."""
        menubar = self.menuBar()
        
        # File menu
        file_menu = menubar.addMenu("File")
        
        new_action = QAction("New Project", self)
        file_menu.addAction(new_action)
        
        open_action = QAction("Open Project", self)
        file_menu.addAction(open_action)
        
        save_action = QAction("Save Project", self)
        file_menu.addAction(save_action)
        
        file_menu.addSeparator()
        
        exit_action = QAction("Exit", self)
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        # Tools menu
        tools_menu = menubar.addMenu("Tools")
        
        settings_action = QAction("Settings", self)
        tools_menu.addAction(settings_action)
        
        # Help menu
        help_menu = menubar.addMenu("Help")
        
        about_action = QAction("About", self)
        about_action.triggered.connect(self.show_about)
        help_menu.addAction(about_action)
    
    def create_tool_bar(self):
        """Create tool bar."""
        toolbar = self.addToolBar("Main")
        toolbar.setToolButtonStyle(Qt.ToolButtonStyle.ToolButtonTextUnderIcon)
        
        # Add actions
        new_action = QAction("New", self)
        toolbar.addAction(new_action)
        
        open_action = QAction("Open", self)
        toolbar.addAction(open_action)
        
        save_action = QAction("Save", self)
        toolbar.addAction(save_action)
        
        toolbar.addSeparator()
        
        start_action = QAction("Start", self)
        toolbar.addAction(start_action)
    
    def create_status_bar(self):
        """Create status bar."""
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        
        self.status_bar.showMessage("Ready")
    
    def setup_connections(self):
        """Set up signal connections."""
        self.firmware1_widget.firmware_selected.connect(self.on_firmware1_selected)
        self.firmware2_widget.firmware_selected.connect(self.on_firmware2_selected)
    
    def load_stylesheet(self):
        """Load and apply stylesheet."""
        style_file = Path(__file__).parent / "styles" / "dark_theme.qss"
        if style_file.exists():
            with open(style_file, 'r', encoding='utf-8') as f:
                self.setStyleSheet(f.read())
    
    def on_firmware1_selected(self, path: str, firmware_type: str):
        """Handle firmware 1 selection."""
        self.firmware1_path = path
        self.logger.info(f"Source firmware selected: {Path(path).name}")
        self.check_ready_state()
    
    def on_firmware2_selected(self, path: str, firmware_type: str):
        """Handle firmware 2 selection."""
        self.firmware2_path = path
        self.logger.info(f"Target firmware selected: {Path(path).name}")
        self.check_ready_state()
    
    def check_ready_state(self):
        """Check if ready to start porting."""
        ready = bool(self.firmware1_path and self.firmware2_path)
        self.start_btn.setEnabled(ready)
        
        if ready:
            self.status_bar.showMessage("Ready to start porting")
        else:
            self.status_bar.showMessage("Select both firmware files to continue")
    
    def browse_output_path(self):
        """Browse for output path."""
        path = QFileDialog.getExistingDirectory(self, "Select Output Directory")
        if path:
            self.output_path_edit.setText(path)
            self.output_path = path
    
    def open_output_folder(self):
        """Open output folder in file manager."""
        if self.output_path and Path(self.output_path).exists():
            import platform
            system = platform.system()
            
            try:
                if system == "Windows":
                    os.startfile(self.output_path)
                elif system == "Darwin":  # macOS
                    os.system(f'open "{self.output_path}"')
                else:  # Linux and others
                    os.system(f'xdg-open "{self.output_path}"')
            except Exception as e:
                self.logger.error(f"Failed to open output folder: {e}")
                QMessageBox.warning(
                    self, 
                    "Error", 
                    f"Could not open output folder:\n{self.output_path}\n\nError: {e}"
                )
    
    def start_porting(self):
        """Start the porting process."""
        if not self.firmware1_path:
            QMessageBox.warning(self, "Error", "Please select source firmware first")
            return
        
        if not self.output_path:
            QMessageBox.warning(self, "Error", "Please select output directory first")
            return
        
        # Get target device from combo box
        device_text = self.device_combo.currentText()
        target_device = device_text.split('(')[1].split(')')[0]  # Extract codename
        
        self.logger.info("Starting firmware porting process...")
        self.start_btn.setEnabled(False)
        self.pause_btn.setEnabled(True)
        self.stop_btn.setEnabled(True)
        
        # Switch to processing tab
        self.tab_widget.setCurrentIndex(1)
        
        # Create and start porting thread
        self.porting_thread = PortingThread(
            self.firmware1_path,
            self.firmware2_path if self.firmware2_path else None,
            target_device,
            self.output_path,
            self.logger
        )
        
        # Connect thread signals
        self.porting_thread.progress_updated.connect(self.on_progress_updated)
        self.porting_thread.porting_finished.connect(self.on_porting_finished)
        
        # Start the thread
        self.porting_thread.start()
        self.logger.info("Porting process started successfully")
    
    def on_progress_updated(self, message: str, percentage: int):
        """Handle progress updates from porting thread."""
        self.progress_widget.update_progress(percentage, message)
        self.logger.info(f"Progress: {percentage}% - {message}")
    
    def on_porting_finished(self, result):
        """Handle porting completion."""
        # Re-enable buttons
        self.start_btn.setEnabled(True)
        self.pause_btn.setEnabled(False)
        self.stop_btn.setEnabled(False)
        
        if result.success:
            self.logger.info(f"Porting completed successfully in {result.processing_time:.1f}s")
            self.progress_widget.update_progress(100, "Porting completed successfully!")
            
            # Show success message
            msg = QMessageBox(self)
            msg.setIcon(QMessageBox.Icon.Information)
            msg.setWindowTitle("Porting Complete")
            msg.setText("Firmware porting completed successfully!")
            msg.setDetailedText(f"""
Output directory: {result.output_path}
Processing time: {result.processing_time:.1f} seconds
Ported images: {', '.join(result.ported_images.keys())}

Warnings: {len(result.warnings)}
""")
            msg.exec()
            
        else:
            self.logger.error(f"Porting failed with {len(result.errors)} errors")
            self.progress_widget.update_progress(0, "Porting failed")
            
            # Show error message
            msg = QMessageBox(self)
            msg.setIcon(QMessageBox.Icon.Critical)
            msg.setWindowTitle("Porting Failed")
            msg.setText("Firmware porting failed!")
            msg.setDetailedText(f"""
Errors:
{chr(10).join(result.errors)}

Warnings:
{chr(10).join(result.warnings)}
""")
            msg.exec()
        
        # Clean up thread
        self.porting_thread = None
    
    def show_about(self):
        """Show about dialog."""
        QMessageBox.about(
            self,
            "About MaxRegner Kitchen",
            f"""
            <h2>{APP_TITLE}</h2>
            <p>Version: {get_version()}</p>
            <p>Ultra-modern Android kitchen tool for Pixel firmware porting</p>
            <p>© 2023 MaxRegner Development Team</p>
            """
        )
    
    def closeEvent(self, event):
        """Handle window close event."""
        # Save window geometry
        geom = self.geometry()
        self.config.ui.window_geometry.x = geom.x()
        self.config.ui.window_geometry.y = geom.y()
        self.config.ui.window_geometry.width = geom.width()
        self.config.ui.window_geometry.height = geom.height()
        
        self.config.save()
        event.accept()
