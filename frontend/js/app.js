// Главный файл приложения - инициализация

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initServiceWorker();
    initTheme();
    initAuth();
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
    
    // Инициализация UI улучшений (должна быть после всех остальных)
    if (window.initUIEnhancements) {
        initUIEnhancements();
    }
    
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

