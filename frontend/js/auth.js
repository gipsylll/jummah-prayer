// Модуль авторизации

// Определяем URL API - если фронтенд и бэкенд на одном домене, используем относительный путь
// Иначе используем полный URL с портом 8080
const API_BASE_URL = (() => {
    // Если фронтенд открыт через file://, используем localhost:8080
    if (window.location.protocol === 'file:') {
        return 'http://localhost:8080';
    }
    // Если фронтенд на том же порту, используем относительный путь
    if (window.location.port === '8080' || window.location.port === '') {
        return window.location.origin;
    }
    // Иначе используем localhost:8080
    return 'http://localhost:8080';
})();

console.log('API_BASE_URL:', API_BASE_URL);

// Состояние авторизации
let currentUser = null;
let authToken = null;

// Инициализация авторизации
async function initAuth() {
    // Загружаем токен из localStorage
    authToken = localStorage.getItem('authToken');
    
    // Если есть токен, проверяем его валидность
    if (authToken) {
        await checkAuthStatus();
    }
    
    // Инициализируем обработчики форм после небольшой задержки, чтобы убедиться, что DOM готов
    setTimeout(() => {
        initAuthForms();
    }, 100);
    
    // Обновляем UI
    updateAuthUI();
}

// Проверка статуса авторизации
async function checkAuthStatus() {
    if (!authToken) {
        return false;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                currentUser = data.data;
                updateAuthUI();
                return true;
            }
        }
        
        // Токен невалиден, удаляем его
        logout();
        return false;
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        return false;
    }
}

// Регистрация
async function register(email, password, name) {
    try {
        const url = `${API_BASE_URL}/api/auth/register`;
        console.log('🔵 Отправка запроса на регистрацию:', url);
        console.log('🔵 API_BASE_URL:', API_BASE_URL);
        console.log('🔵 Данные:', { email, name, password: '***' });
        
        const requestBody = JSON.stringify({ email, password, name });
        console.log('🔵 Request body:', requestBody);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: requestBody
        });
        
        console.log('🔵 Ответ получен:', response.status, response.statusText);
        console.log('🔵 Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('🔵 Response text:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Ошибка парсинга JSON:', e);
            console.error('❌ Response text:', responseText);
            return { success: false, message: 'Ошибка парсинга ответа сервера: ' + responseText };
        }
        
        console.log('🔵 Данные ответа:', data);
        
        if (data.success && data.data) {
            authToken = data.data.token;
            currentUser = {
                userId: data.data.userId,
                name: data.data.name,
                email: data.data.email
            };
            
            // Сохраняем токен
            localStorage.setItem('authToken', authToken);
            
            updateAuthUI();
            return { success: true, message: data.message || 'Регистрация успешна' };
        } else {
            return { success: false, message: data.message || 'Ошибка регистрации' };
        }
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        return { success: false, message: 'Ошибка соединения с сервером: ' + error.message };
    }
}

// Вход
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
            authToken = data.data.token;
            currentUser = {
                userId: data.data.userId,
                name: data.data.name,
                email: data.data.email,
                lastLogin: data.data.lastLogin
            };
            
            // Сохраняем токен
            localStorage.setItem('authToken', authToken);
            
            updateAuthUI();
            return { success: true, message: data.message || 'Вход выполнен успешно' };
        } else {
            return { success: false, message: data.message || 'Неверный email или пароль' };
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        return { success: false, message: 'Ошибка соединения с сервером' };
    }
}

// Выход
async function logout() {
    if (authToken) {
        try {
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Ошибка выхода:', error);
        }
    }
    
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    updateAuthUI();
    
    // Переключаемся на главную страницу
    if (window.switchPage) {
        window.switchPage('main-page');
    }
}

// Получение статистики
async function getStats() {
    if (!authToken) {
        return null;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                return data.data;
            }
        }
        return null;
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        return null;
    }
}

// Получение информации о пользователе
async function getUserInfo() {
    if (!authToken) {
        return null;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                currentUser = data.data;
                return data.data;
            }
        }
        return null;
    } catch (error) {
        console.error('Ошибка получения информации о пользователе:', error);
        return null;
    }
}

// Изменение пароля
async function changePassword(oldPassword, newPassword) {
    if (!authToken || !currentUser) {
        return { success: false, message: 'Необходима авторизация' };
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                oldPassword,
                newPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            return { success: true, message: data.message || 'Пароль успешно изменен' };
        } else {
            return { success: false, message: data.message || 'Ошибка изменения пароля' };
        }
    } catch (error) {
        console.error('Ошибка изменения пароля:', error);
        return { success: false, message: 'Ошибка соединения с сервером' };
    }
}

// Получение токена для API запросов
function getAuthToken() {
    return authToken;
}

