// Personen-Manager für AWO Fahrdienst App
class PersonManager {
    constructor() {
        this.isInitialized = false;
        this.currentPerson = null;
        this.searchResults = [];
        this.callbacks = {
            personCreated: [],
            personUpdated: [],
            personDeleted: [],
            error: []
        };
    }

    // Person-Manager initialisieren
    init() {
        console.log('Person-Manager initialisiert');
        this.isInitialized = true;
    }

    // Neue Person erstellen
    async createPerson(personData) {
        try {
            console.log('Erstelle neue Person...');

            // Person-Objekt erstellen
            const person = new Person(personData);

            // Validierung
            const validation = person.validate();
            if (!validation.isValid) {
                throw new Error(`Person-Validierung fehlgeschlagen: ${validation.errors.join(', ')}`);
            }

            // In Datenbank speichern
            const savedPerson = await window.dbManager.createPerson(person);

            // Callbacks benachrichtigen
            this.notifyCallbacks('personCreated', savedPerson);

            console.log('Person erstellt:', savedPerson.id);
            return savedPerson;

        } catch (error) {
            console.error('Fehler beim Erstellen der Person:', error);
            this.notifyCallbacks('error', error);
            throw error;
        }
    }

    // Person aktualisieren
    async updatePerson(personId, updateData) {
        try {
            console.log('Aktualisiere Person:', personId);

            // Bestehende Person laden
            const existingPerson = await window.dbManager.read('persons', personId);
            if (!existingPerson) {
                throw new Error('Person nicht gefunden');
            }

            // Daten zusammenführen
            const updatedPersonData = { ...existingPerson, ...updateData };
            const person = new Person(updatedPersonData);

            // Validierung
            const validation = person.validate();
            if (!validation.isValid) {
                throw new Error(`Person-Validierung fehlgeschlagen: ${validation.errors.join(', ')}`);
            }

            // In Datenbank aktualisieren
            const savedPerson = await window.dbManager.update('persons', person);

            // Callbacks benachrichtigen
            this.notifyCallbacks('personUpdated', savedPerson);

            console.log('Person aktualisiert:', savedPerson.id);
            return savedPerson;

        } catch (error) {
            console.error('Fehler beim Aktualisieren der Person:', error);
            this.notifyCallbacks('error', error);
            throw error;
        }
    }

    // Person löschen
    async deletePerson(personId) {
        try {
            console.log('Lösche Person:', personId);

            // Prüfen ob Person in aktiven Fahrten verwendet wird
            const activeTrips = await window.dbManager.getAll('trips', 'status', 'active');
            const isInUse = activeTrips.some(trip => 
                trip.driverId === personId || trip.passengers.includes(personId)
            );

            if (isInUse) {
                throw new Error('Person kann nicht gelöscht werden - wird in aktiven Fahrten verwendet');
            }

            // Person aus Datenbank löschen
            await window.dbManager.delete('persons', personId);

            // Callbacks benachrichtigen
            this.notifyCallbacks('personDeleted', { id: personId });

            console.log('Person gelöscht:', personId);
            return true;

        } catch (error) {
            console.error('Fehler beim Löschen der Person:', error);
            this.notifyCallbacks('error', error);
            throw error;
        }
    }

    // Person suchen
    async searchPersons(query) {
        try {
            if (!query || query.trim().length < 2) {
                this.searchResults = [];
                return [];
            }

            console.log('Suche Personen:', query);

            // Suche in Datenbank
            const results = await window.dbManager.searchPersons(query);
            this.searchResults = results;

            return results;

        } catch (error) {
            console.error('Fehler bei der Personensuche:', error);
            this.notifyCallbacks('error', error);
            return [];
        }
    }

    // Alle Fahrer abrufen
    async getDrivers() {
        try {
            const drivers = await window.dbManager.getAll('persons', 'type', 'driver');
            return drivers.filter(driver => driver.isActive);
        } catch (error) {
            console.error('Fehler beim Laden der Fahrer:', error);
            return [];
        }
    }

    // Alle Fahrgäste abrufen
    async getPassengers() {
        try {
            const passengers = await window.dbManager.getAll('persons', 'type', 'passenger');
            return passengers.filter(passenger => passenger.isActive);
        } catch (error) {
            console.error('Fehler beim Laden der Fahrgäste:', error);
            return [];
        }
    }

    // Person-Details-Dialog anzeigen
    async showPersonDialog(personId = null) {
        try {
            let person = null;
            let isEdit = false;

            if (personId) {
                person = await window.dbManager.read('persons', personId);
                if (!person) {
                    throw new Error('Person nicht gefunden');
                }
                isEdit = true;
            }

            const modalContent = this.createPersonDialogHTML(person, isEdit);
            window.navigationManager.showModal(modalContent);

            // Form-Submit-Handler
            const form = document.getElementById('personForm');
            form.addEventListener('submit', (e) => this.handlePersonFormSubmit(e, personId));

            // Typ-Wechsel-Handler
            const typeSelect = document.getElementById('personType');
            typeSelect.addEventListener('change', (e) => this.handleTypeChange(e.target.value));

            // Initial Typ-spezifische Felder anzeigen
            this.handleTypeChange(person ? person.type : 'passenger');

        } catch (error) {
            console.error('Fehler beim Anzeigen des Person-Dialogs:', error);
            window.navigationManager.showError('Dialog konnte nicht geöffnet werden');
        }
    }

