// Datenmodelle für AWO Fahrdienst App

// Basis-Modell mit gemeinsamen Eigenschaften
class BaseModel {
    constructor(data = {}) {
        this.id = data.id || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.syncStatus = data.syncStatus || 'pending';
    }

    // Validierung (überschreibbar in Unterklassen)
    validate() {
        return { isValid: true, errors: [] };
    }

    // Zu JSON konvertieren
    toJSON() {
        return { ...this };
    }

    // Aus JSON erstellen
    static fromJSON(data) {
        return new this(data);
    }
}

// Person-Modell (Fahrer und Fahrgäste)
class Person extends BaseModel {
    constructor(data = {}) {
        super(data);
        
        // Pflichtfelder
        this.name = data.name || '';
        this.type = data.type || 'passenger'; // 'driver' oder 'passenger'
        
        // Optionale Felder
        this.firstName = data.firstName || '';
        this.lastName = data.lastName || '';
        this.dateOfBirth = data.dateOfBirth || null;
        this.address = data.address || '';
        this.city = data.city || '';
        this.zipCode = data.zipCode || '';
        this.phone = data.phone || '';
        this.email = data.email || '';
        this.emergencyContact = data.emergencyContact || '';
        this.emergencyPhone = data.emergencyPhone || '';
        
        // Spezielle Felder für Fahrer
        this.licenseNumber = data.licenseNumber || '';
        this.licenseExpiry = data.licenseExpiry || null;
        this.employeeId = data.employeeId || '';
        
        // Spezielle Felder für Fahrgäste
        this.mobility = data.mobility || 'normal'; // 'normal', 'wheelchair', 'walker'
        this.medicalNotes = data.medicalNotes || '';
        this.preferredPickupTime = data.preferredPickupTime || null;
        
        // Metadaten
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.notes = data.notes || '';
        this.avatar = data.avatar || null;
    }

    validate() {
        const errors = [];
        
        if (!this.name || this.name.trim().length < 2) {
            errors.push('Name muss mindestens 2 Zeichen lang sein');
        }
        
        if (!['driver', 'passenger'].includes(this.type)) {
            errors.push('Typ muss "driver" oder "passenger" sein');
        }
        
        if (this.email && !this.isValidEmail(this.email)) {
            errors.push('E-Mail-Adresse ist ungültig');
        }
        
        if (this.phone && !this.isValidPhone(this.phone)) {
            errors.push('Telefonnummer ist ungültig');
        }
        
        if (this.type === 'driver' && !this.licenseNumber) {
            errors.push('Führerscheinnummer ist für Fahrer erforderlich');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }

    getFullName() {
        if (this.firstName && this.lastName) {
            return `${this.firstName} ${this.lastName}`;
        }
        return this.name;
    }

    getDisplayName() {
        const fullName = this.getFullName();
        return this.type === 'driver' ? `${fullName} (Fahrer)` : fullName;
    }

    isDriver() {
        return this.type === 'driver';
    }

    isPassenger() {
        return this.type === 'passenger';
    }
}

// Fahrt-Modell
class Trip extends BaseModel {
    constructor(data = {}) {
        super(data);
        
        // Pflichtfelder
        this.driverId = data.driverId || null;
        this.date = data.date || new Date().toISOString();
        this.status = data.status || 'planned'; // 'planned', 'active', 'completed', 'cancelled'
        
        // Fahrtdetails
        this.startTime = data.startTime || null;
        this.endTime = data.endTime || null;
        this.startLocation = data.startLocation || null; // { lat, lng, address }
        this.endLocation = data.endLocation || null; // { lat, lng, address }
        this.distance = data.distance || 0; // in Kilometern
        this.duration = data.duration || 0; // in Minuten
        
        // Fahrgäste
        this.passengers = data.passengers || []; // Array von Passenger-IDs
        this.maxPassengers = data.maxPassengers || 4;
        
        // Fahrzeug
        this.vehicleId = data.vehicleId || null;
        this.vehiclePlate = data.vehiclePlate || '';
        
        // Fahrttyp
        this.tripType = data.tripType || 'regular'; // 'regular', 'medical', 'emergency', 'shopping'
        this.purpose = data.purpose || '';
        this.destination = data.destination || '';
        
        // Kosten
        this.estimatedCost = data.estimatedCost || 0;
        this.actualCost = data.actualCost || 0;
        this.fuelCost = data.fuelCost || 0;
        
        // GPS und Route
        this.route = data.route || []; // Array von GPS-Punkten
        this.routeOptimized = data.routeOptimized || false;
        
        // Notizen und Besonderheiten
        this.notes = data.notes || '';
        this.specialRequirements = data.specialRequirements || '';
        this.weatherConditions = data.weatherConditions || '';
        
        // Bewertung
        this.rating = data.rating || null;
        this.feedback = data.feedback || '';
        
        // Nachweise
        this.reportGenerated = data.reportGenerated || false;
        this.reportId = data.reportId || null;
    }

