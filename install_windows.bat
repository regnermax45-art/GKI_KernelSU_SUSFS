@echo off
echo ========================================
echo MaxRegner Android Kitchen Tool
echo Windows Installation Script
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH!
    echo Please install Python 3.8+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo Python found:
python --version
echo.

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip
if errorlevel 1 (
    echo WARNING: Failed to upgrade pip, continuing anyway...
)
echo.

REM Install PyQt6 first with specific version
echo Installing PyQt6 (this may take a few minutes)...
python -m pip install --only-binary=all PyQt6==6.7.1
if errorlevel 1 (
    echo ERROR: Failed to install PyQt6!
    echo Trying alternative installation method...
    python -m pip install PyQt6
    if errorlevel 1 (
        echo ERROR: Could not install PyQt6!
        echo Please try installing manually:
        echo   pip install PyQt6==6.7.1
        pause
        exit /b 1
    )
)
echo.

REM Install other requirements
echo Installing other dependencies...
python -m pip install -r requirements_minimal.txt
if errorlevel 1 (
    echo ERROR: Failed to install requirements!
    echo Please check the error messages above.
    pause
    exit /b 1
)
echo.

echo ========================================
echo Installation completed successfully!
echo ========================================
echo.
echo To run the MaxRegner Kitchen Tool:
echo   python -m maxregner_kitchen.main
echo.
echo Or double-click on: run_windows.bat
echo.
pause
