import React, { useState, useEffect } from 'react';
import { usePrayerTracking } from '../contexts/PrayerTrackingContext';
import { tr } from '../utils/translations';
import CardAnimation from '../components/CardAnimation';

const PrayerCalendarPage = () => {
    const { getDayData, markPrayerCompleted, markPrayerMissed, clearPrayerMark, getMonthStats } = usePrayerTracking();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const prayerNames = {
        fajr: 'Фаджр',
        dhuhr: 'Зухр',
        asr: 'Аср',
        maghrib: 'Магриб',
        isha: 'Иша'
    };

    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    const getDateKey = (date) => {
        return date.toISOString().split('T')[0];
    };

    const isSameDay = (date1, date2) => {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    };

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const today = new Date();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        let startingDayOfWeek = firstDay.getDay();
        startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
        
        const days = [];
        const monthStats = getMonthStats(year, month);
        
        // Заголовки дней недели
        dayNames.forEach(day => {
            days.push(
                <div key={`header-${day}`} className="calendar-day-header">
                    {day}
                </div>
            );
        });
        
        // Пустые ячейки до первого дня
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day other-month"></div>);
        }
        
        // Дни месяца
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = getDateKey(date);
            const dayData = getDayData(dateKey);
            const isToday = isSameDay(date, today);
            const isSelected = isSameDay(date, selectedDate);
            
            // Подсчет выполненных молитв за день
            const completedCount = prayers.filter(p => dayData[p] === true).length;
            const missedCount = prayers.filter(p => dayData[p] === false).length;
            const totalMarked = completedCount + missedCount;
            
            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            
            // Цветовая индикация
            if (completedCount === prayers.length) {
                classes += ' all-completed'; // Все выполнены - зеленый
            } else if (missedCount > 0 && completedCount === 0) {
                classes += ' all-missed'; // Все пропущены - красный
            } else if (totalMarked > 0) {
                classes += ' partially-completed'; // Частично - желтый/оранжевый
            }
            
            days.push(
                <div
                    key={`day-${day}`}
                    className={classes}
                    onClick={() => setSelectedDate(date)}
                    title={`Выполнено: ${completedCount}/${prayers.length}`}
                >
                    <div className="calendar-day-number">{day}</div>
                    {totalMarked > 0 && (
                        <div className="calendar-day-indicator">
                            <div className="calendar-day-stats">
                                <span className="completed-count">{completedCount}</span>
                                {missedCount > 0 && <span className="missed-count">/{missedCount}</span>}
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        
        return { days, monthStats };
    };

    const handlePrevMonth = () => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + 1);
            return newDate;
        });
    };

    const selectedDateKey = getDateKey(selectedDate);
    const selectedDayData = getDayData(selectedDateKey);

    const { days, monthStats } = renderCalendar();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    return (
        <div className="page">
            <div className="page-header">
                <h1>{tr('Prayer Calendar') || 'Календарь молитв'}</h1>
            </div>

            {/* Статистика за месяц */}
            <CardAnimation>
                <div className="calendar-stats-card">
                    <h3>Статистика за {monthNames[month]} {year}</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-label">Выполнено</div>
                            <div className="stat-value stat-completed">{monthStats.completed}</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-label">Пропущено</div>
                            <div className="stat-value stat-missed">{monthStats.missed}</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-label">Процент</div>
                            <div className="stat-value stat-percentage">{monthStats.percentage}%</div>
                        </div>
                    </div>
                    {monthStats.total > 0 && (
                        <div className="stats-progress">
                            <div 
                                className="stats-progress-bar" 
                                style={{ width: `${monthStats.percentage}%` }}
                            ></div>
                        </div>
                    )}
                </div>
            </CardAnimation>

            {/* Календарь */}
            <CardAnimation delay={100}>
                <div className="calendar-container">
                    <div className="calendar-header">
                        <button className="calendar-nav" onClick={handlePrevMonth}>◄</button>
                        <div className="calendar-month">
                            {monthNames[month]} {year}
                        </div>
                        <button className="calendar-nav" onClick={handleNextMonth}>►</button>
                    </div>
                    <div className="calendar-grid calendar-prayer-grid">
                        {days}
                    </div>
                </div>
            </CardAnimation>

            {/* Выбранный день */}
            {selectedDate && (
                <CardAnimation delay={200}>
                    <div className="selected-day-prayers">
                        <h3>
                            {tr('Prayers for') || 'Молитвы за'} {selectedDate.toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </h3>
                        <div className="prayer-list">
                            {prayers.map(prayer => {
                                const status = selectedDayData[prayer];
                                return (
                                    <div key={prayer} className="prayer-item">
                                        <div className="prayer-name">{prayerNames[prayer]}</div>
                                        <div className="prayer-actions">
                                            <button
                                                className={`btn btn-sm ${status === true ? 'btn-success' : 'btn-outline'}`}
                                                onClick={() => markPrayerCompleted(selectedDate, prayer)}
                                            >
                                                ✓ Выполнено
                                            </button>
                                            <button
                                                className={`btn btn-sm ${status === false ? 'btn-danger' : 'btn-outline'}`}
                                                onClick={() => markPrayerMissed(selectedDate, prayer)}
                                            >
                                                ✗ Пропущено
                                            </button>
                                            {status !== null && status !== undefined && (
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => clearPrayerMark(selectedDate, prayer)}
                                                >
                                                    🗑 Очистить
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardAnimation>
            )}
        </div>
    );
};

export default PrayerCalendarPage;


