# AWO OPR Fahrdienst App

Eine Progressive Web App (PWA) für den Fahrdienst der AWO Ostprignitz-Ruppin mit GPS-Tracking, Personenverwaltung und automatischer Nachweisgenerierung.

## 🚗 Features

### 📍 GPS-Tracking & Karten
- **OpenStreetMap Integration** - Kostenfreie Kartendarstellung
- **Live GPS-Tracking** - Echtzeitverfolgung während der Fahrt
- **Offline-Karten** - Funktioniert auch ohne Internetverbindung
- **Route-Aufzeichnung** - Automatische Speicherung der Fahrtroute
- **Standort-Marker** - Aktuelle Position und Wegpunkte

### 🚙 Fahrtenverwaltung
- **Fahrt starten/stoppen** - Einfache Bedienung mit einem Klick
- **Fahrzeiten erfassen** - Automatische Zeit- und Distanzmessung
- **Fahrgast-Zuordnung** - Mehrere Fahrgäste pro Fahrt
- **Fahrttypen** - Reguläre Fahrten, Arzttermine, Einkaufsfahrten, Notfälle
- **Notizen & Besonderheiten** - Wichtige Hinweise dokumentieren

### 👥 Personenverwaltung
- **Fahrer-Profile** - Mitarbeiter-Nr., Führerschein-Daten
- **Fahrgast-Profile** - Kontaktdaten, Mobilitätshilfen, medizinische Hinweise
- **Notfallkontakte** - Wichtige Ansprechpartner
- **Suchfunktion** - Schnelles Finden von Personen

### 📄 Nachweise & Berichte
- **PDF-Generierung** - Automatische Fahrtennachweise
- **Monatsberichte** - Zusammenfassungen für Abrechnungen
- **Kostenübersichten** - Kilometerpauschalen und Ausgaben
- **Export-Funktionen** - Daten für externe Systeme

### 📱 Progressive Web App
- **Offline-Funktionalität** - Arbeitet ohne Internetverbindung
- **App-Installation** - Wie eine native App installierbar
- **Push-Benachrichtigungen** - Wichtige Updates (geplant)
- **Responsive Design** - Optimiert für Smartphones und Tablets

## 🛠️ Technische Details

### Frontend-Technologien
- **HTML5** - Moderne Web-Standards
- **CSS3** - Responsive Design mit CSS Grid/Flexbox
- **Vanilla JavaScript** - Keine Framework-Abhängigkeiten
- **Service Worker** - Offline-Funktionalität und Caching
- **IndexedDB** - Lokale Datenspeicherung
- **Web APIs** - Geolocation, Notifications, etc.

### Externe Bibliotheken
- **Leaflet.js** - OpenStreetMap-Integration
- **jsPDF** - PDF-Generierung
- **OpenStreetMap** - Kartendaten und Geocoding

### Datenstruktur
- **Trips** - Fahrtendaten mit GPS-Tracks
- **Persons** - Fahrer und Fahrgäste
- **Reports** - Generierte Nachweise
- **Settings** - App-Konfiguration

## 🚀 Installation & Nutzung

### Als PWA installieren
1. App im Browser öffnen
2. "Zur Startseite hinzufügen" wählen
3. App-Icon erscheint auf dem Homescreen
4. Wie eine native App verwenden

### Erste Schritte
1. **GPS-Berechtigung erteilen** - Für Standort-Tracking erforderlich
2. **Fahrer anlegen** - Mindestens einen Fahrer erstellen
3. **Fahrgäste hinzufügen** - Personen mit Kontaktdaten erfassen
4. **Erste Fahrt starten** - GPS-Tracking beginnt automatisch

### Fahrt durchführen
1. **"Fahrt starten"** - Fahrer und Fahrgäste auswählen
2. **GPS-Tracking läuft** - Route wird automatisch aufgezeichnet
3. **"Fahrt beenden"** - Daten werden gespeichert
4. **Nachweis erstellen** - PDF automatisch generieren

## 📋 Systemanforderungen

### Browser-Unterstützung
- **Chrome/Chromium** 80+ (empfohlen)
- **Firefox** 75+
- **Safari** 13+
- **Edge** 80+

### Geräte-Anforderungen
- **GPS-fähiges Gerät** - Smartphone oder Tablet
- **Mindestens 50 MB Speicher** - Für Offline-Daten
- **Internetverbindung** - Für Karten-Download (initial)

