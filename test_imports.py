#!/usr/bin/env python3
"""
Test script to verify all imports work correctly
"""

import sys
import traceback

def test_import(module_name, description):
    """Test importing a module and report results."""
    try:
        __import__(module_name)
        print(f"✅ {description}: OK")
        return True
    except ImportError as e:
        print(f"❌ {description}: FAILED - {e}")
        return False
    except Exception as e:
        print(f"⚠️  {description}: ERROR - {e}")
        return False

def main():
    """Test all critical imports."""
    print("🧪 Testing MaxRegner Kitchen Tool Imports")
    print("=" * 50)
    
    success_count = 0
    total_tests = 0
    
    # Test basic Python modules
    tests = [
        ("sys", "Python sys module"),
        ("os", "Python os module"),
        ("pathlib", "Python pathlib module"),
        ("json", "Python json module"),
    ]
    
    # Test PyQt6
    tests.extend([
        ("PyQt6", "PyQt6 base module"),
        ("PyQt6.QtWidgets", "PyQt6 widgets"),
        ("PyQt6.QtCore", "PyQt6 core"),
        ("PyQt6.QtGui", "PyQt6 GUI"),
    ])
    
    # Test MaxRegner modules
    tests.extend([
        ("maxregner_kitchen", "MaxRegner Kitchen base module"),
        ("maxregner_kitchen.config", "Configuration module"),
        ("maxregner_kitchen.config.settings", "Settings module"),
        ("maxregner_kitchen.config.profiles", "Profiles module"),
        ("maxregner_kitchen.utils", "Utils module"),
        ("maxregner_kitchen.utils.logger", "Logger module"),
        ("maxregner_kitchen.utils.progress", "Progress module"),
        ("maxregner_kitchen.utils.helpers", "Helpers module"),
        ("maxregner_kitchen.gui", "GUI module"),
        ("maxregner_kitchen.gui.main_window", "Main window module"),
    ])
    
    for module_name, description in tests:
        total_tests += 1
        if test_import(module_name, description):
            success_count += 1
    
    print("=" * 50)
    print(f"📊 Results: {success_count}/{total_tests} imports successful")
    
    if success_count == total_tests:
        print("🎉 All imports working correctly!")
        return 0
    else:
        print("⚠️  Some imports failed. Check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
