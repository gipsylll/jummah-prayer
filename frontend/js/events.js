// Исламские события

// Инициализация страницы событий
function initEvents() {
    // Обновляем при переключении на страницу
    const eventsPage = document.getElementById('events-page');
    if (eventsPage) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (eventsPage.classList.contains('active')) {
                        updateEventsPage();
                    } else {
                        // Останавливаем обновление, когда страница неактивна
                        if (window.ramadanCountdownInterval) {
                            clearInterval(window.ramadanCountdownInterval);
                            window.ramadanCountdownInterval = null;
                        }
                    }
                }
            });
        });
        observer.observe(eventsPage, { attributes: true });
    }
}

// Обновление страницы событий
function updateEventsPage() {
    updateRamadanCountdown();
    updateCurrentEvents();
    updateUpcomingEvents();
    updateFastingCalendar();
    
    // Обновляем отсчет каждую секунду для точности
    if (window.ramadanCountdownInterval) {
        clearInterval(window.ramadanCountdownInterval);
    }
    window.ramadanCountdownInterval = setInterval(() => {
        const eventsPage = document.getElementById('events-page');
        if (eventsPage && eventsPage.classList.contains('active')) {
            updateRamadanCountdown();
        }
    }, 1000); // Обновляем каждую секунду
}

// Расчет даты Рамадана (примерно, нужна более точная формула)
function getRamadanDates(year) {
    // Упрощенный расчет - Рамадан обычно начинается в 9-й месяц Хиджры
    // Более точный расчет требует астрономических вычислений
    const hijriYear = year - 579; // Примерное преобразование
    const ramadanStart = new Date(year, 2, 10); // Примерная дата
    const ramadanEnd = new Date(year, 3, 9); // Примерная дата
    
    // Для более точного расчета можно использовать API или библиотеку
    return {
        start: ramadanStart,
        end: ramadanEnd
    };
}

