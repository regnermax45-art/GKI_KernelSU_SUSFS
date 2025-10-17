// PDF-Generator für AWO Fahrdienst App
class PDFGenerator {
    constructor() {
        this.isInitialized = false;
        this.templates = {};
        this.init();
    }

    // PDF-Generator initialisieren
    init() {
        // Prüfen ob jsPDF verfügbar ist
        if (typeof window.jsPDF === 'undefined') {
            console.error('jsPDF nicht verfügbar');
            return;
        }

        this.isInitialized = true;
        console.log('PDF-Generator initialisiert');
    }

    // Fahrt-Nachweis erstellen
    async generateTripReport(tripId) {
        if (!this.isInitialized) {
            throw new Error('PDF-Generator nicht initialisiert');
        }

        try {
            console.log('Erstelle Fahrt-Nachweis für Trip:', tripId);

            // Fahrt-Daten laden
            const trip = await window.dbManager.read('trips', tripId);
            if (!trip) {
                throw new Error('Fahrt nicht gefunden');
            }

            // Fahrer-Daten laden
            const driver = await window.dbManager.read('persons', trip.driverId);
            
            // Fahrgast-Daten laden
            const passengers = [];
            for (const passengerId of trip.passengers) {
                const passenger = await window.dbManager.read('persons', passengerId);
                if (passenger) passengers.push(passenger);
            }

            // GPS-Route laden
            let route = null;
            if (window.gpsManager) {
                try {
                    route = await window.gpsManager.createRouteFromTrip(tripId);
                } catch (error) {
                    console.warn('Route konnte nicht geladen werden:', error);
                }
            }

            // PDF erstellen
            const pdf = new window.jsPDF.jsPDF();
            
            // Header
            this.addHeader(pdf, 'Fahrtnachweis AWO OPR');
            
            // Fahrt-Informationen
            this.addTripInfo(pdf, trip, driver, passengers, route);
            
            // Unterschriftenbereich
            this.addSignatureArea(pdf);
            
            // Footer
            this.addFooter(pdf);

            // PDF speichern
            const filename = `Fahrtnachweis_${trip.id}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(filename);

            // Nachweis in Datenbank speichern
            await this.saveReportRecord(tripId, filename, 'trip_report');

            console.log('Fahrt-Nachweis erstellt:', filename);
            return filename;

        } catch (error) {
            console.error('Fehler beim Erstellen des Fahrt-Nachweises:', error);
            throw error;
        }
    }

    // Monats-Zusammenfassung erstellen
    async generateMonthlyReport(year, month) {
        if (!this.isInitialized) {
            throw new Error('PDF-Generator nicht initialisiert');
        }

        try {
            console.log(`Erstelle Monats-Zusammenfassung für ${month}/${year}`);

            // Fahrten des Monats laden
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            
            const trips = await window.dbManager.getReportsByDateRange(
                startDate.toISOString(),
                endDate.toISOString()
            );

            // Statistiken berechnen
            const stats = this.calculateMonthlyStats(trips);

            // PDF erstellen
            const pdf = new window.jsPDF.jsPDF();
            
            // Header
            this.addHeader(pdf, `Monats-Zusammenfassung ${month}/${year}`);
            
            // Statistiken
            this.addMonthlyStats(pdf, stats);
            
            // Fahrtenliste
            this.addTripsList(pdf, trips);
            
            // Footer
            this.addFooter(pdf);

            // PDF speichern
            const filename = `Monatsbericht_${year}_${month.toString().padStart(2, '0')}.pdf`;
            pdf.save(filename);

            // Nachweis in Datenbank speichern
            await this.saveReportRecord(null, filename, 'monthly_summary');

            console.log('Monats-Zusammenfassung erstellt:', filename);
            return filename;

        } catch (error) {
            console.error('Fehler beim Erstellen der Monats-Zusammenfassung:', error);
            throw error;
        }
    }

    // PDF-Header hinzufügen
    addHeader(pdf, title) {
        // AWO-Logo (falls verfügbar)
        // pdf.addImage(logoData, 'PNG', 20, 20, 30, 15);
        
        // Titel
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, 20, 30);
        
        // Datum
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 40);
        
        // Linie
        pdf.setLineWidth(0.5);
        pdf.line(20, 45, 190, 45);
    }

    // Fahrt-Informationen hinzufügen
    addTripInfo(pdf, trip, driver, passengers, route) {
        let yPos = 60;
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Fahrt-Details', 20, yPos);
        yPos += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        // Grundinformationen
        const tripInfo = [
            ['Fahrt-Nr.:', `#${trip.id}`],
            ['Datum:', new Date(trip.date).toLocaleDateString('de-DE')],
            ['Startzeit:', trip.startTime ? new Date(trip.startTime).toLocaleTimeString('de-DE') : 'Nicht verfügbar'],
            ['Endzeit:', trip.endTime ? new Date(trip.endTime).toLocaleTimeString('de-DE') : 'Nicht verfügbar'],
            ['Dauer:', trip.getFormattedDuration()],
            ['Distanz:', trip.getFormattedDistance()],
            ['Status:', trip.getStatusText()],
            ['Fahrttyp:', trip.getTripTypeText()]
        ];

        tripInfo.forEach(([label, value]) => {
            pdf.text(label, 20, yPos);
            pdf.text(value, 80, yPos);
            yPos += 6;
        });

        yPos += 5;

        // Fahrer-Informationen
        if (driver) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('Fahrer', 20, yPos);
            yPos += 8;
            
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Name: ${driver.getFullName()}`, 20, yPos);
            yPos += 6;
            if (driver.employeeId) {
                pdf.text(`Mitarbeiter-Nr.: ${driver.employeeId}`, 20, yPos);
                yPos += 6;
            }
            if (driver.licenseNumber) {
                pdf.text(`Führerschein: ${driver.licenseNumber}`, 20, yPos);
                yPos += 6;
            }
        }

        yPos += 5;

        // Fahrgäste
        if (passengers.length > 0) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('Fahrgäste', 20, yPos);
            yPos += 8;
            
            pdf.setFont('helvetica', 'normal');
            passengers.forEach((passenger, index) => {
                pdf.text(`${index + 1}. ${passenger.getFullName()}`, 20, yPos);
                if (passenger.address) {
                    yPos += 6;
                    pdf.text(`   ${passenger.address}`, 20, yPos);
                }
                if (passenger.mobility !== 'normal') {
                    yPos += 6;
                    pdf.text(`   Mobilität: ${passenger.mobility}`, 20, yPos);
                }
                yPos += 8;
            });
        }

        // Route-Informationen
        if (route && route.points.length > 0) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('Route', 20, yPos);
            yPos += 8;
            
            pdf.setFont('helvetica', 'normal');
            pdf.text(`GPS-Punkte: ${route.points.length}`, 20, yPos);
            yPos += 6;
            pdf.text(`Startpunkt: ${route.points[0].latitude.toFixed(6)}, ${route.points[0].longitude.toFixed(6)}`, 20, yPos);
            yPos += 6;
            const lastPoint = route.points[route.points.length - 1];
            pdf.text(`Endpunkt: ${lastPoint.latitude.toFixed(6)}, ${lastPoint.longitude.toFixed(6)}`, 20, yPos);
            yPos += 6;
        }

        // Notizen
        if (trip.notes) {
            yPos += 5;
            pdf.setFont('helvetica', 'bold');
            pdf.text('Notizen', 20, yPos);
            yPos += 8;
            
            pdf.setFont('helvetica', 'normal');
            const lines = pdf.splitTextToSize(trip.notes, 170);
            pdf.text(lines, 20, yPos);
        }
    }

    // Unterschriftenbereich hinzufügen
    addSignatureArea(pdf) {
        const yPos = 250;
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Unterschriften', 20, yPos);
        
        // Fahrer-Unterschrift
        pdf.setFont('helvetica', 'normal');
        pdf.text('Fahrer:', 20, yPos + 20);
        pdf.line(50, yPos + 25, 120, yPos + 25);
        pdf.text('Datum:', 130, yPos + 20);
        pdf.line(150, yPos + 25, 190, yPos + 25);
        
        // Fahrgast-Unterschrift
        pdf.text('Fahrgast:', 20, yPos + 40);
        pdf.line(50, yPos + 45, 120, yPos + 45);
        pdf.text('Datum:', 130, yPos + 40);
        pdf.line(150, yPos + 45, 190, yPos + 45);
    }

    // Footer hinzufügen
    addFooter(pdf) {
        const pageHeight = pdf.internal.pageSize.height;
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('AWO Ostprignitz-Ruppin - Fahrdienst', 20, pageHeight - 20);
        pdf.text(`Seite 1 - Erstellt mit AWO Fahrdienst App v${window.app ? window.app.version : '1.0.0'}`, 20, pageHeight - 15);
    }

    // Monats-Statistiken hinzufügen
    addMonthlyStats(pdf, stats) {
        let yPos = 60;
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Statistiken', 20, yPos);
        yPos += 15;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        const statsInfo = [
            ['Gesamte Fahrten:', stats.totalTrips.toString()],
            ['Abgeschlossene Fahrten:', stats.completedTrips.toString()],
            ['Abgebrochene Fahrten:', stats.cancelledTrips.toString()],
            ['Gesamtdistanz:', `${stats.totalDistance.toFixed(1)} km`],
            ['Gesamtzeit:', `${Math.floor(stats.totalDuration / 60)}h ${stats.totalDuration % 60}min`],
            ['Durchschnittliche Fahrtdauer:', `${Math.floor(stats.avgDuration / 60)}h ${Math.floor(stats.avgDuration % 60)}min`],
            ['Durchschnittliche Distanz:', `${stats.avgDistance.toFixed(1)} km`],
            ['Anzahl Fahrgäste:', stats.totalPassengers.toString()],
            ['Aktive Fahrer:', stats.activeDrivers.toString()]
        ];

        statsInfo.forEach(([label, value]) => {
            pdf.text(label, 20, yPos);
            pdf.text(value, 120, yPos);
            yPos += 8;
        });
    }

    // Fahrtenliste hinzufügen
    addTripsList(pdf, trips) {
        let yPos = 180;
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Fahrtenliste', 20, yPos);
        yPos += 15;
        
        // Tabellen-Header
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Nr.', 20, yPos);
        pdf.text('Datum', 35, yPos);
        pdf.text('Zeit', 65, yPos);
        pdf.text('Dauer', 85, yPos);
        pdf.text('Distanz', 110, yPos);
        pdf.text('Status', 135, yPos);
        pdf.text('Fahrgäste', 160, yPos);
        
        yPos += 5;
        pdf.line(20, yPos, 190, yPos);
        yPos += 5;
        
        // Fahrten-Daten
        pdf.setFont('helvetica', 'normal');
        trips.slice(0, 15).forEach(trip => { // Maximal 15 Fahrten pro Seite
            pdf.text(`#${trip.id}`, 20, yPos);
            pdf.text(new Date(trip.date).toLocaleDateString('de-DE'), 35, yPos);
            pdf.text(trip.startTime ? new Date(trip.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '-', 65, yPos);
            pdf.text(trip.getFormattedDuration(), 85, yPos);
            pdf.text(trip.getFormattedDistance(), 110, yPos);
            pdf.text(trip.getStatusText(), 135, yPos);
            pdf.text(trip.passengers.length.toString(), 160, yPos);
            yPos += 6;
        });
        
