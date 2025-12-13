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
    dhikrCounts: {} // Храним счетчики для каждого зикра
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
    if (notificationsToggle) {
        notificationsToggle.checked = appState.notifications;
        notificationsToggle.addEventListener('change', async (e) => {
            appState.notifications = e.target.checked;
            localStorage.setItem('notifications', e.target.checked);
            updateNotificationsStatus();
            
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
        
        // Уведомление за 15 минут
        const notify15Min = new Date(prayerTime.getTime() - 15 * 60 * 1000);
        if (notify15Min > now) {
            scheduleNotification(notify15Min, tr(prayer.name), tr('Prayer in 15 minutes'));
        }
        
        // Уведомление за 5 минут
        const notify5Min = new Date(prayerTime.getTime() - 5 * 60 * 1000);
        if (notify5Min > now) {
            scheduleNotification(notify5Min, tr(prayer.name), tr('Prayer in 5 minutes'));
        }
        
        // Уведомление в время молитвы
        scheduleNotification(prayerTime, tr(prayer.name), tr('Time for prayer'));
    });
}

// Планирование уведомления
function scheduleNotification(time, title, body) {
    const delay = time.getTime() - Date.now();
    if (delay <= 0) return;
    
    setTimeout(() => {
        if (Notification.permission === 'granted') {
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