// Отсчет до Рамадана
function updateRamadanCountdown() {
    const countdownEl = document.getElementById('ramadan-countdown');
    if (!countdownEl) return;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;
    
    // Получаем даты Рамадана
    const ramadanThisYear = getRamadanDates(currentYear);
    const ramadanNextYear = getRamadanDates(nextYear);
    
    let ramadanStart = ramadanThisYear.start;
    if (now > ramadanThisYear.start) {
        ramadanStart = ramadanNextYear.start;
    }
    
    const diff = ramadanStart - now;
    if (diff <= 0) {
        countdownEl.innerHTML = `<div class="event-status">${tr('Ramadan has started')}</div>`;
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    countdownEl.innerHTML = `
        <div class="countdown-days">${days} <span>${tr('days')}</span></div>
        <div class="countdown-time">${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}</div>
    `;
}

// Текущие события
function updateCurrentEvents() {
    const listEl = document.getElementById('current-events-list');
    if (!listEl) return;
    
    const now = new Date();
    const events = getCurrentIslamicEvents(now);
    
    if (events.length === 0) {
        listEl.innerHTML = `<div class="no-events">${tr('No current events')}</div>`;
        return;
    }
    
    listEl.innerHTML = events.map(event => `
        <div class="event-item current">
            <div class="event-icon">${event.icon}</div>
            <div class="event-content">
                <div class="event-name">${event.name}</div>
                <div class="event-date">${event.date}</div>
                ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
            </div>
        </div>
    `).join('');
}

// Ближайшие события
function updateUpcomingEvents() {
    const listEl = document.getElementById('upcoming-events-list');
    if (!listEl) return;
    
    const now = new Date();
    const events = getUpcomingIslamicEvents(now);
    
    if (events.length === 0) {
        listEl.innerHTML = `<div class="no-events">${tr('No upcoming events')}</div>`;
        return;
    }
    
    listEl.innerHTML = events.map(event => `
        <div class="event-item">
            <div class="event-icon">${event.icon}</div>
            <div class="event-content">
                <div class="event-name">${event.name}</div>
                <div class="event-date">${event.date}</div>
                <div class="event-days-left">${tr('Days left')} ${event.daysLeft} ${tr('days')}</div>
            </div>
        </div>
    `).join('');
}

// Получение текущих исламских событий
function getCurrentIslamicEvents(date) {
    const events = [];
    // Здесь можно добавить логику проверки текущих событий
    return events;
}

// Получение предстоящих исламских событий
function getUpcomingIslamicEvents(date) {
    const events = [];
    const currentYear = date.getFullYear();
    const nextYear = currentYear + 1;
    
    // Получаем даты Рамадана для текущего и следующего года
    const ramadanThisYear = getRamadanDates(currentYear);
    const ramadanNextYear = getRamadanDates(nextYear);
    
    // Определяем ближайший Рамадан
    let nextRamadan = ramadanThisYear.start;
    if (date >= ramadanThisYear.start) {
        nextRamadan = ramadanNextYear.start;
    }
    
    // Добавляем Рамадан
    const ramadanDaysLeft = Math.ceil((nextRamadan - date) / (1000 * 60 * 60 * 24));
    events.push({
        name: tr('Ramadan Countdown').replace('Отсчет до ', '').replace('Ramadan Countdown', 'Ramadan'),
        date: nextRamadan.toLocaleDateString('ru-RU'),
        icon: '🌙',
        daysLeft: ramadanDaysLeft
    });
    
    // Добавляем Ид аль-Фитр (конец Рамадана)
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
    
    // Добавляем Ид аль-Адха (примерно через 70 дней после Ид аль-Фитр)
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
    
    // Добавляем Лайлат аль-Кадр (примерно 27-я ночь Рамадана)
    let laylatAlQadr = new Date(nextRamadan);
    laylatAlQadr.setDate(laylatAlQadr.getDate() + 27);
    const laylatAlQadrDaysLeft = Math.ceil((laylatAlQadr - date) / (1000 * 60 * 60 * 24));
    if (laylatAlQadrDaysLeft > 0 && date < nextRamadan) {
        events.push({
            name: 'Лайлат аль-Кадр',
            date: laylatAlQadr.toLocaleDateString('ru-RU'),
            icon: '⭐',
            daysLeft: laylatAlQadrDaysLeft
        });
    }
    
    return events.sort((a, b) => a.daysLeft - b.daysLeft);
}

// Календарь поста
function updateFastingCalendar() {
    const infoEl = document.getElementById('fasting-info');
    const calendarEl = document.getElementById('fasting-calendar');
    
    if (!infoEl || !calendarEl) return;
    
    const now = new Date();
    const ramadan = getRamadanDates(now.getFullYear());
    
    // Информация о посте
    if (now >= ramadan.start && now <= ramadan.end) {
        const dayOfRamadan = Math.ceil((now - ramadan.start) / (1000 * 60 * 60 * 24)) + 1;
        infoEl.innerHTML = `
            <div class="fasting-status active">
                <h3>${tr('Ramadan - Day')} ${dayOfRamadan}</h3>
                <p>${tr('Fasting today')}</p>
            </div>
        `;
    } else {
        infoEl.innerHTML = `
            <div class="fasting-status">
                <h3>${tr('Fasting not required')}</h3>
                <p>${tr('Ramadan starts on')} ${ramadan.start.toLocaleDateString('ru-RU')}</p>
            </div>
        `;
    }
    
    // Время ифтара и сухура
    if (prayerCalc.prayerTimes) {
        const suhur = prayerCalc.prayerTimes.fajr || '--:--';
        const iftar = prayerCalc.prayerTimes.maghrib || '--:--';
        
        calendarEl.innerHTML = `
            <div class="fasting-times">
                <div class="fasting-time-item">
                    <div class="fasting-time-label">${tr('Suhur (before dawn)')}</div>
                    <div class="fasting-time-value">${suhur}</div>
                </div>
                <div class="fasting-time-item">
                    <div class="fasting-time-label">${tr('Iftar (after sunset)')}</div>
                    <div class="fasting-time-value">${iftar}</div>
                </div>
            </div>
        `;
    }
}

