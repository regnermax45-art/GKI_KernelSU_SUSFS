// Cordova-spezifische Erweiterungen für AWO Fahrdienst App
class CordovaExtensions {
    constructor() {
        this.isReady = false;
        this.deviceInfo = null;
        this.networkStatus = 'unknown';
        
        console.log('Cordova Extensions initialisiert');
    }

    // Cordova-spezifische Initialisierung
    init() {
        document.addEventListener('deviceready', () => {
            this.onDeviceReady();
        }, false);

        document.addEventListener('pause', () => {
            this.onPause();
        }, false);

        document.addEventListener('resume', () => {
            this.onResume();
        }, false);

        document.addEventListener('backbutton', (e) => {
            this.onBackButton(e);
        }, false);

        console.log('Cordova Event-Listener registriert');
    }

    // Device Ready Event
    onDeviceReady() {
        this.isReady = true;
        console.log('Cordova Device Ready');

        // Device-Informationen abrufen
        this.getDeviceInfo();

        // Netzwerk-Status überwachen
        this.setupNetworkMonitoring();

        // GPS-Einstellungen für Cordova anpassen
        this.setupCordovaGPS();

        // Status Bar konfigurieren
        this.setupStatusBar();

        // Toast-Benachrichtigungen einrichten
        this.setupToastNotifications();

        // File-System für PDF-Export einrichten
        this.setupFileSystem();

        // App-spezifische Cordova-Initialisierung
        if (window.app) {
            window.app.onCordovaReady();
        }
    }

    // App pausiert
    onPause() {
        console.log('App pausiert');
        
        // GPS-Tracking pausieren wenn keine aktive Fahrt
        if (window.tripTracker && !window.tripTracker.isTracking) {
            if (window.gpsManager) {
                window.gpsManager.stopTracking();
            }
        }

        // Daten synchronisieren
        if (window.dbManager) {
            window.dbManager.syncPendingData();
        }
    }

    // App fortgesetzt
    onResume() {
        console.log('App fortgesetzt');
        
        // GPS-Tracking fortsetzen wenn aktive Fahrt
        if (window.tripTracker && window.tripTracker.isTracking) {
            if (window.gpsManager) {
                const tripId = window.tripTracker.currentTrip?.id;
                if (tripId) {
                    window.gpsManager.startTracking(tripId);
                }
            }
        }

        // Netzwerk-Status aktualisieren
        this.checkNetworkStatus();
    }

    // Zurück-Button gedrückt
    onBackButton(e) {
        e.preventDefault();
        
        // Modal geöffnet?
        const modal = document.getElementById('modalOverlay');
        if (modal && modal.classList.contains('active')) {
            if (window.navigationManager) {
                window.navigationManager.closeModal();
            }
            return;
        }

        // Auf Karten-Tab?
        if (window.navigationManager && window.navigationManager.currentTab === 'map') {
            // App minimieren statt beenden
            if (navigator.app) {
                navigator.app.exitApp();
            }
        } else {
            // Zu Karten-Tab wechseln
            if (window.navigationManager) {
                window.navigationManager.switchTab('map');
            }
        }
    }

    // Device-Informationen abrufen
    getDeviceInfo() {
        if (window.device) {
            this.deviceInfo = {
                platform: device.platform,
                version: device.version,
                uuid: device.uuid,
                model: device.model,
                manufacturer: device.manufacturer,
                isVirtual: device.isVirtual,
                serial: device.serial
            };
            
            console.log('Device Info:', this.deviceInfo);
        }
    }

    // Netzwerk-Monitoring für Cordova
    setupNetworkMonitoring() {
        if (window.Connection) {
            document.addEventListener('online', () => {
                this.networkStatus = 'online';
                this.onNetworkOnline();
            }, false);

            document.addEventListener('offline', () => {
                this.networkStatus = 'offline';
                this.onNetworkOffline();
            }, false);

            // Initial Status prüfen
            this.checkNetworkStatus();
        }
    }

    // Netzwerk-Status prüfen
    checkNetworkStatus() {
        if (navigator.connection) {
            const networkState = navigator.connection.type;
            
            if (networkState === Connection.NONE) {
                this.networkStatus = 'offline';
            } else {
                this.networkStatus = 'online';
            }
            
            console.log('Network Status:', this.networkStatus, 'Type:', networkState);
        }
    }

    // Online Event
    onNetworkOnline() {
        console.log('Netzwerk online');
        
        if (window.app) {
            window.app.isOnline = true;
            window.app.updateConnectionStatus();
        }

        // Toast anzeigen
        this.showToast('Verbindung wiederhergestellt', 'success');

        // Daten synchronisieren
        if (window.dbManager) {
            window.dbManager.syncPendingData();
        }
    }

    // Offline Event
    onNetworkOffline() {
        console.log('Netzwerk offline');
        
        if (window.app) {
            window.app.isOnline = false;
            window.app.updateConnectionStatus();
        }

        // Toast anzeigen
        this.showToast('Offline-Modus aktiviert', 'warning');
    }

    // GPS für Cordova konfigurieren
    setupCordovaGPS() {
        if (window.gpsManager && navigator.geolocation) {
            // Cordova-spezifische GPS-Optionen
            window.gpsManager.updateGPSOptions({
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000
            });

            console.log('Cordova GPS konfiguriert');
        }
    }

    // Status Bar konfigurieren
    setupStatusBar() {
        if (window.StatusBar) {
            StatusBar.styleDefault();
            StatusBar.backgroundColorByHexString('#2196F3');
            StatusBar.show();
            
            console.log('Status Bar konfiguriert');
        }
    }

    // Toast-Benachrichtigungen einrichten
    setupToastNotifications() {
        // Cordova Toast Plugin verwenden falls verfügbar
        this.hasToastPlugin = !!window.plugins?.toast;
        console.log('Toast Plugin verfügbar:', this.hasToastPlugin);
    }

