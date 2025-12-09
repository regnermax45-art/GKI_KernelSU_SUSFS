# Motorola OTA Checker

A Python script that automatically pulls device information from a connected Motorola device using ADB and checks for available OTA updates using the official Motorola CDS (Content Delivery Service).

## Features

- 🔍 Automatically detects connected Motorola devices via ADB
- 📱 Pulls all required device properties (serial, IMEI, build info, etc.)
- 🌐 Queries Motorola's official CDS API for OTA updates
- 📥 Downloads OTA files directly if updates are available
- 🎯 Supports prerelease and official OTA updates
- 🚀 **Force Android 15 downloads** with advanced detection methods
- 🎛️ Interactive mode for version selection
- 🔧 Command-line options for automation

## Prerequisites

1. **ADB (Android Debug Bridge)** installed and in your PATH
2. **Python 3.6+** with pip
3. **USB Debugging** enabled on your Motorola device
4. Device connected and authorized for ADB access

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure ADB is working:
```bash
adb devices
```

## Usage

1. Connect your Motorola device via USB
2. Enable USB debugging in Developer Options
3. Authorize the ADB connection on your device
4. Run the script:

### Basic Usage
```bash
python3 motorola_ota_checker.py
```

### Force Android 15 Download
```bash
python3 motorola_ota_checker.py --force-android 15
```

### Force Other Android Versions
```bash
python3 motorola_ota_checker.py --force-android 14
python3 motorola_ota_checker.py --force-android 13
```

### Interactive Mode
```bash
python3 motorola_ota_checker.py --interactive
```

### Command Line Options
- `--force-android VERSION` - Force check for specific Android version (10, 11, 12, 13, 14, 15)
- `--interactive` - Interactive mode to select Android version
- `--help` - Show help message with all options

## What the script does

1. **Device Detection**: Checks if ADB is available and a device is connected
2. **Information Gathering**: Pulls the following device properties:
   - `ro.serialno` - Device serial number
   - `ro.mot.build.guid` - Motorola build GUID (required for API)
   - `ro.product.manufacturer` - Device manufacturer
   - `ro.product.brand` - Device brand
   - `ro.product.model` - Device model
   - `ro.product.name` - Product name
   - `ro.product.device` - Device codename
   - `ro.hardware` - Hardware platform
   - `ro.build.version.release` - Android version
   - `ro.build.id` - Build ID
   - `persist.radio.imei` - Device IMEI
   - `persist.radio.meid` - Device MEID

3. **OTA Check**: Sends a POST request to Motorola's CDS API with device information
4. **Update Processing**: If updates are found, displays information and offers to download
5. **Download**: Optionally downloads the OTA ZIP file with progress indication

## API Endpoint

The script uses Motorola's official CDS endpoint:
```
https://moto-cds.appspot.com/cds/upgrade/1/check/ctx/ota/key/{BUILD_GUID}
```

## Android 15 Force Download Feature

The script includes advanced logic to force Android 15 downloads even when they're not normally available:

### How it works:
1. **Standard Request**: First tries normal API call with Android 15 as target version
2. **Alternative Build Patterns**: If no updates found, tries different build ID patterns:
   - `VanillaIceCream` (Android 15 codename)
   - `API35` (Android 15 API level)
   - `35` (API level number)
   - `15.0.0` (Version format)
3. **Alternative Endpoints**: Tries different API endpoints:
   - Version 2 API (`/cds/upgrade/2/check/...`)
   - Prerelease endpoint (`/cds/upgrade/1/check/ctx/prerelease/...`)
   - Beta endpoint (`/cds/upgrade/1/check/ctx/beta/...`)
4. **Enhanced Payloads**: Adds special flags like `forceAndroid15: true` and `prerelease: true`

### Usage:
```bash
# Force Android 15 download
python3 motorola_ota_checker.py --force-android 15

# Interactive mode (includes Android 15 option)
python3 motorola_ota_checker.py --interactive
```

