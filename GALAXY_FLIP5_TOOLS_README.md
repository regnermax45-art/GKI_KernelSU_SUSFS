# Galaxy Z Flip 5 Firmware Tools 📱

A comprehensive toolkit for downloading and managing Samsung Galaxy Z Flip 5 firmware.

## ⚠️ Important Notice About OneUI 9

**OneUI 9 does not exist yet!** Samsung is currently rolling out:
- **OneUI 8** (based on Android 16) - Currently available
- **OneUI 8.5** - Beta for Galaxy S25 series

The Galaxy Z Flip 5 is eligible for OneUI 8, which is the latest available version.

## 🛠️ Tools Included

### 1. Galaxy Z Flip 5 Firmware Tool (`galaxy_flip5_firmware_tool.py`)
Custom Python script for downloading Galaxy Z Flip 5 firmware directly from Samsung servers.

**Features:**
- ✅ Direct download from Samsung servers
- ✅ Support for all Galaxy Z Flip 5 variants
- ✅ Automatic decryption
- ✅ Progress tracking
- ✅ Multiple region support

### 2. SamFetch
Web API for downloading Samsung firmware without restrictions.

### 3. SamFirm Reborn
Windows GUI application for Samsung firmware management.

### 4. Additional Tools
- **Heimdall**: Open-source alternative to Odin for Linux
- **ADB/Fastboot**: Android debugging tools

## 🚀 Quick Installation

```bash
# Run the installation script
./install_tools.sh
```

Or install manually:
```bash
# Install dependencies
sudo apt update
sudo apt install -y python3 python3-pip git curl wget unzip heimdall-flash android-tools-adb

# Install Python packages
pip3 install httpx asyncio pathlib argparse

# Clone repositories (already done in this workspace)
# git clone https://github.com/ivanmeler/SamFirm_Reborn.git
# git clone https://github.com/ysfchn/SamFetch.git
```

## 📱 Supported Galaxy Z Flip 5 Models

| Model | Description |
|-------|-------------|
| SM-F731B | Galaxy Z Flip5 5G (Global) |
| SM-F731U | Galaxy Z Flip5 5G (US Unlocked) |
| SM-F731U1 | Galaxy Z Flip5 5G (US) |
| SM-F731W | Galaxy Z Flip5 5G (Canada) |
| SM-F7310 | Galaxy Z Flip5 5G (China) |
| SM-F731N | Galaxy Z Flip5 5G (Korea) |

## 🌍 Supported Regions

| Code | Region |
|------|--------|
| XAA | USA (Unlocked) |
| ATT | USA (AT&T) |
| TMB | USA (T-Mobile) |
| VZW | USA (Verizon) |
| BTU | United Kingdom |
| DBT | Germany |
| XEF | France |
| CHR | Canada |
| TGY | Hong Kong |
| CHC | China |
| KOO | Korea |

## 🎯 Usage Examples

### Check Available Firmware
```bash
# List supported models
python3 galaxy_flip5_firmware_tool.py --list-models

# List supported regions
python3 galaxy_flip5_firmware_tool.py --list-regions

# Check latest firmware for UK model
python3 galaxy_flip5_firmware_tool.py -m SM-F731B -r BTU -c
```

### Download Firmware
```bash
# Download latest firmware for UK model
python3 galaxy_flip5_firmware_tool.py -m SM-F731B -r BTU

# Download with custom output directory
python3 galaxy_flip5_firmware_tool.py -m SM-F731B -r BTU -o ./my_firmware

# Download with specific IMEI (recommended)
python3 galaxy_flip5_firmware_tool.py -m SM-F731B -r BTU -i YOUR_IMEI_HERE
```

### Using SamFetch Web API
```bash
# Start SamFetch server
cd SamFetch
sanic main.app

# Check firmware via API
curl http://localhost:8000/firmware/BTU/SM-F731B/latest

# Download firmware via API
curl http://localhost:8000/firmware/BTU/SM-F731B/latest/download -O
```

