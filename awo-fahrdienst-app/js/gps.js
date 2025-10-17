// GPS-Manager für AWO Fahrdienst App
class GPSManager {
    constructor() {
        this.watchId = null;
        this.currentPosition = null;
        this.isTracking = false;
        this.trackingInterval = null;
        this.callbacks = {
            positionUpdate: [],
            error: [],
            statusChange: []
        };
        
        // GPS-Optionen
        this.options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000
        };
        
        // Tracking-Einstellungen
        this.trackingSettings = {
            interval: 5000, // 5 Sekunden
            minDistance: 10, // 10 Meter Mindestdistanz
            maxAccuracy: 50 // 50 Meter maximale Ungenauigkeit
        };
        
        this.lastTrackedPosition = null;
        this.isSupported = 'geolocation' in navigator;
        
        console.log('GPS Manager initialisiert. Unterstützung:', this.isSupported);
    }

    // GPS-Unterstützung prüfen
    isGPSSupported() {
        return this.isSupported;
    }

    // Berechtigung prüfen
    async checkPermission() {
        if (!this.isSupported) {
            return { state: 'unsupported' };
        }

        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            return { state: permission.state };
        } catch (error) {
            console.warn('Berechtigung konnte nicht geprüft werden:', error);
            return { state: 'unknown' };
        }
    }

    // Aktuelle Position einmalig abrufen
    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!this.isSupported) {
                reject(new Error('GPS wird nicht unterstützt'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentPosition = this.processPosition(position);
                    this.notifyCallbacks('positionUpdate', this.currentPosition);
                    resolve(this.currentPosition);
                },
                (error) => {
                    const processedError = this.processError(error);
                    this.notifyCallbacks('error', processedError);
                    reject(processedError);
                },
                this.options
            );
        });
    }

    // Kontinuierliches GPS-Tracking starten
    startTracking(tripId = null) {
        if (!this.isSupported) {
            throw new Error('GPS wird nicht unterstützt');
        }

        if (this.isTracking) {
            console.warn('GPS-Tracking läuft bereits');
            return;
        }

        console.log('Starte GPS-Tracking...');
        this.isTracking = true;
        this.currentTripId = tripId;

        // Watchdog für kontinuierliche Positionsupdates
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.handlePositionUpdate(position);
            },
            (error) => {
                this.handlePositionError(error);
            },
            this.options
        );

        // Zusätzliches Intervall für regelmäßige Speicherung
        this.trackingInterval = setInterval(() => {
            this.saveCurrentPosition();
        }, this.trackingSettings.interval);

        this.notifyCallbacks('statusChange', { isTracking: true, tripId });
        console.log('GPS-Tracking gestartet');
    }

    // GPS-Tracking stoppen
    stopTracking() {
        if (!this.isTracking) {
            console.warn('GPS-Tracking läuft nicht');
            return;
        }

        console.log('Stoppe GPS-Tracking...');
        
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }

        this.isTracking = false;
        this.currentTripId = null;
        this.lastTrackedPosition = null;

        this.notifyCallbacks('statusChange', { isTracking: false });
        console.log('GPS-Tracking gestoppt');
    }

    // Position verarbeiten
    processPosition(position) {
        const coords = position.coords;
        
        return {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            altitude: coords.altitude,
            altitudeAccuracy: coords.altitudeAccuracy,
            heading: coords.heading,
            speed: coords.speed,
            timestamp: new Date(position.timestamp).toISOString()
        };
    }

    // Positionsupdate verarbeiten
    handlePositionUpdate(position) {
        const processedPosition = this.processPosition(position);
        
        // Genauigkeit prüfen
        if (processedPosition.accuracy > this.trackingSettings.maxAccuracy) {
            console.warn(`GPS-Genauigkeit zu niedrig: ${processedPosition.accuracy}m`);
            return;
        }

        // Mindestdistanz prüfen
        if (this.lastTrackedPosition) {
            const distance = this.calculateDistance(
                this.lastTrackedPosition,
                processedPosition
            );
            
            if (distance < this.trackingSettings.minDistance) {
                // Position zu nah an der letzten - nicht speichern
                this.currentPosition = processedPosition;
                return;
            }
        }

        this.currentPosition = processedPosition;
        this.lastTrackedPosition = processedPosition;
        
        this.notifyCallbacks('positionUpdate', processedPosition);
        
        // Automatisch in Datenbank speichern wenn Fahrt aktiv
        if (this.currentTripId) {
            this.savePositionToDatabase(processedPosition);
        }
    }

    // Aktuelle Position in Datenbank speichern
    async saveCurrentPosition() {
        if (this.currentPosition && this.currentTripId) {
            await this.savePositionToDatabase(this.currentPosition);
        }
    }

    // Position in Datenbank speichern
    async savePositionToDatabase(position) {
        if (!this.currentTripId || !window.dbManager) {
            return;
        }

        try {
            await window.dbManager.addGPSPoint(
                this.currentTripId,
                position.latitude,
                position.longitude,
                position.accuracy
            );
            
            console.log('GPS-Position gespeichert:', position.latitude, position.longitude);
        } catch (error) {
            console.error('Fehler beim Speichern der GPS-Position:', error);
        }
    }

    // GPS-Fehler verarbeiten
    processError(error) {
        let message = 'Unbekannter GPS-Fehler';
        let code = error.code;
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'GPS-Berechtigung verweigert';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'GPS-Position nicht verfügbar';
                break;
            case error.TIMEOUT:
                message = 'GPS-Timeout - Position konnte nicht ermittelt werden';
                break;
        }
        
        return {
            code,
            message,
            originalError: error
        };
    }

    // Positionsfehler behandeln
    handlePositionError(error) {
        const processedError = this.processError(error);
        console.error('GPS-Fehler:', processedError.message);
        this.notifyCallbacks('error', processedError);
    }

    // Distanz zwischen zwei Positionen berechnen (Haversine-Formel)
    calculateDistance(pos1, pos2) {
        const R = 6371000; // Erdradius in Metern
        const dLat = this.toRadians(pos2.latitude - pos1.latitude);
        const dLon = this.toRadians(pos2.longitude - pos1.longitude);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRadians(pos1.latitude)) * Math.cos(this.toRadians(pos2.latitude)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distanz in Metern
    }

    // Grad zu Radiant konvertieren
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Geschwindigkeit formatieren
    formatSpeed(speedMps) {
        if (!speedMps) return '0 km/h';
        const speedKmh = speedMps * 3.6;
        return `${speedKmh.toFixed(1)} km/h`;
    }

    // Genauigkeit formatieren
    formatAccuracy(accuracy) {
        if (!accuracy) return 'Unbekannt';
        return `±${Math.round(accuracy)}m`;
    }

    // Koordinaten formatieren
    formatCoordinates(lat, lng) {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }

    // Callback registrieren
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    // Callback entfernen
    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }

    // Callbacks benachrichtigen
    notifyCallbacks(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Fehler in ${event} callback:`, error);
                }
            });
        }
    }

    // GPS-Status abrufen
    getStatus() {
        return {
            isSupported: this.isSupported,
            isTracking: this.isTracking,
            currentPosition: this.currentPosition,
            currentTripId: this.currentTripId,
            lastUpdate: this.currentPosition ? this.currentPosition.timestamp : null
        };
    }

    // Tracking-Einstellungen aktualisieren
    updateTrackingSettings(settings) {
        this.trackingSettings = { ...this.trackingSettings, ...settings };
        
        // Wenn Tracking aktiv ist, neu starten mit neuen Einstellungen
        if (this.isTracking) {
            const tripId = this.currentTripId;
            this.stopTracking();
            setTimeout(() => {
                this.startTracking(tripId);
            }, 1000);
        }
    }

    // GPS-Optionen aktualisieren
    updateGPSOptions(options) {
        this.options = { ...this.options, ...options };
    }

    // Route aus GPS-Punkten erstellen
    async createRouteFromTrip(tripId) {
        if (!window.dbManager) {
            throw new Error('Datenbankmanager nicht verfügbar');
        }

        try {
            const gpsPoints = await window.dbManager.getTripTrack(tripId);
            
            if (gpsPoints.length === 0) {
                return { points: [], distance: 0, duration: 0 };
            }

            // Punkte nach Zeitstempel sortieren
            gpsPoints.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Gesamtdistanz berechnen
            let totalDistance = 0;
            for (let i = 1; i < gpsPoints.length; i++) {
                const distance = this.calculateDistance(gpsPoints[i-1], gpsPoints[i]);
                totalDistance += distance;
            }

            // Dauer berechnen
            const startTime = new Date(gpsPoints[0].timestamp);
            const endTime = new Date(gpsPoints[gpsPoints.length - 1].timestamp);
            const duration = Math.round((endTime - startTime) / (1000 * 60)); // Minuten

            return {
                points: gpsPoints,
                distance: totalDistance / 1000, // in Kilometern
                duration: duration,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            };
        } catch (error) {
            console.error('Fehler beim Erstellen der Route:', error);
            throw error;
        }
    }

    // GPS-Daten exportieren
    async exportGPSData(tripId, format = 'json') {
        const route = await this.createRouteFromTrip(tripId);
        
        switch (format) {
            case 'json':
                return JSON.stringify(route, null, 2);
            
            case 'gpx':
                return this.createGPXFromRoute(route);
            
            case 'csv':
                return this.createCSVFromRoute(route);
            
            default:
                throw new Error(`Unbekanntes Export-Format: ${format}`);
        }
    }

    // GPX-Format erstellen
    createGPXFromRoute(route) {
        const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="AWO Fahrdienst App">
  <trk>
    <name>AWO Fahrt ${new Date().toISOString()}</name>
    <trkseg>
${route.points.map(point => `      <trkpt lat="${point.latitude}" lon="${point.longitude}">
        <time>${point.timestamp}</time>
        ${point.altitude ? `<ele>${point.altitude}</ele>` : ''}
      </trkpt>`).join('\n')}
    </trkseg>
  </trk>
</gpx>`;
        return gpx;
    }

    // CSV-Format erstellen
    createCSVFromRoute(route) {
        const headers = 'Timestamp,Latitude,Longitude,Accuracy,Altitude,Speed,Heading';
        const rows = route.points.map(point => 
            `${point.timestamp},${point.latitude},${point.longitude},${point.accuracy || ''},${point.altitude || ''},${point.speed || ''},${point.heading || ''}`
        );
        return [headers, ...rows].join('\n');
    }

    // Cleanup beim Beenden der App
    cleanup() {
        this.stopTracking();
        this.callbacks = {
            positionUpdate: [],
            error: [],
            statusChange: []
        };
    }
}

// Globale GPS-Manager-Instanz
window.gpsManager = new GPSManager();

