#!/bin/bash

echo "🚀 Installing Galaxy Z Flip 5 Firmware Tools"
echo "============================================="

# Update system packages
echo "📦 Updating system packages..."
sudo apt update

# Install required dependencies
echo "🔧 Installing dependencies..."
sudo apt install -y python3 python3-pip git curl wget unzip

# Install Python packages
echo "🐍 Installing Python packages..."
pip3 install --upgrade pip
pip3 install requests setuptools httpx asyncio pathlib argparse

# Install additional tools
echo "🛠️  Installing additional tools..."

# Install Heimdall (alternative to Odin for Linux)
echo "📱 Installing Heimdall (Samsung flashing tool)..."
sudo apt install -y heimdall-flash heimdall-flash-frontend

# Install ADB and Fastboot
echo "🔌 Installing ADB and Fastboot..."
sudo apt install -y android-tools-adb android-tools-fastboot

# Create firmware directory
echo "📁 Creating firmware directory..."
mkdir -p ./firmware
mkdir -p ./tools

# Download additional tools
echo "🌐 Downloading additional tools..."

# Download latest Odin (if available)
echo "📥 Note: For Odin, please download manually from Samsung or XDA"

# Make scripts executable
chmod +x simple_flip5_tool.py
chmod +x galaxy_flip5_firmware_tool.py
chmod +x install_tools.sh

echo ""
echo "✅ Installation completed!"
echo ""
echo "📋 Available tools:"
echo "   • Simple Galaxy Z Flip 5 Tool (simple_flip5_tool.py) - ⭐ RECOMMENDED"
echo "   • Advanced Firmware Tool (galaxy_flip5_firmware_tool.py)"
echo "   • SamFetch (SamFetch/)"
echo "   • SamFirm Reborn (SamFirm_Reborn/)"
echo "   • Heimdall (heimdall-flash)"
echo "   • ADB/Fastboot (adb, fastboot)"
echo ""
echo "🎯 Quick start with Simple Tool:"
echo "   1. OneUI info: python3 simple_flip5_tool.py --oneui-info"
echo "   2. List models: python3 simple_flip5_tool.py --list-models"
echo "   3. List regions: python3 simple_flip5_tool.py --list-regions"
echo "   4. Check firmware: python3 simple_flip5_tool.py -m SM-F731B -r BTU"
echo "   5. Device info: python3 simple_flip5_tool.py --device-info"
echo "   6. Flash guide: python3 simple_flip5_tool.py --flash-guide"
echo ""
echo "⚠️  Important notes:"
echo "   • OneUI 9 doesn't exist yet - OneUI 8 is the latest"
echo "   • You may need a valid IMEI for firmware downloads"
echo "   • Always backup your device before flashing firmware"
echo "   • Flashing firmware voids warranty and can brick your device"
echo ""
