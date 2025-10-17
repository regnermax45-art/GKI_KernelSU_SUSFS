// IndexedDB Datenbank-Manager für AWO Fahrdienst App
class DatabaseManager {
    constructor() {
        this.dbName = 'AWOFahrdienstDB';
        this.dbVersion = 1;
        this.db = null;
        this.isOnline = navigator.onLine;
        
        // Event Listeners für Online/Offline Status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncPendingData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // Datenbank initialisieren
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Database error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database initialized successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createTables(db);
            };
        });
    }

    // Tabellen erstellen
    createTables(db) {
        // Fahrten-Tabelle
        if (!db.objectStoreNames.contains('trips')) {
            const tripStore = db.createObjectStore('trips', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            
            tripStore.createIndex('date', 'date', { unique: false });
            tripStore.createIndex('driverId', 'driverId', { unique: false });
            tripStore.createIndex('status', 'status', { unique: false });
            tripStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // Personen-Tabelle
        if (!db.objectStoreNames.contains('persons')) {
            const personStore = db.createObjectStore('persons', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            
            personStore.createIndex('name', 'name', { unique: false });
            personStore.createIndex('type', 'type', { unique: false });
            personStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // GPS-Tracks-Tabelle
        if (!db.objectStoreNames.contains('gps_tracks')) {
            const trackStore = db.createObjectStore('gps_tracks', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            
            trackStore.createIndex('tripId', 'tripId', { unique: false });
            trackStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Nachweise-Tabelle
        if (!db.objectStoreNames.contains('reports')) {
            const reportStore = db.createObjectStore('reports', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            
            reportStore.createIndex('tripId', 'tripId', { unique: false });
            reportStore.createIndex('date', 'date', { unique: false });
            reportStore.createIndex('type', 'type', { unique: false });
        }

        // Einstellungen-Tabelle
        if (!db.objectStoreNames.contains('settings')) {
            const settingsStore = db.createObjectStore('settings', { 
                keyPath: 'key' 
            });
        }

        console.log('Database tables created successfully');
    }

    // Generische CRUD-Operationen
    async create(storeName, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Sync-Status hinzufügen
        data.syncStatus = this.isOnline ? 'synced' : 'pending';
        data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();
        
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            
            request.onsuccess = () => {
                const id = request.result;
                resolve({ ...data, id });
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async read(storeName, id) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async update(storeName, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Update-Timestamp setzen
        data.updatedAt = new Date().toISOString();
        if (data.syncStatus === 'synced') {
            data.syncStatus = 'pending';
        }
        
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            
            request.onsuccess = () => {
                resolve(data);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async delete(storeName, id) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async getAll(storeName, indexName = null, value = null) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            let request;
            
            if (indexName && value !== null) {
                const index = store.index(indexName);
                request = index.getAll(value);
            } else {
                request = store.getAll();
            }
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Spezielle Methoden für Fahrten
    async createTrip(tripData) {
        return await this.create('trips', tripData);
    }

    async getTripsByDate(date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        const allTrips = await this.getAll('trips');
        return allTrips.filter(trip => {
            const tripDate = new Date(trip.date);
            return tripDate >= startDate && tripDate <= endDate;
        });
    }

    async getActiveTrip() {
        const trips = await this.getAll('trips', 'status', 'active');
        return trips.length > 0 ? trips[0] : null;
    }

    // Spezielle Methoden für Personen
    async createPerson(personData) {
        return await this.create('persons', personData);
    }

    async searchPersons(query) {
        const allPersons = await this.getAll('persons');
        const searchTerm = query.toLowerCase();
        
        return allPersons.filter(person => 
            person.name.toLowerCase().includes(searchTerm) ||
            (person.address && person.address.toLowerCase().includes(searchTerm)) ||
            (person.phone && person.phone.includes(searchTerm))
        );
    }

    // GPS-Track-Methoden
    async addGPSPoint(tripId, latitude, longitude, accuracy = null) {
        const trackData = {
            tripId,
            latitude,
            longitude,
            accuracy,
            timestamp: new Date().toISOString(),
            speed: null,
            heading: null
        };
        
        return await this.create('gps_tracks', trackData);
    }

    async getTripTrack(tripId) {
        return await this.getAll('gps_tracks', 'tripId', tripId);
    }

    // Nachweis-Methoden
    async createReport(reportData) {
        return await this.create('reports', reportData);
    }

    async getReportsByDateRange(startDate, endDate) {
        const allReports = await this.getAll('reports');
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return allReports.filter(report => {
            const reportDate = new Date(report.date);
            return reportDate >= start && reportDate <= end;
        });
    }

    // Einstellungen-Methoden
    async getSetting(key, defaultValue = null) {
        try {
            const setting = await this.read('settings', key);
            return setting ? setting.value : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    }

    async setSetting(key, value) {
        const settingData = {
            key,
            value,
            updatedAt: new Date().toISOString()
        };
        
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        
        return new Promise((resolve, reject) => {
            const request = store.put(settingData);
            
            request.onsuccess = () => {
                resolve(settingData);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Synchronisation mit Backend (für zukünftige Erweiterung)
    async syncPendingData() {
        if (!this.isOnline) {
            console.log('Offline - Synchronisation übersprungen');
            return;
        }

        try {
            // Pending Trips synchronisieren
            const pendingTrips = await this.getAll('trips', 'syncStatus', 'pending');
            for (const trip of pendingTrips) {
                await this.syncTrip(trip);
            }

            // Pending Persons synchronisieren
            const pendingPersons = await this.getAll('persons', 'syncStatus', 'pending');
            for (const person of pendingPersons) {
                await this.syncPerson(person);
            }

            console.log('Synchronisation abgeschlossen');
        } catch (error) {
            console.error('Synchronisation fehlgeschlagen:', error);
        }
    }

    async syncTrip(trip) {
        // Hier würde die Synchronisation mit dem Backend implementiert
        // Für den Prototyp markieren wir einfach als synchronisiert
        trip.syncStatus = 'synced';
        await this.update('trips', trip);
    }

    async syncPerson(person) {
        // Hier würde die Synchronisation mit dem Backend implementiert
        // Für den Prototyp markieren wir einfach als synchronisiert
        person.syncStatus = 'synced';
        await this.update('persons', person);
    }

    // Datenbank-Statistiken
    async getStats() {
        const [trips, persons, tracks, reports] = await Promise.all([
            this.getAll('trips'),
            this.getAll('persons'),
            this.getAll('gps_tracks'),
            this.getAll('reports')
        ]);

        return {
            totalTrips: trips.length,
            activeTrips: trips.filter(t => t.status === 'active').length,
            completedTrips: trips.filter(t => t.status === 'completed').length,
            totalPersons: persons.length,
            drivers: persons.filter(p => p.type === 'driver').length,
            passengers: persons.filter(p => p.type === 'passenger').length,
            totalGPSPoints: tracks.length,
            totalReports: reports.length,
            pendingSync: [
                ...trips.filter(t => t.syncStatus === 'pending'),
                ...persons.filter(p => p.syncStatus === 'pending')
            ].length
        };
    }

    // Datenbank bereinigen (alte Daten löschen)
    async cleanup(daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        const oldTrips = await this.getAll('trips');
        const tripsToDelete = oldTrips.filter(trip => 
            new Date(trip.date) < cutoffDate && trip.status === 'completed'
        );

        for (const trip of tripsToDelete) {
            // GPS-Tracks der Fahrt löschen
            const tracks = await this.getTripTrack(trip.id);
            for (const track of tracks) {
                await this.delete('gps_tracks', track.id);
            }
            
            // Fahrt löschen
            await this.delete('trips', trip.id);
        }

        console.log(`${tripsToDelete.length} alte Fahrten bereinigt`);
        return tripsToDelete.length;
    }

    // Datenbank-Export für Backup
    async exportData() {
        const [trips, persons, reports, settings] = await Promise.all([
            this.getAll('trips'),
            this.getAll('persons'),
            this.getAll('reports'),
            this.getAll('settings')
        ]);

        return {
            exportDate: new Date().toISOString(),
            version: this.dbVersion,
            data: {
                trips,
                persons,
                reports,
                settings
            }
        };
    }

    // Datenbank schließen
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

// Globale Datenbankinstanz
window.dbManager = new DatabaseManager();

