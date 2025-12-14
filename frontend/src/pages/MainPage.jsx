import React, { useState, useEffect } from 'react';
import { usePrayerTimes } from '../contexts/PrayerTimesContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { tr } from '../utils/translations';
import { calculateDistanceToMakkah, formatDistance } from '../utils/qiblaUtils';
import { getHijriDate } from '../utils/hijriUtils';
import { exportPrayerTimesToICS, exportMonthlyPrayerTimes, exportYearlyPrayerTimes } from '../utils/icsExport';
import PrayerTimeCard from '../components/PrayerTimeCard';
import CountdownHeader from '../components/CountdownHeader';
import CardAnimation from '../components/CardAnimation';
import SkeletonLoader from '../components/SkeletonLoader';
import DatePicker from '../components/DatePicker';

const MainPage = () => {
    const { prayerTimes, countdown, currentPrayer, nextPrayer, city, loading, latitude, longitude, loadPrayerTimes, selectedDate } = usePrayerTimes();
    const { notifications } = useNotifications();
    const [qiblaDistance, setQiblaDistance] = useState('---');
    const [hijriDate, setHijriDate] = useState('---');
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    const prayers = [
        { key: 'fajr', name: 'Fajr (Dawn) Full', icon: '🌅' },
        { key: 'sunrise', name: 'Sunrise Full', icon: '☀️', isInfo: true },
        { key: 'dhuhr', name: 'Dhuhr (Noon) Full', icon: '🌞' },
        { key: 'asr', name: 'Asr (Afternoon) Full', icon: '🌤️' },
        { key: 'maghrib', name: 'Maghrib (Sunset) Full', icon: '🌆' },
        { key: 'isha', name: 'Isha (Night) Full', icon: '🌙' }
    ];

    // Обновление расстояния до Мекки
    useEffect(() => {
        if (latitude && longitude) {
            const distance = calculateDistanceToMakkah(latitude, longitude);
            setQiblaDistance(formatDistance(distance));
        }
    }, [latitude, longitude]);

    // Обновление даты Хиджры
    useEffect(() => {
        const hijri = getHijriDate();
        setHijriDate(hijri.formatted);
        
        // Обновляем раз в день
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow - now;
        
        const timeout = setTimeout(() => {
            const hijri = getHijriDate();
            setHijriDate(hijri.formatted);
        }, msUntilMidnight);
        
        return () => clearTimeout(timeout);
    }, []);

    // Закрытие меню экспорта при клике вне его
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportMenuOpen && !event.target.closest('[data-export-menu]')) {
                setExportMenuOpen(false);
            }
        };

        if (exportMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [exportMenuOpen]);

    const handleDateSelect = async (date) => {
        await loadPrayerTimes(date);
    };

    return (
        <div className="page">
            <CountdownHeader 
                countdown={countdown} 
                city={city}
                onDateSelect={() => setDatePickerOpen(true)}
            />
            
            <div className="current-next-cards">
                <div className="prayer-card current-prayer">
                    <div className="prayer-card-label">{tr('Current')}</div>
                    <div className="prayer-card-name">{currentPrayer ? tr(currentPrayer) : '---'}</div>
                </div>
                <div className="prayer-card next-prayer">
                    <div className="prayer-card-label">{tr('Next')}</div>
                    <div className="prayer-card-name">{nextPrayer ? tr(nextPrayer) : '---'}</div>
                </div>
            </div>

            <div className="prayer-times-list">
                {loading ? (
                    <SkeletonLoader lines={6} />
                ) : (
                    prayers.map((prayer, index) => (
                        <CardAnimation key={prayer.key} delay={index * 50}>
                            <PrayerTimeCard
                                prayer={prayer}
                                time={prayerTimes[prayer.key]}
                                isCurrent={currentPrayer === prayer.name.split(' ')[0]}
                                isNext={nextPrayer === prayer.name.split(' ')[0]}
                            />
                        </CardAnimation>
                    ))
                )}
            </div>

            <div className="info-widgets">
                <div className="info-widget">
                    <div className="widget-icon">🕋</div>
                    <div className="widget-label">{tr('Distance to Makkah')}</div>
                    <div className="widget-value">{qiblaDistance}</div>
                </div>
                <div className="info-widget">
                    <div className="widget-icon">☪️</div>
                    <div className="widget-label">{tr('Hijri Date')}</div>
                    <div className="widget-value">{hijriDate}</div>
                </div>
                <div className="info-widget">
                    <div className="widget-icon">🔔</div>
                    <div className="widget-label">{tr('Notifications')}</div>
                    <div className="widget-value">{notifications ? tr('Enabled') : tr('Disabled')}</div>
                </div>
            </div>

            {/* Кнопки управления */}
            <div className="date-controls" style={{ padding: '16px', display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="date-display">
                    <span>{tr('Date:')}</span>
                    <span>{selectedDate ? selectedDate.toLocaleDateString('ru-RU') : (prayerTimes?.date || new Date().toLocaleDateString('ru-RU'))}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative' }} data-export-menu>
                        <button 
                            className="btn btn-primary"
                            onClick={() => setExportMenuOpen(!exportMenuOpen)}
                            title={tr('Export to Calendar') || 'Экспорт в календарь'}
                        >
                            📅 {tr('Export') || 'Экспорт'}
                        </button>
                        {exportMenuOpen && (
                            <div style={{
                                position: 'absolute',
                                bottom: '100%',
                                right: 0,
                                marginBottom: '8px',
                                background: 'var(--cardColor)',
                                border: '1px solid var(--borderColor)',
                                borderRadius: 'var(--radiusMedium)',
                                padding: '8px',
                                boxShadow: '0 4px 12px var(--shadowColor)',
                                zIndex: 1000,
                                minWidth: '180px'
                            }}>
                                <button
                                    className="btn btn-outline"
                                    style={{ width: '100%', marginBottom: '4px' }}
                                    onClick={() => {
                                        exportPrayerTimesToICS(prayerTimes, city, new Date(), 7);
                                        setExportMenuOpen(false);
                                    }}
                                >
                                    Неделя
                                </button>
                                <button
                                    className="btn btn-outline"
                                    style={{ width: '100%', marginBottom: '4px' }}
                                    onClick={() => {
                                        exportMonthlyPrayerTimes(prayerTimes, city);
                                        setExportMenuOpen(false);
                                    }}
                                >
                                    Месяц
                                </button>
                                <button
                                    className="btn btn-outline"
                                    style={{ width: '100%' }}
                                    onClick={() => {
                                        exportYearlyPrayerTimes(prayerTimes, city);
                                        setExportMenuOpen(false);
                                    }}
                                >
                                    Год
                                </button>
                            </div>
                        )}
                    </div>
                    <button 
                        className="btn btn-refresh" 
                        onClick={() => loadPrayerTimes()}
                        title="Обновить время молитв"
                    >
                        🔄
                    </button>
                </div>
            </div>

            <DatePicker
                isOpen={datePickerOpen}
                onClose={() => setDatePickerOpen(false)}
                onSelectDate={handleDateSelect}
                selectedDate={selectedDate}
            />
        </div>
    );
};

export default MainPage;