    // Person-Dialog HTML erstellen
    createPersonDialogHTML(person, isEdit) {
        const title = isEdit ? 'Person bearbeiten' : 'Neue Person hinzufügen';
        
        return `
            <div class="person-dialog">
                <h3>${title}</h3>
                <form id="personForm">
                    <div class="form-group">
                        <label for="personType">Typ:</label>
                        <select id="personType" name="type" required>
                            <option value="passenger" ${!person || person.type === 'passenger' ? 'selected' : ''}>Fahrgast</option>
                            <option value="driver" ${person && person.type === 'driver' ? 'selected' : ''}>Fahrer</option>
                        </select>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstName">Vorname:</label>
                            <input type="text" id="firstName" name="firstName" value="${person ? person.firstName : ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="lastName">Nachname:</label>
                            <input type="text" id="lastName" name="lastName" value="${person ? person.lastName : ''}" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="dateOfBirth">Geburtsdatum:</label>
                        <input type="date" id="dateOfBirth" name="dateOfBirth" value="${person && person.dateOfBirth ? person.dateOfBirth.split('T')[0] : ''}">
                    </div>

                    <div class="form-group">
                        <label for="address">Adresse:</label>
                        <input type="text" id="address" name="address" value="${person ? person.address : ''}" placeholder="Straße und Hausnummer">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="zipCode">PLZ:</label>
                            <input type="text" id="zipCode" name="zipCode" value="${person ? person.zipCode : ''}" placeholder="12345">
                        </div>
                        <div class="form-group">
                            <label for="city">Ort:</label>
                            <input type="text" id="city" name="city" value="${person ? person.city : ''}" placeholder="Neuruppin">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="phone">Telefon:</label>
                            <input type="tel" id="phone" name="phone" value="${person ? person.phone : ''}" placeholder="030 12345678">
                        </div>
                        <div class="form-group">
                            <label for="email">E-Mail:</label>
                            <input type="email" id="email" name="email" value="${person ? person.email : ''}" placeholder="max@example.com">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="emergencyContact">Notfallkontakt:</label>
                        <input type="text" id="emergencyContact" name="emergencyContact" value="${person ? person.emergencyContact : ''}" placeholder="Name des Notfallkontakts">
                    </div>

                    <div class="form-group">
                        <label for="emergencyPhone">Notfall-Telefon:</label>
                        <input type="tel" id="emergencyPhone" name="emergencyPhone" value="${person ? person.emergencyPhone : ''}" placeholder="030 87654321">
                    </div>

                    <!-- Fahrer-spezifische Felder -->
                    <div id="driverFields" style="display: none;">
                        <h4>Fahrer-Informationen</h4>
                        <div class="form-group">
                            <label for="employeeId">Mitarbeiter-Nr.:</label>
                            <input type="text" id="employeeId" name="employeeId" value="${person ? person.employeeId : ''}" placeholder="AWO001">
                        </div>
                        <div class="form-group">
                            <label for="licenseNumber">Führerschein-Nr.:</label>
                            <input type="text" id="licenseNumber" name="licenseNumber" value="${person ? person.licenseNumber : ''}" placeholder="B123456789">
                        </div>
                        <div class="form-group">
                            <label for="licenseExpiry">Führerschein gültig bis:</label>
                            <input type="date" id="licenseExpiry" name="licenseExpiry" value="${person && person.licenseExpiry ? person.licenseExpiry.split('T')[0] : ''}">
                        </div>
                    </div>

                    <!-- Fahrgast-spezifische Felder -->
                    <div id="passengerFields" style="display: none;">
                        <h4>Fahrgast-Informationen</h4>
                        <div class="form-group">
                            <label for="mobility">Mobilität:</label>
                            <select id="mobility" name="mobility">
                                <option value="normal" ${!person || person.mobility === 'normal' ? 'selected' : ''}>Normal</option>
                                <option value="wheelchair" ${person && person.mobility === 'wheelchair' ? 'selected' : ''}>Rollstuhl</option>
                                <option value="walker" ${person && person.mobility === 'walker' ? 'selected' : ''}>Gehhilfe</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="medicalNotes">Medizinische Hinweise:</label>
                            <textarea id="medicalNotes" name="medicalNotes" placeholder="Besondere medizinische Hinweise...">${person ? person.medicalNotes : ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="preferredPickupTime">Bevorzugte Abholzeit:</label>
                            <input type="time" id="preferredPickupTime" name="preferredPickupTime" value="${person ? person.preferredPickupTime : ''}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="notes">Notizen:</label>
                        <textarea id="notes" name="notes" placeholder="Allgemeine Notizen...">${person ? person.notes : ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="isActive" name="isActive" ${!person || person.isActive ? 'checked' : ''}>
                            Person ist aktiv
                        </label>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn" onclick="navigationManager.closeModal()">Abbrechen</button>
                        ${isEdit ? '<button type="button" class="btn danger" onclick="personManager.confirmDeletePerson(' + person.id + ')">Löschen</button>' : ''}
                        <button type="submit" class="btn primary">${isEdit ? 'Aktualisieren' : 'Erstellen'}</button>
                    </div>
                </form>
            </div>
        `;
    }

