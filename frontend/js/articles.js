// Статьи

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

