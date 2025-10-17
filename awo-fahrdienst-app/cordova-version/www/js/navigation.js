// Navigation-Manager für AWO Fahrdienst App
class NavigationManager {
    constructor() {
        this.currentTab = 'map';
        this.tabs = ['map', 'trips', 'persons', 'reports'];
        this.isInitialized = false;
        this.history = [];
        this.maxHistoryLength = 10;
    }

    // Navigation initialisieren
    init() {
        console.log('Initialisiere Navigation...');
        
        // Tab-Buttons Event-Listener hinzufügen
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = item.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // URL-Parameter prüfen
        this.handleURLParameters();

        // Browser-Zurück-Button handhaben
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.tab) {
                this.switchTab(e.state.tab, false);
            }
        });

        // Keyboard-Shortcuts
        this.setupKeyboardShortcuts();

        this.isInitialized = true;
        console.log('Navigation initialisiert');
    }

    // Tab wechseln
    switchTab(tabName, addToHistory = true) {
        if (!this.tabs.includes(tabName)) {
            console.warn(`Unbekannter Tab: ${tabName}`);
            return false;
        }

        if (this.currentTab === tabName) {
            return true; // Bereits aktiver Tab
        }

        console.log(`Wechsle zu Tab: ${tabName}`);

        // Vorherigen Tab deaktivieren
        this.deactivateTab(this.currentTab);

        // Neuen Tab aktivieren
        this.activateTab(tabName);

        // History aktualisieren
        if (addToHistory) {
            this.addToHistory(tabName);
            this.updateURL(tabName);
        }

        // Tab-spezifische Initialisierung
        this.initializeTab(tabName);

        this.currentTab = tabName;
        return true;
    }

    // Tab aktivieren
    activateTab(tabName) {
        // Tab-Content anzeigen
        const tabContent = document.getElementById(`${tabName}Tab`);
        if (tabContent) {
            tabContent.classList.add('active');
        }

        // Navigation-Button aktivieren
        const navItem = document.querySelector(`[data-tab="${tabName}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }

        // Tab-spezifische Aktionen
        this.onTabActivated(tabName);
    }

    // Tab deaktivieren
    deactivateTab(tabName) {
        // Tab-Content ausblenden
        const tabContent = document.getElementById(`${tabName}Tab`);
        if (tabContent) {
            tabContent.classList.remove('active');
        }

        // Navigation-Button deaktivieren
        const navItem = document.querySelector(`[data-tab="${tabName}"]`);
        if (navItem) {
            navItem.classList.remove('active');
        }

        // Tab-spezifische Cleanup-Aktionen
        this.onTabDeactivated(tabName);
    }

    // Tab-spezifische Initialisierung
    async initializeTab(tabName) {
        switch (tabName) {
            case 'map':
                await this.initializeMapTab();
                break;
            case 'trips':
                await this.initializeTripsTab();
                break;
            case 'persons':
                await this.initializePersonsTab();
                break;
            case 'reports':
                await this.initializeReportsTab();
                break;
        }
    }

    // Karten-Tab initialisieren
    async initializeMapTab() {
        if (window.mapManager && !window.mapManager.isInitialized) {
            try {
                await window.mapManager.init();
            } catch (error) {
                console.error('Fehler beim Initialisieren der Karte:', error);
                this.showError('Karte konnte nicht geladen werden');
            }
        }

        // Aktuelle Fahrt anzeigen
        if (window.tripTracker && window.tripTracker.currentTrip) {
            const tripId = window.tripTracker.currentTrip.id;
            if (window.mapManager) {
                window.mapManager.displayTripRoute(tripId);
            }
        }
    }

    // Fahrten-Tab initialisieren
    async initializeTripsTab() {
        await this.loadTripsList();
    }

    // Personen-Tab initialisieren
    async initializePersonsTab() {
        await this.loadPersonsList();
    }

    // Nachweise-Tab initialisieren
    async initializeReportsTab() {
        await this.loadReportsList();
    }

    // Tab-Aktivierung Event
    onTabActivated(tabName) {
        console.log(`Tab aktiviert: ${tabName}`);
        
        // Custom Event auslösen
        const event = new CustomEvent('tabActivated', {
            detail: { tabName, previousTab: this.currentTab }
        });
        document.dispatchEvent(event);
    }

    // Tab-Deaktivierung Event
    onTabDeactivated(tabName) {
        console.log(`Tab deaktiviert: ${tabName}`);
        
        // Custom Event auslösen
        const event = new CustomEvent('tabDeactivated', {
            detail: { tabName }
        });
        document.dispatchEvent(event);
    }

    // Fahrten-Liste laden
    async loadTripsList() {
        try {
            const tripsList = document.getElementById('tripsList');
            if (!tripsList || !window.dbManager) return;

            // Loading-Indikator anzeigen
            tripsList.innerHTML = '<div class="loading">Lade Fahrten...</div>';

            // Fahrten aus Datenbank laden
            const trips = await window.dbManager.getAll('trips');
            
            // Nach Datum sortieren (neueste zuerst)
            trips.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Liste rendern
            if (trips.length === 0) {
                tripsList.innerHTML = '<div class="empty-state">Keine Fahrten vorhanden</div>';
            } else {
                tripsList.innerHTML = trips.map(trip => this.renderTripCard(trip)).join('');
                
                // Event-Listener für Trip-Cards hinzufügen
                this.attachTripCardListeners();
            }

        } catch (error) {
            console.error('Fehler beim Laden der Fahrten:', error);
            const tripsList = document.getElementById('tripsList');
            if (tripsList) {
                tripsList.innerHTML = '<div class="error">Fehler beim Laden der Fahrten</div>';
            }
        }
    }

    // Trip-Card HTML rendern
    renderTripCard(trip) {
        const date = new Date(trip.date).toLocaleDateString('de-DE');
        const startTime = trip.startTime ? new Date(trip.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
        const endTime = trip.endTime ? new Date(trip.endTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
        
        return `
            <div class="item-card trip-card" data-trip-id="${trip.id}">
                <div class="item-header">
                    <div>
                        <div class="item-title">Fahrt #${trip.id}</div>
                        <div class="item-subtitle">${date} ${startTime}${endTime ? ' - ' + endTime : ''}</div>
                    </div>
                    <div class="meta-tag status ${trip.status}">${trip.getStatusText()}</div>
                </div>
                <div class="item-meta">
                    ${trip.distance ? `<span class="meta-tag">📏 ${trip.getFormattedDistance()}</span>` : ''}
                    ${trip.duration ? `<span class="meta-tag">⏱️ ${trip.getFormattedDuration()}</span>` : ''}
                    ${trip.passengers.length ? `<span class="meta-tag">👥 ${trip.passengers.length} Fahrgäste</span>` : ''}
                    ${trip.tripType !== 'regular' ? `<span class="meta-tag">🏷️ ${trip.getTripTypeText()}</span>` : ''}
                </div>
                ${trip.notes ? `<div class="item-notes">${trip.notes}</div>` : ''}
            </div>
        `;
    }

    // Event-Listener für Trip-Cards
    attachTripCardListeners() {
        const tripCards = document.querySelectorAll('.trip-card');
        tripCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const tripId = parseInt(card.getAttribute('data-trip-id'));
                this.showTripDetails(tripId);
            });
        });
    }

    // Trip-Details anzeigen
    async showTripDetails(tripId) {
        try {
            const trip = await window.dbManager.read('trips', tripId);
            if (!trip) {
                this.showError('Fahrt nicht gefunden');
                return;
            }

            // Modal mit Trip-Details öffnen
            const modalContent = `
                <div class="trip-details">
                    <h3>Fahrt #${trip.id}</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="status-badge ${trip.status}">${trip.getStatusText()}</span>
                        </div>
                        <div class="detail-item">
                            <label>Datum:</label>
                            <span>${new Date(trip.date).toLocaleDateString('de-DE')}</span>
                        </div>
                        <div class="detail-item">
                            <label>Startzeit:</label>
                            <span>${trip.startTime ? new Date(trip.startTime).toLocaleString('de-DE') : 'Nicht verfügbar'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Endzeit:</label>
                            <span>${trip.endTime ? new Date(trip.endTime).toLocaleString('de-DE') : 'Nicht verfügbar'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Dauer:</label>
                            <span>${trip.getFormattedDuration()}</span>
                        </div>
                        <div class="detail-item">
                            <label>Distanz:</label>
                            <span>${trip.getFormattedDistance()}</span>
                        </div>
                        <div class="detail-item">
                            <label>Fahrgäste:</label>
                            <span>${trip.passengers.length}</span>
                        </div>
                    </div>
                    ${trip.notes ? `<div class="notes-section"><h4>Notizen:</h4><p>${trip.notes}</p></div>` : ''}
                    <div class="modal-actions">
                        <button class="btn" onclick="navigationManager.showTripOnMap(${trip.id})">Auf Karte anzeigen</button>
                        <button class="btn primary" onclick="navigationManager.generateTripReport(${trip.id})">Nachweis erstellen</button>
                        <button class="btn" onclick="navigationManager.closeModal()">Schließen</button>
                    </div>
                </div>
            `;

            this.showModal(modalContent);

        } catch (error) {
            console.error('Fehler beim Laden der Trip-Details:', error);
            this.showError('Fehler beim Laden der Fahrt-Details');
        }
    }

    // Fahrt auf Karte anzeigen
    async showTripOnMap(tripId) {
        this.closeModal();
        this.switchTab('map');
        
        if (window.mapManager) {
            await window.mapManager.displayTripRoute(tripId);
        }
    }

    // Personen-Liste laden
    async loadPersonsList() {
        try {
            const personsList = document.getElementById('personsList');
            if (!personsList || !window.dbManager) return;

            personsList.innerHTML = '<div class="loading">Lade Personen...</div>';

            const persons = await window.dbManager.getAll('persons');
            persons.sort((a, b) => a.name.localeCompare(b.name));

            if (persons.length === 0) {
                personsList.innerHTML = '<div class="empty-state">Keine Personen vorhanden</div>';
            } else {
                personsList.innerHTML = persons.map(person => this.renderPersonCard(person)).join('');
                this.attachPersonCardListeners();
            }

        } catch (error) {
            console.error('Fehler beim Laden der Personen:', error);
            const personsList = document.getElementById('personsList');
            if (personsList) {
                personsList.innerHTML = '<div class="error">Fehler beim Laden der Personen</div>';
            }
        }
    }

    // Person-Card HTML rendern
    renderPersonCard(person) {
        return `
            <div class="item-card person-card" data-person-id="${person.id}">
                <div class="item-header">
                    <div>
                        <div class="item-title">${person.getDisplayName()}</div>
                        <div class="item-subtitle">${person.address || 'Keine Adresse'}</div>
                    </div>
                    <div class="meta-tag ${person.type}">${person.type === 'driver' ? 'Fahrer' : 'Fahrgast'}</div>
                </div>
                <div class="item-meta">
                    ${person.phone ? `<span class="meta-tag">📞 ${person.phone}</span>` : ''}
                    ${person.email ? `<span class="meta-tag">📧 ${person.email}</span>` : ''}
                    ${person.mobility !== 'normal' ? `<span class="meta-tag">♿ ${person.mobility}</span>` : ''}
                </div>
            </div>
        `;
    }

    // Event-Listener für Person-Cards
    attachPersonCardListeners() {
        const personCards = document.querySelectorAll('.person-card');
        personCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const personId = parseInt(card.getAttribute('data-person-id'));
                this.showPersonDetails(personId);
            });
        });
    }

    // Person-Details anzeigen
    async showPersonDetails(personId) {
        // Implementation ähnlich wie showTripDetails
        console.log('Person-Details anzeigen:', personId);
    }

    // Nachweise-Liste laden
    async loadReportsList() {
        try {
            const reportsList = document.getElementById('reportsList');
            if (!reportsList || !window.dbManager) return;

            reportsList.innerHTML = '<div class="loading">Lade Nachweise...</div>';

            const reports = await window.dbManager.getAll('reports');
            reports.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (reports.length === 0) {
                reportsList.innerHTML = '<div class="empty-state">Keine Nachweise vorhanden</div>';
            } else {
                reportsList.innerHTML = reports.map(report => this.renderReportCard(report)).join('');
            }

        } catch (error) {
            console.error('Fehler beim Laden der Nachweise:', error);
            const reportsList = document.getElementById('reportsList');
            if (reportsList) {
                reportsList.innerHTML = '<div class="error">Fehler beim Laden der Nachweise</div>';
            }
        }
    }

    // Report-Card HTML rendern
    renderReportCard(report) {
        const date = new Date(report.date).toLocaleDateString('de-DE');
        
        return `
            <div class="item-card report-card" data-report-id="${report.id}">
                <div class="item-header">
                    <div>
                        <div class="item-title">${report.title}</div>
                        <div class="item-subtitle">${date}</div>
                    </div>
                    <div class="meta-tag status ${report.status}">${report.getStatusText()}</div>
                </div>
                <div class="item-meta">
                    <span class="meta-tag">📄 ${report.getTypeText()}</span>
                </div>
            </div>
        `;
    }

    // URL-Parameter handhaben
    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        const action = urlParams.get('action');

        if (tab && this.tabs.includes(tab)) {
            this.switchTab(tab, false);
        }

        if (action === 'start-trip') {
            // Fahrt-Start-Dialog öffnen
            setTimeout(() => this.showStartTripDialog(), 500);
        }
    }

    // URL aktualisieren
    updateURL(tabName) {
        const url = new URL(window.location);
        url.searchParams.set('tab', tabName);
        window.history.pushState({ tab: tabName }, '', url);
    }

    // History verwalten
    addToHistory(tabName) {
        this.history.push(tabName);
        if (this.history.length > this.maxHistoryLength) {
            this.history.shift();
        }
    }

    // Zurück-Navigation
    goBack() {
        if (this.history.length > 1) {
            this.history.pop(); // Aktuellen Tab entfernen
            const previousTab = this.history.pop(); // Vorherigen Tab holen
            this.switchTab(previousTab);
        }
    }

    // Keyboard-Shortcuts einrichten
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + Nummer für Tab-Wechsel
            if (e.altKey && !e.ctrlKey && !e.shiftKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchTab('map');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchTab('trips');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchTab('persons');
                        break;
                    case '4':
                        e.preventDefault();
                        this.switchTab('reports');
                        break;
                }
            }

            // ESC für Modal schließen
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // Modal anzeigen
    showModal(content) {
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContent = document.getElementById('modalContent');
        
        if (modalOverlay && modalContent) {
            modalContent.innerHTML = content;
            modalOverlay.classList.add('active');
            
            // Klick außerhalb des Modals zum Schließen
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }
    }

    // Modal schließen
    closeModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    }

    // Fehler anzeigen
    showError(message) {
        this.showToast(message, 'error');
    }

    // Toast-Benachrichtigung anzeigen
    showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Automatisch entfernen
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, duration);
    }

    // Status abrufen
    getStatus() {
        return {
            currentTab: this.currentTab,
            isInitialized: this.isInitialized,
            history: [...this.history]
        };
    }
}

// Globale Navigation-Manager-Instanz
window.navigationManager = new NavigationManager();