    // Toast anzeigen (Cordova-optimiert)
    showToast(message, type = 'info', duration = 3000) {
        if (this.hasToastPlugin) {
            // Native Toast verwenden
            const position = type === 'error' ? 'top' : 'bottom';
            window.plugins.toast.show(message, duration === 3000 ? 'short' : 'long', position);
        } else {
            // Fallback auf Web-Toast
            if (window.navigationManager) {
                window.navigationManager.showToast(message, type, duration);
            }
        }
    }

    // File-System für PDF-Export einrichten
    setupFileSystem() {
        if (window.requestFileSystem) {
            // Cordova File Plugin verfügbar
            this.hasFileSystem = true;
            console.log('File System verfügbar');
        }
    }

    // PDF in Downloads-Ordner speichern
    async savePDFToDownloads(pdfBlob, filename) {
        if (!this.hasFileSystem) {
            console.warn('File System nicht verfügbar');
            return null;
        }

        try {
            // Downloads-Ordner abrufen
            const downloadsDir = await this.getDownloadsDirectory();
            
            // PDF-Datei erstellen
            const fileEntry = await this.createFile(downloadsDir, filename);
            
            // PDF-Daten schreiben
            await this.writeFile(fileEntry, pdfBlob);
            
            console.log('PDF gespeichert:', fileEntry.nativeURL);
            
            // Toast anzeigen
            this.showToast(`PDF gespeichert: ${filename}`, 'success');
            
            return fileEntry.nativeURL;
            
        } catch (error) {
            console.error('Fehler beim Speichern der PDF:', error);
            this.showToast('Fehler beim Speichern der PDF', 'error');
            return null;
        }
    }

    // Downloads-Verzeichnis abrufen
    getDownloadsDirectory() {
        return new Promise((resolve, reject) => {
            if (this.deviceInfo?.platform === 'Android') {
                // Android Downloads-Ordner
                window.resolveLocalFileSystemURL(
                    cordova.file.externalRootDirectory + 'Download/',
                    resolve,
                    reject
                );
            } else {
                // Fallback auf Documents
                window.resolveLocalFileSystemURL(
                    cordova.file.documentsDirectory,
                    resolve,
                    reject
                );
            }
        });
    }

    // Datei erstellen
    createFile(directory, filename) {
        return new Promise((resolve, reject) => {
            directory.getFile(filename, { create: true, exclusive: false }, resolve, reject);
        });
    }

    // Datei schreiben
    writeFile(fileEntry, data) {
        return new Promise((resolve, reject) => {
            fileEntry.createWriter((fileWriter) => {
                fileWriter.onwriteend = resolve;
                fileWriter.onerror = reject;
                fileWriter.write(data);
            });
        });
    }

    // Vibration
    vibrate(duration = 100) {
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    // Dialog anzeigen
    showDialog(title, message, buttons = ['OK']) {
        return new Promise((resolve) => {
            if (navigator.notification) {
                navigator.notification.confirm(
                    message,
                    (buttonIndex) => resolve(buttonIndex),
                    title,
                    buttons
                );
            } else {
                // Fallback auf Browser-Dialog
                const result = confirm(`${title}\n\n${message}`);
                resolve(result ? 1 : 2);
            }
        });
    }

    // Alert anzeigen
    showAlert(title, message) {
        return new Promise((resolve) => {
            if (navigator.notification) {
                navigator.notification.alert(message, resolve, title, 'OK');
            } else {
                alert(`${title}\n\n${message}`);
                resolve();
            }
        });
    }

    // App-Informationen abrufen
    getAppInfo() {
        return {
            version: '1.0.0',
            platform: this.deviceInfo?.platform || 'unknown',
            device: this.deviceInfo?.model || 'unknown',
            networkStatus: this.networkStatus,
            isReady: this.isReady
        };
    }

    // Berechtigungen prüfen
    async checkPermissions() {
        const permissions = {
            location: false,
            storage: false,
            camera: false
        };

        // Location-Berechtigung prüfen
        if (navigator.geolocation) {
            try {
                await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 5000,
                        enableHighAccuracy: false
                    });
                });
                permissions.location = true;
            } catch (error) {
                permissions.location = false;
            }
        }

        return permissions;
    }

    // App beenden
    exitApp() {
        if (navigator.app) {
            navigator.app.exitApp();
        }
    }
}

// Cordova Extensions initialisieren
window.cordovaExtensions = new CordovaExtensions();

// Erweiterte App-Klasse für Cordova
if (window.AWOFahrdienstApp) {
    const originalInit = window.AWOFahrdienstApp.prototype.init;
    
    window.AWOFahrdienstApp.prototype.onCordovaReady = function() {
        console.log('App: Cordova Ready Event empfangen');
        
        // Cordova-spezifische Initialisierung
        this.cordovaExtensions = window.cordovaExtensions;
        
        // PDF-Generator erweitern
        if (window.pdfGenerator) {
            const originalSave = window.pdfGenerator.generateTripReport;
            window.pdfGenerator.generateTripReport = async function(tripId) {
                const filename = await originalSave.call(this, tripId);
                
                // In Downloads speichern wenn Cordova verfügbar
                if (window.cordovaExtensions.hasFileSystem && filename) {
                    // PDF-Blob erstellen (vereinfacht)
                    const pdfBlob = new Blob(['PDF Content'], { type: 'application/pdf' });
                    await window.cordovaExtensions.savePDFToDownloads(pdfBlob, filename);
                }
                
                return filename;
            };
        }
    };
}

// Cordova Extensions starten
document.addEventListener('DOMContentLoaded', () => {
    window.cordovaExtensions.init();
});

