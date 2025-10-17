// Fahrt-Tracker für AWO Fahrdienst App
class TripTracker {
    constructor() {
        this.currentTrip = null;
        this.isTracking = false;
        this.startTime = null;
        this.trackingTimer = null;
        this.callbacks = {
            tripStarted: [],
            tripEnded: [],
            tripUpdated: [],
            error: []
        };
    }

    // Neue Fahrt starten
    async startTrip(driverId, passengers = [], tripData = {}) {
        try {
            if (this.isTracking) {
                throw new Error('Es läuft bereits eine Fahrt');
            }

            console.log('Starte neue Fahrt...');

            // GPS-Berechtigung prüfen
            if (window.gpsManager && !await this.checkGPSPermission()) {
                throw new Error('GPS-Berechtigung erforderlich');
            }

            // Aktuelle Position für Startpunkt ermitteln
            let startLocation = null;
            if (window.gpsManager) {
                try {
                    const position = await window.gpsManager.getCurrentPosition();
                    startLocation = {
                        lat: position.latitude,
                        lng: position.longitude,
                        address: await this.getAddressFromCoordinates(position.latitude, position.longitude)
                    };
                } catch (error) {
                    console.warn('Startposition konnte nicht ermittelt werden:', error);
                }
            }

            // Fahrt-Objekt erstellen
            const trip = new Trip({
                driverId: driverId,
                passengers: passengers,
                date: new Date().toISOString(),
                status: 'active',
                startTime: new Date().toISOString(),
                startLocation: startLocation,
                ...tripData
            });

            // Validierung
            const validation = trip.validate();
            if (!validation.isValid) {
                throw new Error(`Fahrt-Validierung fehlgeschlagen: ${validation.errors.join(', ')}`);
            }

            // In Datenbank speichern
            this.currentTrip = await window.dbManager.createTrip(trip);
            
            // Tracking-Status setzen
            this.isTracking = true;
            this.startTime = new Date();

            // GPS-Tracking starten
            if (window.gpsManager) {
                window.gpsManager.startTracking(this.currentTrip.id);
            }

            // Live-Tracking auf Karte starten
            if (window.mapManager) {
                window.mapManager.startLiveTracking(this.currentTrip.id);
            }

            // Timer für Fahrtzeit starten
            this.startTrackingTimer();

            // UI aktualisieren
            this.updateTripUI();

            // Callbacks benachrichtigen
            this.notifyCallbacks('tripStarted', this.currentTrip);

            console.log('Fahrt gestartet:', this.currentTrip.id);
            return this.currentTrip;

        } catch (error) {
            console.error('Fehler beim Starten der Fahrt:', error);
            this.notifyCallbacks('error', error);
            throw error;
        }
    }

    // Fahrt beenden
    async endTrip(endData = {}) {
        try {
            if (!this.isTracking || !this.currentTrip) {
                throw new Error('Keine aktive Fahrt vorhanden');
            }

            console.log('Beende Fahrt...');

            // Aktuelle Position für Endpunkt ermitteln
            let endLocation = null;
            if (window.gpsManager) {
                try {
                    const position = await window.gpsManager.getCurrentPosition();
                    endLocation = {
                        lat: position.latitude,
                        lng: position.longitude,
                        address: await this.getAddressFromCoordinates(position.latitude, position.longitude)
                    };
                } catch (error) {
                    console.warn('Endposition konnte nicht ermittelt werden:', error);
                }
            }

            // GPS-Tracking stoppen
            if (window.gpsManager) {
                window.gpsManager.stopTracking();
            }

            // Live-Tracking auf Karte stoppen
            if (window.mapManager) {
                window.mapManager.stopLiveTracking();
            }

            // Timer stoppen
            this.stopTrackingTimer();

            // Fahrt-Daten aktualisieren
            this.currentTrip.endTime = new Date().toISOString();
            this.currentTrip.endLocation = endLocation;
            this.currentTrip.status = 'completed';

            // Fahrtdauer berechnen
            if (this.startTime) {
                const endTime = new Date();
                this.currentTrip.duration = Math.round((endTime - this.startTime) / (1000 * 60)); // Minuten
            }

            // Distanz aus GPS-Daten berechnen
            if (window.gpsManager) {
                try {
                    const route = await window.gpsManager.createRouteFromTrip(this.currentTrip.id);
                    this.currentTrip.distance = route.distance;
                } catch (error) {
                    console.warn('Distanz konnte nicht berechnet werden:', error);
                }
            }

            // Zusätzliche Daten hinzufügen
            Object.assign(this.currentTrip, endData);

            // In Datenbank aktualisieren
            await window.dbManager.update('trips', this.currentTrip);

            // Tracking-Status zurücksetzen
            const completedTrip = { ...this.currentTrip };
            this.currentTrip = null;
            this.isTracking = false;
            this.startTime = null;

            // UI aktualisieren
            this.updateTripUI();

            // Callbacks benachrichtigen
            this.notifyCallbacks('tripEnded', completedTrip);

            console.log('Fahrt beendet:', completedTrip.id);
            return completedTrip;

        } catch (error) {
            console.error('Fehler beim Beenden der Fahrt:', error);
            this.notifyCallbacks('error', error);
            throw error;
        }
    }

