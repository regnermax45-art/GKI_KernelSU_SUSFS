// Haupt-App für AWO Fahrdienst
class AWOFahrdienstApp {
    constructor() {
        this.isInitialized = false;
        this.version = '1.0.0';
        this.isOnline = navigator.onLine;
        this.installPrompt = null;
        
        console.log(`AWO Fahrdienst App v${this.version} wird gestartet...`);
    }

    // App initialisieren
    async init() {
        try {
            console.log('Initialisiere App-Komponenten...');

            // Online/Offline Status überwachen
            this.setupNetworkMonitoring();

            // PWA Install-Prompt handhaben
            this.setupPWAInstall();

            // Datenbank initialisieren
            await this.initDatabase();

            // GPS-Manager initialisieren
            this.initGPS();

            // Navigation initialisieren
            this.initNavigation();

            // Event-Listener einrichten
            this.setupEventListeners();

            // Aktive Fahrt wiederherstellen
            await this.restoreActiveTrip();

            // UI initialisieren
            this.initUI();

            this.isInitialized = true;
            console.log('App erfolgreich initialisiert');

            // Willkommensnachricht anzeigen
            this.showWelcomeMessage();

        } catch (error) {
            console.error('Fehler beim Initialisieren der App:', error);
            this.showError('App konnte nicht gestartet werden: ' + error.message);
        }
    }

    // Datenbank initialisieren
    async initDatabase() {
        try {
            await window.dbManager.init();
            console.log('Datenbank initialisiert');

            // Beispieldaten erstellen falls leer
            await this.createSampleDataIfEmpty();

        } catch (error) {
            console.error('Datenbankfehler:', error);
            throw new Error('Datenbank konnte nicht initialisiert werden');
        }
    }

    // GPS initialisieren
    initGPS() {
        if (window.gpsManager) {
            // GPS-Events abonnieren
            window.gpsManager.on('positionUpdate', (position) => {
                this.onGPSUpdate(position);
            });

            window.gpsManager.on('error', (error) => {
                this.onGPSError(error);
            });

            console.log('GPS-Manager initialisiert');
        }
    }

    // Navigation initialisieren
    initNavigation() {
        if (window.navigationManager) {
            window.navigationManager.init();
            console.log('Navigation initialisiert');
        }
    }

