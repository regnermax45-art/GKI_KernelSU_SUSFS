// Karten-Manager für AWO Fahrdienst App mit OpenStreetMap
class MapManager {
    constructor() {
        this.map = null;
        this.currentLocationMarker = null;
        this.tripMarkers = [];
        this.routePolyline = null;
        this.isInitialized = false;
        this.defaultCenter = [52.5200, 13.4050]; // Berlin als Standard
        this.defaultZoom = 13;
        
        // Marker-Icons
        this.icons = {
            currentLocation: null,
            startPoint: null,
            endPoint: null,
            waypoint: null,
            passenger: null
        };
        
        this.initializeIcons();
    }

    // Karten-Icons initialisieren
    initializeIcons() {
        // Aktueller Standort (blauer Punkt)
        this.icons.currentLocation = L.divIcon({
            className: 'current-location-marker',
            html: '<div class="location-dot"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        // Startpunkt (grüner Marker)
        this.icons.startPoint = L.divIcon({
            className: 'start-point-marker',
            html: '<div class="marker-icon start">🚗</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });

        // Endpunkt (roter Marker)
        this.icons.endPoint = L.divIcon({
            className: 'end-point-marker',
            html: '<div class="marker-icon end">🏁</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });

        // Wegpunkt (gelber Marker)
        this.icons.waypoint = L.divIcon({
            className: 'waypoint-marker',
            html: '<div class="marker-icon waypoint">📍</div>',
            iconSize: [25, 25],
            iconAnchor: [12, 25]
        });

        // Fahrgast (Person-Icon)
        this.icons.passenger = L.divIcon({
            className: 'passenger-marker',
            html: '<div class="marker-icon passenger">👤</div>',
            iconSize: [25, 25],
            iconAnchor: [12, 25]
        });
    }

    // Karte initialisieren
    async init(containerId = 'map') {
        try {
            console.log('Initialisiere Karte...');
            
            // Karte erstellen
            this.map = L.map(containerId, {
                center: this.defaultCenter,
                zoom: this.defaultZoom,
                zoomControl: true,
                attributionControl: true
            });

            // OpenStreetMap Tiles hinzufügen
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
                subdomains: ['a', 'b', 'c']
            }).addTo(this.map);

            // Alternative Tile-Layer für bessere Verfügbarkeit
            const alternativeTiles = L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 18,
                subdomains: ['a', 'b', 'c']
            });

            // Event-Listener für Karten-Events
            this.map.on('click', (e) => {
                this.onMapClick(e);
            });

            this.map.on('locationfound', (e) => {
                this.onLocationFound(e);
            });

            this.map.on('locationerror', (e) => {
                this.onLocationError(e);
            });

            // CSS für Marker hinzufügen
            this.addMarkerStyles();

            this.isInitialized = true;
            console.log('Karte erfolgreich initialisiert');

            // Aktuelle Position anzeigen
            await this.showCurrentLocation();

        } catch (error) {
            console.error('Fehler beim Initialisieren der Karte:', error);
            throw error;
        }
    }

    // CSS-Styles für Marker hinzufügen
    addMarkerStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .current-location-marker {
                background: transparent;
                border: none;
            }
            
            .location-dot {
                width: 16px;
                height: 16px;
                background: #2196F3;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            .marker-icon {
                background: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                border: 2px solid #fff;
            }
            
            .marker-icon.start {
                background: #4CAF50;
            }
            
            .marker-icon.end {
                background: #F44336;
            }
            
            .marker-icon.waypoint {
                background: #FF9800;
            }
            
            .marker-icon.passenger {
                background: #9C27B0;
            }
        `;
        document.head.appendChild(style);
    }

    // Aktuelle Position anzeigen
    async showCurrentLocation() {
        if (!window.gpsManager) {
            console.warn('GPS-Manager nicht verfügbar');
            return;
        }

        try {
            const position = await window.gpsManager.getCurrentPosition();
            this.updateCurrentLocationMarker(position.latitude, position.longitude);
            this.map.setView([position.latitude, position.longitude], 15);
        } catch (error) {
            console.warn('Aktuelle Position konnte nicht ermittelt werden:', error);
            // Fallback auf Berlin
            this.map.setView(this.defaultCenter, this.defaultZoom);
        }
    }

    // Marker für aktuelle Position aktualisieren
    updateCurrentLocationMarker(lat, lng) {
        if (this.currentLocationMarker) {
            this.currentLocationMarker.setLatLng([lat, lng]);
        } else {
            this.currentLocationMarker = L.marker([lat, lng], {
                icon: this.icons.currentLocation,
                title: 'Aktuelle Position'
            }).addTo(this.map);
        }
    }

    // Karte auf Position zentrieren
    centerOnLocation(lat, lng, zoom = 15) {
        if (!this.isInitialized) return;
        this.map.setView([lat, lng], zoom);
    }

    // Fahrt-Route anzeigen
    async displayTripRoute(tripId) {
        if (!window.gpsManager || !window.dbManager) {
            console.warn('GPS-Manager oder Datenbankmanager nicht verfügbar');
            return;
        }

        try {
            // Bestehende Route entfernen
            this.clearRoute();

            // GPS-Punkte der Fahrt laden
            const gpsPoints = await window.dbManager.getTripTrack(tripId);
            
            if (gpsPoints.length === 0) {
                console.warn('Keine GPS-Punkte für Fahrt gefunden');
                return;
            }

            // Punkte nach Zeitstempel sortieren
            gpsPoints.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Route als Polyline anzeigen
            const routePoints = gpsPoints.map(point => [point.latitude, point.longitude]);
            
            this.routePolyline = L.polyline(routePoints, {
                color: '#2196F3',
                weight: 4,
                opacity: 0.8,
                smoothFactor: 1
            }).addTo(this.map);

            // Start- und Endpunkt markieren
            if (gpsPoints.length > 0) {
                const startPoint = gpsPoints[0];
                const endPoint = gpsPoints[gpsPoints.length - 1];

                L.marker([startPoint.latitude, startPoint.longitude], {
                    icon: this.icons.startPoint,
                    title: `Start: ${new Date(startPoint.timestamp).toLocaleTimeString()}`
                }).addTo(this.map);

                L.marker([endPoint.latitude, endPoint.longitude], {
                    icon: this.icons.endPoint,
                    title: `Ende: ${new Date(endPoint.timestamp).toLocaleTimeString()}`
                }).addTo(this.map);
            }

            // Karte auf Route zentrieren
            this.map.fitBounds(this.routePolyline.getBounds(), { padding: [20, 20] });

            console.log(`Route mit ${gpsPoints.length} Punkten angezeigt`);

        } catch (error) {
            console.error('Fehler beim Anzeigen der Route:', error);
        }
    }

    // Live-Tracking für aktive Fahrt
    startLiveTracking(tripId) {
        if (!window.gpsManager) {
            console.warn('GPS-Manager nicht verfügbar');
            return;
        }

        // GPS-Updates abonnieren
        window.gpsManager.on('positionUpdate', (position) => {
            this.updateCurrentLocationMarker(position.latitude, position.longitude);
            
            // Route erweitern wenn vorhanden
            if (this.routePolyline) {
                const currentLatLngs = this.routePolyline.getLatLngs();
                currentLatLngs.push([position.latitude, position.longitude]);
                this.routePolyline.setLatLngs(currentLatLngs);
            } else {
                // Neue Route beginnen
                this.routePolyline = L.polyline([[position.latitude, position.longitude]], {
                    color: '#4CAF50',
                    weight: 4,
                    opacity: 0.8
                }).addTo(this.map);
            }
        });

        console.log('Live-Tracking gestartet');
    }

    // Live-Tracking stoppen
    stopLiveTracking() {
        if (window.gpsManager) {
            window.gpsManager.off('positionUpdate');
        }
        console.log('Live-Tracking gestoppt');
    }

    // Route löschen
    clearRoute() {
        if (this.routePolyline) {
            this.map.removeLayer(this.routePolyline);
            this.routePolyline = null;
        }

        // Alle Trip-Marker entfernen
        this.tripMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.tripMarkers = [];
    }

    // Fahrgast-Marker hinzufügen
    addPassengerMarker(lat, lng, passengerName, address = '') {
        const marker = L.marker([lat, lng], {
            icon: this.icons.passenger,
            title: `${passengerName}${address ? ' - ' + address : ''}`
        }).addTo(this.map);

        // Popup mit Fahrgast-Informationen
        marker.bindPopup(`
            <div class="passenger-popup">
                <h4>${passengerName}</h4>
                ${address ? `<p><strong>Adresse:</strong> ${address}</p>` : ''}
                <p><strong>Koordinaten:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
            </div>
        `);

        this.tripMarkers.push(marker);
        return marker;
    }

    // Wegpunkt hinzufügen
    addWaypoint(lat, lng, title = 'Wegpunkt') {
        const marker = L.marker([lat, lng], {
            icon: this.icons.waypoint,
            title: title
        }).addTo(this.map);

        this.tripMarkers.push(marker);
        return marker;
    }

    // Adresse zu Koordinaten konvertieren (Geocoding)
    async geocodeAddress(address) {
        try {
            // Nominatim API für Geocoding verwenden
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
            );
            
            const data = await response.json();
            
            if (data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    displayName: data[0].display_name
                };
            } else {
                throw new Error('Adresse nicht gefunden');
            }
        } catch (error) {
            console.error('Geocoding-Fehler:', error);
            throw error;
        }
    }

    // Koordinaten zu Adresse konvertieren (Reverse Geocoding)
    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            
            const data = await response.json();
            
            if (data.display_name) {
                return {
                    address: data.display_name,
                    city: data.address?.city || data.address?.town || data.address?.village || '',
                    postcode: data.address?.postcode || '',
                    country: data.address?.country || ''
                };
            } else {
                throw new Error('Adresse nicht gefunden');
            }
        } catch (error) {
            console.error('Reverse Geocoding-Fehler:', error);
            throw error;
        }
    }

    // Distanz zwischen zwei Punkten berechnen
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Erdradius in km
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lng2 - lng1);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Grad zu Radiant
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Event-Handler für Karten-Klick
    onMapClick(e) {
        console.log('Karte geklickt:', e.latlng);
        
        // Event für andere Komponenten auslösen
        const event = new CustomEvent('mapClick', {
            detail: {
                lat: e.latlng.lat,
                lng: e.latlng.lng
            }
        });
        document.dispatchEvent(event);
    }

    // Event-Handler für gefundene Position
    onLocationFound(e) {
        console.log('Position gefunden:', e.latlng);
        this.updateCurrentLocationMarker(e.latlng.lat, e.latlng.lng);
    }

    // Event-Handler für Positionsfehler
    onLocationError(e) {
        console.warn('Positionsfehler:', e.message);
    }

    // Karten-Bounds für mehrere Punkte berechnen
    getBoundsForPoints(points) {
        if (points.length === 0) return null;
        
        const group = new L.featureGroup(
            points.map(point => L.marker([point.lat, point.lng]))
        );
        
        return group.getBounds();
    }

    // Karte auf mehrere Punkte zentrieren
    fitBoundsToPoints(points, padding = [20, 20]) {
        const bounds = this.getBoundsForPoints(points);
        if (bounds) {
            this.map.fitBounds(bounds, { padding });
        }
    }

    // Screenshot der Karte erstellen
    async takeMapScreenshot() {
        try {
            // Leaflet-Image Plugin würde hier verwendet werden
            // Für den Prototyp verwenden wir eine einfache Implementierung
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Karten-Container als Bild erfassen
            const mapContainer = this.map.getContainer();
            
            // Hier würde normalerweise html2canvas oder ähnliches verwendet
            console.log('Screenshot-Funktion würde hier implementiert');
            
            return null; // Placeholder
        } catch (error) {
            console.error('Fehler beim Erstellen des Screenshots:', error);
            throw error;
        }
    }

    // Karte für Druck optimieren
    preparePrintView() {
        // Zoom-Controls ausblenden
        this.map.zoomControl.remove();
        
        // Attribution kompakter machen
        this.map.attributionControl.setPrefix('');
        
        console.log('Karte für Druck vorbereitet');
    }

    // Normale Ansicht wiederherstellen
    restoreNormalView() {
        // Zoom-Controls wieder anzeigen
        this.map.addControl(L.control.zoom());
        
        console.log('Normale Kartenansicht wiederhergestellt');
    }

    // Karte zerstören
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.isInitialized = false;
        console.log('Karte zerstört');
    }

    // Status der Karte abrufen
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            center: this.map ? this.map.getCenter() : null,
            zoom: this.map ? this.map.getZoom() : null,
            hasRoute: !!this.routePolyline,
            markerCount: this.tripMarkers.length
        };
    }
}

// Globale Karten-Manager-Instanz
window.mapManager = new MapManager();

