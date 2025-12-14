import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Не загружаем токен сразу из localStorage, проверяем его при инициализации
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const savedToken = localStorage.getItem('authToken');
                if (savedToken && savedToken.trim() !== '') {
                    // Проверяем токен с сервером
                    const userData = await authService.checkAuthStatus(savedToken);
                    if (userData && userData.userId) {
                        // Токен валидный - устанавливаем состояние
                        setToken(savedToken);
                        setUser(userData);
                    } else {
                        // Токен невалидный или истек - очищаем все
                        setToken(null);
                        setUser(null);
                        localStorage.removeItem('authToken');
                        sessionStorage.removeItem('authToken');
                    }
                } else {
                    // Нет сохраненного токена - гарантируем, что пользователь не залогинен
                    setToken(null);
                    setUser(null);
                    // Очищаем на всякий случай
                    localStorage.removeItem('authToken');
                }
            } catch (error) {
                console.error('Ошибка инициализации аутентификации:', error);
                // При ошибке очищаем все и считаем пользователя не залогиненным
                setToken(null);
                setUser(null);
                localStorage.removeItem('authToken');
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        const result = await authService.login(email, password);
        if (result.success) {
            setToken(result.token);
            setUser(result.user);
            localStorage.setItem('authToken', result.token);
            return result;
        }
        return result;
    };

    const register = async (email, password, name) => {
        const result = await authService.register(email, password, name);
        if (result.success) {
            setToken(result.token);
            setUser(result.user);
            localStorage.setItem('authToken', result.token);
            return result;
        }
        return result;
    };

    const logout = async () => {
        if (token) {
            try {
                await authService.logout(token);
            } catch (error) {
                console.error('Ошибка при выходе:', error);
            }
        }
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        // Очищаем все возможные источники токена
        sessionStorage.removeItem('authToken');
    };

    const updateUser = async () => {
        if (token) {
            const userData = await authService.getUserInfo(token);
            if (userData) {
                setUser(userData);
            }
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            register,
            logout,
            updateUser,
            isAuthenticated: !!user && !!token
        }}>
            {children}
        </AuthContext.Provider>
    );
};
