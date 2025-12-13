// Главный файл приложения - инициализация

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initServiceWorker();
    initTheme();
    initNavigation();
    initPrayerTimes();
    initSettings();
    initDhikr();
    initCalendar();
    initCitySearch();
    initGeolocation();
    initNotifications();
    initQiblaInfo();
    initEvents();
    initArticles();
    
    // Обновление обратного отсчета каждую секунду
    setInterval(updateCountdown, 1000);
    
    // Обновление времени молитв каждую минуту
    setInterval(() => {
        updatePrayerInfo();
    }, 60000);
    
    // Инициализация даты Хиджры
    updateHijriDate();
    setInterval(updateHijriDate, 86400000); // Обновляем раз в день
});

