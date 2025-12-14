// Работа с временем молитв

// Инициализация времени молитв
async function initPrayerTimes() {
    await loadPrayerTimes();
    updatePrayerInfo();
    updatePrayerTimesList();
    
    // Инициализация кнопки обновления
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadPrayerTimes();
            updatePrayerInfo();
        });
    }
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

