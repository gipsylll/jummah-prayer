// Инициализация Service Worker
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker зарегистрирован:', registration);
            })
            .catch((error) => {
                console.error('Ошибка регистрации Service Worker:', error);
            });
    }
}

