#!/usr/bin/env python3
"""
Galaxy Z Flip 5 Firmware Tool
Modified SamFetch implementation for Galaxy Z Flip 5 firmware download
"""

import os
import sys
import json
import asyncio
import argparse
from pathlib import Path

# Add SamFetch to path
sys.path.insert(0, 'SamFetch')

from samfetch import kies, session, crypto
import httpx

class GalaxyFlip5FirmwareTool:
    def __init__(self):
        self.session = session.SamSession()
        
        # Galaxy Z Flip 5 model variants
        self.models = {
            'SM-F731B': 'Galaxy Z Flip5 5G (Global)',
            'SM-F731U': 'Galaxy Z Flip5 5G (US Unlocked)',
            'SM-F731U1': 'Galaxy Z Flip5 5G (US)',
            'SM-F731W': 'Galaxy Z Flip5 5G (Canada)',
            'SM-F7310': 'Galaxy Z Flip5 5G (China)',
            'SM-F731N': 'Galaxy Z Flip5 5G (Korea)'
        }
        
        # Common regions
        self.regions = {
            'XAA': 'USA (Unlocked)',
            'ATT': 'USA (AT&T)',
            'TMB': 'USA (T-Mobile)',
            'VZW': 'USA (Verizon)',
            'SPR': 'USA (Sprint)',
            'CHR': 'Canada',
            'BTU': 'United Kingdom',
            'DBT': 'Germany',
            'XEF': 'France',
            'ITV': 'Italy',
            'PHN': 'Netherlands',
            'AUT': 'Austria',
            'CHE': 'Switzerland',
            'TGY': 'Hong Kong',
            'CHC': 'China',
            'KOO': 'Korea',
            'DCM': 'Japan (Docomo)',
            'SBM': 'Japan (SoftBank)',
            'XJP': 'Japan'
        }

    async def check_firmware(self, model: str, region: str, imei: str = None):
        """Check available firmware for a model and region"""
        try:
            print(f"🔍 Checking firmware for {model} in region {region}...")
            
            # Use a dummy IMEI if none provided (required by Samsung backend)
            if not imei:
                # Generate a dummy IMEI for the model
                imei = self.generate_dummy_imei(model)
                print(f"⚠️  Using dummy IMEI: {imei}")
            
            # Get firmware info
            firmware_info = await kies.get_firmware_info(
                self.session, model, region, imei
            )
            
            if firmware_info:
                print(f"✅ Latest firmware found:")
                print(f"   Version: {firmware_info.get('version', 'Unknown')}")
                print(f"   Build Date: {firmware_info.get('build_date', 'Unknown')}")
                print(f"   Android Version: {firmware_info.get('android_version', 'Unknown')}")
                print(f"   Size: {firmware_info.get('size_readable', 'Unknown')}")
                print(f"   Filename: {firmware_info.get('filename', 'Unknown')}")
                return firmware_info
            else:
                print(f"❌ No firmware found for {model} in region {region}")
                return None
                
        except Exception as e:
            print(f"❌ Error checking firmware: {str(e)}")
            return None

    async def download_firmware(self, model: str, region: str, imei: str = None, output_dir: str = "./firmware"):
        """Download firmware for a model and region"""
        try:
            # Create output directory
            Path(output_dir).mkdir(parents=True, exist_ok=True)
            
            # Check firmware first
            firmware_info = await self.check_firmware(model, region, imei)
            if not firmware_info:
                return False
            
            print(f"📥 Starting download...")
            
            # Get download URL and decrypt key
            download_url = firmware_info.get('download_url')
            decrypt_key = firmware_info.get('decrypt_key')
            filename = firmware_info.get('filename', f"{model}_{region}_firmware.zip")
            
            if not download_url:
                print("❌ No download URL available")
                return False
            
            # Download the firmware
            output_path = Path(output_dir) / filename
            
            async with httpx.AsyncClient() as client:
                print(f"🌐 Downloading from Samsung servers...")
                
                async with client.stream('GET', download_url) as response:
                    if response.status_code == 200:
                        total_size = int(response.headers.get('content-length', 0))
                        downloaded = 0
                        
                        with open(output_path, 'wb') as f:
                            async for chunk in response.aiter_bytes(chunk_size=1024*1024):
                                f.write(chunk)
                                downloaded += len(chunk)
                                
                                if total_size > 0:
                                    progress = (downloaded / total_size) * 100
                                    print(f"\r📊 Progress: {progress:.1f}% ({downloaded}/{total_size} bytes)", end='')
                        
                        print(f"\n✅ Download completed: {output_path}")
                        
                        # Decrypt if needed and key available
                        if decrypt_key and filename.endswith('.enc4'):
                            await self.decrypt_firmware(output_path, decrypt_key)
                        
                        return True
                    else:
                        print(f"❌ Download failed with status: {response.status_code}")
                        return False
                        
        except Exception as e:
            print(f"❌ Download error: {str(e)}")
            return False

    async def decrypt_firmware(self, encrypted_file: Path, decrypt_key: str):
        """Decrypt downloaded firmware"""
        try:
            print(f"🔓 Decrypting firmware...")
            
            decrypted_file = encrypted_file.with_suffix('')  # Remove .enc4 extension
            
            # Use SamFetch crypto module to decrypt
            with open(encrypted_file, 'rb') as enc_f, open(decrypted_file, 'wb') as dec_f:
                crypto.decrypt_file(enc_f, dec_f, decrypt_key)
            
            print(f"✅ Decryption completed: {decrypted_file}")
            
            # Remove encrypted file
            encrypted_file.unlink()
            print(f"🗑️  Removed encrypted file: {encrypted_file}")
            
        except Exception as e:
            print(f"❌ Decryption error: {str(e)}")

    def generate_dummy_imei(self, model: str) -> str:
        """Generate a dummy IMEI for testing purposes"""
        # This is for testing only - use your real IMEI for actual downloads
        base_imei = "123456789012345"  # 15 digits
        return base_imei

    def list_models(self):
        """List supported Galaxy Z Flip 5 models"""
        print("📱 Supported Galaxy Z Flip 5 Models:")
        for model, description in self.models.items():
            print(f"   {model}: {description}")

    def list_regions(self):
        """List supported regions"""
        print("🌍 Supported Regions:")
        for region, description in self.regions.items():
            print(f"   {region}: {description}")

