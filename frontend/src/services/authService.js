import { getApiUrl } from '../config/api';

export const authService = {
    async checkAuthStatus(token) {
        if (!token || typeof token !== 'string' || token.trim() === '') {
            return null;
        }
        try {
            const response = await fetch(getApiUrl('/auth/me'), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                // Не кешируем запрос проверки токена
                cache: 'no-store'
            });
            
            // Если ответ не OK (401, 403, и т.д.) - токен невалидный
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    console.log('Токен невалидный или истек');
                }
                return null;
            }
            
            const data = await response.json();
            // Строгая проверка - нужен и success: true, и data.data
            if (data && data.success === true && data.data && typeof data.data === 'object') {
                return data.data;
            }
            
            return null;
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            return null;
        }
    },
    
    async register(email, password, name) {
        try {
            const response = await fetch(getApiUrl('/auth/register'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, name })
            });
            const data = await response.json();
            if (data.success && data.data) {
                return {
                    success: true,
                    token: data.data.token,
                    user: {
                        userId: data.data.userId,
                        name: data.data.name,
                        email: data.data.email
                    },
                    message: data.message || 'Регистрация успешна'
                };
            } else {
                return { success: false, message: data.message || 'Ошибка регистрации' };
            }
        } catch (error) {
            return { success: false, message: 'Ошибка соединения с сервером: ' + error.message };
        }
    },
    
    async login(email, password) {
        try {
            const response = await fetch(getApiUrl('/auth/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data.success && data.data) {
                return {
                    success: true,
                    token: data.data.token,
                    user: {
                        userId: data.data.userId,
                        name: data.data.name,
                        email: data.data.email,
                        lastLogin: data.data.lastLogin
                    },
                    message: data.message || 'Вход выполнен успешно'
                };
            } else {
                return { success: false, message: data.message || 'Неверный email или пароль' };
            }
        } catch (error) {
            return { success: false, message: 'Ошибка соединения с сервером' };
        }
    },
    
    async logout(token) {
        if (token) {
            try {
                await fetch(getApiUrl('/auth/logout'), {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error('Ошибка выхода:', error);
            }
        }
    },
    
    async getUserInfo(token) {
        if (!token) return null;
        try {
            const response = await fetch(getApiUrl('/auth/me'), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
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
            console.error('Ошибка получения информации о пользователе:', error);
            return null;
        }
    },
    
    async changePassword(token, oldPassword, newPassword) {
        if (!token) {
            return { success: false, message: 'Необходима авторизация' };
        }
        try {
            const response = await fetch(getApiUrl('/auth/change-password'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await response.json();
            return {
                success: data.success,
                message: data.message || (data.success ? 'Пароль успешно изменен' : 'Ошибка изменения пароля')
            };
        } catch (error) {
            return { success: false, message: 'Ошибка соединения с сервером' };
        }
    }
};