    validate() {
        const errors = [];
        
        if (!this.driverId) {
            errors.push('Fahrer muss ausgewählt werden');
        }
        
        if (!this.date) {
            errors.push('Datum ist erforderlich');
        }
        
        if (!['planned', 'active', 'completed', 'cancelled'].includes(this.status)) {
            errors.push('Ungültiger Fahrt-Status');
        }
        
        if (this.passengers.length > this.maxPassengers) {
            errors.push(`Maximale Anzahl Fahrgäste (${this.maxPassengers}) überschritten`);
        }
        
        if (this.status === 'completed' && !this.endTime) {
            errors.push('Endzeit ist für abgeschlossene Fahrten erforderlich');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Fahrt starten
    start(location = null) {
        this.status = 'active';
        this.startTime = new Date().toISOString();
        if (location) {
            this.startLocation = location;
        }
        this.updatedAt = new Date().toISOString();
    }

    // Fahrt beenden
    end(location = null) {
        this.status = 'completed';
        this.endTime = new Date().toISOString();
        if (location) {
            this.endLocation = location;
        }
        
        // Dauer berechnen
        if (this.startTime) {
            const start = new Date(this.startTime);
            const end = new Date(this.endTime);
            this.duration = Math.round((end - start) / (1000 * 60)); // Minuten
        }
        
        this.updatedAt = new Date().toISOString();
    }

    // Fahrt abbrechen
    cancel(reason = '') {
        this.status = 'cancelled';
        this.notes = this.notes ? `${this.notes}\nAbbruch: ${reason}` : `Abbruch: ${reason}`;
        this.updatedAt = new Date().toISOString();
    }

    // Fahrgast hinzufügen
    addPassenger(passengerId) {
        if (!this.passengers.includes(passengerId) && 
            this.passengers.length < this.maxPassengers) {
            this.passengers.push(passengerId);
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    // Fahrgast entfernen
    removePassenger(passengerId) {
        const index = this.passengers.indexOf(passengerId);
        if (index > -1) {
            this.passengers.splice(index, 1);
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    // Fahrtdauer formatiert
    getFormattedDuration() {
        if (!this.duration) return '00:00';
        
        const hours = Math.floor(this.duration / 60);
        const minutes = this.duration % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Fahrtdistanz formatiert
    getFormattedDistance() {
        if (!this.distance) return '0.0 km';
        return `${this.distance.toFixed(1)} km`;
    }

    // Status-Text auf Deutsch
    getStatusText() {
        const statusMap = {
            'planned': 'Geplant',
            'active': 'Aktiv',
            'completed': 'Abgeschlossen',
            'cancelled': 'Abgebrochen'
        };
        return statusMap[this.status] || this.status;
    }

    // Fahrttyp-Text auf Deutsch
    getTripTypeText() {
        const typeMap = {
            'regular': 'Reguläre Fahrt',
            'medical': 'Arzttermin',
            'emergency': 'Notfall',
            'shopping': 'Einkaufsfahrt'
        };
        return typeMap[this.tripType] || this.tripType;
    }

    // Ist Fahrt aktiv?
    isActive() {
        return this.status === 'active';
    }

    // Ist Fahrt abgeschlossen?
    isCompleted() {
        return this.status === 'completed';
    }

    // Kann Fahrt gestartet werden?
    canStart() {
        return this.status === 'planned' && this.driverId;
    }

    // Kann Fahrt beendet werden?
    canEnd() {
        return this.status === 'active';
    }
}

// GPS-Track-Punkt-Modell
class GPSPoint extends BaseModel {
    constructor(data = {}) {
        super(data);
        
        this.tripId = data.tripId || null;
        this.latitude = data.latitude || 0;
        this.longitude = data.longitude || 0;
        this.accuracy = data.accuracy || null;
        this.altitude = data.altitude || null;
        this.speed = data.speed || null;
        this.heading = data.heading || null;
        this.timestamp = data.timestamp || new Date().toISOString();
    }

    validate() {
        const errors = [];
        
        if (!this.tripId) {
            errors.push('Fahrt-ID ist erforderlich');
        }
        
        if (!this.latitude || !this.longitude) {
            errors.push('GPS-Koordinaten sind erforderlich');
        }
        
        if (Math.abs(this.latitude) > 90) {
            errors.push('Breitengrad muss zwischen -90 und 90 liegen');
        }
        
        if (Math.abs(this.longitude) > 180) {
            errors.push('Längengrad muss zwischen -180 und 180 liegen');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Distanz zu anderem Punkt berechnen (Haversine-Formel)
    distanceTo(otherPoint) {
        const R = 6371; // Erdradius in km
        const dLat = this.toRadians(otherPoint.latitude - this.latitude);
        const dLon = this.toRadians(otherPoint.longitude - this.longitude);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRadians(this.latitude)) * Math.cos(this.toRadians(otherPoint.latitude)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distanz in km
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Koordinaten als Array
    toArray() {
        return [this.latitude, this.longitude];
    }

    // Leaflet-kompatibles Format
    toLeafletLatLng() {
        return [this.latitude, this.longitude];
    }
}

// Nachweis-Modell
class Report extends BaseModel {
    constructor(data = {}) {
        super(data);
        
        this.tripId = data.tripId || null;
        this.type = data.type || 'trip_report'; // 'trip_report', 'monthly_summary', 'expense_report'
        this.date = data.date || new Date().toISOString();
        this.title = data.title || '';
        this.content = data.content || {};
        this.pdfPath = data.pdfPath || null;
        this.status = data.status || 'draft'; // 'draft', 'generated', 'sent'
        this.recipient = data.recipient || '';
        this.notes = data.notes || '';
    }

    validate() {
        const errors = [];
        
        if (!this.title) {
            errors.push('Titel ist erforderlich');
        }
        
        if (!['trip_report', 'monthly_summary', 'expense_report'].includes(this.type)) {
            errors.push('Ungültiger Nachweis-Typ');
        }
        
        if (this.type === 'trip_report' && !this.tripId) {
            errors.push('Fahrt-ID ist für Fahrtennachweise erforderlich');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Status-Text auf Deutsch
    getStatusText() {
        const statusMap = {
            'draft': 'Entwurf',
            'generated': 'Erstellt',
            'sent': 'Versendet'
        };
        return statusMap[this.status] || this.status;
    }

    // Typ-Text auf Deutsch
    getTypeText() {
        const typeMap = {
            'trip_report': 'Fahrtnachweis',
            'monthly_summary': 'Monatszusammenfassung',
            'expense_report': 'Kostennachweis'
        };
        return typeMap[this.type] || this.type;
    }
}

// Fahrzeug-Modell (für zukünftige Erweiterung)
class Vehicle extends BaseModel {
    constructor(data = {}) {
        super(data);
        
        this.plate = data.plate || '';
        this.make = data.make || '';
        this.model = data.model || '';
        this.year = data.year || null;
        this.color = data.color || '';
        this.seats = data.seats || 4;
        this.wheelchairAccessible = data.wheelchairAccessible || false;
        this.fuelType = data.fuelType || 'gasoline';
        this.mileage = data.mileage || 0;
        this.lastService = data.lastService || null;
        this.nextService = data.nextService || null;
        this.insurance = data.insurance || null;
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.notes = data.notes || '';
    }

    validate() {
        const errors = [];
        
        if (!this.plate) {
            errors.push('Kennzeichen ist erforderlich');
        }
        
        if (!this.make || !this.model) {
            errors.push('Marke und Modell sind erforderlich');
        }
        
        if (this.seats < 1 || this.seats > 50) {
            errors.push('Sitzplätze müssen zwischen 1 und 50 liegen');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    getDisplayName() {
        return `${this.make} ${this.model} (${this.plate})`;
    }
}

// Model Factory für einfache Instanziierung
class ModelFactory {
    static createPerson(data) {
        return new Person(data);
    }

    static createTrip(data) {
        return new Trip(data);
    }

    static createGPSPoint(data) {
        return new GPSPoint(data);
    }

    static createReport(data) {
        return new Report(data);
    }

    static createVehicle(data) {
        return new Vehicle(data);
    }

    // JSON-Daten zu entsprechendem Modell konvertieren
    static fromJSON(type, data) {
        switch (type) {
            case 'person':
                return new Person(data);
            case 'trip':
                return new Trip(data);
            case 'gps_point':
                return new GPSPoint(data);
            case 'report':
                return new Report(data);
            case 'vehicle':
                return new Vehicle(data);
            default:
                throw new Error(`Unbekannter Modell-Typ: ${type}`);
        }
    }
}

// Globale Verfügbarkeit
window.Person = Person;
window.Trip = Trip;
window.GPSPoint = GPSPoint;
window.Report = Report;
window.Vehicle = Vehicle;
window.ModelFactory = ModelFactory;