    // Event-Listener einrichten
    setupEventListeners() {
        // Fahrt-Buttons
        const startTripBtn = document.getElementById('startTripBtn');
        const stopTripBtn = document.getElementById('stopTripBtn');
        const centerLocationBtn = document.getElementById('centerLocationBtn');

        if (startTripBtn) {
            startTripBtn.addEventListener('click', () => this.showStartTripDialog());
        }

        if (stopTripBtn) {
            stopTripBtn.addEventListener('click', () => this.stopCurrentTrip());
        }

        if (centerLocationBtn) {
            centerLocationBtn.addEventListener('click', () => this.centerOnCurrentLocation());
        }

        // Neue Einträge erstellen
        const newTripBtn = document.getElementById('newTripBtn');
        const newPersonBtn = document.getElementById('newPersonBtn');
        const generateReportBtn = document.getElementById('generateReportBtn');

        if (newTripBtn) {
            newTripBtn.addEventListener('click', () => this.showStartTripDialog());
        }

        if (newPersonBtn) {
            newPersonBtn.addEventListener('click', () => this.showPersonDialog());
        }

        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => this.showReportDialog());
        }

        // Suchfelder
        const tripSearch = document.getElementById('tripSearch');
        const personSearch = document.getElementById('personSearch');

        if (tripSearch) {
            tripSearch.addEventListener('input', (e) => this.filterTrips(e.target.value));
        }

        if (personSearch) {
            personSearch.addEventListener('input', (e) => this.filterPersons(e.target.value));
        }

        // Trip-Tracker Events
        if (window.tripTracker) {
            window.tripTracker.on('tripStarted', (trip) => {
                this.onTripStarted(trip);
            });

            window.tripTracker.on('tripEnded', (trip) => {
                this.onTripEnded(trip);
            });

            window.tripTracker.on('error', (error) => {
                this.showError('Fahrt-Fehler: ' + error.message);
            });
        }

        console.log('Event-Listener eingerichtet');
    }

    // Netzwerk-Monitoring einrichten
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateConnectionStatus();
            this.showToast('Verbindung wiederhergestellt', 'success');
            
            // Daten synchronisieren
            if (window.dbManager) {
                window.dbManager.syncPendingData();
            }
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus();
            this.showToast('Offline-Modus aktiviert', 'warning');
        });

        this.updateConnectionStatus();
    }

    // Verbindungsstatus aktualisieren
    updateConnectionStatus() {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');

        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${this.isOnline ? 'online' : 'offline'}`;
        }

        if (statusText) {
            statusText.textContent = this.isOnline ? 'Online' : 'Offline';
        }
    }

    // PWA-Installation einrichten
    setupPWAInstall() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            this.installPrompt = null;
            this.hideInstallButton();
            this.showToast('App erfolgreich installiert!', 'success');
        });
    }

    // Install-Button anzeigen
    showInstallButton() {
        // Hier könnte ein Install-Button in der UI angezeigt werden
        console.log('PWA kann installiert werden');
    }

    // Install-Button ausblenden
    hideInstallButton() {
        console.log('PWA-Installation abgeschlossen');
    }

    // PWA installieren
    async installPWA() {
        if (this.installPrompt) {
            this.installPrompt.prompt();
            const result = await this.installPrompt.userChoice;
            
            if (result.outcome === 'accepted') {
                console.log('PWA-Installation akzeptiert');
            } else {
                console.log('PWA-Installation abgelehnt');
            }
            
            this.installPrompt = null;
        }
    }

    // Aktive Fahrt wiederherstellen
    async restoreActiveTrip() {
        if (window.tripTracker) {
            const activeTrip = await window.tripTracker.loadActiveTrip();
            if (activeTrip) {
                console.log('Aktive Fahrt wiederhergestellt:', activeTrip.id);
                this.showToast('Aktive Fahrt fortgesetzt', 'info');
            }
        }
    }

    // UI initialisieren
    initUI() {
        // Karte initialisieren wenn auf Map-Tab
        if (window.navigationManager && window.navigationManager.currentTab === 'map') {
            setTimeout(() => {
                if (window.mapManager) {
                    window.mapManager.init().catch(console.error);
                }
            }, 100);
        }

        // Loading-Spinner ausblenden
        this.hideLoadingSpinner();
    }

    // Beispieldaten erstellen
    async createSampleDataIfEmpty() {
        try {
            const persons = await window.dbManager.getAll('persons');
            
            if (persons.length === 0) {
                console.log('Erstelle Beispieldaten...');
                
                // Beispiel-Fahrer
                const driver = new Person({
                    name: 'Max Mustermann',
                    firstName: 'Max',
                    lastName: 'Mustermann',
                    type: 'driver',
                    phone: '030 12345678',
                    email: 'max.mustermann@awo-opr.de',
                    licenseNumber: 'B123456789',
                    employeeId: 'AWO001'
                });

                await window.dbManager.createPerson(driver);

                // Beispiel-Fahrgäste
                const passengers = [
                    new Person({
                        name: 'Anna Schmidt',
                        firstName: 'Anna',
                        lastName: 'Schmidt',
                        type: 'passenger',
                        address: 'Musterstraße 123, 16816 Neuruppin',
                        phone: '03391 123456',
                        mobility: 'wheelchair'
                    }),
                    new Person({
                        name: 'Hans Müller',
                        firstName: 'Hans',
                        lastName: 'Müller',
                        type: 'passenger',
                        address: 'Hauptstraße 45, 16816 Neuruppin',
                        phone: '03391 654321',
                        mobility: 'walker'
                    })
                ];

                for (const passenger of passengers) {
                    await window.dbManager.createPerson(passenger);
                }

                console.log('Beispieldaten erstellt');
            }
        } catch (error) {
            console.error('Fehler beim Erstellen der Beispieldaten:', error);
        }
    }

    // Fahrt-Start-Dialog anzeigen
    async showStartTripDialog() {
        try {
            // Verfügbare Fahrer laden
            const drivers = await window.dbManager.getAll('persons', 'type', 'driver');
            const passengers = await window.dbManager.getAll('persons', 'type', 'passenger');

            if (drivers.length === 0) {
                this.showError('Keine Fahrer verfügbar. Bitte erst einen Fahrer anlegen.');
                return;
            }

            const modalContent = `
                <div class="start-trip-dialog">
                    <h3>Neue Fahrt starten</h3>
                    <form id="startTripForm">
                        <div class="form-group">
                            <label for="driverSelect">Fahrer:</label>
                            <select id="driverSelect" required>
                                <option value="">Fahrer auswählen...</option>
                                ${drivers.map(driver => 
                                    `<option value="${driver.id}">${driver.getDisplayName()}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="tripType">Fahrttyp:</label>
                            <select id="tripType">
                                <option value="regular">Reguläre Fahrt</option>
                                <option value="medical">Arzttermin</option>
                                <option value="shopping">Einkaufsfahrt</option>
                                <option value="emergency">Notfall</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="destination">Ziel:</label>
                            <input type="text" id="destination" placeholder="Zieladresse eingeben...">
                        </div>

                        <div class="form-group">
                            <label>Fahrgäste:</label>
                            <div class="passenger-list">
                                ${passengers.map(passenger => `
                                    <label class="checkbox-label">
                                        <input type="checkbox" name="passengers" value="${passenger.id}">
                                        ${passenger.getDisplayName()}
                                        ${passenger.mobility !== 'normal' ? `<span class="mobility-indicator">(${passenger.mobility})</span>` : ''}
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="notes">Notizen:</label>
                            <textarea id="notes" placeholder="Besondere Hinweise..."></textarea>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn" onclick="navigationManager.closeModal()">Abbrechen</button>
                            <button type="submit" class="btn primary">Fahrt starten</button>
                        </div>
                    </form>
                </div>
            `;

            window.navigationManager.showModal(modalContent);

            // Form-Submit-Handler
            const form = document.getElementById('startTripForm');
            form.addEventListener('submit', (e) => this.handleStartTripSubmit(e));

        } catch (error) {
            console.error('Fehler beim Anzeigen des Start-Dialogs:', error);
            this.showError('Dialog konnte nicht geöffnet werden');
        }
    }

    // Fahrt-Start-Formular verarbeiten
    async handleStartTripSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const driverId = parseInt(formData.get('driverSelect'));
            const tripType = formData.get('tripType');
            const destination = formData.get('destination');
            const notes = formData.get('notes');
            
            // Ausgewählte Fahrgäste sammeln
            const passengerCheckboxes = document.querySelectorAll('input[name="passengers"]:checked');
            const passengers = Array.from(passengerCheckboxes).map(cb => parseInt(cb.value));

            if (!driverId) {
                this.showError('Bitte einen Fahrer auswählen');
                return;
            }

            // Fahrt starten
            const tripData = {
                tripType,
                destination,
                notes
            };

            await window.tripTracker.startTrip(driverId, passengers, tripData);
            
            window.navigationManager.closeModal();
            window.navigationManager.switchTab('map');
            
            this.showToast('Fahrt gestartet!', 'success');

        } catch (error) {
            console.error('Fehler beim Starten der Fahrt:', error);
            this.showError('Fahrt konnte nicht gestartet werden: ' + error.message);
        }
    }

    // Aktuelle Fahrt stoppen
    async stopCurrentTrip() {
        try {
            if (!window.tripTracker.isTracking) {
                this.showError('Keine aktive Fahrt vorhanden');
                return;
            }

            const result = confirm('Fahrt wirklich beenden?');
            if (!result) return;

            await window.tripTracker.endTrip();
            this.showToast('Fahrt beendet!', 'success');

        } catch (error) {
            console.error('Fehler beim Beenden der Fahrt:', error);
            this.showError('Fahrt konnte nicht beendet werden: ' + error.message);
        }
    }

    // Auf aktuelle Position zentrieren
    async centerOnCurrentLocation() {
        try {
            if (window.mapManager && window.gpsManager) {
                const position = await window.gpsManager.getCurrentPosition();
                window.mapManager.centerOnLocation(position.latitude, position.longitude);
                this.showToast('Position aktualisiert', 'success');
            }
        } catch (error) {
            console.error('Fehler beim Zentrieren:', error);
            this.showError('Position konnte nicht ermittelt werden');
        }
    }

    // Person-Dialog anzeigen
    showPersonDialog(personId = null) {
        // Implementation für Person hinzufügen/bearbeiten
        console.log('Person-Dialog anzeigen:', personId);
    }

    // Nachweis-Dialog anzeigen
    showReportDialog() {
        // Implementation für Nachweis erstellen
        console.log('Nachweis-Dialog anzeigen');
    }

    // Fahrten filtern
    filterTrips(query) {
        // Implementation für Fahrt-Suche
        console.log('Fahrten filtern:', query);
    }

    // Personen filtern
    filterPersons(query) {
        // Implementation für Personen-Suche
        console.log('Personen filtern:', query);
    }

    // GPS-Update Event
    onGPSUpdate(position) {
        // Position auf Karte aktualisieren
        if (window.mapManager) {
            window.mapManager.updateCurrentLocationMarker(position.latitude, position.longitude);
        }
    }

    // GPS-Fehler Event
    onGPSError(error) {
        console.warn('GPS-Fehler:', error.message);
        
        // Nur bei kritischen Fehlern Benutzer informieren
        if (error.code === 1) { // PERMISSION_DENIED
            this.showError('GPS-Berechtigung erforderlich für Fahrt-Tracking');
        }
    }

    // Fahrt-Start Event
    onTripStarted(trip) {
        console.log('Fahrt gestartet:', trip.id);
        
        // UI aktualisieren
        if (window.navigationManager) {
            window.navigationManager.loadTripsList();
        }
    }

    // Fahrt-Ende Event
    onTripEnded(trip) {
        console.log('Fahrt beendet:', trip.id);
        
        // UI aktualisieren
        if (window.navigationManager) {
            window.navigationManager.loadTripsList();
        }

        // Nachweis-Erstellung anbieten
        setTimeout(() => {
            const createReport = confirm('Möchten Sie einen Nachweis für diese Fahrt erstellen?');
            if (createReport) {
                this.generateTripReport(trip.id);
            }
        }, 1000);
    }

    // Fahrt-Nachweis erstellen
    async generateTripReport(tripId) {
        try {
            if (window.pdfGenerator) {
                await window.pdfGenerator.generateTripReport(tripId);
                this.showToast('Nachweis erstellt!', 'success');
            } else {
                this.showError('PDF-Generator nicht verfügbar');
            }
        } catch (error) {
            console.error('Fehler beim Erstellen des Nachweises:', error);
            this.showError('Nachweis konnte nicht erstellt werden');
        }
    }

    // Willkommensnachricht anzeigen
    showWelcomeMessage() {
        const isFirstVisit = !localStorage.getItem('awo-fahrdienst-visited');
        
        if (isFirstVisit) {
            localStorage.setItem('awo-fahrdienst-visited', 'true');
            
            setTimeout(() => {
                this.showToast('Willkommen bei der AWO OPR Fahrdienst App!', 'info', 5000);
            }, 1000);
        }
    }

    // Loading-Spinner anzeigen
    showLoadingSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'flex';
        }
    }

    // Loading-Spinner ausblenden
    hideLoadingSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    // Toast-Benachrichtigung anzeigen
    showToast(message, type = 'info', duration = 3000) {
        if (window.navigationManager) {
            window.navigationManager.showToast(message, type, duration);
        } else {
            console.log(`Toast (${type}): ${message}`);
        }
    }

    // Fehler anzeigen
    showError(message) {
        this.showToast(message, 'error', 5000);
        console.error('App-Fehler:', message);
    }

    // App-Status abrufen
    getStatus() {
        return {
            version: this.version,
            isInitialized: this.isInitialized,
            isOnline: this.isOnline,
            components: {
                database: !!window.dbManager,
                gps: !!window.gpsManager,
                map: !!window.mapManager,
                tripTracker: !!window.tripTracker,
                navigation: !!window.navigationManager
            }
        };
    }

    // Cleanup beim Beenden
    cleanup() {
        if (window.tripTracker) {
            window.tripTracker.cleanup();
        }
        
        if (window.gpsManager) {
            window.gpsManager.cleanup();
        }
        
        if (window.mapManager) {
            window.mapManager.destroy();
        }
        
        console.log('App-Cleanup abgeschlossen');
    }
}

// App beim Laden der Seite starten
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM geladen, starte App...');
    
    window.app = new AWOFahrdienstApp();
    
    try {
        await window.app.init();
    } catch (error) {
        console.error('App-Start fehlgeschlagen:', error);
        
        // Fallback-UI anzeigen
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #f44336;">
                <h2>⚠️ App konnte nicht gestartet werden</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px;">
                    Neu laden
                </button>
            </div>
        `;
    }
});

// Cleanup beim Verlassen der Seite
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.cleanup();
    }
});

// Unhandled Promise Rejections abfangen
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    
    if (window.app) {
        window.app.showError('Ein unerwarteter Fehler ist aufgetreten');
    }
    
    event.preventDefault();
});

// Globale Fehlerbehandlung
window.addEventListener('error', (event) => {
    console.error('Globaler Fehler:', event.error);
    
    if (window.app) {
        window.app.showError('Ein Fehler ist aufgetreten');
    }
});

