// Timer-Utilities für AWO Fahrdienst App
class TimerManager {
    constructor() {
        this.timers = new Map();
        this.intervals = new Map();
        this.isInitialized = false;
    }

    // Timer-Manager initialisieren
    init() {
        console.log('Timer-Manager initialisiert');
        this.isInitialized = true;
    }

    // Neuen Timer erstellen
    createTimer(id, startTime = null) {
        const timer = {
            id: id,
            startTime: startTime || new Date(),
            endTime: null,
            duration: 0,
            isRunning: true,
            isPaused: false,
            pausedDuration: 0,
            pauseStart: null,
            callbacks: {
                tick: [],
                pause: [],
                resume: [],
                stop: []
            }
        };

        this.timers.set(id, timer);
        this.startTimerInterval(id);
        
        console.log('Timer erstellt:', id);
        return timer;
    }

    // Timer-Interval starten
    startTimerInterval(id) {
        const timer = this.timers.get(id);
        if (!timer) return;

        // Bestehenden Interval löschen
        if (this.intervals.has(id)) {
            clearInterval(this.intervals.get(id));
        }

        // Neuen Interval erstellen
        const interval = setInterval(() => {
            this.updateTimer(id);
        }, 1000);

        this.intervals.set(id, interval);
    }

    // Timer aktualisieren
    updateTimer(id) {
        const timer = this.timers.get(id);
        if (!timer || !timer.isRunning || timer.isPaused) return;

        const now = new Date();
        const elapsed = now - timer.startTime - timer.pausedDuration;
        timer.duration = Math.floor(elapsed / 1000); // Sekunden

        // Tick-Callbacks aufrufen
        this.notifyTimerCallbacks(id, 'tick', {
            duration: timer.duration,
            formatted: this.formatDuration(timer.duration)
        });
    }

    // Timer pausieren
    pauseTimer(id) {
        const timer = this.timers.get(id);
        if (!timer || !timer.isRunning || timer.isPaused) return false;

        timer.isPaused = true;
        timer.pauseStart = new Date();

        // Pause-Callbacks aufrufen
        this.notifyTimerCallbacks(id, 'pause', timer);

        console.log('Timer pausiert:', id);
        return true;
    }

    // Timer fortsetzen
    resumeTimer(id) {
        const timer = this.timers.get(id);
        if (!timer || !timer.isRunning || !timer.isPaused) return false;

        // Pausierte Zeit zur Gesamtpause hinzufügen
        if (timer.pauseStart) {
            const pauseDuration = new Date() - timer.pauseStart;
            timer.pausedDuration += pauseDuration;
            timer.pauseStart = null;
        }

        timer.isPaused = false;

        // Resume-Callbacks aufrufen
        this.notifyTimerCallbacks(id, 'resume', timer);

        console.log('Timer fortgesetzt:', id);
        return true;
    }

    // Timer stoppen
    stopTimer(id) {
        const timer = this.timers.get(id);
        if (!timer) return null;

        timer.isRunning = false;
        timer.endTime = new Date();

        // Finale Dauer berechnen
        if (timer.isPaused && timer.pauseStart) {
            const pauseDuration = timer.endTime - timer.pauseStart;
            timer.pausedDuration += pauseDuration;
        }

        const totalElapsed = timer.endTime - timer.startTime - timer.pausedDuration;
        timer.duration = Math.floor(totalElapsed / 1000);

        // Interval löschen
        if (this.intervals.has(id)) {
            clearInterval(this.intervals.get(id));
            this.intervals.delete(id);
        }

        // Stop-Callbacks aufrufen
        this.notifyTimerCallbacks(id, 'stop', timer);

        console.log('Timer gestoppt:', id, 'Dauer:', this.formatDuration(timer.duration));
        return timer;
    }

    // Timer löschen
    deleteTimer(id) {
        this.stopTimer(id);
        this.timers.delete(id);
        console.log('Timer gelöscht:', id);
    }

    // Timer abrufen
    getTimer(id) {
        return this.timers.get(id);
    }

    // Alle Timer abrufen
    getAllTimers() {
        return Array.from(this.timers.values());
    }

    // Aktive Timer abrufen
    getActiveTimers() {
        return Array.from(this.timers.values()).filter(timer => timer.isRunning);
    }

    // Timer-Callback registrieren
    onTimer(id, event, callback) {
        const timer = this.timers.get(id);
        if (timer && timer.callbacks[event]) {
            timer.callbacks[event].push(callback);
        }
    }

    // Timer-Callback entfernen
    offTimer(id, event, callback) {
        const timer = this.timers.get(id);
        if (timer && timer.callbacks[event]) {
            const index = timer.callbacks[event].indexOf(callback);
            if (index > -1) {
                timer.callbacks[event].splice(index, 1);
            }
        }
    }

