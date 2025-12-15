import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PrayerTrackingContext = createContext();

export const usePrayerTracking = () => {
    const context = useContext(PrayerTrackingContext);
    if (!context) {
        throw new Error('usePrayerTracking must be used within PrayerTrackingProvider');
    }
    return context;
};

// Формат: { "2024-12-14": { "fajr": true, "dhuhr": false, ... } }
const getStorageKey = () => 'prayerTracking';

const getDateKey = (date = new Date()) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const PrayerTrackingProvider = ({ children }) => {
    const [tracking, setTracking] = useState(() => {
        const saved = localStorage.getItem(getStorageKey());
        return saved ? JSON.parse(saved) : {};
    });

    // Сохранение в localStorage при изменении
    useEffect(() => {
        localStorage.setItem(getStorageKey(), JSON.stringify(tracking));
    }, [tracking]);

    // Отметить молитву как выполненную
    const markPrayerCompleted = useCallback((date, prayerName) => {
        const dateKey = typeof date === 'string' ? date : getDateKey(date);
        setTracking(prev => ({
            ...prev,
            [dateKey]: {
                ...prev[dateKey],
                [prayerName.toLowerCase()]: true
            }
        }));
    }, []);

    // Отметить молитву как пропущенную
    const markPrayerMissed = useCallback((date, prayerName) => {
        const dateKey = typeof date === 'string' ? date : getDateKey(date);
        setTracking(prev => ({
            ...prev,
            [dateKey]: {
                ...prev[dateKey],
                [prayerName.toLowerCase()]: false
            }
        }));
    }, []);

    // Получить статус молитвы
    const getPrayerStatus = useCallback((date, prayerName) => {
        const dateKey = typeof date === 'string' ? date : getDateKey(date);
        const dayData = tracking[dateKey];
        if (!dayData) return null; // Не отмечено
        return dayData[prayerName.toLowerCase()] ?? null;
    }, [tracking]);

    // Получить данные за день
    const getDayData = useCallback((date) => {
        const dateKey = typeof date === 'string' ? date : getDateKey(date);
        return tracking[dateKey] || {};
    }, [tracking]);

    // Получить статистику за месяц
    const getMonthStats = useCallback((year, month) => {
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        let total = 0;
        let completed = 0;

        // Проходим по всем дням месяца
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = getDateKey(date);
            const dayData = tracking[dateKey] || {};

            prayers.forEach(prayer => {
                if (dayData.hasOwnProperty(prayer)) {
                    total++;
                    if (dayData[prayer] === true) {
                        completed++;
                    }
                }
            });
        }

        return {
            total,
            completed,
            missed: total - completed,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }, [tracking]);

    // Получить статистику за неделю
    const getWeekStats = useCallback((startDate) => {
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        let total = 0;
        let completed = 0;
        const weekData = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateKey = getDateKey(date);
            const dayData = tracking[dateKey] || {};
            const dayStats = { date: dateKey, prayers: {} };

            prayers.forEach(prayer => {
                if (dayData.hasOwnProperty(prayer)) {
                    total++;
                    dayStats.prayers[prayer] = dayData[prayer];
                    if (dayData[prayer] === true) {
                        completed++;
                    }
                }
            });

            weekData.push(dayStats);
        }

        return {
            total,
            completed,
            missed: total - completed,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
            weekData
        };
    }, [tracking]);

    // Очистить отметку молитвы
    const clearPrayerMark = useCallback((date, prayerName) => {
        const dateKey = typeof date === 'string' ? date : getDateKey(date);
        setTracking(prev => {
            const newData = { ...prev };
            if (newData[dateKey]) {
                const dayData = { ...newData[dateKey] };
                delete dayData[prayerName.toLowerCase()];
                if (Object.keys(dayData).length === 0) {
                    delete newData[dateKey];
                } else {
                    newData[dateKey] = dayData;
                }
            }
            return newData;
        });
    }, []);

    // Получить все данные
    const getAllTracking = useCallback(() => {
        return tracking;
    }, [tracking]);

    return (
        <PrayerTrackingContext.Provider value={{
            markPrayerCompleted,
            markPrayerMissed,
            clearPrayerMark,
            getPrayerStatus,
            getDayData,
            getMonthStats,
            getWeekStats,
            getAllTracking
        }}>
            {children}
        </PrayerTrackingContext.Provider>
    );
};


