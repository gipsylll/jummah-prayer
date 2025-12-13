// Настройки приложения

// Инициализация настроек
function initSettings() {
    // Метод расчета
    const methodSelect = document.getElementById('calculation-method');
    if (methodSelect) {
        methodSelect.value = prayerCalc.calculationMethod;
        methodSelect.addEventListener('change', async (e) => {
            prayerCalc.setCalculationMethod(e.target.value);
            await loadPrayerTimes();
        });
    }
    
    // Мазхаб
    const madhabRadios = document.querySelectorAll('input[name="madhab"]');
    madhabRadios.forEach(radio => {
        radio.checked = parseInt(radio.value) === prayerCalc.madhhab;
        radio.addEventListener('change', async (e) => {
            if (e.target.checked) {
                prayerCalc.setMadhhab(e.target.value);
                await loadPrayerTimes();
            }
        });
    });
    
    // Уведомления
    const notificationsToggle = document.getElementById('notifications');
    const notificationSettings = document.getElementById('notification-settings');
    const soundNotificationSetting = document.getElementById('sound-notification-setting');
    const testNotificationSetting = document.getElementById('test-notification-setting');
    
    if (notificationsToggle) {
        notificationsToggle.checked = appState.notifications;
        
        // Показываем/скрываем дополнительные настройки
        if (notificationSettings) {
            notificationSettings.style.display = appState.notifications ? 'flex' : 'none';
        }
        if (soundNotificationSetting) {
            soundNotificationSetting.style.display = appState.notifications ? 'flex' : 'none';
        }
        if (testNotificationSetting) {
            testNotificationSetting.style.display = appState.notifications ? 'flex' : 'none';
        }
        
        notificationsToggle.addEventListener('change', async (e) => {
            appState.notifications = e.target.checked;
            localStorage.setItem('notifications', e.target.checked);
            updateNotificationsStatus();
            
            // Показываем/скрываем дополнительные настройки
            if (notificationSettings) {
                notificationSettings.style.display = e.target.checked ? 'flex' : 'none';
            }
            if (soundNotificationSetting) {
                soundNotificationSetting.style.display = e.target.checked ? 'flex' : 'none';
            }
            if (testNotificationSetting) {
                testNotificationSetting.style.display = e.target.checked ? 'flex' : 'none';
            }
            
            if (e.target.checked) {
                // Запрашиваем разрешение
                if ('Notification' in window && Notification.permission === 'default') {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        schedulePrayerNotifications();
                    }
                } else if (Notification.permission === 'granted') {
                    schedulePrayerNotifications();
                }
            }
        });
    }
    
    // Настройка времени предупреждения
    const warningTimeSelect = document.getElementById('notification-warning-time');
    if (warningTimeSelect) {
        warningTimeSelect.value = appState.notificationWarningTime;
        warningTimeSelect.addEventListener('change', (e) => {
            appState.notificationWarningTime = parseInt(e.target.value);
            localStorage.setItem('notificationWarningTime', e.target.value);
            if (appState.notifications) {
                schedulePrayerNotifications();
            }
        });
    }
    
    // Звуковые уведомления
    const soundNotificationsToggle = document.getElementById('sound-notifications');
    if (soundNotificationsToggle) {
        soundNotificationsToggle.checked = appState.soundNotifications;
        soundNotificationsToggle.addEventListener('change', (e) => {
            appState.soundNotifications = e.target.checked;
            localStorage.setItem('soundNotifications', e.target.checked);
        });
    }
    
    // Тестовая кнопка уведомления
    const testNotificationBtn = document.getElementById('test-notification-btn');
    if (testNotificationBtn) {
        testNotificationBtn.addEventListener('click', () => {
            testNotification();
        });
    }
    
    // Язык
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = appState.language;
        languageSelect.addEventListener('change', (e) => {
            appState.language = e.target.value;
            setLanguage(e.target.value);
        });
    }
    
    // Обновление информации о местоположении в настройках
    updateSettingsLocation();
    updateNotificationsStatus();
}

function updateSettingsLocation() {
    const settingsCity = document.getElementById('settings-city');
    const settingsCoords = document.getElementById('settings-coords');
    
    if (settingsCity) {
        settingsCity.textContent = prayerCalc.city;
    }
    if (settingsCoords) {
        settingsCoords.textContent = `${prayerCalc.latitude.toFixed(2)}°N, ${prayerCalc.longitude.toFixed(2)}°E`;
    }
}

function updateNotificationsStatus() {
    const statusEl = document.getElementById('notifications-status');
    if (statusEl) {
        statusEl.textContent = appState.notifications ? tr('Enabled') : tr('Disabled');
    }
}

