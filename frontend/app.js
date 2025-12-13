// Главный файл приложения
const prayerCalc = new PrayerTimesCalculator();

// Данные зикров
const dhikrData = [
    {
        title: "Субханаллах",
        arabic: "سُبْحَانَ ٱللَّٰهِ",
        transliteration: "Subḥānallāh",
        translation: "Слава Аллаху",
        goal: 33
    },
    {
        title: "Альхамдулиллях",
        arabic: "ٱلْحَمْدُ لِلَّٰهِ",
        transliteration: "Alḥamdulillāh",
        translation: "Хвала Аллаху",
        goal: 33
    },
    {
        title: "Аллаху Акбар",
        arabic: "ٱللَّٰهُ أَكْبَرُ",
        transliteration: "Allāhu akbar",
        translation: "Аллах велик",
        goal: 34
    },
    {
        title: "Ля иляха илляллах",
        arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ",
        transliteration: "Lā ilāha illallāh",
        translation: "Нет божества, кроме Аллаха",
        goal: 100
    },
    {
        title: "Астагфируллах",
        arabic: "أَسْتَغْفِرُ ٱللَّٰهَ",
        transliteration: "Astaghfirullāh",
        translation: "Прошу прощения у Аллаха",
        goal: 100
    },
    {
        title: "Дуа перед едой",
        arabic: "بِسْمِ ٱللَّٰهِ",
        transliteration: "Bismillāh",
        translation: "Во имя Аллаха",
        goal: 1
    },
    {
        title: "Дуа после еды",
        arabic: "ٱلْحَمْدُ لِلَّٰهِ ٱلَّذِي أَطْعَمَنَا وَسَقَانَا",
        transliteration: "Alḥamdulillāhil-ladhī aṭ'amanā wa-saqānā",
        translation: "Хвала Аллаху, Который накормил нас и напоил нас",
        goal: 1
    },
    {
        title: "Дуа перед сном",
        arabic: "بِٱسْمِكَ ٱللَّٰهُمَّ أَمُوتُ وَأَحْيَا",
        transliteration: "Bismika Allāhumma amūtu wa-aḥyā",
        translation: "Именем Твоим, о Аллах, умираю и оживаю",
        goal: 1
    }
];

// Состояние приложения
const appState = {
    currentPage: 'main-page',
    darkTheme: localStorage.getItem('darkTheme') === 'true',
    notifications: localStorage.getItem('notifications') === 'true',
    language: localStorage.getItem('language') || 'ru',
    dhikrCount: 0,
    dhikrGoal: 33,
    currentDhikr: null,
    dhikrCounts: {}, // Храним счетчики для каждого зикра
    notificationWarningTime: parseInt(localStorage.getItem('notificationWarningTime')) || 15, // Время предупреждения в минутах
    soundNotifications: localStorage.getItem('soundNotifications') === 'true' // Звуковые уведомления
};

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
});

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

// Инициализация темы
function initTheme() {
    if (appState.darkTheme) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    const darkThemeToggle = document.getElementById('dark-theme');
    if (darkThemeToggle) {
        darkThemeToggle.checked = appState.darkTheme;
        darkThemeToggle.addEventListener('change', (e) => {
            appState.darkTheme = e.target.checked;
            localStorage.setItem('darkTheme', e.target.checked);
            document.documentElement.setAttribute('data-theme', e.target.checked ? 'dark' : 'light');
        });
    }
}

// Инициализация навигации
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.getAttribute('data-page');
            switchPage(pageId);
            
            // Обновление активной кнопки
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function switchPage(pageId) {
    // Скрыть все страницы
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Показать выбранную страницу
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        appState.currentPage = pageId;
        
        // Обновляем страницы при переключении
        if (pageId === 'events-page') {
            updateEventsPage();
        } else if (pageId === 'articles-page') {
            renderArticles();
        }
    }
}

// Инициализация времени молитв
async function initPrayerTimes() {
    await loadPrayerTimes();
    updatePrayerInfo();
    updatePrayerTimesList();
}

async function loadPrayerTimes() {
    try {
        await prayerCalc.fetchPrayerTimes();
        updateUI();
    } catch (error) {
        console.error('Ошибка загрузки времени молитв:', error);
    }
}

function updateUI() {
    // Обновление города
    const cityElement = document.getElementById('current-city');
    if (cityElement) {
        cityElement.textContent = prayerCalc.city;
    }
    
    // Обновление даты
    const dateElement = document.getElementById('current-date');
    if (dateElement && prayerCalc.prayerTimes.date) {
        dateElement.textContent = prayerCalc.prayerTimes.date;
    }
    
    // Обновление расстояния до Мекки
    updateQiblaDistance();
}

