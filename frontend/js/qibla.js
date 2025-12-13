// Информация о Кибле

// Инициализация информации о Кибле
function initQiblaInfo() {
    updateQiblaDistance();
    
    // Обновляем при изменении местоположения
    const originalSetLocation = prayerCalc.setLocation;
    prayerCalc.setLocation = function(lat, lon, city) {
        originalSetLocation.call(this, lat, lon, city);
        updateQiblaDistance();
    };
}

// Обновление расстояния до Мекки в виджете
function updateQiblaDistance() {
    const qiblaWidget = document.getElementById('qibla-widget');
    if (!qiblaWidget) return;
    
    const distance = calculateDistanceToMakkah(prayerCalc.latitude, prayerCalc.longitude);
    // Форматируем только в километрах
    const km = (distance / 1000).toFixed(1);
    const distanceText = `${km} км`;
    
    const valueEl = qiblaWidget.querySelector('.widget-value');
    if (valueEl) {
        valueEl.textContent = distanceText;
        valueEl.title = `Расстояние до Мекки: ${distanceText}`;
    }
}

