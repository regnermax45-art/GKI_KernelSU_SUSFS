#!/bin/bash

# AWO OPR Fahrdienst - Automatisches APK Build Script
# Verwendung: ./build-apk.sh [debug|release]

set -e  # Bei Fehler abbrechen

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktionen
print_header() {
    echo -e "${BLUE}🚗 AWO OPR Fahrdienst - APK Builder${NC}"
    echo -e "${BLUE}======================================${NC}"
}

print_step() {
    echo -e "${YELLOW}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_requirements() {
    print_step "Prüfe Systemanforderungen..."
    
    # Node.js prüfen
    if ! command -v node &> /dev/null; then
        print_error "Node.js ist nicht installiert!"
        exit 1
    fi
    
    # Cordova prüfen
    if ! command -v cordova &> /dev/null; then
        print_error "Cordova CLI ist nicht installiert! Installiere mit: npm install -g cordova"
        exit 1
    fi
    
    # Java prüfen
    if ! command -v java &> /dev/null; then
        print_error "Java JDK ist nicht installiert!"
        exit 1
    fi
    
    # Android SDK prüfen
    if [ -z "$ANDROID_HOME" ]; then
        print_error "ANDROID_HOME Umgebungsvariable ist nicht gesetzt!"
        exit 1
    fi
    
    print_success "Alle Anforderungen erfüllt"
}

setup_project() {
    print_step "Projekt vorbereiten..."
    
    # Dependencies installieren
    if [ -f "package.json" ]; then
        npm install
    fi
    
    # Android-Plattform hinzufügen (falls nicht vorhanden)
    if [ ! -d "platforms/android" ]; then
        cordova platform add android
    fi
    
    # Plugins installieren
    print_step "Installiere Cordova Plugins..."
    
    # Core Plugins
    cordova plugin add cordova-plugin-whitelist --save || true
    cordova plugin add cordova-plugin-statusbar --save || true
    cordova plugin add cordova-plugin-device --save || true
    cordova plugin add cordova-plugin-splashscreen --save || true
    
    # Feature Plugins
    cordova plugin add cordova-plugin-geolocation --save --variable GEOLOCATION_USAGE_DESCRIPTION="Diese App benötigt Zugriff auf Ihren Standort für GPS-Tracking während der Fahrten." || true
    cordova plugin add cordova-plugin-file --save || true
    cordova plugin add cordova-plugin-file-transfer --save || true
    cordova plugin add cordova-plugin-network-information --save || true
    cordova plugin add cordova-plugin-vibration --save || true
    cordova plugin add cordova-plugin-dialogs --save || true
    cordova plugin add cordova-plugin-inappbrowser --save || true
    cordova plugin add cordova-plugin-x-toast --save || true
    
    print_success "Projekt vorbereitet"
}

build_debug() {
    print_step "Erstelle Debug APK..."
    
    cordova build android --debug
    
    local apk_path="platforms/android/app/build/outputs/apk/debug/app-debug.apk"
    
    if [ -f "$apk_path" ]; then
        print_success "Debug APK erstellt: $apk_path"
        
        # APK-Informationen anzeigen
        local size=$(du -h "$apk_path" | cut -f1)
        echo -e "${BLUE}📦 APK-Größe: $size${NC}"
        
        # APK umbenennen
        local new_name="AWO-Fahrdienst-debug-$(date +%Y%m%d-%H%M%S).apk"
        cp "$apk_path" "$new_name"
        print_success "APK kopiert nach: $new_name"
        
        return 0
    else
        print_error "Debug APK konnte nicht erstellt werden!"
        return 1
    fi
}

build_release() {
    print_step "Erstelle Release APK..."
    
    cordova build android --release
    
    local apk_path="platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk"
    
    if [ -f "$apk_path" ]; then
        print_success "Release APK erstellt: $apk_path"
        
        # APK-Informationen anzeigen
        local size=$(du -h "$apk_path" | cut -f1)
        echo -e "${BLUE}📦 APK-Größe: $size${NC}"
        
        # APK umbenennen
        local new_name="AWO-Fahrdienst-release-unsigned-$(date +%Y%m%d-%H%M%S).apk"
        cp "$apk_path" "$new_name"
        print_success "APK kopiert nach: $new_name"
        
        echo -e "${YELLOW}⚠️  HINWEIS: Release APK ist nicht signiert!${NC}"
        echo -e "${YELLOW}   Für Production-Deployment muss die APK signiert werden.${NC}"
        
        return 0
    else
        print_error "Release APK konnte nicht erstellt werden!"
        return 1
    fi
}

clean_project() {
    print_step "Bereinige Projekt..."
    
    cordova clean
    
    # Node modules bereinigen
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        npm install
    fi
    
    print_success "Projekt bereinigt"
}

show_help() {
    echo "AWO OPR Fahrdienst APK Builder"
    echo ""
    echo "Verwendung:"
    echo "  ./build-apk.sh [OPTION]"
    echo ""
    echo "Optionen:"
    echo "  debug     Erstelle Debug APK (Standard)"
    echo "  release   Erstelle Release APK (unsigned)"
    echo "  clean     Bereinige Projekt"
    echo "  help      Zeige diese Hilfe"
    echo ""
    echo "Beispiele:"
    echo "  ./build-apk.sh debug"
    echo "  ./build-apk.sh release"
    echo "  ./build-apk.sh clean"
}

# Hauptprogramm
main() {
    print_header
    
    # Parameter verarbeiten
    local build_type="${1:-debug}"
    
    case "$build_type" in
        "debug")
            check_requirements
            setup_project
            build_debug
            ;;
        "release")
            check_requirements
            setup_project
            build_release
            ;;
        "clean")
            clean_project
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unbekannte Option: $build_type"
            show_help
            exit 1
            ;;
    esac
    
    print_success "Build-Prozess abgeschlossen!"
}

# Script ausführen
main "$@"

