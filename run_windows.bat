@echo off
echo ========================================
echo MaxRegner Android Kitchen Tool
echo Starting Application...
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH!
    echo Please run install_windows.bat first
    pause
    exit /b 1
)

REM Test imports first (optional)
echo Testing imports...
python test_imports.py
if errorlevel 1 (
    echo.
    echo Some imports failed. Please check the installation.
    echo Try running install_windows.bat again.
    pause
    exit /b 1
)

echo.
REM Run the application
echo Starting MaxRegner Kitchen Tool...
python -m maxregner_kitchen.main

REM Keep window open if there's an error
if errorlevel 1 (
    echo.
    echo Application exited with an error.
    echo Check the error messages above.
    pause
)
