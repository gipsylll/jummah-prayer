// Навигация между страницами

function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.getAttribute('data-page');
            switchPage(pageId);
            
            // Обновление активной кнопки
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Объявляем для screen readers
            if (window.announceToScreenReader) {
                const pageNames = {
                    'main-page': 'Главная страница',
                    'dhikr-page': 'Страница зикров',
                    'events-page': 'Страница событий',
                    'articles-page': 'Страница статей',
                    'settings-page': 'Настройки'
                };
                window.announceToScreenReader(`Переключено на ${pageNames[pageId] || 'страницу'}`);
            }
        });
        
        // Клавиатурная навигация
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
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
        
        // Обновляем breadcrumbs если функция доступна
        if (window.updateBreadcrumbs) {
            updateBreadcrumbs();
        }
    }
}

// Делаем switchPage глобальной для использования в других модулях
window.switchPage = switchPage;