This feature significantly increases the chances of finding Android 15 updates that might not be available through standard channels.

## Sample Output

### Normal Usage
```
🚀 Motorola OTA Checker
==============================
📱 Collecting device information...
  serial: ZY1234567890
  build_guid: ABCD1234-5678-90EF-GHIJ-KLMNOPQRSTUV
  manufacturer: motorola
  brand: motorola
  model: moto g(7) power
  product: ocean
  device: ocean
  hardware: qcom
  os_version: 10
  build_id: QPOS30.52-29-5

🔍 Checking for OTA updates...
📡 Sending request to: https://moto-cds.appspot.com/cds/upgrade/1/check/ctx/ota/key/ABCD1234-5678-90EF-GHIJ-KLMNOPQRSTUV
📊 Response status: 200

📋 OTA Check Results:
==================================================
🎉 Update Available!
📦 Version: QPOS30.52-29-8
📅 Release Date: 2023-12-15
📏 Size: 1234567890 bytes
🔗 Download URL: https://example.com/ota.zip

❓ Download OTA to motorola_ota_QPOS30.52-29-8.zip? (y/N): y
📥 Downloading OTA: motorola_ota_QPOS30.52-29-8.zip
📊 Progress: 100.0%
✅ Download completed: motorola_ota_QPOS30.52-29-8.zip
```

### Force Android 15 Usage
```
🚀 Motorola OTA Checker
🎯 Targeting Android 15
==============================
📱 Collecting device information...
  serial: ZY1234567890
  build_guid: ABCD1234-5678-90EF-GHIJ-KLMNOPQRSTUV
  manufacturer: motorola
  brand: motorola
  model: moto g(7) power
  product: ocean
  device: ocean
  hardware: qcom
  os_version: 10
  build_id: QPOS30.52-29-5

📊 Version Info:
  Current Android: 10
  Target Android: 15

🔧 Forcing Android version: 15 (requested: 15)

🔍 Checking for OTA updates...
📡 Sending request to: https://moto-cds.appspot.com/cds/upgrade/1/check/ctx/ota/key/ABCD1234-5678-90EF-GHIJ-KLMNOPQRSTUV
🎯 Requesting updates for Android 15
📊 Response status: 200
🔄 No Android 15 updates found with standard request, trying alternative methods...
🔍 Trying alternative Android 15 detection strategies...
  🧪 Trying with build pattern: VanillaIceCream
  ✅ Found Android 15 update with pattern: VanillaIceCream

📋 OTA Check Results:
==================================================
🎉 Update Available!
📦 Version: Android15.QPOS30.52-29-15
📅 Release Date: 2024-12-01
📏 Size: 2345678901 bytes
🔗 Download URL: https://example.com/android15_ota.zip

❓ Download OTA to motorola_ota_Android15.QPOS30.52-29-15.zip? (y/N): y
📥 Downloading OTA: motorola_ota_Android15.QPOS30.52-29-15.zip
📊 Progress: 100.0%
✅ Download completed: motorola_ota_Android15.QPOS30.52-29-15.zip
```

## Troubleshooting

### ADB Issues
- Ensure ADB is installed: `adb version`
- Check device connection: `adb devices`
- Enable USB debugging in Developer Options
- Try different USB cables/ports
- Revoke and re-authorize ADB debugging

### Device Not Recognized
- This script is designed for Motorola devices
- Ensure `ro.mot.build.guid` property exists on your device
- Some custom ROMs may not have Motorola-specific properties

### Network Issues
- Check internet connection
- Some corporate firewalls may block the CDS endpoint
- Try using a VPN if the service is geo-restricted

## Security Notes

- The script only reads device information, it doesn't modify anything
- All API calls use official Motorola endpoints
- Device identifiers (IMEI, serial) are only sent to Motorola's servers
- Downloaded OTA files should be verified before flashing

## Disclaimer

This tool is for educational and research purposes. Always backup your device before applying any OTA updates. The authors are not responsible for any damage to your device.
