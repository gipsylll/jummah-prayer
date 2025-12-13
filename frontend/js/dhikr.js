// Функционал зикров

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

