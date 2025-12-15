import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { usePrayerTimes } from '../contexts/PrayerTimesContext';

export const useKeyboardNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toggleTheme } = useTheme();
    const { loadPrayerTimes } = usePrayerTimes();

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Игнорируем если пользователь вводит текст
            if (e.target.tagName === 'INPUT' || 
                e.target.tagName === 'TEXTAREA' || 
                e.target.isContentEditable) {
                return;
            }

            // Alt + цифра для быстрого перехода к страницам
            if (e.altKey && !e.ctrlKey && !e.shiftKey) {
                const keyMap = {
                    '1': '/',
                    '2': '/dhikr',
                    '3': '/events',
                    '4': '/articles',
                    '5': '/settings'
                };
                
                if (keyMap[e.key]) {
                    e.preventDefault();
                    navigate(keyMap[e.key]);
                }
            }

            // Горячие клавиши для быстрых действий
            if (!e.altKey && !e.ctrlKey && !e.shiftKey) {
                switch (e.key.toLowerCase()) {
                    case 'r':
                        e.preventDefault();
                        loadPrayerTimes();
                        break;
                    case 't':
                        e.preventDefault();
                        toggleTheme();
                        break;
                    case 'l':
                        e.preventDefault();
                        navigate('/settings');
                        break;
                }
            }

            // Escape для закрытия модальных окон
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal.active');
                modals.forEach(modal => {
                    modal.classList.remove('active');
                });
            }

            // Tab для навигации по элементам
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        };

        // Убираем класс при использовании мыши
        const handleMouseDown = () => {
            document.body.classList.remove('keyboard-navigation');
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, [navigate, toggleTheme, loadPrayerTimes]);
};


