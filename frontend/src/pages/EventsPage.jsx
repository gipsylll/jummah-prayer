import React, { useState, useEffect } from 'react';
import { usePrayerTimes } from '../contexts/PrayerTimesContext';
import { tr } from '../utils/translations';
import CardAnimation from '../components/CardAnimation';

const EventsPage = () => {
    const { prayerTimes } = usePrayerTimes();
    const [ramadanCountdown, setRamadanCountdown] = useState('');
    const [currentEvents, setCurrentEvents] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [fastingInfo, setFastingInfo] = useState('');
    const [fastingTimes, setFastingTimes] = useState({ suhur: '', iftar: '' });

    const getRamadanDates = (year) => {
        const hijriYear = year - 579;
        const ramadanStart = new Date(year, 2, 10);
        const ramadanEnd = new Date(year, 3, 9);
        return { start: ramadanStart, end: ramadanEnd };
    };

    const updateRamadanCountdown = () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const nextYear = currentYear + 1;
        
        const ramadanThisYear = getRamadanDates(currentYear);
        const ramadanNextYear = getRamadanDates(nextYear);
        
        let ramadanStart = ramadanThisYear.start;
        if (now > ramadanThisYear.start) {
            ramadanStart = ramadanNextYear.start;
        }
        
        const diff = ramadanStart - now;
        if (diff <= 0) {
            setRamadanCountdown(tr('Ramadan has started') || 'Рамадан начался!');
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setRamadanCountdown(`${days} ${tr('days') || 'дней'} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    const getUpcomingIslamicEvents = (date) => {
        const events = [];
        const currentYear = date.getFullYear();
        const nextYear = currentYear + 1;
        
        const ramadanThisYear = getRamadanDates(currentYear);
        const ramadanNextYear = getRamadanDates(nextYear);
        
        let nextRamadan = ramadanThisYear.start;
        if (date >= ramadanThisYear.start) {
            nextRamadan = ramadanNextYear.start;
        }
        
        const ramadanDaysLeft = Math.ceil((nextRamadan - date) / (1000 * 60 * 60 * 24));
        events.push({
            name: 'Рамадан',
            date: nextRamadan.toLocaleDateString('ru-RU'),
            icon: '🌙',
            daysLeft: ramadanDaysLeft
        });
        
        let eidAlFitr = ramadanThisYear.end;
        if (date >= ramadanThisYear.end) {
            eidAlFitr = ramadanNextYear.end;
        }
        const eidAlFitrDaysLeft = Math.ceil((eidAlFitr - date) / (1000 * 60 * 60 * 24));
        if (eidAlFitrDaysLeft > 0) {
            events.push({
                name: 'Ид аль-Фитр',
                date: eidAlFitr.toLocaleDateString('ru-RU'),
                icon: '🎉',
                daysLeft: eidAlFitrDaysLeft
            });
        }
        
        let eidAlAdha = new Date(eidAlFitr);
        eidAlAdha.setDate(eidAlAdha.getDate() + 70);
        const eidAlAdhaDaysLeft = Math.ceil((eidAlAdha - date) / (1000 * 60 * 60 * 24));
        if (eidAlAdhaDaysLeft > 0) {
            events.push({
                name: 'Ид аль-Адха',
                date: eidAlAdha.toLocaleDateString('ru-RU'),
                icon: '🕌',
                daysLeft: eidAlAdhaDaysLeft
            });
        }
        
        return events.sort((a, b) => a.daysLeft - b.daysLeft);
    };

    const updateFastingInfo = () => {
        const now = new Date();
        const ramadan = getRamadanDates(now.getFullYear());
        
        if (now >= ramadan.start && now <= ramadan.end) {
            const dayOfRamadan = Math.ceil((now - ramadan.start) / (1000 * 60 * 60 * 24)) + 1;
            setFastingInfo(`${tr('Ramadan - Day') || 'Рамадан - День'} ${dayOfRamadan}`);
        } else {
            setFastingInfo(`${tr('Fasting not required') || 'Пост не требуется'}. ${tr('Ramadan starts on') || 'Рамадан начинается'} ${ramadan.start.toLocaleDateString('ru-RU')}`);
        }
        
        if (prayerTimes) {
            setFastingTimes({
                suhur: prayerTimes.fajr || '--:--',
                iftar: prayerTimes.maghrib || '--:--'
            });
        }
    };

    useEffect(() => {
        updateRamadanCountdown();
        setCurrentEvents([]);
        setUpcomingEvents(getUpcomingIslamicEvents(new Date()));
        updateFastingInfo();

        const interval = setInterval(() => {
            updateRamadanCountdown();
        }, 1000);

        return () => clearInterval(interval);
    }, [prayerTimes]);

    return (
        <div className="page">
            <div className="page-header">
                <h1>{tr('Islamic Events')}</h1>
            </div>
            <div className="events-container">
                <div className="event-card ramadan-countdown">
                    <div className="event-card-header">
                        <div className="event-icon">🌙</div>
                        <div>
                            <h2>{tr('Ramadan Countdown') || 'Отсчет до Рамадана'}</h2>
                            <div className="countdown-display">{ramadanCountdown}</div>
                        </div>
                    </div>
                </div>

                <div className="events-section">
                    <h2>{tr('Current Events') || 'Текущие события'}</h2>
                    <div className="events-list">
                        {currentEvents.length === 0 ? (
                            <div className="no-events">{tr('No current events') || 'Нет текущих событий'}</div>
                        ) : (
                            currentEvents.map((event, index) => (
                                <div key={index} className="event-item current">
                                    <div className="event-icon">{event.icon}</div>
                                    <div className="event-content">
                                        <div className="event-name">{event.name}</div>
                                        <div className="event-date">{event.date}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="events-section">
                    <h2>{tr('Upcoming Events') || 'Ближайшие события'}</h2>
                    <div className="events-list">
                        {upcomingEvents.map((event, index) => (
                            <CardAnimation key={index} delay={index * 50}>
                                <div className="event-item">
                                <div className="event-icon">{event.icon}</div>
                                <div className="event-content">
                                    <div className="event-name">{event.name}</div>
                                    <div className="event-date">{event.date}</div>
                                    <div className="event-days-left">
                                        {tr('Days left') || 'Осталось дней'}: {event.daysLeft} {tr('days') || 'дней'}
                                    </div>
                                </div>
                            </div>
                            </CardAnimation>
                        ))}
                    </div>
                </div>

                <div className="fasting-section">
                    <h2>{tr('Fasting Calendar') || 'Календарь поста'}</h2>
                    <div className="fasting-info">
                        <div className="fasting-status">
                            <h3>{fastingInfo}</h3>
                        </div>
                    </div>
                    <div className="fasting-calendar">
                        <div className="fasting-times">
                            <div className="fasting-time-item">
                                <div className="fasting-time-label">{tr('Suhur (before dawn)') || 'Сухур (до рассвета)'}</div>
                                <div className="fasting-time-value">{fastingTimes.suhur}</div>
                            </div>
                            <div className="fasting-time-item">
                                <div className="fasting-time-label">{tr('Iftar (after sunset)') || 'Ифтар (после заката)'}</div>
                                <div className="fasting-time-value">{fastingTimes.iftar}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventsPage;


