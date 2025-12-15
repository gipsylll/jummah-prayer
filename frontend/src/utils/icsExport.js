// Утилита для экспорта времени молитв в формат iCalendar (.ics)

/**
 * Форматирует дату для iCalendar (формат: YYYYMMDDTHHmmss)
 * Использует локальное время без Z (floating time)
 */
const formatDateForICS = (date, useUTC = false) => {
    if (useUTC) {
        // Для DTSTAMP используем UTC
        const utcYear = date.getUTCFullYear();
        const utcMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
        const utcDay = String(date.getUTCDate()).padStart(2, '0');
        const utcHours = String(date.getUTCHours()).padStart(2, '0');
        const utcMinutes = String(date.getUTCMinutes()).padStart(2, '0');
        const utcSeconds = String(date.getUTCSeconds()).padStart(2, '0');
        return `${utcYear}${utcMonth}${utcDay}T${utcHours}${utcMinutes}${utcSeconds}Z`;
    }
    
    // Для DTSTART/DTEND используем локальное время
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
};

/**
 * Создает UID для события
 */
const createUID = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@jummah-prayer.app`;
};

/**
 * Экранирует специальные символы для iCalendar
 */
const escapeICS = (text) => {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
};

/**
 * Создает событие для одной молитвы
 */
const createPrayerEvent = (prayerName, prayerTime, date, city, description = '', isRecurring = false) => {
    const [hours, minutes] = prayerTime.split(':').map(Number);
    const eventDate = new Date(date);
    eventDate.setHours(hours, minutes, 0, 0);
    
    const startDate = formatDateForICS(eventDate, false);
    const endDate = formatDateForICS(new Date(eventDate.getTime() + 5 * 60 * 1000), false); // 5 минут длительность
    
    const uid = createUID();
    const created = formatDateForICS(new Date(), true); // DTSTAMP должен быть в UTC
    
    const lines = [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${created}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${escapeICS(prayerName)}`,
        `DESCRIPTION:${escapeICS(description || `Время молитвы ${prayerName} в ${city}`)}`,
        `LOCATION:${escapeICS(city)}`
    ];
    
    // Не добавляем RRULE, так как мы создаем отдельные события для каждого дня
    lines.push('END:VEVENT');
    
    return lines.join('\r\n');
};

/**
 * Экспортирует время молитв в формат iCalendar
 * @param {Object} prayerTimes - Объект с временем молитв (используется как шаблон для всех дней)
 * @param {string} city - Название города
 * @param {Date} startDate - Начальная дата экспорта
 * @param {number} days - Количество дней для экспорта (по умолчанию 30)
 */
export const exportPrayerTimesToICS = (prayerTimes, city, startDate = new Date(), days = 30) => {
    const prayerNames = {
        fajr: 'Фаджр',
        sunrise: 'Восход',
        dhuhr: 'Зухр',
        asr: 'Аср',
        maghrib: 'Магриб',
        isha: 'Иша'
    };
    
    const prayerDescriptions = {
        fajr: 'Утренняя молитва',
        sunrise: 'Восход солнца',
        dhuhr: 'Полуденная молитва',
        asr: 'Послеполуденная молитва',
        maghrib: 'Молитва на закате',
        isha: 'Ночная молитва'
    };
    
    // Создаем события для каждой молитвы на каждый день
    const events = [];
    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']; // Исключаем sunrise, так как это информационное время
    
    for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        // Используем переданные prayerTimes как шаблон для всех дней
        // Время молитв меняется незначительно день ото дня
        prayers.forEach(prayerKey => {
            if (prayerTimes[prayerKey]) {
                const prayerName = prayerNames[prayerKey] || prayerKey;
                const description = prayerDescriptions[prayerKey] || '';
                events.push(createPrayerEvent(prayerName, prayerTimes[prayerKey], currentDate, city, description, false));
            }
        });
    }
    
    // Создаем полный календарь
    const now = formatDateForICS(new Date(), true); // Используем UTC для метаданных
    const calendarName = `Время молитв - ${city}`;
    
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Jummah Prayer//Prayer Times//RU',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${escapeICS(calendarName)}`,
        `X-WR-CALDESC:${escapeICS(`Расписание времени молитв для города ${city}`)}`,
        `X-WR-TIMEZONE:UTC`,
        ...events,
        'END:VCALENDAR'
    ].join('\r\n');
    
    // Создаем blob и скачиваем файл
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prayer-times-${city}-${startDate.toISOString().split('T')[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
};

/**
 * Экспортирует время молитв за один день
 */
export const exportSingleDayPrayerTimes = (prayerTimes, city, date = new Date()) => {
    return exportPrayerTimesToICS(prayerTimes, city, date, 1);
};

/**
 * Экспортирует время молитв на месяц
 */
export const exportMonthlyPrayerTimes = (prayerTimes, city, startDate = new Date()) => {
    return exportPrayerTimesToICS(prayerTimes, city, startDate, 30);
};

/**
 * Экспортирует время молитв на год
 */
export const exportYearlyPrayerTimes = (prayerTimes, city, startDate = new Date()) => {
    return exportPrayerTimesToICS(prayerTimes, city, startDate, 365);
};