    // Timer-Callbacks benachrichtigen
    notifyTimerCallbacks(id, event, data) {
        const timer = this.timers.get(id);
        if (timer && timer.callbacks[event]) {
            timer.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Fehler in Timer ${id} ${event} callback:`, error);
                }
            });
        }
    }

    // Dauer formatieren (Sekunden zu HH:MM:SS)
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Dauer formatieren (kurz, z.B. "1h 23m")
    formatDurationShort(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return `${seconds}s`;
        }
    }

    // Dauer zu Minuten konvertieren
    secondsToMinutes(seconds) {
        return Math.round(seconds / 60);
    }

    // Minuten zu Sekunden konvertieren
    minutesToSeconds(minutes) {
        return minutes * 60;
    }

    // Zeitstempel formatieren
    formatTimestamp(date, includeSeconds = false) {
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            ...(includeSeconds && { second: '2-digit' })
        };
        
        return date.toLocaleTimeString('de-DE', options);
    }

    // Datum formatieren
    formatDate(date) {
        return date.toLocaleDateString('de-DE');
    }

    // Datum und Zeit formatieren
    formatDateTime(date, includeSeconds = false) {
        return `${this.formatDate(date)} ${this.formatTimestamp(date, includeSeconds)}`;
    }

    // Zeitdifferenz berechnen
    calculateTimeDifference(startDate, endDate) {
        const diff = endDate - startDate;
        return Math.floor(diff / 1000); // Sekunden
    }

    // Countdown-Timer erstellen
    createCountdown(id, targetDate, onComplete = null) {
        const countdown = {
            id: id,
            targetDate: new Date(targetDate),
            isRunning: true,
            onComplete: onComplete,
            callbacks: {
                tick: [],
                complete: []
            }
        };

        this.timers.set(id, countdown);

        const interval = setInterval(() => {
            const now = new Date();
            const remaining = countdown.targetDate - now;

            if (remaining <= 0) {
                // Countdown abgelaufen
                clearInterval(interval);
                this.intervals.delete(id);
                countdown.isRunning = false;

                // Complete-Callbacks aufrufen
                this.notifyTimerCallbacks(id, 'complete', countdown);
                
                if (onComplete) {
                    onComplete();
                }
            } else {
                // Verbleibende Zeit berechnen
                const remainingSeconds = Math.floor(remaining / 1000);
                
                // Tick-Callbacks aufrufen
                this.notifyTimerCallbacks(id, 'tick', {
                    remaining: remainingSeconds,
                    formatted: this.formatDuration(remainingSeconds)
                });
            }
        }, 1000);

        this.intervals.set(id, interval);
        console.log('Countdown erstellt:', id);
        return countdown;
    }

    // Stoppuhr erstellen (einfacher Timer ohne Persistierung)
    createStopwatch(id) {
        return this.createTimer(id);
    }

    // Timer-Statistiken abrufen
    getTimerStats(id) {
        const timer = this.timers.get(id);
        if (!timer) return null;

        return {
            id: timer.id,
            startTime: timer.startTime,
            endTime: timer.endTime,
            duration: timer.duration,
            formattedDuration: this.formatDuration(timer.duration),
            isRunning: timer.isRunning,
            isPaused: timer.isPaused,
            pausedDuration: timer.pausedDuration,
            effectiveRunTime: timer.duration - Math.floor(timer.pausedDuration / 1000)
        };
    }

    // Alle Timer bereinigen
    cleanup() {
        // Alle Intervals löschen
        this.intervals.forEach((interval, id) => {
            clearInterval(interval);
        });

        this.intervals.clear();
        this.timers.clear();
        
        console.log('Timer-Manager bereinigt');
    }

    // Timer-Status abrufen
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            activeTimers: this.getActiveTimers().length,
            totalTimers: this.timers.size,
            runningIntervals: this.intervals.size
        };
    }
}

// Utility-Funktionen für Zeitberechnungen
class TimeUtils {
    // Arbeitszeit berechnen (ohne Pausen)
    static calculateWorkingTime(startTime, endTime, breaks = []) {
        let totalTime = endTime - startTime;
        
        // Pausen abziehen
        breaks.forEach(breakPeriod => {
            if (breakPeriod.start && breakPeriod.end) {
                const breakDuration = breakPeriod.end - breakPeriod.start;
                totalTime -= breakDuration;
            }
        });

        return Math.max(0, Math.floor(totalTime / 1000)); // Sekunden
    }

    // Durchschnittsgeschwindigkeit berechnen
    static calculateAverageSpeed(distance, duration) {
        if (duration === 0) return 0;
        return (distance / (duration / 3600)).toFixed(1); // km/h
    }

    // Geschätzte Ankunftszeit berechnen
    static calculateETA(distance, averageSpeed) {
        if (averageSpeed === 0) return null;
        
        const travelTimeHours = distance / averageSpeed;
        const eta = new Date();
        eta.setTime(eta.getTime() + (travelTimeHours * 60 * 60 * 1000));
        
        return eta;
    }

    // Zeitzone-sichere Datumsvergleiche
    static isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    static isToday(date) {
        return this.isSameDay(date, new Date());
    }

    static isYesterday(date) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return this.isSameDay(date, yesterday);
    }

    // Relative Zeitangaben
    static getRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) {
            return 'gerade eben';
        } else if (minutes < 60) {
            return `vor ${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
        } else if (hours < 24) {
            return `vor ${hours} Stunde${hours !== 1 ? 'n' : ''}`;
        } else if (days < 7) {
            return `vor ${days} Tag${days !== 1 ? 'en' : ''}`;
        } else {
            return date.toLocaleDateString('de-DE');
        }
    }

    // Arbeitszeiten validieren
    static isValidWorkingHours(time) {
        const hour = time.getHours();
        return hour >= 6 && hour <= 22; // 6:00 bis 22:00 Uhr
    }

    // Wochenende prüfen
    static isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6; // Sonntag oder Samstag
    }

    // Feiertag prüfen (vereinfacht)
    static isHoliday(date) {
        // Hier könnten deutsche Feiertage implementiert werden
        // Für den Prototyp nur Neujahr und Weihnachten
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        return (month === 1 && day === 1) || // Neujahr
               (month === 12 && day === 25) || // 1. Weihnachtstag
               (month === 12 && day === 26);   // 2. Weihnachtstag
    }
}

// Globale Timer-Manager-Instanz
window.timerManager = new TimerManager();
window.TimeUtils = TimeUtils;

