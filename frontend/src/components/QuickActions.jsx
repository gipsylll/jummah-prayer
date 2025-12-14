import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { usePrayerTimes } from '../contexts/PrayerTimesContext';
import { useAccessibility } from '../contexts/AccessibilityContext';
import './QuickActions.css';

const QuickActions = () => {
    const navigate = useNavigate();
    const { toggleTheme } = useTheme();
    const { loadPrayerTimes } = usePrayerTimes();
    const { announceToScreenReader } = useAccessibility();

    const handleRefresh = () => {
        loadPrayerTimes();
        if (announceToScreenReader) {
            announceToScreenReader('Время молитв обновлено');
        }
    };

    const handleLocation = () => {
        navigate('/settings');
        // Фокус на кнопку автоопределения будет установлен на странице настроек
    };

    const handleTheme = () => {
        toggleTheme();
    };

    return (
        <div className="quick-actions" role="toolbar" aria-label="Быстрые действия">
            <button
                className="quick-action-btn"
                onClick={handleRefresh}
                aria-label="Обновить время молитв"
                title="Обновить (R)"
            >
                <span>🔄</span>
            </button>
            <button
                className="quick-action-btn"
                onClick={handleLocation}
                aria-label="Определить местоположение"
                title="Геолокация (L)"
            >
                <span>📍</span>
            </button>
            <button
                className="quick-action-btn"
                onClick={handleTheme}
                aria-label="Переключить тему"
                title="Тема (T)"
            >
                <span>🌓</span>
            </button>
        </div>
    );
};

export default QuickActions;
