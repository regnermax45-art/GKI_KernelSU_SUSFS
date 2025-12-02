#!/usr/bin/env python3
"""
Setup script for MaxRegner Android Kitchen Tool
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read README
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text(encoding="utf-8") if readme_file.exists() else ""

# Read requirements
requirements_file = Path(__file__).parent / "requirements.txt"
requirements = []
if requirements_file.exists():
    requirements = requirements_file.read_text().strip().split('\n')
    requirements = [req.strip() for req in requirements if req.strip() and not req.startswith('#')]

setup(
    name="maxregner-kitchen",
    version="1.0.0",
    author="MaxRegner Development Team",
    author_email="dev@maxregner.com",
    description="Ultra-Modern Android Kitchen Tool for Pixel Firmware Porting",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/regnermax45-art/maxregner-kitchen",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Build Tools",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Operating System :: OS Independent",
        "Environment :: X11 Applications :: Qt",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-qt>=4.2.0",
            "black>=23.7.0",
            "flake8>=6.0.0",
            "mypy>=1.5.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "maxregner-kitchen=maxregner_kitchen.main:main",
            "mrk=maxregner_kitchen.main:main",
        ],
    },
    include_package_data=True,
    package_data={
        "maxregner_kitchen": [
            "gui/styles/*.qss",
            "config/*.json",
            "tools/*",
        ],
    },
    zip_safe=False,
    keywords="android, firmware, porting, pixel, kitchen, gui, modern",
    project_urls={
        "Bug Reports": "https://github.com/regnermax45-art/maxregner-kitchen/issues",
        "Source": "https://github.com/regnermax45-art/maxregner-kitchen",
        "Documentation": "https://github.com/regnermax45-art/maxregner-kitchen/wiki",
    },
)