### Berechtigungen
- **Standort** - Für GPS-Tracking (erforderlich)
- **Speicher** - Für lokale Datenbank
- **Benachrichtigungen** - Für Updates (optional)

## 🔧 Konfiguration

### GPS-Einstellungen
```javascript
// Tracking-Genauigkeit anpassen
gpsManager.updateTrackingSettings({
    interval: 5000,        // 5 Sekunden
    minDistance: 10,       // 10 Meter
    maxAccuracy: 50        // 50 Meter
});
```

### Offline-Speicher
- **Automatische Synchronisation** - Bei Internetverbindung
- **Lokale Datenhaltung** - Bis zu 90 Tage
- **Cache-Management** - Automatische Bereinigung

## 📊 Datenschutz & Sicherheit

### Lokale Datenspeicherung
- Alle Daten werden lokal auf dem Gerät gespeichert
- Keine automatische Cloud-Synchronisation
- Benutzer hat volle Kontrolle über seine Daten

### GPS-Daten
- Werden nur während aktiver Fahrten erfasst
- Können jederzeit gelöscht werden
- Keine Weitergabe an Dritte

### Backup & Export
- Manuelle Datenexporte möglich
- PDF-Nachweise für Archivierung
- Keine automatischen Backups

## 🐛 Bekannte Einschränkungen

### GPS-Genauigkeit
- Abhängig von Gerät und Umgebung
- In Gebäuden eingeschränkt
- Kann bei schlechtem Wetter variieren

### Offline-Funktionalität
- Karten müssen vorher geladen werden
- Geocoding erfordert Internetverbindung
- Synchronisation nur bei Online-Verbindung

### Browser-Kompatibilität
- Service Worker nicht in allen Browsern
- PWA-Installation browserabhängig
- Einige Features erfordern HTTPS

## 🔄 Updates & Wartung

### Automatische Updates
- Service Worker aktualisiert sich automatisch
- Neue Versionen werden im Hintergrund geladen
- Benutzer wird über Updates informiert

### Datenbank-Migration
- Automatische Schema-Updates
- Bestehende Daten bleiben erhalten
- Backup vor größeren Updates empfohlen

## 📞 Support & Kontakt

### Technischer Support
- **E-Mail**: support@awo-opr.de
- **Telefon**: 03391 / 123-456
- **Öffnungszeiten**: Mo-Fr 8:00-16:00 Uhr

### Feedback & Verbesserungen
- Feature-Requests willkommen
- Bug-Reports mit Screenshots
- Verbesserungsvorschläge

## 📜 Lizenz

Diese Software wurde speziell für die AWO Ostprignitz-Ruppin entwickelt.

**Entwickelt mit ❤️ für die AWO OPR**

---

## 🚀 Entwickler-Informationen

### Projektstruktur
```
awo-fahrdienst-app/
├── index.html              # Haupt-HTML-Datei
├── manifest.json           # PWA-Manifest
├── sw.js                   # Service Worker
├── app.js                  # Haupt-App-Logik
├── styles.css              # Basis-Styles
├── css/
│   └── components.css      # Komponenten-Styles
├── js/
│   ├── database.js         # IndexedDB-Manager
│   ├── models.js           # Datenmodelle
│   ├── gps.js              # GPS-Manager
│   ├── map.js              # Karten-Manager
│   ├── trip-tracker.js     # Fahrt-Tracking
│   ├── navigation.js       # App-Navigation
│   ├── person-manager.js   # Personenverwaltung
│   ├── pdf-generator.js    # PDF-Erstellung
│   └── timer.js            # Timer-Utilities
├── icons/                  # App-Icons
├── screenshots/            # PWA-Screenshots
└── README.md              # Diese Datei
```

### Entwicklung
```bash
# Lokaler Entwicklungsserver
python -m http.server 8000

# Oder mit Node.js
npx serve .

# App unter http://localhost:8000 öffnen
```

### Deployment
- Dateien auf HTTPS-Server hochladen
- Service Worker erfordert HTTPS
- Manifest.json konfigurieren
- Icons in verschiedenen Größen bereitstellen

**Version**: 1.0.0  
**Letzte Aktualisierung**: Oktober 2024