    // Fahrt pausieren
    async pauseTrip() {
        if (!this.isTracking || !this.currentTrip) {
            throw new Error('Keine aktive Fahrt vorhanden');
        }

        // GPS-Tracking pausieren
        if (window.gpsManager) {
            window.gpsManager.stopTracking();
        }

        // Timer pausieren
        this.stopTrackingTimer();

        this.currentTrip.status = 'paused';
        await window.dbManager.update('trips', this.currentTrip);

        this.updateTripUI();
        console.log('Fahrt pausiert');
    }

    // Fahrt fortsetzen
    async resumeTrip() {
        if (!this.currentTrip || this.currentTrip.status !== 'paused') {
            throw new Error('Keine pausierte Fahrt vorhanden');
        }

        // GPS-Tracking fortsetzen
        if (window.gpsManager) {
            window.gpsManager.startTracking(this.currentTrip.id);
        }

        // Timer fortsetzen
        this.startTrackingTimer();

        this.currentTrip.status = 'active';
        await window.dbManager.update('trips', this.currentTrip);

        this.updateTripUI();
        console.log('Fahrt fortgesetzt');
    }

    // Fahrt abbrechen
    async cancelTrip(reason = '') {
        try {
            if (!this.currentTrip) {
                throw new Error('Keine aktive Fahrt vorhanden');
            }

            console.log('Breche Fahrt ab...');

            // GPS-Tracking stoppen
            if (window.gpsManager) {
                window.gpsManager.stopTracking();
            }

            // Live-Tracking stoppen
            if (window.mapManager) {
                window.mapManager.stopLiveTracking();
            }

            // Timer stoppen
            this.stopTrackingTimer();

            // Fahrt als abgebrochen markieren
            this.currentTrip.status = 'cancelled';
            this.currentTrip.endTime = new Date().toISOString();
            this.currentTrip.notes = this.currentTrip.notes ? 
                `${this.currentTrip.notes}\nAbbruch: ${reason}` : 
                `Abbruch: ${reason}`;

            // In Datenbank aktualisieren
            await window.dbManager.update('trips', this.currentTrip);

            // Status zurücksetzen
            const cancelledTrip = { ...this.currentTrip };
            this.currentTrip = null;
            this.isTracking = false;
            this.startTime = null;

            // UI aktualisieren
            this.updateTripUI();

            console.log('Fahrt abgebrochen:', cancelledTrip.id);
            return cancelledTrip;

        } catch (error) {
            console.error('Fehler beim Abbrechen der Fahrt:', error);
            throw error;
        }
    }

    // Fahrgast zur aktuellen Fahrt hinzufügen
    async addPassengerToCurrentTrip(passengerId) {
        if (!this.currentTrip) {
            throw new Error('Keine aktive Fahrt vorhanden');
        }

        if (this.currentTrip.addPassenger(passengerId)) {
            await window.dbManager.update('trips', this.currentTrip);
            this.updateTripUI();
            this.notifyCallbacks('tripUpdated', this.currentTrip);
            return true;
        }
        return false;
    }

    // Fahrgast aus aktueller Fahrt entfernen
    async removePassengerFromCurrentTrip(passengerId) {
        if (!this.currentTrip) {
            throw new Error('Keine aktive Fahrt vorhanden');
        }

        if (this.currentTrip.removePassenger(passengerId)) {
            await window.dbManager.update('trips', this.currentTrip);
            this.updateTripUI();
            this.notifyCallbacks('tripUpdated', this.currentTrip);
            return true;
        }
        return false;
    }

    // Tracking-Timer starten
    startTrackingTimer() {
        this.trackingTimer = setInterval(() => {
            this.updateTripDuration();
        }, 1000); // Jede Sekunde aktualisieren
    }

    // Tracking-Timer stoppen
    stopTrackingTimer() {
        if (this.trackingTimer) {
            clearInterval(this.trackingTimer);
            this.trackingTimer = null;
        }
    }

    // Fahrtdauer aktualisieren
    updateTripDuration() {
        if (!this.startTime || !this.isTracking) return;

        const now = new Date();
        const durationMs = now - this.startTime;
        const durationMinutes = Math.floor(durationMs / (1000 * 60));
        const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);