        if (trips.length > 15) {
            yPos += 5;
            pdf.text(`... und ${trips.length - 15} weitere Fahrten`, 20, yPos);
        }
    }

    // Monats-Statistiken berechnen
    calculateMonthlyStats(trips) {
        const stats = {
            totalTrips: trips.length,
            completedTrips: 0,
            cancelledTrips: 0,
            totalDistance: 0,
            totalDuration: 0,
            totalPassengers: 0,
            activeDrivers: new Set(),
            avgDistance: 0,
            avgDuration: 0
        };

        trips.forEach(trip => {
            if (trip.status === 'completed') {
                stats.completedTrips++;
                stats.totalDistance += trip.distance || 0;
                stats.totalDuration += trip.duration || 0;
            } else if (trip.status === 'cancelled') {
                stats.cancelledTrips++;
            }
            
            stats.totalPassengers += trip.passengers.length;
            stats.activeDrivers.add(trip.driverId);
        });

        stats.activeDrivers = stats.activeDrivers.size;
        
        if (stats.completedTrips > 0) {
            stats.avgDistance = stats.totalDistance / stats.completedTrips;
            stats.avgDuration = stats.totalDuration / stats.completedTrips;
        }

        return stats;
    }

    // Nachweis-Datensatz speichern
    async saveReportRecord(tripId, filename, type) {
        if (!window.dbManager) return;

        try {
            const report = new Report({
                tripId: tripId,
                type: type,
                title: filename,
                date: new Date().toISOString(),
                pdfPath: filename,
                status: 'generated',
                content: {
                    filename: filename,
                    generatedAt: new Date().toISOString()
                }
            });

            await window.dbManager.createReport(report);
            console.log('Nachweis-Datensatz gespeichert:', report.id);

        } catch (error) {
            console.error('Fehler beim Speichern des Nachweis-Datensatzes:', error);
        }
    }

    // Kosten-Nachweis erstellen
    async generateExpenseReport(startDate, endDate) {
        if (!this.isInitialized) {
            throw new Error('PDF-Generator nicht initialisiert');
        }

        try {
            console.log('Erstelle Kosten-Nachweis...');

            // Fahrten im Zeitraum laden
            const trips = await window.dbManager.getReportsByDateRange(startDate, endDate);
            
            // Kosten berechnen
            const expenses = this.calculateExpenses(trips);

            // PDF erstellen
            const pdf = new window.jsPDF.jsPDF();
            
            // Header
            this.addHeader(pdf, 'Kosten-Nachweis');
            
            // Kosten-Details
            this.addExpenseDetails(pdf, expenses, startDate, endDate);
            
            // Footer
            this.addFooter(pdf);

            // PDF speichern
            const filename = `Kostennachweis_${startDate}_${endDate}.pdf`;
            pdf.save(filename);

            // Nachweis in Datenbank speichern
            await this.saveReportRecord(null, filename, 'expense_report');

            console.log('Kosten-Nachweis erstellt:', filename);
            return filename;

        } catch (error) {
            console.error('Fehler beim Erstellen des Kosten-Nachweises:', error);
            throw error;
        }
    }

    // Kosten berechnen
    calculateExpenses(trips) {
        const expenses = {
            totalDistance: 0,
            fuelCosts: 0,
            maintenanceCosts: 0,
            totalCosts: 0,
            costPerKm: 0.30, // Standard-Kilometerpauschale
            trips: []
        };

        trips.forEach(trip => {
            if (trip.status === 'completed' && trip.distance) {
                const tripCost = trip.distance * expenses.costPerKm;
                expenses.totalDistance += trip.distance;
                expenses.totalCosts += tripCost;
                
                expenses.trips.push({
                    id: trip.id,
                    date: trip.date,
                    distance: trip.distance,
                    cost: tripCost
                });
            }
        });

        expenses.fuelCosts = expenses.totalCosts * 0.7; // 70% für Kraftstoff
        expenses.maintenanceCosts = expenses.totalCosts * 0.3; // 30% für Wartung

        return expenses;
    }

    // Kosten-Details hinzufügen
    addExpenseDetails(pdf, expenses, startDate, endDate) {
        let yPos = 60;
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Zeitraum: ${startDate} bis ${endDate}`, 20, yPos);
        yPos += 15;
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Kosten-Übersicht', 20, yPos);
        yPos += 15;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        const costInfo = [
            ['Gesamtdistanz:', `${expenses.totalDistance.toFixed(1)} km`],
            ['Kilometerpauschale:', `${expenses.costPerKm.toFixed(2)} €/km`],
            ['Kraftstoffkosten:', `${expenses.fuelCosts.toFixed(2)} €`],
            ['Wartungskosten:', `${expenses.maintenanceCosts.toFixed(2)} €`],
            ['Gesamtkosten:', `${expenses.totalCosts.toFixed(2)} €`]
        ];

        costInfo.forEach(([label, value]) => {
            pdf.text(label, 20, yPos);
            pdf.text(value, 120, yPos);
            yPos += 8;
        });
    }

    // Status abrufen
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasJsPDF: typeof window.jsPDF !== 'undefined'
        };
    }
}

// Globale PDF-Generator-Instanz
window.pdfGenerator = new PDFGenerator();

