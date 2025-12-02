# 🪟 Windows Setup Guide - MaxRegner Kitchen Tool

This guide will help you install and run the MaxRegner Android Kitchen Tool on Windows.

## 📋 Prerequisites

### 1. Install Python
- Download Python 3.8+ from [python.org](https://python.org)
- **IMPORTANT**: During installation, check "Add Python to PATH"
- Verify installation by opening Command Prompt and typing: `python --version`

### 2. System Requirements
- Windows 10 or Windows 11
- 4GB RAM minimum (8GB recommended)
- 5GB free disk space
- Internet connection for downloading dependencies

## 🚀 Quick Installation (Recommended)

### Method 1: Automated Installation
1. Download or clone this repository
2. Double-click `install_windows.bat`
3. Wait for installation to complete
4. Double-click `run_windows.bat` to start the application

### Method 2: Manual Installation
1. Open Command Prompt as Administrator
2. Navigate to the project directory
3. Run the following commands:

```cmd
# Upgrade pip
python -m pip install --upgrade pip

# Install PyQt6 (specific version for Windows compatibility)
python -m pip install --only-binary=all PyQt6==6.7.1

# Install minimal requirements
python -m pip install -r requirements_minimal.txt

# Run the application
python -m maxregner_kitchen.main
```

## 🔧 Troubleshooting

### PyQt6 Installation Issues

If you encounter the error you mentioned, try these solutions:

#### Solution 1: Use Pre-compiled Wheels
```cmd
python -m pip install --only-binary=all PyQt6==6.7.1
```

#### Solution 2: Use Conda (Alternative)
If you have Anaconda or Miniconda installed:
```cmd
conda install pyqt
```

#### Solution 3: Use Different PyQt6 Version
```cmd
python -m pip install PyQt6==6.5.0
```

#### Solution 4: Install Visual Studio Build Tools
If you still have compilation issues:
1. Download "Microsoft C++ Build Tools" from Microsoft
2. Install with C++ build tools
3. Restart Command Prompt
4. Try installing PyQt6 again

### Common Issues and Solutions

#### Issue: "Python is not recognized"
**Solution**: 
- Reinstall Python and check "Add Python to PATH"
- Or manually add Python to your PATH environment variable

#### Issue: "Permission denied" errors
**Solution**: 
- Run Command Prompt as Administrator
- Or use: `python -m pip install --user PyQt6==6.7.1`

#### Issue: "No module named 'PyQt6'"
**Solution**:
- Verify PyQt6 installation: `python -c "import PyQt6; print('PyQt6 installed successfully')"`
- If not installed, follow the installation steps above

#### Issue: Application won't start
**Solution**:
- Check Python version: `python --version` (must be 3.8+)
- Verify all dependencies: `python -m pip list`
- Run with debug mode: `python -m maxregner_kitchen.main --debug`

## 📁 File Structure

After installation, your directory should look like this:
```
MaxRegner_Kitchen/
├── maxregner_kitchen/          # Main application code
├── requirements_minimal.txt    # Minimal dependencies
├── requirements.txt           # Full dependencies
├── install_windows.bat        # Windows installer
├── run_windows.bat           # Windows launcher
├── WINDOWS_SETUP.md          # This guide
└── README.md                 # Main documentation
```

## 🎯 Running the Application

### Option 1: Double-click Launcher
- Double-click `run_windows.bat`

### Option 2: Command Line
```cmd
python -m maxregner_kitchen.main
```

### Option 3: With Debug Output
```cmd
python -m maxregner_kitchen.main --debug
```

## 🔍 Verification

To verify everything is working:

1. **Check Python**: `python --version`
2. **Check PyQt6**: `python -c "import PyQt6; print('PyQt6 OK')"`
3. **Check Application**: `python -m maxregner_kitchen.main --version`

## 💡 Tips for Windows Users

1. **Use Command Prompt as Administrator** for installations
2. **Keep Python updated** to the latest stable version
3. **Use Windows Defender exclusions** for the project folder if antivirus interferes
4. **Close other applications** during installation to avoid conflicts

## 🆘 Getting Help

If you still have issues:

1. **Check the error message** carefully
2. **Try the minimal installation** using `requirements_minimal.txt`
3. **Update your system** (Windows Update)
4. **Try a different Python version** (3.9, 3.10, or 3.11)
5. **Use virtual environment**:
   ```cmd
   python -m venv maxregner_env
   maxregner_env\Scripts\activate
   python -m pip install PyQt6==6.7.1
   python -m pip install -r requirements_minimal.txt
   ```

## 🎉 Success!

Once installed successfully, you should see the MaxRegner Kitchen Tool GUI with:
- Modern dark theme interface
- Drag-and-drop firmware input areas
- Real-time progress tracking
- Comprehensive logging system

Enjoy using the MaxRegner Android Kitchen Tool! 🚀
