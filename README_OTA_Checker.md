# Motorola OTA Checker

A Python script that automatically pulls device information from a connected Motorola device using ADB and checks for available OTA updates using the official Motorola CDS (Content Delivery Service).

## Features

- 🔍 Automatically detects connected Motorola devices via ADB
- 📱 Pulls all required device properties (serial, IMEI, build info, etc.)
- 🌐 Queries Motorola's official CDS API for OTA updates
- 📥 Downloads OTA files directly if updates are available
- 🎯 Supports prerelease and official OTA updates

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

```bash
python3 motorola_ota_checker.py
```

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

## Sample Output

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