// Получение заголовка авторизации
function getAuthHeader() {
    if (authToken) {
        return { 'Authorization': `Bearer ${authToken}` };
    }
    return {};
}

// Проверка авторизован ли пользователь
function isAuthenticated() {
    return authToken !== null && currentUser !== null;
}

// Получение текущего пользователя
function getCurrentUser() {
    return currentUser;
}

// Обновление UI в зависимости от статуса авторизации
function updateAuthUI() {
    const loginBtn = document.getElementById('login-btn');
    const profileBtn = document.getElementById('profile-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');
    
    if (isAuthenticated()) {
        // Показываем кнопку профиля и выхода
        if (loginBtn) loginBtn.style.display = 'none';
        if (profileBtn) {
            profileBtn.style.display = 'flex';
            // Сбрасываем состояние загрузки, если оно застряло
            if (window.resetButtonLoading) {
                window.resetButtonLoading(profileBtn);
            }
        }
        if (logoutBtn) logoutBtn.style.display = 'flex';
        if (userInfo) {
            userInfo.textContent = currentUser.name || currentUser.email;
            userInfo.style.display = 'block';
        }
    } else {
        // Показываем кнопку входа
        if (loginBtn) loginBtn.style.display = 'flex';
        if (profileBtn) profileBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
    }
}

// Инициализация форм авторизации
function initAuthForms() {
    // Форма входа
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorMsg = document.getElementById('login-error');
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            if (errorMsg) errorMsg.textContent = '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = tr('Loading') || 'Загрузка...';
            }
            
            const result = await login(email, password);
            
            if (result.success) {
                // Закрываем форму входа
                const loginPage = document.getElementById('login-page');
                if (loginPage) loginPage.classList.remove('active');
                
                // Показываем сообщение об успехе
                if (window.showToast) {
                    window.showToast(result.message, 'success');
                }
                
                // Переключаемся на главную страницу
                if (window.switchPage) {
                    window.switchPage('main-page');
                }
            } else {
                if (errorMsg) errorMsg.textContent = result.message;
            }
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = tr('Login') || 'Войти';
            }
        });
    }
    
    // Форма регистрации
    const registerForm = document.getElementById('register-form');
    console.log('Форма регистрации найдена:', registerForm);
    if (registerForm) {
        // Удаляем старый обработчик, если он есть
        const newRegisterForm = registerForm.cloneNode(true);
        registerForm.parentNode.replaceChild(newRegisterForm, registerForm);
        const form = document.getElementById('register-form');
        
        // Обработчик submit формы
        const handleRegisterSubmit = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('✅ Отправка формы регистрации');
            
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            const errorMsg = document.getElementById('register-error');
            const submitBtn = form.querySelector('button[type="submit"]');
            
            console.log('Данные формы:', { name, email, password: password ? '***' : '', confirmPassword: confirmPassword ? '***' : '' });
            
            if (errorMsg) errorMsg.textContent = '';
            
            // Проверка совпадения паролей
            if (password !== confirmPassword) {
                if (errorMsg) errorMsg.textContent = tr('Passwords do not match') || 'Пароли не совпадают';
                return;
            }
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = tr('Loading') || 'Загрузка...';
            }
            
            try {
                const result = await register(email, password, name);
                console.log('Результат регистрации:', result);
                
                if (result.success) {
                    // Закрываем форму регистрации
                    const registerPage = document.getElementById('register-page');
                    if (registerPage) registerPage.classList.remove('active');
                    
                    // Показываем сообщение об успехе
                    if (window.showToast) {
                        window.showToast(result.message, 'success');
                    }
                    
                    // Переключаемся на главную страницу
                    if (window.switchPage) {
                        window.switchPage('main-page');
                    }
                } else {
                    if (errorMsg) errorMsg.textContent = result.message;
                }
            } catch (error) {
                console.error('Ошибка при обработке регистрации:', error);
                if (errorMsg) errorMsg.textContent = 'Ошибка: ' + error.message;
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = tr('Register') || 'Зарегистрироваться';
                }
            }
        };
        
        form.addEventListener('submit', handleRegisterSubmit);
        form.setAttribute('data-handler-attached', 'true');
        
        // Также добавляем обработчик на кнопку для надежности
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                console.log('🔘 Кнопка регистрации нажата');
                // Не вызываем preventDefault здесь, пусть форма обрабатывает submit
            });
        }
        
        console.log('✅ Обработчик формы регистрации привязан, форма:', form);
    } else {
        console.error('❌ Форма регистрации не найдена!');
    }
    
    // Кнопка выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await logout();
            if (window.showToast) {
                window.showToast(tr('Logged out successfully') || 'Выход выполнен успешно', 'success');
            }
        });
    }
    
    // Переключение между формой входа и регистрации
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Переключение на страницу регистрации');
            const loginPage = document.getElementById('login-page');
            const registerPage = document.getElementById('register-page');
            if (loginPage) loginPage.classList.remove('active');
            if (registerPage) {
                registerPage.classList.add('active');
                // Убеждаемся, что обработчик формы привязан
                setTimeout(() => {
                    const form = document.getElementById('register-form');
                    if (form) {
                        console.log('Проверка формы регистрации при переключении страницы');
                        // Проверяем, есть ли обработчик
                        const hasHandler = form.getAttribute('data-handler-attached');
                        if (!hasHandler) {
                            console.log('Повторная инициализация формы регистрации');
                            // Переинициализируем форму
                            initAuthForms();
                        }
                    }
                }, 50);
            }
        });
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Переключение на страницу входа');
            const registerPage = document.getElementById('register-page');
            const loginPage = document.getElementById('login-page');
            if (registerPage) registerPage.classList.remove('active');
            if (loginPage) loginPage.classList.add('active');
        });
    }
    
    // Кнопка входа
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (window.switchPage) {
                window.switchPage('login-page');
            }
        });
    }
    
    // Кнопка профиля
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', async () => {
            // Устанавливаем состояние загрузки
            if (window.setButtonLoading) {
                window.setButtonLoading(profileBtn);
            }
            try {
                await loadProfilePage();
                if (window.switchPage) {
                    window.switchPage('profile-page');
                }
            } finally {
                // Сбрасываем состояние загрузки
                if (window.resetButtonLoading) {
                    window.resetButtonLoading(profileBtn);
                }
            }
        });
    }
    
    // Форма смены пароля
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const oldPassword = document.getElementById('old-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmNewPassword = document.getElementById('confirm-new-password').value;
            const errorMsg = document.getElementById('change-password-error');
            const submitBtn = changePasswordForm.querySelector('button[type="submit"]');
            
            if (errorMsg) errorMsg.textContent = '';
            
            // Проверка совпадения паролей
            if (newPassword !== confirmNewPassword) {
                if (errorMsg) errorMsg.textContent = tr('Passwords do not match') || 'Пароли не совпадают';
                return;
            }
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = tr('Loading') || 'Загрузка...';
            }
            
            const result = await changePassword(oldPassword, newPassword);
            
            if (result.success) {
                if (errorMsg) {
                    errorMsg.style.color = 'var(--primary-color)';
                    errorMsg.textContent = result.message;
                }
                // Очищаем форму
                changePasswordForm.reset();
                
                if (window.showToast) {
                    window.showToast(result.message, 'success');
                }
            } else {
                if (errorMsg) {
                    errorMsg.style.color = 'var(--error-color, #f44336)';
                    errorMsg.textContent = result.message;
                }
            }
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = tr('Change Password') || 'Изменить пароль';
            }
        });
    }
}

