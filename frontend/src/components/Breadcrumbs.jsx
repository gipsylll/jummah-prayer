import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tr } from '../utils/translations';

const Breadcrumbs = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const pageNames = {
        '/': tr('Time') || 'Время',
        '/dhikr': tr('Dhikr') || 'Зикры',
        '/events': tr('Islamic Events') || 'События',
        '/articles': tr('Educational Articles') || 'Статьи',
        '/settings': tr('Settings') || 'Настройки',
        '/profile': tr('Profile') || 'Профиль',
        '/login': tr('Login') || 'Вход',
        '/register': 'Регистрация'
    };

    const currentName = pageNames[location.pathname] || '';

    if (location.pathname === '/') {
        return null; // Не показываем breadcrumbs на главной странице
    }

    return (
        <nav className="breadcrumbs" aria-label="Навигационная цепочка">
            <button
                onClick={() => navigate('/')}
                className="breadcrumb-link"
                aria-label="Главная страница"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary-color)' }}
            >
                🏠 {tr('Time') || 'Время'}
            </button>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">{currentName}</span>
        </nav>
    );
};

export default Breadcrumbs;
