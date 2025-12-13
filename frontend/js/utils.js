// Утилиты и вспомогательные функции

// Координаты Мекки (Кааба)
const MAKKAH_COORDS = {
    lat: 21.4225,
    lon: 39.8262
};

// Расчет расстояния до Мекки (формула гаверсинуса)
function calculateDistanceToMakkah(lat, lon) {
    const R = 6371; // Радиус Земли в километрах
    
    const dLat = (MAKKAH_COORDS.lat - lat) * Math.PI / 180;
    const dLon = (MAKKAH_COORDS.lon - lon) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat * Math.PI / 180) * Math.cos(MAKKAH_COORDS.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
}

// Форматирование расстояния
function formatDistance(km) {
    if (km < 1) {
        return Math.round(km * 1000) + ' м';
    } else if (km < 1000) {
        return Math.round(km) + ' км';
    } else {
        return Math.round(km / 1000) + ' тыс. км';
    }
}

// Расчет расстояния между двумя точками
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Радиус Земли в километрах
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Обновление даты Хиджры
function updateHijriDate() {
    const hijriEl = document.getElementById('hijri-date');
    if (hijriEl) {
        // Упрощенная конверсия (для точности нужна библиотека)
        const now = new Date();
        const gregorianYear = now.getFullYear();
        const hijriYear = Math.floor((gregorianYear - 622) * 1.030684);
        hijriEl.textContent = `${hijriYear} г.`;
    }
}

