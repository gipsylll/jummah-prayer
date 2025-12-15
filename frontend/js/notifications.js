// Уведомления о молитвах

// Инициализация уведомлений о молитвах
function initNotifications() {
    // Запрашиваем разрешение на уведомления
    if ('Notification' in window && appState.notifications) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    console.log('Разрешение на уведомления получено');
                }
            });
        }
    }
    
    // Планируем уведомления
    schedulePrayerNotifications();
}

// Планирование уведомлений о молитвах
function schedulePrayerNotifications() {
    if (!appState.notifications || !('Notification' in window)) {
        return;
    }
    
    if (Notification.permission !== 'granted') {
        return;
    }
    
    if (!prayerCalc.prayerTimes) {
        return;
    }
    
    // Очищаем старые уведомления
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.getNotifications().then((notifications) => {
                notifications.forEach(notification => notification.close());
            });
        });
    }
    
    const prayers = [
        { key: 'fajr', name: 'Fajr (Dawn) Full' },
        { key: 'dhuhr', name: 'Dhuhr (Noon) Full' },
        { key: 'asr', name: 'Asr (Afternoon) Full' },
        { key: 'maghrib', name: 'Maghrib (Sunset) Full' },
        { key: 'isha', name: 'Isha (Night) Full' }
    ];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    prayers.forEach(prayer => {
        const timeStr = prayerCalc.prayerTimes[prayer.key];
        if (!timeStr) return;
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        const prayerTime = new Date(today);
        prayerTime.setHours(hours, minutes, 0, 0);
        
        // Если время уже прошло, планируем на завтра
        if (prayerTime <= now) {
            prayerTime.setDate(prayerTime.getDate() + 1);
        }
        
        // Уведомление за настроенное время (по умолчанию 15 минут)
        const warningTime = appState.notificationWarningTime || 15;
        const notifyWarning = new Date(prayerTime.getTime() - warningTime * 60 * 1000);
        if (notifyWarning > now) {
            scheduleNotification(notifyWarning, tr(prayer.name), tr('Prayer in') + ' ' + warningTime + ' ' + tr('minutes'));
        }
        
        // Уведомление за 5 минут (всегда)
        const notify5Min = new Date(prayerTime.getTime() - 5 * 60 * 1000);
        if (notify5Min > now && notify5Min.getTime() !== notifyWarning.getTime()) {
            scheduleNotification(notify5Min, tr(prayer.name), tr('Prayer in 5 minutes'));
        }
        
        // Уведомление в время молитвы
        scheduleNotification(prayerTime, tr(prayer.name), tr('Time for prayer'));
    });
}

// Воспроизведение звука уведомления
function playNotificationSound() {
    if (!appState.soundNotifications) return;
    
    try {
        // Создаем AudioContext для генерации звука
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Настраиваем звук (мягкий тон)
        oscillator.frequency.value = 800; // Частота в Гц
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        // Второй тон через небольшую задержку
        setTimeout(() => {
            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();
            
            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);
            
            oscillator2.frequency.value = 1000;
            oscillator2.type = 'sine';
            
            gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator2.start(audioContext.currentTime);
            oscillator2.stop(audioContext.currentTime + 0.5);
        }, 200);
    } catch (error) {
        console.error('Ошибка воспроизведения звука:', error);
    }
}

// Тестовое уведомление
function testNotification() {
    // Проверяем разрешение на уведомления
    if (!('Notification' in window)) {
        alert('Ваш браузер не поддерживает уведомления');
        return;
    }
    
    if (Notification.permission === 'denied') {
        alert('Уведомления заблокированы. Разрешите уведомления в настройках браузера.');
        return;
    }
    
    if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                showTestNotification();
            } else {
                alert('Разрешение на уведомления не предоставлено');
            }
        });
    } else {
        showTestNotification();
    }
}

// Показать тестовое уведомление
function showTestNotification() {
    // Воспроизводим звук, если включено
    playNotificationSound();
    
    const title = tr('Test Notification') || 'Тестовое уведомление';
    const body = tr('This is a test notification') || 'Это тестовое уведомление. Если вы видите это сообщение, уведомления работают правильно!';
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, {
                body: body,
                icon: '/icon-192.png',
                badge: '/icon-32x32.png',
                tag: 'test-notification',
                requireInteraction: false,
                vibrate: [200, 100, 200]
            });
        });
    } else {
        new Notification(title, {
            body: body,
            icon: '/icon-192.png'
        });
    }
}

// Планирование уведомления
function scheduleNotification(time, title, body) {
    const delay = time.getTime() - Date.now();
    if (delay <= 0) return;
    
    setTimeout(() => {
        if (Notification.permission === 'granted') {
            // Воспроизводим звук, если включено
            playNotificationSound();
            
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then((registration) => {
                    registration.showNotification(title, {
                        body: body,
                        icon: '/icon-192.png',
                        badge: '/icon-32x32.png',
                        tag: 'prayer-notification',
                        requireInteraction: false,
                        vibrate: [200, 100, 200]
                    });
                });
            } else {
                new Notification(title, {
                    body: body,
                    icon: '/icon-192.png'
                });
            }
        }
    }, delay);
}




