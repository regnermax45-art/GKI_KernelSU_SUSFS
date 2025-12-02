# 🚀 MaxRegner Android Kitchen Tool

**Ultra-Modern GUI-Based Android Firmware Porting Suite for Pixel Devices**

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://python.org)
[![PyQt6](https://img.shields.io/badge/PyQt6-6.6%2B-green.svg)](https://www.riverbankcomputing.com/software/pyqt/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey.svg)](https://github.com/regnermax45-art/maxregner-kitchen)

## ✨ Features

### 🎨 Ultra-Modern Interface
- **Dark Theme**: Sleek, professional dark interface with smooth animations
- **Drag & Drop**: Intuitive firmware file handling with visual feedback
- **Real-time Progress**: Advanced progress tracking with ETA estimation
- **Responsive Design**: Adaptive layout that works on different screen sizes

### 📱 Pixel Firmware Support
- **Multiple Formats**: Factory images, OTA packages, payload.bin files
- **Device Profiles**: Pre-configured profiles for Pixel 6, 7, and newer devices
- **Compatibility Check**: Automatic validation of firmware compatibility
- **Smart Detection**: Auto-detection of firmware types and device variants

### 🔧 Advanced Porting Engine
- **Intelligent Merging**: Smart partition merging with conflict resolution
- **Custom Modifications**: Extensible modification system
- **Build Property Updates**: Automatic build.prop adaptation
- **SEPolicy Patching**: Advanced security policy handling

### 🛡️ Security & Signing
- **AVB Support**: Android Verified Boot handling
- **Custom Keys**: Support for custom signing keys
- **Integrity Verification**: Checksum validation and verification
- **Secure Processing**: Safe handling of sensitive firmware data

### 📊 Comprehensive Logging
- **Multi-level Logging**: Debug, Info, Warning, Error levels
- **Real-time Updates**: Live log streaming to GUI
- **File Logging**: Persistent log files with rotation
- **Progress Tracking**: Detailed operation progress with statistics

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- 5GB+ free disk space
- Administrative privileges (for some operations)

### Installation

#### From Source (Recommended)
```bash
# Clone the repository
git clone https://github.com/regnermax45-art/GKI_KernelSU_SUSFS.git
cd GKI_KernelSU_SUSFS

# Install dependencies
pip install -r requirements.txt

# Run the application
python -m maxregner_kitchen.main
```

### First Run
1. **Launch the application**
2. **Select source firmware** (drag & drop or browse)
3. **Select target firmware** (drag & drop or browse)
4. **Choose target device** from the dropdown
5. **Configure porting options** in the Configuration tab
6. **Click "🚀 Start Porting"** to begin

## 📖 Usage Guide

### Basic Workflow
1. **Firmware Input**: Load two Pixel firmware files
2. **Device Selection**: Choose target device profile
3. **Configuration**: Set porting options and preferences
4. **Processing**: Monitor real-time progress and logs
5. **Output**: Access generated files and flash to device

### Supported Operations
- ✅ **System Partition Merging**
- ✅ **Vendor Partition Merging**
- ✅ **Build Properties Update**
- ✅ **SEPolicy Patching**
- ✅ **Image Optimization**
- ✅ **Bloatware Removal**
- ✅ **Root Support Integration**
- ✅ **Custom ROM Generation**

## 🛠️ Configuration

### Device Profiles
The tool includes pre-configured profiles for:
- Pixel 7 Pro (cheetah)
- Pixel 7 (panther)
- Pixel 6 Pro (raven)
- Pixel 6 (oriole)
- Pixel 6a (bluejay)

### Porting Presets
- **Basic Port**: Simple firmware merging
- **Advanced Port**: Full feature porting with optimizations
- **Custom ROM**: Complete ROM customization with MaxRegner features

## 🔧 Development

### Project Structure
```
maxregner_kitchen/
├── gui/                 # PyQt6 GUI components
│   ├── main_window.py   # Main application window
│   ├── widgets/         # Custom widgets
│   └── styles/          # CSS stylesheets
├── firmware/            # Firmware handling
├── porting/             # Porting algorithms
├── packaging/           # ROM packaging
├── tools/               # External tool integration
├── config/              # Configuration management
└── utils/               # Utilities and helpers
```

## 📋 Requirements

### System Requirements
- **OS**: Windows 10+, Linux (Ubuntu 20.04+), macOS 10.15+
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 5GB free space for temporary files
- **Python**: 3.8 or higher

### Dependencies
- PyQt6 6.6+ (GUI framework)
- psutil (System monitoring)
- cryptography (Security operations)
- protobuf (Android format support)
- lz4, zstandard (Compression)
- Pillow (Image processing)

## 🐛 Troubleshooting

### Debug Mode
```bash
python -m maxregner_kitchen.main --debug
```

### Log Files
Logs are stored in:
- **Windows**: `%APPDATA%/MaxRegner/logs/`
- **Linux**: `~/.config/MaxRegner/logs/`
- **macOS**: `~/Library/Application Support/MaxRegner/logs/`

## 📄 License

This project is licensed under the MIT License.

## 🤝 Acknowledgments

- **Android Open Source Project** for the foundation
- **Google** for Pixel device specifications
- **PyQt Team** for the excellent GUI framework
- **Community Contributors** for testing and feedback

---

**⚠️ Disclaimer**: This tool is for educational and development purposes. Always backup your device before flashing custom firmware. The developers are not responsible for any damage to your device.

**🔒 Security Notice**: This tool handles sensitive firmware data. Always verify the integrity of firmware files and use trusted sources.
