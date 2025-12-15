// Координаты Мекки (Кааба)
const MAKKAH_COORDS = {
    lat: 21.4225,
    lon: 39.8262
};

// Расчет расстояния до Мекки (формула гаверсинуса)
export const calculateDistanceToMakkah = (lat, lon) => {
    const R = 6371; // Радиус Земли в километрах
    
    const dLat = (MAKKAH_COORDS.lat - lat) * Math.PI / 180;
    const dLon = (MAKKAH_COORDS.lon - lon) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat * Math.PI / 180) * Math.cos(MAKKAH_COORDS.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
};

// Форматирование расстояния
export const formatDistance = (km) => {
    if (km < 1) {
        return Math.round(km * 1000) + ' м';
    } else if (km < 1000) {
        return km.toFixed(1) + ' км';
    } else {
        return (km / 1000).toFixed(1) + ' тыс. км';
    }
};