function updatePrayerInfo() {
    const currentPrayer = prayerCalc.getCurrentPrayer();
    const nextPrayer = prayerCalc.getNextPrayer();
    
    const currentPrayerEl = document.getElementById('current-prayer-name');
    const nextPrayerEl = document.getElementById('next-prayer-name');
    
    if (currentPrayerEl) {
        currentPrayerEl.textContent = tr(currentPrayer);
    }
    if (nextPrayerEl) {
        nextPrayerEl.textContent = tr(nextPrayer);
    }
    
    updatePrayerTimesList();
}

function updatePrayerTimesList() {
    const listContainer = document.getElementById('prayer-times-list');
    if (!listContainer || !prayerCalc.prayerTimes) return;
    
    const prayers = [
        { key: 'fajr', name: 'Fajr (Dawn) Full', icon: '🌅' },
        { key: 'sunrise', name: 'Sunrise Full', icon: '☀️', isInfo: true },
        { key: 'dhuhr', name: 'Dhuhr (Noon) Full', icon: '🌞' },
        { key: 'asr', name: 'Asr (Afternoon) Full', icon: '🌤️' },
        { key: 'maghrib', name: 'Maghrib (Sunset) Full', icon: '🌆' },
        { key: 'isha', name: 'Isha (Night) Full', icon: '🌙' }
    ];
    
    const currentPrayer = prayerCalc.getCurrentPrayer();
    const nextPrayer = prayerCalc.getNextPrayer();
    
    listContainer.innerHTML = prayers.map(prayer => {
        const time = prayerCalc.prayerTimes[prayer.key] || '00:00';
        const isCurrent = currentPrayer === prayer.name.split(' ')[0];
        const isNext = nextPrayer === prayer.name.split(' ')[0];
        
        let classes = 'prayer-time-item';
        if (isCurrent) classes += ' current';
        if (isNext) classes += ' next';
        
        return `
            <div class="${classes}">
                <div class="prayer-time-header">
                    <div class="prayer-time-name">
                        <span>${prayer.icon}</span>
                        <span>${tr(prayer.name)}</span>
                    </div>
                    <div class="prayer-time-value">${time}</div>
                </div>
                ${isCurrent ? '<div class="prayer-time-progress"><div class="prayer-time-progress-bar" style="width: 50%"></div></div>' : ''}
            </div>
        `;
    }).join('');
}

// Обновление обратного отсчета
function updateCountdown() {
    const timeUntil = prayerCalc.getTimeUntilNextPrayer();
    const hours = Math.floor(timeUntil / 3600);
    const minutes = Math.floor((timeUntil % 3600) / 60);
    const seconds = timeUntil % 60;
    
    const countdownEl = document.getElementById('countdown-time');
    if (countdownEl) {
        countdownEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    // Обновляем информацию о молитвах
    updatePrayerInfo();
}

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

// Инициализация зикра
function initDhikr() {
    renderDhikrList();
    initDhikrCounter();
}

// Отображение списка зикров
function renderDhikrList() {
    const dhikrList = document.getElementById('dhikr-list');
    if (!dhikrList) return;
    
    dhikrList.innerHTML = dhikrData.map((dhikr, index) => {
        const count = appState.dhikrCounts[index] || 0;
        const progress = dhikr.goal > 0 ? Math.min((count / dhikr.goal) * 100, 100) : 0;
        
        return `
            <div class="dhikr-item" data-index="${index}">
                <div class="dhikr-item-content">
                    <div class="dhikr-item-header">
                        <h3 class="dhikr-item-title">${dhikr.title}</h3>
                        <div class="dhikr-item-count">${count} / ${dhikr.goal}</div>
                    </div>
                    <div class="dhikr-item-arabic">${dhikr.arabic}</div>
                    <div class="dhikr-item-transliteration">${dhikr.transliteration}</div>
                    <div class="dhikr-item-translation">${dhikr.translation}</div>
                    ${dhikr.goal > 1 ? `
                        <div class="dhikr-progress">
                            <div class="dhikr-progress-bar" style="width: ${progress}%"></div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Обработчики кликов на зикры
    dhikrList.querySelectorAll('.dhikr-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.getAttribute('data-index'));
            openDhikrCounter(index);
        });
    });
}

