// Улучшения UI/UX: анимации, навигация, доступность

// История посещений страниц
const pageHistory = [];

// Инициализация улучшений UI
function initUIEnhancements() {
    // Сбрасываем все застрявшие состояния загрузки
    document.querySelectorAll('.btn[data-loading="true"]').forEach(btn => {
        resetButtonLoading(btn);
    });
    
    initPageTransitions();
    initCardAnimations();
    initLoadingStates();
    initKeyboardNavigation();
    initAccessibility();
    initQuickActions();
    initBreadcrumbs();
}

// Плавные переходы между страницами
function initPageTransitions() {
    // Обертываем switchPage для добавления анимаций
    const originalSwitchPage = window.switchPage;
    if (originalSwitchPage) {
        window.switchPage = function(pageId) {
            const currentPage = document.querySelector('.page.active');
            const targetPage = document.getElementById(pageId);
            
            if (currentPage && targetPage && currentPage !== targetPage) {
                // Добавляем класс для анимации выхода
                currentPage.classList.add('page-exit');
                
                setTimeout(() => {
                    // Вызываем оригинальную функцию
                    originalSwitchPage(pageId);
                    
                    // Добавляем класс для анимации входа
                    targetPage.classList.add('page-enter');
                    
                    // Удаляем классы после анимации
                    setTimeout(() => {
                        targetPage.classList.remove('page-enter');
                        currentPage.classList.remove('page-exit');
                    }, 300);
                    
                    // Сохраняем в историю
                    pageHistory.push(pageId);
                    if (pageHistory.length > 10) {
                        pageHistory.shift();
                    }
                }, 150);
            } else {
                // Если страница та же или нет текущей, просто переключаем
                originalSwitchPage(pageId);
            }
        };
    }
}

// Анимация появления карточек
function initCardAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('card-visible');
                }, index * 50); // Задержка для каскадного эффекта
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Наблюдаем за всеми карточками
    document.querySelectorAll('.card, .prayer-time-item, .dhikr-item, .event-card, .article-item').forEach(card => {
        card.classList.add('card-animate');
        observer.observe(card);
    });
}

// Loading состояния (Skeleton)
function showSkeleton(element) {
    if (!element) return;
    
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton';
    skeleton.innerHTML = '<div class="skeleton-line"></div><div class="skeleton-line"></div>';
    
    const originalContent = element.innerHTML;
    element.dataset.originalContent = originalContent;
    element.innerHTML = '';
    element.appendChild(skeleton);
    element.classList.add('skeleton-container');
}

function hideSkeleton(element, content) {
    if (!element) return;
    
    element.classList.remove('skeleton-container');
    element.innerHTML = content || element.dataset.originalContent || '';
}

// Функция для сброса состояния загрузки кнопки
function resetButtonLoading(button) {
    if (!button) return;
    if (button.dataset.loading === 'true') {
        button.dataset.loading = 'false';
        button.disabled = false;
        const originalText = button.dataset.originalText || button.textContent.replace(/<span class="spinner"><\/span>\s*/, '');
        button.innerHTML = originalText;
        delete button.dataset.originalText;
    }
}

// Функция для установки состояния загрузки кнопки
function setButtonLoading(button) {
    if (!button || button.dataset.loading === 'true') return;
    const originalText = button.textContent.trim();
    button.dataset.originalText = originalText;
    button.dataset.loading = 'true';
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> ' + originalText;
}

// Инициализация loading состояний
function initLoadingStates() {
    // Добавляем loading состояние для кнопок (только для форм, чтобы не конфликтовать с другими обработчиками)
    document.querySelectorAll('form .btn[type="submit"]').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.dataset.loading !== 'true') {
                setButtonLoading(this);
            }
        });
    });
}

// Клавиатурная навигация
function initKeyboardNavigation() {
    // Горячие клавиши
    document.addEventListener('keydown', (e) => {
        // Alt + цифра для быстрого перехода к страницам
        if (e.altKey && !e.ctrlKey && !e.shiftKey) {
            const keyMap = {
                '1': 'main-page',
                '2': 'dhikr-page',
                '3': 'events-page',
                '4': 'articles-page',
                '5': 'settings-page'
            };
            
            if (keyMap[e.key]) {
                e.preventDefault();
                switchPage(keyMap[e.key]);
                
                // Обновляем активную кнопку навигации
                document.querySelectorAll('.nav-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.getAttribute('data-page') === keyMap[e.key]) {
                        btn.classList.add('active');
                    }
                });
            }
        }
        
        // Escape для закрытия модальных окон
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
        
        // Tab для навигации по элементам
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    // Убираем класс при использовании мыши
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
}

