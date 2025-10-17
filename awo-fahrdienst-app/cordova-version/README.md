# 📱 AWO OPR Fahrdienst - Cordova Android App

Diese Version der AWO Fahrdienst App ist für die **APK-Kompilierung mit Apache Cordova** optimiert.

## 🚀 Schnellstart

### 1. Voraussetzungen installieren
```bash
# Node.js, Java JDK, Android Studio installieren
# Siehe BUILD_INSTRUCTIONS.md für Details
```

### 2. APK erstellen
```bash
# Debug-Version (zum Testen)
./build-apk.sh debug

# Release-Version (für Produktion)
./build-apk.sh release
```

### 3. APK installieren
```bash
# Auf Android-Gerät installieren
adb install AWO-Fahrdienst-debug-*.apk
```

## 📂 Projektstruktur

```
cordova-version/
├── config.xml              # Cordova-Konfiguration
├── package.json             # NPM-Dependencies
├── build-apk.sh            # Build-Script
├── BUILD_INSTRUCTIONS.md   # Detaillierte Anleitung
├── www/                    # Web-App-Dateien
│   ├── index.html          # Haupt-HTML
│   ├── cordova-app.js      # Cordova-Erweiterungen
│   ├── js/                 # JavaScript-Module
│   ├── css/                # Stylesheets
│   └── icons/              # App-Icons
├── res/                    # Ressourcen
│   └── android/            # Android-Icons & Splash
├── platforms/              # Cordova-Plattformen
└── plugins/                # Cordova-Plugins
```

## 🛠️ Cordova-Features

### Native Android-Integration
- **GPS-Tracking** mit nativer Geolocation
- **File-System-Zugriff** für PDF-Export
- **Native Dialogs** und Toast-Benachrichtigungen
- **Vibration** für Feedback
- **Network-Status** Monitoring
- **Back-Button** Handling

### Installierte Plugins
- `cordova-plugin-geolocation` - GPS-Tracking
- `cordova-plugin-file` - Dateisystem-Zugriff
- `cordova-plugin-dialogs` - Native Dialogs
- `cordova-plugin-vibration` - Vibration
- `cordova-plugin-statusbar` - Status Bar
- `cordova-plugin-device` - Device-Informationen
- `cordova-plugin-network-information` - Netzwerk-Status

## 📱 Android-Berechtigungen

Die App benötigt folgende Berechtigungen:
- **ACCESS_FINE_LOCATION** - Präzises GPS
- **ACCESS_COARSE_LOCATION** - Grober Standort
- **INTERNET** - Karten und Synchronisation
- **WRITE_EXTERNAL_STORAGE** - PDF-Export
- **VIBRATE** - Benachrichtigungen
- **WAKE_LOCK** - App aktiv halten

## 🔧 Build-Befehle

```bash
# Projekt vorbereiten
npm install
cordova platform add android

# Debug-APK erstellen
cordova build android

# Release-APK erstellen
cordova build android --release

# Auf Gerät installieren
cordova run android

# Im Emulator testen
cordova emulate android

# Projekt bereinigen
cordova clean
```

## 📦 APK-Ausgabe

**Debug APK:**
- Pfad: `platforms/android/app/build/outputs/apk/debug/app-debug.apk`
- Größe: ~15-20 MB
- Signierung: Debug-Zertifikat
- Installation: Nur Sideload

**Release APK:**
- Pfad: `platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk`
- Größe: ~10-15 MB
- Signierung: Keine (muss signiert werden)
- Installation: Nach Signierung

## 🔐 APK Signierung (Release)

```bash
# 1. Keystore erstellen
keytool -genkey -v -keystore awo-fahrdienst.keystore \
  -alias awo-fahrdienst -keyalg RSA -keysize 2048 -validity 10000

# 2. APK signieren
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore awo-fahrdienst.keystore \
  platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk \
  awo-fahrdienst

# 3. APK optimieren
zipalign -v 4 \
  platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk \
  AWO-Fahrdienst-v1.0.0-signed.apk
```

## 🧪 Testing

### Auf physischem Gerät
1. USB-Debugging aktivieren
2. Gerät per USB verbinden
3. `cordova run android` ausführen

### Im Android Emulator
1. Android Studio AVD Manager öffnen
2. Emulator starten
3. `cordova emulate android` ausführen

## 🔍 Debugging

```bash
# Logs anzeigen
cordova run android --verbose

# Chrome DevTools verwenden
# chrome://inspect in Chrome öffnen
# Gerät auswählen und "inspect" klicken
```

## 📋 Unterschiede zur PWA-Version

| Feature | PWA | Cordova APK |
|---------|-----|-------------|
| Installation | Browser | APK-Datei |
| App Store | Nein | Möglich |
| Native APIs | Begrenzt | Vollzugriff |
| Offline-Karten | Service Worker | Native Cache |
| File-Export | Download | Dateisystem |
| Benachrichtigungen | Web Push | Native |
| GPS-Genauigkeit | Browser API | Native API |

## 🚀 Deployment

### Google Play Store
1. APK signieren
2. Google Play Console öffnen
3. App hochladen
4. Store-Listing erstellen
5. Review-Prozess abwarten

### Direkte Installation
1. APK auf Webserver hochladen
2. Download-Link bereitstellen
3. "Unbekannte Quellen" aktivieren
4. APK installieren

## 🆘 Troubleshooting

### Häufige Probleme

**"Requirements check failed"**
```bash
cordova requirements
# Fehlende SDK-Komponenten installieren
```

**"Gradle build failed"**
```bash
cd platforms/android
./gradlew clean
./gradlew assembleDebug
```

**"Plugin not found"**
```bash
cordova plugin remove --all
./build-apk.sh clean
./build-apk.sh debug
```

### Support
- **Build-Logs:** `cordova build android --verbose`
- **Plugin-Liste:** `cordova plugin list`
- **Platform-Info:** `cordova platform list`

---

## 📞 Kontakt

**AWO Ostprignitz-Ruppin**
- E-Mail: support@awo-opr.de
- Telefon: 03391 / 123-456

**Entwickelt mit ❤️ für die AWO OPR**

---

**Version:** 1.0.0  
**Build-System:** Apache Cordova 12.0+  
**Target:** Android 6.0+ (API Level 23+)