// Открытие диалога счетчика зикра
function openDhikrCounter(index) {
    const dhikr = dhikrData[index];
    if (!dhikr) return;
    
    appState.currentDhikr = index;
    appState.dhikrCount = appState.dhikrCounts[index] || 0;
    appState.dhikrGoal = dhikr.goal;
    
    const dialog = document.getElementById('dhikr-counter-dialog');
    const titleEl = document.getElementById('dhikr-counter-title');
    const arabicEl = document.getElementById('dhikr-arabic');
    const transliterationEl = document.getElementById('dhikr-transliteration');
    const translationEl = document.getElementById('dhikr-translation');
    const countEl = document.getElementById('dhikr-count');
    const goalEl = document.getElementById('dhikr-goal');
    
    if (titleEl) titleEl.textContent = dhikr.title;
    if (arabicEl) arabicEl.textContent = dhikr.arabic;
    if (transliterationEl) transliterationEl.textContent = dhikr.transliteration;
    if (translationEl) translationEl.textContent = dhikr.translation;
    if (countEl) countEl.textContent = appState.dhikrCount;
    if (goalEl) goalEl.textContent = dhikr.goal;
    
    if (dialog) {
        dialog.classList.add('active');
    }
}

// Закрытие диалога счетчика
function closeDhikrCounter() {
    const dialog = document.getElementById('dhikr-counter-dialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
    // Сохраняем счетчик
    if (appState.currentDhikr !== null) {
        appState.dhikrCounts[appState.currentDhikr] = appState.dhikrCount;
        localStorage.setItem('dhikrCounts', JSON.stringify(appState.dhikrCounts));
    }
    // Обновляем список
    renderDhikrList();
}

// Инициализация счетчика зикра
function initDhikrCounter() {
    // Загружаем сохраненные счетчики
    const saved = localStorage.getItem('dhikrCounts');
    if (saved) {
        try {
            appState.dhikrCounts = JSON.parse(saved);
        } catch (e) {
            console.error('Ошибка загрузки счетчиков:', e);
        }
    }
    
    const incrementBtn = document.getElementById('dhikr-increment');
    const resetBtn = document.getElementById('dhikr-reset');
    const closeBtn = document.getElementById('close-dhikr-dialog');
    const countEl = document.getElementById('dhikr-count');
    
    if (incrementBtn) {
        incrementBtn.addEventListener('click', () => {
            appState.dhikrCount++;
            if (countEl) {
                countEl.textContent = appState.dhikrCount;
            }
            
            if (appState.dhikrCount >= appState.dhikrGoal) {
                alert('Машаллах! Вы достигли цели!');
                appState.dhikrCount = 0;
                if (countEl) {
                    countEl.textContent = '0';
                }
            }
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            appState.dhikrCount = 0;
            if (countEl) {
                countEl.textContent = '0';
            }
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDhikrCounter);
    }
    
    // Закрытие по клику вне модального окна
    const dialog = document.getElementById('dhikr-counter-dialog');
    if (dialog) {
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                closeDhikrCounter();
            }
        });
    }
}

// Инициализация календаря
function initCalendar() {
    const dateDialog = document.getElementById('date-dialog');
    const calendarBtn = document.getElementById('calendar-btn');
    const selectDateBtn = document.getElementById('select-date-btn');
    const closeDateDialog = document.getElementById('close-date-dialog');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarMonth = document.getElementById('calendar-month');
    const yesterdayBtn = document.getElementById('yesterday-btn');
    const todayBtn = document.getElementById('today-btn');
    const tomorrowBtn = document.getElementById('tomorrow-btn');
    
    let currentCalendarDate = new Date();
    
    function openCalendar() {
        currentCalendarDate = new Date(prayerCalc.selectedDate);
        renderCalendar();
        dateDialog.classList.add('active');
    }
    
    function closeCalendar() {
        dateDialog.classList.remove('active');
    }
    
    function renderCalendar() {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        
        // Заголовок месяца
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                           'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        if (calendarMonth) {
            calendarMonth.textContent = `${monthNames[month]} ${year}`;
        }
        
        // Первый день месяца
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Дни недели
        const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        
        if (calendarGrid) {
            let html = '';
            
            // Заголовки дней
            dayNames.forEach(day => {
                html += `<div class="calendar-day-header">${day}</div>`;
            });
            
            // Пустые ячейки до первого дня
            for (let i = 0; i < startingDayOfWeek; i++) {
                html += '<div class="calendar-day other-month"></div>';
            }
            
            // Дни месяца
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const isToday = isSameDay(date, new Date());
                const isSelected = isSameDay(date, prayerCalc.selectedDate);
                
                let classes = 'calendar-day';
                if (isToday) classes += ' today';
                if (isSelected) classes += ' selected';
                
                html += `<div class="${classes}" data-day="${day}">${day}</div>`;
            }
            
            calendarGrid.innerHTML = html;
            
            // Обработчики кликов на дни
            calendarGrid.querySelectorAll('.calendar-day:not(.other-month)').forEach(dayEl => {
                dayEl.addEventListener('click', async () => {
                    const day = parseInt(dayEl.getAttribute('data-day'));
                    const selectedDate = new Date(year, month, day);
                    prayerCalc.selectedDate = selectedDate;
                    await prayerCalc.fetchPrayerTimes(selectedDate);
                    updateUI();
                    updatePrayerInfo();
                    renderCalendar();
                });
            });
        }
    }
    
    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    if (calendarBtn) {
        calendarBtn.addEventListener('click', openCalendar);
    }
    if (selectDateBtn) {
        selectDateBtn.addEventListener('click', openCalendar);
    }
    if (closeDateDialog) {
        closeDateDialog.addEventListener('click', closeCalendar);
    }
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendar();
        });
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendar();
        });
    }
    if (yesterdayBtn) {
        yesterdayBtn.addEventListener('click', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            prayerCalc.selectedDate = yesterday;
            await prayerCalc.fetchPrayerTimes(yesterday);
            updateUI();
            updatePrayerInfo();
            currentCalendarDate = new Date(yesterday);
            renderCalendar();
        });
    }
    if (todayBtn) {
        todayBtn.addEventListener('click', async () => {
            const today = new Date();
            prayerCalc.selectedDate = today;
            await prayerCalc.fetchPrayerTimes(today);
            updateUI();
            updatePrayerInfo();
            currentCalendarDate = new Date(today);
            renderCalendar();
        });
    }
    if (tomorrowBtn) {
        tomorrowBtn.addEventListener('click', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            prayerCalc.selectedDate = tomorrow;
            await prayerCalc.fetchPrayerTimes(tomorrow);
            updateUI();
            updatePrayerInfo();
            currentCalendarDate = new Date(tomorrow);
            renderCalendar();
        });
    }
    
    // Закрытие по клику вне модального окна
    if (dateDialog) {
        dateDialog.addEventListener('click', (e) => {
            if (e.target === dateDialog) {
                closeCalendar();
            }
        });
    }
}

