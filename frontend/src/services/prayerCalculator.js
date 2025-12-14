import { getApiUrl } from '../config/api';

class PrayerTimesCalculator {
    constructor() {
        this.latitude = 55.7558;
        this.longitude = 37.6173;
        this.city = "Москва";
        this.calculationMethod = 3;
        this.madhhab = 0;
        this.prayerTimes = {};
        this.selectedDate = new Date();
        this.loadSettings();
    }
    
    loadSettings() {
        const saved = localStorage.getItem('prayerSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.latitude = settings.latitude || this.latitude;
            this.longitude = settings.longitude || this.longitude;
            this.city = settings.city || this.city;
            this.calculationMethod = settings.calculationMethod || this.calculationMethod;
            this.madhhab = settings.madhhab || this.madhhab;
        }
    }
    
    saveSettings() {
        localStorage.setItem('prayerSettings', JSON.stringify({
            latitude: this.latitude,
            longitude: this.longitude,
            city: this.city,
            calculationMethod: this.calculationMethod,
            madhhab: this.madhhab
        }));
    }
    
    setLocation(lat, lon, cityName = '') {
        this.latitude = lat;
        this.longitude = lon;
        if (cityName) {
            this.city = cityName;
        }
        this.saveSettings();
    }
    
    setCalculationMethod(method) {
        this.calculationMethod = parseInt(method);
        this.saveSettings();
    }
    
    setMadhhab(madhhab) {
        this.madhhab = parseInt(madhhab);
        this.saveSettings();
    }
    
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    async fetchPrayerTimes(date = null) {
        const targetDate = date || this.selectedDate;
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1;
        const day = targetDate.getDate();
        
        const url = `${getApiUrl('/prayer-times')}?lat=${this.latitude}&lon=${this.longitude}&city=${encodeURIComponent(this.city)}&method=${this.calculationMethod}&madhhab=${this.madhhab}&year=${year}&month=${month}&day=${day}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                },
                cache: 'no-store'
            });
            const data = await response.json();
            
            if (data.success && data.data) {
                this.prayerTimes = {
                    fajr: data.data.fajr,
                    sunrise: data.data.sunrise,
                    dhuhr: data.data.dhuhr,
                    asr: data.data.asr,
                    maghrib: data.data.maghrib,
                    isha: data.data.isha,
                    date: data.data.date,
                    currentPrayer: data.data.currentPrayer,
                    nextPrayer: data.data.nextPrayer
                };
                if (data.data.city) {
                    this.city = data.data.city;
                }
                return this.prayerTimes;
            } else {
                throw new Error('Invalid API response');
            }
        } catch (error) {
            console.error('Ошибка при получении времени молитв:', error);
            return this.calculatePrayerTimesLocal(targetDate);
        }
    }
    
    calculatePrayerTimesLocal(date) {
        return {
            fajr: "05:00",
            sunrise: "06:30",
            dhuhr: "12:00",
            asr: "15:00",
            maghrib: "18:00",
            isha: "19:30",
            date: this.formatDateDisplay(date)
        };
    }
    
    formatDateDisplay(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }
    
    getCurrentPrayer() {
        if (this.prayerTimes && this.prayerTimes.currentPrayer) {
            return this.prayerTimes.currentPrayer;
        }
        if (!this.prayerTimes || Object.keys(this.prayerTimes).length === 0) {
            return "Isha";
        }
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const prayers = [
            { name: "Isha", time: this.prayerTimes.isha },
            { name: "Maghrib", time: this.prayerTimes.maghrib },
            { name: "Asr", time: this.prayerTimes.asr },
            { name: "Dhuhr", time: this.prayerTimes.dhuhr },
            { name: "Sunrise", time: this.prayerTimes.sunrise },
            { name: "Fajr", time: this.prayerTimes.fajr }
        ];
        for (let i = prayers.length - 1; i >= 0; i--) {
            if (currentTime >= prayers[i].time) {
                return prayers[i].name;
            }
        }
        return "Isha";
    }
    
    getNextPrayer() {
        if (this.prayerTimes && this.prayerTimes.nextPrayer) {
            return this.prayerTimes.nextPrayer;
        }
        if (!this.prayerTimes || Object.keys(this.prayerTimes).length === 0) {
            return "Fajr";
        }
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const prayers = [
            { name: "Fajr", time: this.prayerTimes.fajr },
            { name: "Sunrise", time: this.prayerTimes.sunrise },
            { name: "Dhuhr", time: this.prayerTimes.dhuhr },
            { name: "Asr", time: this.prayerTimes.asr },
            { name: "Maghrib", time: this.prayerTimes.maghrib },
            { name: "Isha", time: this.prayerTimes.isha }
        ];
        for (let prayer of prayers) {
            if (currentTime < prayer.time) {
                return prayer.name;
            }
        }
        return "Fajr";
    }
    
    getNextPrayerTime() {
        const nextPrayer = this.getNextPrayer();
        if (!this.prayerTimes || !this.prayerTimes[nextPrayer.toLowerCase()]) {
            return null;
        }
        return this.prayerTimes[nextPrayer.toLowerCase()];
    }
    
    getTimeUntilNextPrayer() {
        const nextTime = this.getNextPrayerTime();
        if (!nextTime) return 0;
        const now = new Date();
        const [hours, minutes] = nextTime.split(':').map(Number);
        const nextPrayerDate = new Date(now);
        nextPrayerDate.setHours(hours, minutes, 0, 0);
        if (nextPrayerDate < now) {
            nextPrayerDate.setDate(nextPrayerDate.getDate() + 1);
        }
        return Math.floor((nextPrayerDate - now) / 1000);
    }
}

export default PrayerTimesCalculator;
