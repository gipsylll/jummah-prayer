import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationsContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationsContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationsProvider');
    }
    return context;
};

export const NotificationsProvider = ({ children }) => {
    const [notifications, setNotifications] = useState(() => {
        return localStorage.getItem('notifications') === 'true';
    });
    const [notificationWarningTime, setNotificationWarningTime] = useState(() => {
        return parseInt(localStorage.getItem('notificationWarningTime')) || 15;
    });
    const [soundNotifications, setSoundNotifications] = useState(() => {
        return localStorage.getItem('soundNotifications') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('notifications', notifications);
    }, [notifications]);

    useEffect(() => {
        localStorage.setItem('notificationWarningTime', notificationWarningTime.toString());
    }, [notificationWarningTime]);

    useEffect(() => {
        localStorage.setItem('soundNotifications', soundNotifications.toString());
    }, [soundNotifications]);

    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            return false;
        }
        
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        
        return Notification.permission === 'granted';
    }, []);

    const testNotification = useCallback(async () => {
        if (!('Notification' in window)) {
            alert('Ваш браузер не поддерживает уведомления');
            return;
        }
        
        if (Notification.permission === 'denied') {
            alert('Уведомления заблокированы. Разрешите уведомления в настройках браузера.');
            return;
        }
        
        if (Notification.permission === 'default') {
            const granted = await requestPermission();
            if (!granted) {
                alert('Разрешение на уведомления не предоставлено');
                return;
            }
        }
        
        const title = 'Тестовое уведомление';
        const body = 'Это тестовое уведомление. Если вы видите это сообщение, уведомления работают правильно!';
        
        if (soundNotifications) {
            playNotificationSound();
        }
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    body: body,
                    icon: '/icon-192.png',
                    badge: '/icon-32x32.png',
                    tag: 'test-notification',
                    requireInteraction: false,
                    vibrate: [200, 100, 200]
                });
            });
        } else {
            new Notification(title, {
                body: body,
                icon: '/icon-192.png'
            });
        }
    }, [soundNotifications, requestPermission]);

    const playNotificationSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            
            setTimeout(() => {
                const oscillator2 = audioContext.createOscillator();
                const gainNode2 = audioContext.createGain();
                
                oscillator2.connect(gainNode2);
                gainNode2.connect(audioContext.destination);
                
                oscillator2.frequency.value = 1000;
                oscillator2.type = 'sine';
                
                gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator2.start(audioContext.currentTime);
                oscillator2.stop(audioContext.currentTime + 0.5);
            }, 200);
        } catch (error) {
            console.error('Ошибка воспроизведения звука:', error);
        }
    };

    const toggleNotifications = useCallback(async (enabled) => {
        setNotifications(enabled);
        
        if (enabled) {
            if ('Notification' in window && Notification.permission === 'default') {
                await requestPermission();
            }
        }
    }, [requestPermission]);

    const announceToScreenReader = (message) => {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    };

    return (
        <NotificationsContext.Provider value={{
            notifications,
            notificationWarningTime,
            soundNotifications,
            toggleNotifications,
            setNotificationWarningTime,
            setSoundNotifications,
            testNotification,
            requestPermission,
            announceToScreenReader
        }}>
            {children}
        </NotificationsContext.Provider>
    );
};