// Инициализация поиска города
function initCitySearch() {
    console.log('🔧 Инициализация поиска городов...');
    
    const cityDialog = document.getElementById('city-dialog');
    const selectCityBtn = document.getElementById('select-city-btn');
    const citySearch = document.getElementById('city-search');
    const cityResults = document.getElementById('city-results');
    const closeCityDialog = document.getElementById('close-city-dialog');
    const searchCityBtn = document.getElementById('search-city-btn');
    
    // Проверяем, что все элементы найдены
    if (!cityDialog) console.warn('⚠️ city-dialog не найден');
    if (!selectCityBtn) console.warn('⚠️ select-city-btn не найден');
    if (!citySearch) console.warn('⚠️ city-search не найден');
    if (!cityResults) console.warn('⚠️ city-results не найден');
    if (!closeCityDialog) console.warn('⚠️ close-city-dialog не найден');
    
    if (!citySearch || !cityResults) {
        console.error('❌ Критические элементы для поиска городов не найдены!');
        return;
    }
    
    console.log('✅ Все элементы для поиска городов найдены');
    
    let searchTimeout;
    
    function openCityDialog() {
        console.log('📂 Открытие диалога выбора города');
        if (cityDialog) {
            cityDialog.classList.add('active');
            console.log('   ✅ Класс active добавлен к city-dialog');
        } else {
            console.error('   ❌ cityDialog не найден!');
        }
        if (citySearch) {
            citySearch.focus();
            console.log('   ✅ Фокус установлен на city-search');
            console.log('   📝 Текущее значение поля:', citySearch.value);
        } else {
            console.error('   ❌ citySearch не найден!');
        }
    }
    
    function closeCityDialogFunc() {
        console.log('📂 Закрытие диалога выбора города');
        if (cityDialog) {
            cityDialog.classList.remove('active');
        }
        if (citySearch) {
            citySearch.value = '';
        }
        if (cityResults) {
            cityResults.innerHTML = '';
        }
    }
    
    async function searchCities(query) {
        console.log('🔍 searchCities вызвана с запросом:', query);
        console.log('   Длина запроса:', query.length);
        console.log('   cityResults существует:', !!cityResults);
        
        if (!query || query.length < 2) {
            console.log('⚠️ Запрос слишком короткий, пропускаем');
            if (cityResults) {
                cityResults.innerHTML = '<div class="city-result-item">Введите хотя бы 2 символа для поиска</div>';
            }
            return;
        }
        
        // Показываем индикатор загрузки
        if (cityResults) {
            cityResults.innerHTML = '<div class="city-result-item">Поиск...</div>';
            console.log('📊 Индикатор загрузки показан');
        } else {
            console.error('❌ cityResults не существует!');
            return;
        }
        
        try {
            // Используем C++ бэкенд API для поиска городов
            const apiUrl = window.location.origin;
            const url = `${apiUrl}/api/cities/search?q=${encodeURIComponent(query)}&limit=20`;
            
            console.log('🔍 Поиск городов:', query);
            console.log('📡 URL запроса:', url);
            console.log('🌐 Origin:', apiUrl);
            console.log('📋 Полный URL:', url);
            
            // Явно отправляем запрос
            console.log('🚀 Отправка fetch запроса...');
            console.log('   Метод: GET');
            console.log('   Headers: Accept: application/json');
            
            const startTime = Date.now();
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                },
                cache: 'no-store'
            });
            const endTime = Date.now();
            
            console.log('📥 Получен ответ за', endTime - startTime, 'мс');
            console.log('   Статус:', response.status, response.statusText);
            console.log('   OK:', response.ok);
            console.log('   Headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ошибка HTTP:', response.status, response.statusText);
                console.error('   Ответ сервера:', errorText);
                throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📥 Получен ответ от API:', data);
            
            if (cityResults) {
                // Проверяем оба формата ответа
                const cities = Array.isArray(data.data?.cities) ? data.data.cities : 
                              Array.isArray(data.cities) ? data.cities : [];
                
                console.log('🏙️ Найдено городов:', cities.length);
                
                if (!data.success) {
                    const errorMsg = data.error || 'Неизвестная ошибка';
                    cityResults.innerHTML = `<div class="city-result-item">Ошибка: ${errorMsg}</div>`;
                    return;
                }
                
                if (cities.length === 0) {
                    cityResults.innerHTML = '<div class="city-result-item">Города не найдены. Попробуйте другой запрос.</div>';
                    return;
                }
                
                // Формируем список городов
                cityResults.innerHTML = cities.map(city => {
                    // Извлекаем название города из ответа Nominatim (как в мобильной версии)
                    const cityName = city.address?.city || 
                                   city.address?.town || 
                                   city.address?.village || 
                                   city.address?.municipality ||
                                   city.address?.city_district ||
                                   city.address?.county ||
                                   city.name || 
                                   (city.display_name ? city.display_name.split(',')[0] : '') ||
                                   'Неизвестно';
                    
                    const country = city.address?.country || '';
                    const region = city.address?.state || 
                                 city.address?.region || 
                                 city.address?.province || '';
                    
                    // Формируем полное название с регионом и страной
                    let fullName = cityName;
                    if (region && region !== cityName) {
                        fullName += ', ' + region;
                    }
                    if (country) {
                        fullName += ', ' + country;
                    }
                    
                    const lat = parseFloat(city.lat);
                    const lon = parseFloat(city.lon);
                    
                    // Проверяем валидность координат
                    if (isNaN(lat) || isNaN(lon)) {
                        console.warn('⚠️ Некорректные координаты для города:', cityName);
                        return null;
                    }
                    
                    return `
                        <div class="city-result-item" data-lat="${lat}" data-lon="${lon}" data-name="${cityName}">
                            <strong>${cityName}</strong>${region && region !== cityName ? ', ' + region : ''}${country ? ', ' + country : ''}
                        </div>
                    `;
                }).filter(item => item !== null).join('');
                
                // Обработчики кликов
                cityResults.querySelectorAll('.city-result-item').forEach(item => {
                    item.addEventListener('click', async () => {
                        const lat = parseFloat(item.getAttribute('data-lat'));
                        const lon = parseFloat(item.getAttribute('data-lon'));
                        const name = item.getAttribute('data-name');
                        
                        console.log('📍 Выбран город:', name, 'координаты:', lat, lon);
                        
                        if (isNaN(lat) || isNaN(lon)) {
                            console.error('❌ Некорректные координаты');
                            return;
                        }
                        
                        prayerCalc.setLocation(lat, lon, name);
                        await loadPrayerTimes();
                        updateSettingsLocation();
                        closeCityDialogFunc();
                    });
                });
            }
        } catch (error) {
            console.error('❌ Ошибка поиска городов:', error);
            console.error('   Детали:', error.message);
            if (cityResults) {
                cityResults.innerHTML = `<div class="city-result-item">Ошибка при поиске городов: ${error.message}</div>`;
            }
        }
    }
    
    if (selectCityBtn) {
        console.log('✅ Кнопка select-city-btn найдена, привязываем обработчик');
        selectCityBtn.addEventListener('click', () => {
            console.log('🖱️ Клик по кнопке выбора города');
            openCityDialog();
        });
    } else {
        console.warn('⚠️ Кнопка select-city-btn не найдена');
    }
    
    // Обработчик кнопки поиска
    if (searchCityBtn) {
        console.log('✅ Кнопка search-city-btn найдена, привязываем обработчик');
        console.log('   Элемент:', searchCityBtn);
        console.log('   Текст кнопки:', searchCityBtn.textContent);
        
        searchCityBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔍 КЛИК ПО КНОПКЕ ПОИСКА!');
            console.log('   citySearch существует:', !!citySearch);
            console.log('   Значение поля:', citySearch ? citySearch.value : 'N/A');
            
            if (citySearch && citySearch.value) {
                const query = citySearch.value.trim();
                console.log('   Запрос:', query, 'длина:', query.length);
                
                if (query.length >= 2) {
                    console.log('   ✅ Запуск поиска для:', query);
                    clearTimeout(searchTimeout);
                    searchCities(query);
                } else {
                    console.log('   ⚠️ Запрос слишком короткий');
                    if (cityResults) {
                        cityResults.innerHTML = '<div class="city-result-item">Введите хотя бы 2 символа для поиска</div>';
                    }
                }
            } else {
                console.log('   ⚠️ Поле поиска пустое');
                if (cityResults) {
                    cityResults.innerHTML = '<div class="city-result-item">Введите название города</div>';
                }
            }
        });
        
        // Также добавляем обработчик через делегирование на случай если прямой не сработает
        if (cityDialog) {
            cityDialog.addEventListener('click', (e) => {
                if (e.target && e.target.id === 'search-city-btn') {
                    console.log('🔍 [Делегирование] Клик по кнопке поиска');
                    e.preventDefault();
                    e.stopPropagation();
                    if (citySearch && citySearch.value) {
                        const query = citySearch.value.trim();
                        if (query.length >= 2) {
                            clearTimeout(searchTimeout);
                            searchCities(query);
                        }
                    }
                }
            });
        }
    } else {
        console.error('❌ Кнопка search-city-btn НЕ НАЙДЕНА! Проверьте HTML.');
    }
    
    if (closeCityDialog) {
        console.log('✅ Кнопка close-city-dialog найдена, привязываем обработчик');
        closeCityDialog.addEventListener('click', closeCityDialogFunc);
    } else {
        console.warn('⚠️ Кнопка close-city-dialog не найдена');
    }
    // Используем делегирование событий на cityDialog, чтобы обработчик работал всегда
    if (cityDialog) {
        console.log('✅ Используем делегирование событий на city-dialog');
        
        // Обработчик input через делегирование
        cityDialog.addEventListener('input', (e) => {
            // Проверяем, что событие от нужного элемента
            if (e.target && e.target.id === 'city-search') {
                try {
                    const value = e.target.value;
                    console.log('⌨️ [Делегирование] Ввод в поле поиска:', value, 'тип:', typeof value);
                    
                    if (!value || value.trim().length === 0) {
                        console.log('⚠️ Пустое значение, очищаем результаты');
                        if (cityResults) {
                            cityResults.innerHTML = '';
                        }
                        return;
                    }
                    
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        console.log('⏱️ Таймаут истек (300ms), запуск поиска для:', value);
                        try {
                            searchCities(value.trim());
                        } catch (error) {
                            console.error('❌ Ошибка в searchCities:', error);
                            if (cityResults) {
                                cityResults.innerHTML = `<div class="city-result-item">Ошибка: ${error.message}</div>`;
                            }
                        }
                    }, 300);
                } catch (error) {
                    console.error('❌ Ошибка в обработчике input (делегирование):', error);
                }
            }
        });
        
        // Обработчик keyup через делегирование
        cityDialog.addEventListener('keyup', (e) => {
            if (e.target && e.target.id === 'city-search') {
                try {
                    if (e.key === 'Enter') {
                        const value = e.target.value;
                        console.log('⌨️ [Делегирование] Нажата Enter, запуск поиска для:', value);
                        clearTimeout(searchTimeout);
                        try {
                            searchCities(value.trim());
                        } catch (error) {
                            console.error('❌ Ошибка в searchCities (Enter):', error);
                        }
                    }
                } catch (error) {
                    console.error('❌ Ошибка в обработчике keyup (делегирование):', error);
                }
            }
        });
    }
    
    // Также привязываем напрямую к элементу (на случай если делегирование не сработает)
    if (citySearch) {
        console.log('✅ Обработчик input привязан напрямую к city-search');
        
        const handleInput = (e) => {
            try {
                const value = e.target.value;
                console.log('⌨️ [Прямой] Ввод в поле поиска:', value, 'тип:', typeof value);
                
                if (!value || value.trim().length === 0) {
                    console.log('⚠️ Пустое значение, очищаем результаты');
                    if (cityResults) {
                        cityResults.innerHTML = '';
                    }
                    return;
                }
                
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    console.log('⏱️ Таймаут истек (300ms), запуск поиска для:', value);
                    try {
                        searchCities(value.trim());
                    } catch (error) {
                        console.error('❌ Ошибка в searchCities:', error);
                        if (cityResults) {
                            cityResults.innerHTML = `<div class="city-result-item">Ошибка: ${error.message}</div>`;
                        }
                    }
                }, 300);
            } catch (error) {
                console.error('❌ Ошибка в обработчике input (прямой):', error);
            }
        };
        
        citySearch.addEventListener('input', handleInput);
        citySearch.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const value = e.target.value;
                console.log('⌨️ [Прямой] Нажата Enter, запуск поиска для:', value);
                clearTimeout(searchTimeout);
                try {
                    if (value && value.trim().length >= 2) {
                        searchCities(value.trim());
                    } else {
                        console.log('   ⚠️ Запрос слишком короткий');
                        if (cityResults) {
                            cityResults.innerHTML = '<div class="city-result-item">Введите хотя бы 2 символа для поиска</div>';
                        }
                    }
                } catch (error) {
                    console.error('❌ Ошибка в searchCities (Enter):', error);
                }
            }
        });
        
        console.log('🧪 Тест: можно ли вызвать searchCities напрямую?');
        console.log('   citySearch.value:', citySearch.value);
    } else {
        console.error('❌ citySearch не найден, обработчик не привязан!');
    }
    
    // Закрытие по клику вне модального окна
    if (cityDialog) {
        cityDialog.addEventListener('click', (e) => {
            if (e.target === cityDialog) {
                closeCityDialogFunc();
            }
        });
    }
    
    // Экспортируем функции для тестирования из консоли
    window.testCitySearch = function(query = 'Москва') {
        console.log('🧪 ТЕСТ: Ручной вызов поиска городов для:', query);
        console.log('   Вызываем searchCities напрямую...');
        try {
            searchCities(query);
        } catch (error) {
            console.error('❌ Ошибка при тестовом вызове:', error);
        }
    };
    
    window.testCitySearchInput = function(query = 'Москва') {
        console.log('🧪 ТЕСТ: Симуляция ввода для:', query);
        if (citySearch) {
            citySearch.value = query;
            // Создаем событие input
            const event = new Event('input', { bubbles: true, cancelable: true });
            citySearch.dispatchEvent(event);
            console.log('   ✅ Событие input отправлено');
        } else {
            console.error('❌ citySearch не найден для теста');
        }
    };
    
    // Экспортируем searchCities для прямого вызова
    window.searchCitiesDirect = searchCities;
    
    console.log('✅ Инициализация поиска городов завершена');
    console.log('🧪 Для теста вызовите в консоли:');
    console.log('   testCitySearch("Москва") - прямой вызов функции');
    console.log('   testCitySearchInput("Москва") - симуляция ввода');
    console.log('   searchCitiesDirect("Москва") - прямой вызов searchCities');
}

