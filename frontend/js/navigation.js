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

