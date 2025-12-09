#!/usr/bin/env python3
"""
Motorola OTA Checker
A Python script that uses ADB to pull device information from a connected Motorola device
and checks for available OTA updates using the Motorola CDS service.
"""

import subprocess
import json
import requests
import sys
import os
from typing import Dict, Optional, Any

class MotorolaOTAChecker:
    def __init__(self, force_android_version=None):
        self.cds_url = "https://moto-cds.appspot.com/cds/upgrade/1/check/ctx/ota/key"
        self.device_props = {}
        self.force_android_version = force_android_version
        
        # Android version mappings for forcing specific versions
        self.android_version_map = {
            "15": "15",
            "14": "14", 
            "13": "13",
            "12": "12",
            "11": "11",
            "10": "10"
        }
        
    def run_adb_command(self, command: str) -> str:
        """Run an ADB command and return the output."""
        try:
            result = subprocess.run(
                f"adb {command}",
                shell=True,
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            print(f"Error running ADB command '{command}': {e}")
            return ""
    
    def get_device_property(self, prop: str) -> str:
        """Get a specific device property using ADB."""
        return self.run_adb_command(f"shell getprop {prop}")
    
    def check_adb_connection(self) -> bool:
        """Check if ADB is available and a device is connected."""
        try:
            devices = self.run_adb_command("devices")
            if "device" in devices and len(devices.split('\n')) > 1:
                return True
            else:
                print("No ADB devices found. Please ensure:")
                print("1. ADB is installed and in PATH")
                print("2. USB debugging is enabled on your device")
                print("3. Device is connected and authorized")
                return False
        except Exception as e:
            print(f"ADB not available: {e}")
            return False
    
    def collect_device_info(self) -> Dict[str, Any]:
        """Collect all required device information using ADB."""
        print("📱 Collecting device information...")
        
        # Required properties for the API call
        properties = {
            'ro.serialno': 'serial',
            'ro.mot.build.guid': 'build_guid',
            'ro.product.manufacturer': 'manufacturer',
            'ro.product.brand': 'brand',
            'ro.product.model': 'model',
            'ro.product.name': 'product',
            'ro.product.device': 'device',
            'ro.hardware': 'hardware',
            'ro.build.version.release': 'os_version',
            'ro.build.id': 'build_id',
            'persist.radio.imei': 'imei',
            'persist.radio.meid': 'meid'
        }
        
        device_info = {}
        for prop, key in properties.items():
            value = self.get_device_property(prop)
            device_info[key] = value
            print(f"  {key}: {value}")
        
        return device_info
    
    def build_api_payload(self, device_info: Dict[str, Any]) -> Dict[str, Any]:
        """Build the JSON payload for the Motorola CDS API."""
        # Use forced Android version if specified, otherwise use device's current version
        os_version = device_info['os_version']
        if self.force_android_version:
            os_version = self.android_version_map.get(self.force_android_version, device_info['os_version'])
            print(f"🔧 Forcing Android version: {os_version} (requested: {self.force_android_version})")
        
        return {
            "id": device_info['serial'],
            "contentTimestamp": 0,
            "deviceInfo": {
                "manufacturer": device_info['manufacturer'],
                "brand": device_info['brand'],
                "model": device_info['model'],
                "product": device_info['product'],
                "device": device_info['device'],
                "hardware": device_info['hardware'],
                "osVersion": os_version,
                "buildId": device_info['build_id']
            },
            "extraInfo": {},
            "identityInfo": {
                "imei": device_info['imei'],
                "meid": device_info['meid'],
                "serial": device_info['serial']
            },
            "triggeredBy": "polling",
            "idType": "serialNumber"
        }
    
    def check_for_updates(self, device_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Check for OTA updates using the Motorola CDS service."""
        print("\n🔍 Checking for OTA updates...")
        
        # Build the full URL with the build GUID
        full_url = f"{self.cds_url}/{device_info['build_guid']}"
        
        # Build the payload
        payload = self.build_api_payload(device_info)
        
        # Headers - Update User-Agent based on target Android version
        android_version = payload['deviceInfo']['osVersion']
        headers = {
            "Content-Type": "application/json",
            "User-Agent": f"Mozilla/5.0 (Linux; Android {android_version}; Motorola) AppleWebKit/537.36"
        }
        
        try:
            print(f"📡 Sending request to: {full_url}")
            if self.force_android_version:
                print(f"🎯 Requesting updates for Android {android_version}")
            
            response = requests.post(full_url, json=payload, headers=headers, timeout=30)
            
            print(f"📊 Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                
                # If forcing Android 15 and no updates found, try alternative approaches
                if (self.force_android_version == "15" and 
                    not result.get('updateAvailable', False)):
                    print("🔄 No Android 15 updates found with standard request, trying alternative methods...")
                    return self._try_alternative_android15_methods(device_info, full_url, headers)
                
                return result
            else:
                print(f"❌ API request failed with status {response.status_code}")
                print(f"Response: {response.text}")
                
                # If forcing Android 15, try alternative methods even on API failure
                if self.force_android_version == "15":
                    print("🔄 Trying alternative Android 15 detection methods...")
                    return self._try_alternative_android15_methods(device_info, full_url, headers)
                
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Network error: {e}")
            
            # If forcing Android 15, try alternative methods even on network error
            if self.force_android_version == "15":
                print("🔄 Network error occurred, trying alternative Android 15 methods...")
                return self._try_alternative_android15_methods(device_info, full_url, headers)
            
            return None
    
    def _try_alternative_android15_methods(self, device_info: Dict[str, Any], base_url: str, headers: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """Try alternative methods to find Android 15 updates."""
        print("🔍 Trying alternative Android 15 detection strategies...")
        
        # Strategy 1: Try with different build IDs that might trigger Android 15
        android15_build_patterns = [
            "VanillaIceCream",  # Android 15 codename
            "API35",            # Android 15 API level
            "35",               # API level
            "15.0.0",           # Version format
        ]
        
        original_build_id = device_info['build_id']
        
        for pattern in android15_build_patterns:
            print(f"  🧪 Trying with build pattern: {pattern}")
            
            # Modify device info for this attempt
            modified_device_info = device_info.copy()
            modified_device_info['build_id'] = f"{original_build_id}.{pattern}"
            
            # Build payload with Android 15 and modified build ID
            payload = {
                "id": modified_device_info['serial'],
                "contentTimestamp": 0,
                "deviceInfo": {
                    "manufacturer": modified_device_info['manufacturer'],
                    "brand": modified_device_info['brand'],
                    "model": modified_device_info['model'],
                    "product": modified_device_info['product'],
                    "device": modified_device_info['device'],
                    "hardware": modified_device_info['hardware'],
                    "osVersion": "15",
                    "buildId": modified_device_info['build_id']
                },
                "extraInfo": {
                    "forceAndroid15": True,
                    "prerelease": True
                },
                "identityInfo": {
                    "imei": modified_device_info['imei'],
                    "meid": modified_device_info['meid'],
                    "serial": modified_device_info['serial']
                },
                "triggeredBy": "manual_android15_check",
                "idType": "serialNumber"
            }
            
            try:
                response = requests.post(base_url, json=payload, headers=headers, timeout=30)
                if response.status_code == 200:
                    result = response.json()
                    if result.get('updateAvailable', False):
                        print(f"  ✅ Found Android 15 update with pattern: {pattern}")
                        return result
                    else:
                        print(f"  ❌ No updates with pattern: {pattern}")
                else:
                    print(f"  ❌ API error with pattern {pattern}: {response.status_code}")
            except Exception as e:
                print(f"  ❌ Network error with pattern {pattern}: {e}")
        
        # Strategy 2: Try different API endpoints that might have Android 15
        alternative_endpoints = [
            "https://moto-cds.appspot.com/cds/upgrade/2/check/ctx/ota/key",  # Version 2 API
            "https://moto-cds.appspot.com/cds/upgrade/1/check/ctx/prerelease/key",  # Prerelease endpoint
            "https://moto-cds.appspot.com/cds/upgrade/1/check/ctx/beta/key",  # Beta endpoint
        ]
        
        for endpoint in alternative_endpoints:
            print(f"  🌐 Trying alternative endpoint: {endpoint}")
            alt_url = f"{endpoint}/{device_info['build_guid']}"
            
            payload = self.build_api_payload(device_info)
            payload['extraInfo']['android15Request'] = True
            payload['extraInfo']['prerelease'] = True
            
            try:
                response = requests.post(alt_url, json=payload, headers=headers, timeout=30)
                if response.status_code == 200:
                    result = response.json()
                    if result.get('updateAvailable', False):
                        print(f"  ✅ Found Android 15 update via alternative endpoint!")
                        return result
                    else:
                        print(f"  ❌ No updates via alternative endpoint")
                else:
                    print(f"  ❌ Alternative endpoint error: {response.status_code}")
            except Exception as e:
                print(f"  ❌ Alternative endpoint network error: {e}")
        
        print("❌ No Android 15 updates found via alternative methods")
        return None
    
    def download_ota(self, download_url: str, filename: str) -> bool:
        """Download the OTA file."""
        print(f"\n📥 Downloading OTA: {filename}")
        
        try:
            response = requests.get(download_url, stream=True)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            with open(filename, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            progress = (downloaded / total_size) * 100
                            print(f"\r📊 Progress: {progress:.1f}%", end='', flush=True)
            
            print(f"\n✅ Download completed: {filename}")
            return True
            
        except Exception as e:
            print(f"\n❌ Download failed: {e}")
            return False
    
    def parse_ota_response(self, response: Dict[str, Any]) -> None:
        """Parse and display the OTA response."""
        print("\n📋 OTA Check Results:")
        print("=" * 50)
        
        if 'updateAvailable' in response:
            if response['updateAvailable']:
                print("🎉 Update Available!")
                
                if 'updateInfo' in response:
                    update_info = response['updateInfo']
                    
                    print(f"📦 Version: {update_info.get('version', 'Unknown')}")
                    print(f"📅 Release Date: {update_info.get('releaseDate', 'Unknown')}")
                    print(f"📏 Size: {update_info.get('size', 'Unknown')} bytes")
                    print(f"🔗 Download URL: {update_info.get('downloadUrl', 'Not provided')}")
                    
                    if 'description' in update_info:
                        print(f"📝 Description: {update_info['description']}")
                    
                    # Ask user if they want to download
                    download_url = update_info.get('downloadUrl')
                    if download_url:
                        filename = f"motorola_ota_{update_info.get('version', 'unknown')}.zip"
                        
                        user_input = input(f"\n❓ Download OTA to {filename}? (y/N): ").lower()
                        if user_input in ['y', 'yes']:
                            self.download_ota(download_url, filename)
                        else:
                            print("⏭️  Download skipped.")
                    else:
                        print("❌ No download URL provided in response.")
                        
            else:
                print("✅ No updates available - device is up to date!")
        else:
            print("❓ Unexpected response format")
            print(json.dumps(response, indent=2))
    
    def run(self):
        """Main execution method."""
        print("🚀 Motorola OTA Checker")
        if self.force_android_version:
            print(f"🎯 Targeting Android {self.force_android_version}")
        print("=" * 30)
        
        # Check ADB connection
        if not self.check_adb_connection():
            sys.exit(1)
        
        # Collect device information
        device_info = self.collect_device_info()
        
        # Validate required information
        if not device_info.get('build_guid'):
            print("❌ Could not retrieve build GUID (ro.mot.build.guid)")
            print("This might not be a Motorola device or the property is not available.")
            sys.exit(1)
        
        if not device_info.get('serial'):
            print("❌ Could not retrieve device serial number")
            sys.exit(1)
        
        # Show current vs target version info
        if self.force_android_version:
            current_version = device_info.get('os_version', 'Unknown')
            target_version = self.android_version_map.get(self.force_android_version, self.force_android_version)
            print(f"\n📊 Version Info:")
            print(f"  Current Android: {current_version}")
            print(f"  Target Android: {target_version}")
            
            if current_version == target_version:
                print("⚠️  Warning: Device is already on target Android version")
                user_input = input("Continue anyway? (y/N): ").lower()
                if user_input not in ['y', 'yes']:
                    print("🛑 Operation cancelled")
                    sys.exit(0)
        
        # Check for updates
        response = self.check_for_updates(device_info)
        
        if response:
            self.parse_ota_response(response)
        else:
            print("❌ Failed to check for updates")
            sys.exit(1)

def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Motorola OTA Checker - Check and download OTA updates for Motorola devices",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 motorola_ota_checker.py                    # Check for updates normally
  python3 motorola_ota_checker.py --force-android 15 # Force check for Android 15
  python3 motorola_ota_checker.py --force-android 14 # Force check for Android 14
  python3 motorola_ota_checker.py --interactive      # Interactive mode to select version
        """
    )
    
    parser.add_argument(
        '--force-android', 
        type=str, 
        choices=['10', '11', '12', '13', '14', '15'],
        help='Force check for specific Android version (10, 11, 12, 13, 14, 15)'
    )
    
    parser.add_argument(
        '--interactive', 
        action='store_true',
        help='Interactive mode to select Android version'
    )
    
    args = parser.parse_args()
    
    force_version = args.force_android
    
    # Interactive mode
    if args.interactive:
        print("🎯 Interactive Android Version Selection")
        print("=" * 40)
        print("Available Android versions:")
        versions = ['10', '11', '12', '13', '14', '15']
        for i, version in enumerate(versions, 1):
            print(f"  {i}. Android {version}")
        print("  0. Use device's current version")
        
        try:
            choice = input("\nSelect version (0-6): ").strip()
            if choice == '0':
                force_version = None
            elif choice.isdigit() and 1 <= int(choice) <= 6:
                force_version = versions[int(choice) - 1]
            else:
                print("❌ Invalid selection")
                sys.exit(1)
        except (ValueError, KeyboardInterrupt):
            print("\n❌ Invalid input or cancelled")
            sys.exit(1)
    
    try:
        checker = MotorolaOTAChecker(force_android_version=force_version)
        checker.run()
    except KeyboardInterrupt:
        print("\n\n⏹️  Operation cancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
