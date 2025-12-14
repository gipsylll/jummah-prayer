import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PrayerTimesCalculator from '../services/prayerCalculator';

const PrayerTimesContext = createContext();

export const usePrayerTimes = () => {
    const context = useContext(PrayerTimesContext);
    if (!context) {
        throw new Error('usePrayerTimes must be used within PrayerTimesProvider');
    }
    return context;
};

export const PrayerTimesProvider = ({ children }) => {
    const [calculator] = useState(() => new PrayerTimesCalculator());
    const [prayerTimes, setPrayerTimes] = useState({});
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState(0);
    const [currentPrayer, setCurrentPrayer] = useState('');
    const [nextPrayer, setNextPrayer] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());

    const loadPrayerTimes = useCallback(async (date = null) => {
        try {
            setLoading(true);
            const targetDate = date || selectedDate;
            if (date) {
                setSelectedDate(new Date(date));
            }
            const times = await calculator.fetchPrayerTimes(targetDate);
            setPrayerTimes(times);
            setCurrentPrayer(calculator.getCurrentPrayer());
            setNextPrayer(calculator.getNextPrayer());
            return times;
        } catch (error) {
            console.error('Ошибка загрузки времени молитв:', error);
            return null;
        } finally {
            setLoading(false);
        }
    }, [calculator, selectedDate]);

    useEffect(() => {
        loadPrayerTimes();
    }, [loadPrayerTimes]);

    useEffect(() => {
        const updateCountdown = () => {
            const seconds = calculator.getTimeUntilNextPrayer();
            setCountdown(seconds);
            setCurrentPrayer(calculator.getCurrentPrayer());
            setNextPrayer(calculator.getNextPrayer());
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [calculator, prayerTimes]);

    const setLocation = useCallback((lat, lon, cityName) => {
        calculator.setLocation(lat, lon, cityName);
        loadPrayerTimes();
    }, [calculator, loadPrayerTimes]);

    const setCalculationMethod = useCallback((method) => {
        calculator.setCalculationMethod(method);
        loadPrayerTimes();
    }, [calculator, loadPrayerTimes]);

    const setMadhhab = useCallback((madhhab) => {
        calculator.setMadhhab(madhhab);
        loadPrayerTimes();
    }, [calculator, loadPrayerTimes]);

    const formatCountdown = () => {
        const hours = Math.floor(countdown / 3600);
        const minutes = Math.floor((countdown % 3600) / 60);
        const seconds = countdown % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    return (
        <PrayerTimesContext.Provider value={{
            prayerTimes: prayerTimes || {},
            loading,
            countdown: formatCountdown(),
            currentPrayer: currentPrayer || '',
            nextPrayer: nextPrayer || '',
            city: calculator?.city || 'Москва',
            latitude: calculator?.latitude || 55.7558,
            longitude: calculator?.longitude || 37.6173,
            calculationMethod: calculator?.calculationMethod ?? 3,
            madhhab: calculator?.madhhab ?? 0,
            selectedDate,
            loadPrayerTimes,
            setLocation,
            setCalculationMethod,
            setMadhhab,
            calculator
        }}>
            {children}
        </PrayerTimesContext.Provider>
    );
};