// Инициализация геолокации
function initGeolocation() {
    const autoDetectBtn = document.getElementById('auto-detect-btn');
    
    if (autoDetectBtn) {
        autoDetectBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        
                        // Получаем название города через бэкенд API (Nominatim)
                        try {
                            const apiUrl = window.location.origin;
                            const response = await fetch(`${apiUrl}/api/cities/nearest?lat=${lat}&lon=${lon}`);
                            const data = await response.json();
                            
                            if (data.success && data.data) {
                                // Nominatim возвращает объект с address
                                const address = data.data.address || {};
                                const cityName = address.city || 
                                               address.town || 
                                               address.village || 
                                               address.municipality ||
                                               data.data.display_name?.split(',')[0] || 
                                               `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
                                
                                prayerCalc.setLocation(lat, lon, cityName);
                                await loadPrayerTimes();
                                updateSettingsLocation();
                                alert(`Местоположение определено: ${cityName}`);
                            } else {
                                throw new Error('City not found');
                            }
                        } catch (error) {
                            console.error('Ошибка получения названия города:', error);
                            // Используем координаты напрямую
                            prayerCalc.setLocation(lat, lon, `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`);
                            await loadPrayerTimes();
                            updateSettingsLocation();
                            alert(`Местоположение определено по координатам`);
                        }
                    },
                    (error) => {
                        console.error('Ошибка геолокации:', error);
                        alert('Не удалось определить местоположение. Разрешите доступ к геолокации в настройках браузера.');
                    }
                );
            } else {
                alert('Геолокация не поддерживается вашим браузером.');
            }
        });
    }
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

// Поиск мечетей поблизости через Overpass API
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

// Инициализация при загрузке
updateHijriDate();
setInterval(updateHijriDate, 86400000); // Обновляем раз в день

// Кнопка обновления
const refreshBtn = document.getElementById('refresh-btn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
        await loadPrayerTimes();
        updatePrayerInfo();
    });
}

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

// ==================== ИСЛАМСКИЕ СОБЫТИЯ ====================

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

// ==================== СТАТЬИ ====================

// Данные статей
const articlesData = [
    {
        id: 1,
        title: 'Как правильно совершать намаз',
        icon: '🤲',
        content: `
            <h2>Как правильно совершать намаз</h2>
            <p>Намаз (салят) - это один из пяти столпов ислама. Правильное совершение намаза включает в себя:</p>
            <ol>
                <li><strong>Ният (намерение)</strong> - внутреннее намерение совершить молитву</li>
                <li><strong>Такбир</strong> - произнесение "Аллаху Акбар" с поднятием рук</li>
                <li><strong>Кыям</strong> - стояние и чтение суры Аль-Фатиха</li>
                <li><strong>Руку</strong> - поясной поклон</li>
                <li><strong>Суджуд</strong> - земной поклон (два раза)</li>
                <li><strong>Ташаххуд</strong> - сидение и чтение молитвы</li>
                <li><strong>Салям</strong> - приветствие вправо и влево</li>
            </ol>
            <p>Важно совершать намаз в чистоте, обратившись лицом к Кибле (Мекке).</p>
        `
    },
    {
        id: 2,
        title: 'Время молитв и его важность',
        icon: '⏰',
        content: `
            <h2>Время молитв и его важность</h2>
            <p>В исламе существует пять обязательных молитв в течение дня:</p>
            <ul>
                <li><strong>Фаджр (Рассвет)</strong> - от рассвета до восхода солнца</li>
                <li><strong>Зухр (Полдень)</strong> - после того, как солнце прошло зенит</li>
                <li><strong>Аср (Послеполуденная)</strong> - во второй половине дня</li>
                <li><strong>Магриб (Закат)</strong> - сразу после захода солнца</li>
                <li><strong>Иша (Ночь)</strong> - после наступления темноты</li>
            </ul>
            <p>Соблюдение времени молитв является обязательным для каждого мусульманина. Время молитв зависит от положения солнца и географического местоположения.</p>
        `
    },
    {
        id: 3,
        title: 'Зикры и их значение',
        icon: '📿',
        content: `
            <h2>Зикры и их значение</h2>
            <p>Зикр (поминание Аллаха) - это важная практика в исламе, которая помогает мусульманину помнить о Всевышнем в течение дня.</p>
            <h3>Основные зикры:</h3>
            <ul>
                <li><strong>Субханаллах</strong> - "Слава Аллаху" (произносится 33 раза)</li>
                <li><strong>Альхамдулиллях</strong> - "Хвала Аллаху" (произносится 33 раза)</li>
                <li><strong>Аллаху Акбар</strong> - "Аллах велик" (произносится 34 раза)</li>
                <li><strong>Ля иляха илляллах</strong> - "Нет божества, кроме Аллаха"</li>
            </ul>
            <p>Регулярное произнесение зикров очищает сердце, укрепляет веру и приближает к Аллаху.</p>
        `
    }
];

// Инициализация страницы статей
function initArticles() {
    // Обновляем при переключении на страницу
    const articlesPage = document.getElementById('articles-page');
    if (articlesPage) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (articlesPage.classList.contains('active')) {
                        renderArticles();
                    }
                }
            });
        });
        observer.observe(articlesPage, { attributes: true });
    }
}

// Отображение списка статей
function renderArticles() {
    const listEl = document.getElementById('articles-list');
    if (!listEl) return;
    
    listEl.innerHTML = articlesData.map(article => `
        <div class="article-item" data-article-id="${article.id}">
            <div class="article-icon">${article.icon}</div>
            <div class="article-title">${article.title}</div>
            <div class="article-arrow">→</div>
        </div>
    `).join('');
    
    // Обработчики кликов
    listEl.querySelectorAll('.article-item').forEach(item => {
        item.addEventListener('click', () => {
            const articleId = parseInt(item.getAttribute('data-article-id'));
            showArticle(articleId);
        });
    });
}

// Показать статью
function showArticle(articleId) {
    const article = articlesData.find(a => a.id === articleId);
    if (!article) return;
    
    // Создаем модальное окно для статьи
    let dialog = document.getElementById('article-dialog');
    if (!dialog) {
        dialog = document.createElement('div');
        dialog.id = 'article-dialog';
        dialog.className = 'modal';
        dialog.innerHTML = `
            <div class="modal-content article-content">
                <button class="btn btn-secondary" id="close-article-dialog" style="position: absolute; top: 16px; right: 16px;">✕</button>
                <div id="article-content-body"></div>
            </div>
        `;
        document.body.appendChild(dialog);
        
        const closeBtn = document.getElementById('close-article-dialog');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                dialog.classList.remove('active');
            });
        }
        
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.classList.remove('active');
            }
        });
    }
    
    const contentBody = document.getElementById('article-content-body');
    if (contentBody) {
        contentBody.innerHTML = article.content;
    }
    
    dialog.classList.add('active');
}

