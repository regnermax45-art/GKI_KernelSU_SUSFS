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
    def __init__(self):
        self.cds_url = "https://moto-cds.appspot.com/cds/upgrade/1/check/ctx/ota/key"
        self.device_props = {}
        
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
                "osVersion": device_info['os_version'],
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
        
        # Headers
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; Motorola) AppleWebKit/537.36"
        }
        
        try:
            print(f"📡 Sending request to: {full_url}")
            response = requests.post(full_url, json=payload, headers=headers, timeout=30)
            
            print(f"📊 Response status: {response.status_code}")
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ API request failed with status {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Network error: {e}")
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
        
        # Check for updates
        response = self.check_for_updates(device_info)
        
        if response:
            self.parse_ota_response(response)
        else:
            print("❌ Failed to check for updates")
            sys.exit(1)

def main():
    """Main entry point."""
    try:
        checker = MotorolaOTAChecker()
        checker.run()
    except KeyboardInterrupt:
        print("\n\n⏹️  Operation cancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