    // Typ-Wechsel handhaben
    handleTypeChange(type) {
        const driverFields = document.getElementById('driverFields');
        const passengerFields = document.getElementById('passengerFields');

        if (type === 'driver') {
            driverFields.style.display = 'block';
            passengerFields.style.display = 'none';
            
            // Führerschein-Nummer als erforderlich markieren
            const licenseNumber = document.getElementById('licenseNumber');
            if (licenseNumber) licenseNumber.required = true;
        } else {
            driverFields.style.display = 'none';
            passengerFields.style.display = 'block';
            
            // Führerschein-Nummer als nicht erforderlich markieren
            const licenseNumber = document.getElementById('licenseNumber');
            if (licenseNumber) licenseNumber.required = false;
        }
    }

    // Person-Formular verarbeiten
    async handlePersonFormSubmit(e, personId = null) {
        e.preventDefault();

        try {
            const formData = new FormData(e.target);
            const personData = {};

            // Formular-Daten sammeln
            for (const [key, value] of formData.entries()) {
                if (key === 'isActive') {
                    personData[key] = true; // Checkbox ist gecheckt
                } else if (value.trim()) {
                    personData[key] = value.trim();
                }
            }

            // Checkbox-Wert korrekt setzen
            personData.isActive = formData.has('isActive');

            // Name aus Vor- und Nachname zusammensetzen
            if (personData.firstName && personData.lastName) {
                personData.name = `${personData.firstName} ${personData.lastName}`;
            }

            let savedPerson;
            if (personId) {
                // Person aktualisieren
                savedPerson = await this.updatePerson(personId, personData);
                window.navigationManager.showToast('Person aktualisiert!', 'success');
            } else {
                // Neue Person erstellen
                savedPerson = await this.createPerson(personData);
                window.navigationManager.showToast('Person erstellt!', 'success');
            }

            // Modal schließen
            window.navigationManager.closeModal();

            // Personen-Liste aktualisieren
            if (window.navigationManager.currentTab === 'persons') {
                await window.navigationManager.loadPersonsList();
            }

            return savedPerson;

        } catch (error) {
            console.error('Fehler beim Speichern der Person:', error);
            window.navigationManager.showError('Person konnte nicht gespeichert werden: ' + error.message);
        }
    }

    // Person-Löschung bestätigen
    async confirmDeletePerson(personId) {
        const confirmed = confirm('Person wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.');
        
        if (confirmed) {
            try {
                await this.deletePerson(personId);
                window.navigationManager.closeModal();
                window.navigationManager.showToast('Person gelöscht!', 'success');
                
                // Personen-Liste aktualisieren
                if (window.navigationManager.currentTab === 'persons') {
                    await window.navigationManager.loadPersonsList();
                }
            } catch (error) {
                window.navigationManager.showError('Person konnte nicht gelöscht werden: ' + error.message);
            }
        }
    }

    // Person-Statistiken abrufen
    async getPersonStats(personId) {
        try {
            const person = await window.dbManager.read('persons', personId);
            if (!person) {
                throw new Error('Person nicht gefunden');
            }

            const stats = {
                totalTrips: 0,
                completedTrips: 0,
                totalDistance: 0,
                totalDuration: 0,
                lastTripDate: null
            };

            // Alle Fahrten der Person laden
            const allTrips = await window.dbManager.getAll('trips');
            const personTrips = allTrips.filter(trip => 
                trip.driverId === personId || trip.passengers.includes(personId)
            );

            stats.totalTrips = personTrips.length;
            stats.completedTrips = personTrips.filter(trip => trip.status === 'completed').length;

            personTrips.forEach(trip => {
                if (trip.status === 'completed') {
                    stats.totalDistance += trip.distance || 0;
                    stats.totalDuration += trip.duration || 0;
                }
                
                const tripDate = new Date(trip.date);
                if (!stats.lastTripDate || tripDate > new Date(stats.lastTripDate)) {
                    stats.lastTripDate = trip.date;
                }
            });

            return stats;

        } catch (error) {
            console.error('Fehler beim Abrufen der Person-Statistiken:', error);
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
            isInitialized: this.isInitialized,
            searchResults: this.searchResults.length,
            currentPerson: this.currentPerson
        };
    }
}

// CSS für Form-Row hinzufügen
const style = document.createElement('style');
style.textContent = `
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-md);
    }
    
    @media (max-width: 480px) {
        .form-row {
            grid-template-columns: 1fr;
        }
    }
    
    .person-dialog h4 {
        margin: var(--spacing-lg) 0 var(--spacing-md) 0;
        color: var(--text-primary);
        border-bottom: 1px solid var(--divider-color);
        padding-bottom: var(--spacing-xs);
    }
`;
document.head.appendChild(style);

// Globale Person-Manager-Instanz
window.personManager = new PersonManager();