        // UI-Element aktualisieren
        const durationElement = document.getElementById('tripDuration');
        if (durationElement) {
            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;
            durationElement.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${durationSeconds.toString().padStart(2, '0')}`;
        }
    }

    // Trip-UI aktualisieren
    updateTripUI() {
        const tripInfo = document.getElementById('tripInfo');
        const startBtn = document.getElementById('startTripBtn');
        const stopBtn = document.getElementById('stopTripBtn');

        if (this.isTracking && this.currentTrip) {
            // Fahrt läuft
            if (tripInfo) tripInfo.style.display = 'block';
            if (startBtn) startBtn.style.display = 'none';
            if (stopBtn) stopBtn.style.display = 'block';

            // Distanz aktualisieren
            this.updateTripDistance();
        } else {
            // Keine aktive Fahrt
            if (tripInfo) tripInfo.style.display = 'none';
            if (startBtn) startBtn.style.display = 'block';
            if (stopBtn) stopBtn.style.display = 'none';
        }
    }

    // Fahrtdistanz aktualisieren
    async updateTripDistance() {
        if (!this.currentTrip || !window.gpsManager) return;

        try {
            const route = await window.gpsManager.createRouteFromTrip(this.currentTrip.id);
            const distanceElement = document.getElementById('tripDistance');
            if (distanceElement) {
                distanceElement.textContent = `${route.distance.toFixed(1)} km`;
            }
        } catch (error) {
            console.warn('Distanz konnte nicht aktualisiert werden:', error);
        }
    }

    // GPS-Berechtigung prüfen
    async checkGPSPermission() {
        if (!window.gpsManager) return false;

        const permission = await window.gpsManager.checkPermission();
        return permission.state === 'granted';
    }

    // Adresse aus Koordinaten ermitteln
    async getAddressFromCoordinates(lat, lng) {
        if (!window.mapManager) return null;

        try {
            const result = await window.mapManager.reverseGeocode(lat, lng);
            return result.address;
        } catch (error) {
            console.warn('Adresse konnte nicht ermittelt werden:', error);
            return null;
        }
    }

    // Aktive Fahrt laden (beim App-Start)
    async loadActiveTrip() {
        try {
            const activeTrip = await window.dbManager.getActiveTrip();
            if (activeTrip) {
                this.currentTrip = activeTrip;
                this.isTracking = true;
                this.startTime = new Date(activeTrip.startTime);

                // GPS-Tracking fortsetzen
                if (window.gpsManager) {
                    window.gpsManager.startTracking(activeTrip.id);
                }

                // Timer starten
                this.startTrackingTimer();

                // UI aktualisieren
                this.updateTripUI();

                console.log('Aktive Fahrt geladen:', activeTrip.id);
                return activeTrip;
            }
        } catch (error) {
            console.error('Fehler beim Laden der aktiven Fahrt:', error);
        }
        return null;
    }

    // Fahrt-Statistiken abrufen
    async getTripStats(tripId) {
        try {
            const trip = await window.dbManager.read('trips', tripId);
            if (!trip) {
                throw new Error('Fahrt nicht gefunden');
            }

            const stats = {
                duration: trip.duration || 0,
                distance: trip.distance || 0,
                averageSpeed: 0,
                maxSpeed: 0,
                gpsPoints: 0
            };

            // GPS-Daten analysieren
            if (window.gpsManager) {
                const route = await window.gpsManager.createRouteFromTrip(tripId);
                stats.gpsPoints = route.points.length;
                
                if (stats.duration > 0 && stats.distance > 0) {
                    stats.averageSpeed = (stats.distance / (stats.duration / 60)).toFixed(1); // km/h
                }

                // Maximale Geschwindigkeit aus GPS-Daten
                const speedValues = route.points
                    .map(p => p.speed)
                    .filter(s => s !== null && s !== undefined);
                
                if (speedValues.length > 0) {
                    stats.maxSpeed = (Math.max(...speedValues) * 3.6).toFixed(1); // m/s zu km/h
                }
            }

            return stats;
        } catch (error) {
            console.error('Fehler beim Abrufen der Fahrt-Statistiken:', error);
            throw error;
        }
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

    // Status abrufen
    getStatus() {
        return {
            isTracking: this.isTracking,
            currentTrip: this.currentTrip,
            startTime: this.startTime,
            duration: this.startTime ? Math.floor((new Date() - this.startTime) / 1000) : 0
        };
    }

    // Cleanup
    cleanup() {
        this.stopTrackingTimer();
        if (window.gpsManager) {
            window.gpsManager.stopTracking();
        }
        if (window.mapManager) {
            window.mapManager.stopLiveTracking();
        }
        this.currentTrip = null;
        this.isTracking = false;
        this.startTime = null;
    }
}

// Globale Trip-Tracker-Instanz
window.tripTracker = new TripTracker();

