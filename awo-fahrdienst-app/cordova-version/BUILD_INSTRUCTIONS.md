# 📱 AWO OPR Fahrdienst - APK Build Anleitung

Diese Anleitung zeigt Ihnen, wie Sie die AWO Fahrdienst App als Android APK kompilieren.

## 🛠️ Voraussetzungen

### 1. Node.js installieren
```bash
# Node.js 16+ erforderlich
node --version
npm --version
```

### 2. Java Development Kit (JDK)
```bash
# JDK 11 oder 17 installieren
java -version
```

### 3. Android Studio & SDK
- **Android Studio** herunterladen und installieren
- **Android SDK** installieren (API Level 33)
- **Android SDK Build-Tools** installieren
- **Android SDK Platform-Tools** installieren

### 4. Umgebungsvariablen setzen
```bash
# Windows
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools

# macOS/Linux
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### 5. Cordova CLI installieren
```bash
npm install -g cordova
cordova --version
```

## 🚀 APK Build-Prozess

### Schritt 1: Projekt vorbereiten
```bash
# In das Cordova-Verzeichnis wechseln
cd awo-fahrdienst-app/cordova-version

# Dependencies installieren
npm install

# Android-Plattform hinzufügen
cordova platform add android

# Plugins installieren
npm run plugin-add-all
```

### Schritt 2: Anforderungen prüfen
```bash
# Prüfen ob alle Anforderungen erfüllt sind
cordova requirements

# Sollte etwa so aussehen:
# Requirements check results for android:
# Java JDK: installed 11.0.16
# Android SDK: installed true
# Android target: installed android-33
# Gradle: installed /usr/local/gradle-7.4.2/bin/gradle
```

### Schritt 3: Debug APK erstellen
```bash
# Debug-Version kompilieren
cordova build android

# APK-Datei finden:
# platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

### Schritt 4: Release APK erstellen
```bash
# Release-Version kompilieren
cordova build android --release

# APK-Datei finden:
# platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Schritt 5: APK signieren (für Release)
```bash
# Keystore erstellen (einmalig)
keytool -genkey -v -keystore awo-fahrdienst.keystore -alias awo-fahrdienst -keyalg RSA -keysize 2048 -validity 10000

# APK signieren
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore awo-fahrdienst.keystore platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk awo-fahrdienst

# APK optimieren
zipalign -v 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk AWO-Fahrdienst-v1.0.0.apk
```

## 📋 Schnell-Befehle

```bash
# Alles in einem Schritt (Debug)
npm run build

# Release-Version
npm run build-release

# Auf Gerät installieren (USB-Debugging aktiviert)
npm run run

# Im Emulator testen
npm run emulate

# Projekt bereinigen
npm run clean
```

## 🔧 Troubleshooting

### Problem: "Requirements check failed"
```bash
# Android SDK Pfad prüfen
echo $ANDROID_HOME

# SDK Manager öffnen
$ANDROID_HOME/tools/bin/sdkmanager --list

# Fehlende Komponenten installieren
$ANDROID_HOME/tools/bin/sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
```

### Problem: "Gradle build failed"
```bash
# Gradle Wrapper verwenden
cd platforms/android
./gradlew clean
./gradlew assembleDebug
```

### Problem: "Plugin not found"
```bash
# Alle Plugins neu installieren
cordova plugin remove --all
npm run plugin-add-all
```

### Problem: "Java version mismatch"
```bash
# Java-Version prüfen
java -version
javac -version

# Gradle Java-Version setzen
export JAVA_HOME=/path/to/java11
```

## 📱 APK testen

### Auf physischem Gerät
1. **USB-Debugging aktivieren** (Entwickleroptionen)
2. **Gerät per USB verbinden**
3. **APK installieren:**
   ```bash
   adb install AWO-Fahrdienst-v1.0.0.apk
   ```

### Im Android Emulator
1. **Android Studio öffnen**
2. **AVD Manager starten**
3. **Emulator erstellen und starten**
4. **APK per Drag & Drop installieren**

## 🔐 Berechtigungen

Die App benötigt folgende Android-Berechtigungen:
- **ACCESS_FINE_LOCATION** - GPS-Tracking
- **ACCESS_COARSE_LOCATION** - Grober Standort
- **INTERNET** - Karten laden
- **WRITE_EXTERNAL_STORAGE** - PDF speichern
- **VIBRATE** - Benachrichtigungen

## 📦 APK-Informationen

**Debug APK:**
- Datei: `app-debug.apk`
- Größe: ~15-20 MB
- Signiert: Debug-Zertifikat
- Installation: Nur über ADB/Sideload

**Release APK:**
- Datei: `AWO-Fahrdienst-v1.0.0.apk`
- Größe: ~10-15 MB (optimiert)
- Signiert: Production-Zertifikat
- Installation: Direkt installierbar

## 🚀 Automatisiertes Build-Script

```bash
#!/bin/bash
# build-apk.sh

echo "🚀 Building AWO Fahrdienst APK..."

# Projekt bereinigen
cordova clean

# Android-Plattform neu hinzufügen
cordova platform remove android
cordova platform add android

# Plugins installieren
cordova plugin add cordova-plugin-whitelist
cordova plugin add cordova-plugin-statusbar
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-splashscreen
cordova plugin add cordova-plugin-geolocation
cordova plugin add cordova-plugin-file
cordova plugin add cordova-plugin-network-information
cordova plugin add cordova-plugin-vibration
cordova plugin add cordova-plugin-dialogs

# Release-APK erstellen
cordova build android --release

echo "✅ APK erstellt: platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk"
```

## 📞 Support

Bei Problemen:
1. **Logs prüfen:** `cordova build android --verbose`
2. **GitHub Issues:** Fehler melden
3. **Cordova Docs:** https://cordova.apache.org/docs/

---

**🎯 Ziel:** Funktionsfähige Android APK für AWO OPR Fahrdienst  
**📅 Version:** 1.0.0  
**🔧 Build-System:** Apache Cordova 12.0+