// Доступность
function initAccessibility() {
    // Добавляем ARIA атрибуты
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const pageId = btn.getAttribute('data-page');
        btn.setAttribute('aria-label', `Перейти на страницу ${pageId}`);
        btn.setAttribute('role', 'button');
        btn.setAttribute('tabindex', '0');
    });
    
    // Добавляем aria-live для динамического контента
    const liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
    
    // Функция для объявления изменений
    window.announceToScreenReader = function(message) {
        const region = document.getElementById('aria-live-region');
        if (region) {
            region.textContent = message;
            setTimeout(() => {
                region.textContent = '';
            }, 1000);
        }
    };
}

// Быстрые действия (Quick Actions)
function initQuickActions() {
    // Создаем контейнер для быстрых действий
    const quickActions = document.createElement('div');
    quickActions.id = 'quick-actions';
    quickActions.className = 'quick-actions';
    quickActions.innerHTML = `
        <button class="quick-action-btn" data-action="refresh" aria-label="Обновить время молитв" title="Обновить (R)">
            <span>🔄</span>
        </button>
        <button class="quick-action-btn" data-action="location" aria-label="Определить местоположение" title="Геолокация (L)">
            <span>📍</span>
        </button>
        <button class="quick-action-btn" data-action="theme" aria-label="Переключить тему" title="Тема (T)">
            <span>🌓</span>
        </button>
    `;
    document.body.appendChild(quickActions);
    
    // Обработчики быстрых действий
    quickActions.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
            handleQuickAction(action);
        });
    });
    
    // Горячие клавиши для быстрых действий
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            handleQuickAction('refresh');
        } else if (e.key === 'l' || e.key === 'L') {
            e.preventDefault();
            handleQuickAction('location');
        } else if (e.key === 't' || e.key === 'T') {
            e.preventDefault();
            handleQuickAction('theme');
        }
    });
}

// Обработка быстрых действий
function handleQuickAction(action) {
    switch (action) {
        case 'refresh':
            if (window.loadPrayerTimes) {
                loadPrayerTimes();
                window.announceToScreenReader('Время молитв обновлено');
            }
            break;
        case 'location':
            const autoDetectBtn = document.getElementById('auto-detect-btn');
            if (autoDetectBtn) {
                autoDetectBtn.click();
            }
            break;
        case 'theme':
            const themeToggle = document.getElementById('dark-theme');
            if (themeToggle) {
                themeToggle.click();
            }
            break;
    }
}

// Breadcrumbs (хлебные крошки)
function initBreadcrumbs() {
    const breadcrumbsContainer = document.createElement('nav');
    breadcrumbsContainer.id = 'breadcrumbs';
    breadcrumbsContainer.className = 'breadcrumbs';
    breadcrumbsContainer.setAttribute('aria-label', 'Навигационная цепочка');
    document.body.insertBefore(breadcrumbsContainer, document.body.firstChild);
    
    updateBreadcrumbs();
}

// Обновление breadcrumbs
function updateBreadcrumbs() {
    const breadcrumbs = document.getElementById('breadcrumbs');
    if (!breadcrumbs) return;
    
    const pageNames = {
        'main-page': 'Главная',
        'dhikr-page': 'Зикры',
        'events-page': 'События',
        'articles-page': 'Статьи',
        'settings-page': 'Настройки'
    };
    
    const currentPage = appState.currentPage || 'main-page';
    const currentName = pageNames[currentPage] || 'Главная';
    
    breadcrumbs.innerHTML = `
        <a href="#" onclick="switchPage('main-page'); return false;" aria-label="Главная страница">🏠 Главная</a>
        ${currentPage !== 'main-page' ? `<span class="breadcrumb-separator">›</span><span class="breadcrumb-current">${currentName}</span>` : ''}
    `;
}

// Обновляем breadcrumbs при переключении страниц (уже интегрировано в switchPage)

// Экспортируем функции для использования в других модулях
window.initUIEnhancements = initUIEnhancements;
window.updateBreadcrumbs = updateBreadcrumbs;
window.showSkeleton = showSkeleton;
window.hideSkeleton = hideSkeleton;
window.setButtonLoading = setButtonLoading;
window.resetButtonLoading = resetButtonLoading;