// Загрузка страницы профиля
async function loadProfilePage() {
    const userInfo = await getUserInfo();
    if (userInfo) {
        const nameEl = document.getElementById('profile-name');
        const emailEl = document.getElementById('profile-email');
        const createdAtEl = document.getElementById('profile-created-at');
        const lastLoginEl = document.getElementById('profile-last-login');
        const sessionsEl = document.getElementById('profile-sessions');
        
        if (nameEl) nameEl.textContent = userInfo.name || '---';
        if (emailEl) emailEl.textContent = userInfo.email || '---';
        if (createdAtEl) createdAtEl.textContent = userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString('ru-RU') : '---';
        if (lastLoginEl) lastLoginEl.textContent = userInfo.lastLogin ? new Date(userInfo.lastLogin).toLocaleDateString('ru-RU') : '---';
        if (sessionsEl) sessionsEl.textContent = userInfo.activeSessions || '0';
    }
}

// Загрузка страницы статистики
async function loadStatsPage() {
    const stats = await getStats();
    const totalUsersEl = document.getElementById('stats-total-users');
    const activeSessionsEl = document.getElementById('stats-active-sessions');
    
    if (stats) {
        if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers || '0';
        if (activeSessionsEl) activeSessionsEl.textContent = stats.activeSessions || '0';
    } else {
        if (totalUsersEl) totalUsersEl.textContent = '---';
        if (activeSessionsEl) activeSessionsEl.textContent = '---';
    }
}

// Экспорт функций
window.initAuth = initAuth;
window.initAuthForms = initAuthForms;
window.register = register;
window.login = login;
window.logout = logout;
window.getStats = getStats;
window.getUserInfo = getUserInfo;
window.changePassword = changePassword;
window.getAuthToken = getAuthToken;
window.getAuthHeader = getAuthHeader;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.updateAuthUI = updateAuthUI;
window.loadProfilePage = loadProfilePage;
window.loadStatsPage = loadStatsPage;