async def main():
    parser = argparse.ArgumentParser(description='Galaxy Z Flip 5 Firmware Tool')
    parser.add_argument('--model', '-m', help='Device model (e.g., SM-F731B)')
    parser.add_argument('--region', '-r', help='Region code (e.g., BTU)')
    parser.add_argument('--imei', '-i', help='IMEI number (optional, dummy will be used)')
    parser.add_argument('--output', '-o', default='./firmware', help='Output directory')
    parser.add_argument('--check-only', '-c', action='store_true', help='Only check firmware, don\'t download')
    parser.add_argument('--list-models', action='store_true', help='List supported models')
    parser.add_argument('--list-regions', action='store_true', help='List supported regions')
    
    args = parser.parse_args()
    
    tool = GalaxyFlip5FirmwareTool()
    
    if args.list_models:
        tool.list_models()
        return
    
    if args.list_regions:
        tool.list_regions()
        return
    
    if not args.model or not args.region:
        print("❌ Please specify both model and region")
        print("Use --list-models and --list-regions to see available options")
        print("Example: python3 galaxy_flip5_firmware_tool.py -m SM-F731B -r BTU")
        return
    
    if args.model not in tool.models:
        print(f"❌ Unsupported model: {args.model}")
        tool.list_models()
        return
    
    if args.region not in tool.regions:
        print(f"❌ Unsupported region: {args.region}")
        tool.list_regions()
        return
    
    print(f"🚀 Galaxy Z Flip 5 Firmware Tool")
    print(f"📱 Model: {args.model} ({tool.models[args.model]})")
    print(f"🌍 Region: {args.region} ({tool.regions[args.region]})")
    print()
    
    if args.check_only:
        await tool.check_firmware(args.model, args.region, args.imei)
    else:
        success = await tool.download_firmware(args.model, args.region, args.imei, args.output)
        if success:
            print(f"\n🎉 Firmware download completed successfully!")
        else:
            print(f"\n💥 Firmware download failed!")

if __name__ == "__main__":
    asyncio.run(main())