## 🔧 Flashing Tools

### Heimdall (Linux/macOS)
```bash
# Flash firmware using Heimdall
heimdall flash --BOOTLOADER BL_*.tar.md5 --AP AP_*.tar.md5 --CP CP_*.tar.md5 --CSC CSC_*.tar.md5
```

### Odin (Windows)
1. Download Odin from Samsung or XDA
2. Put device in Download Mode (Volume Down + Power + USB)
3. Load firmware files in Odin
4. Click Start

### ADB/Fastboot
```bash
# Check device connection
adb devices

# Reboot to download mode
adb reboot download

# Flash via fastboot (if supported)
fastboot flash system system.img
```

## ⚠️ Important Safety Information

### Before You Start
1. **Backup your device** completely
2. **Check your exact model** (Settings → About phone)
3. **Verify region code** for your device
4. **Ensure battery is >50%** charged
5. **Use original USB cable**

### Risks
- ⚠️ **Flashing firmware voids warranty**
- ⚠️ **Incorrect firmware can brick your device**
- ⚠️ **Always use firmware for your exact model and region**
- ⚠️ **Never interrupt the flashing process**

### Recovery Options
If something goes wrong:
1. Try entering Download Mode again
2. Flash stock firmware for your region
3. Use Samsung Smart Switch for recovery
4. Contact Samsung support (warranty may be void)

## 🔍 Finding Your Device Information

### Model Number
- Settings → About phone → Model number
- Or check under battery (if removable)
- Or use: `adb shell getprop ro.product.model`

### Region Code (CSC)
- Settings → About phone → Software information → Service provider SW ver.
- Or use: `adb shell getprop ro.csc.sales_code`

### IMEI
- Settings → About phone → Status → IMEI
- Or dial: `*#06#`
- Or use: `adb shell service call iphonesubinfo 1`

## 📚 Additional Resources

### Official Sources
- [Samsung Smart Switch](https://www.samsung.com/us/support/owners/app/smart-switch)
- [Samsung Members App](https://www.samsung.com/us/support/owners/app/samsung-members)
- [Samsung Firmware Updates](https://www.samsung.com/us/support/owners/product-support)

### Community Resources
- [SamMobile](https://www.sammobile.com/samsung/galaxy-z-flip-5/firmware/)
- [XDA Developers](https://xdaforums.com/c/samsung-galaxy-z-flip5.12757/)
- [r/GalaxyFold](https://www.reddit.com/r/GalaxyFold/)

### Firmware Databases
- [SamFw.com](https://samfw.com/firmware/SM-F731B)
- [SamMobile Firmware](https://www.sammobile.com/samsung/galaxy-z-flip-5/firmware/)
- [Updato.com](https://updato.com/samsung/galaxy-z-flip-5)

## 🆘 Troubleshooting

### Common Issues

**"No firmware found"**
- Check model number is correct
- Verify region code
- Try different region if device is unlocked

**"Download failed"**
- Check internet connection
- Try different server/mirror
- Verify IMEI if required

**"Device not recognized"**
- Install Samsung USB drivers
- Try different USB port/cable
- Enable USB debugging

**"Firmware mismatch"**
- Ensure exact model match
- Check region compatibility
- Verify bootloader version

### Getting Help
1. Check device model and region carefully
2. Search XDA forums for your specific model
3. Ask in Samsung community forums
4. Contact Samsung support (if under warranty)

## 📄 License

This toolkit combines multiple open-source projects:
- SamFetch: AGPLv3
- SamFirm Reborn: Various licenses
- Custom scripts: MIT License

## ⚖️ Disclaimer

**USE AT YOUR OWN RISK!**

The authors are not responsible for:
- Bricked devices
- Voided warranties  
- Data loss
- Hardware damage
- Any other issues arising from use

Always research thoroughly and understand the risks before proceeding with firmware modifications.

---

**Happy flashing! 📱✨**

