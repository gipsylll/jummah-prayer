import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { usePrayerTimes } from '../contexts/PrayerTimesContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { tr, setLanguage, getCurrentLanguage } from '../utils/translations';
import CitySearchModal from '../components/CitySearchModal';
import { citySearchService } from '../services/citySearchService';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { user, isAuthenticated, logout } = useAuth();
    const { city, latitude, longitude, calculationMethod, madhhab, setCalculationMethod, setMadhhab, setLocation, loadPrayerTimes } = usePrayerTimes();
    const { 
        notifications, 
        notificationWarningTime, 
        soundNotifications, 
        toggleNotifications, 
        setNotificationWarningTime, 
        setSoundNotifications, 
        testNotification 
    } = useNotifications();
    const {
        fontSize,
        highContrast,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        setHighContrast
    } = useAccessibility();
    const [language, setLang] = useState(getCurrentLanguage());
    const [isCityModalOpen, setIsCityModalOpen] = useState(false);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setLang(newLang);
        setLanguage(newLang);
        window.location.reload();
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleCitySelect = async (selectedCity) => {
        setLocation(selectedCity.lat, selectedCity.lon, selectedCity.name);
        await loadPrayerTimes();
    };

    const handleAutoDetect = async () => {
        if (!navigator.geolocation) {
            alert('Геолокация не поддерживается вашим браузером.');
            return;
        }

        setIsDetectingLocation(true);
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                try {
                    const cityData = await citySearchService.getNearestCity(lat, lon);
                    setLocation(lat, lon, cityData.name);
                    await loadPrayerTimes();
                    alert(`Местоположение определено: ${cityData.name}`);
                } catch (error) {
                    console.error('Ошибка получения названия города:', error);
                    setLocation(lat, lon, `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`);
                    await loadPrayerTimes();
                    alert('Местоположение определено по координатам');
                } finally {
                    setIsDetectingLocation(false);
                }
            },
            (error) => {
                console.error('Ошибка геолокации:', error);
                alert('Не удалось определить местоположение. Разрешите доступ к геолокации в настройках браузера.');
                setIsDetectingLocation(false);
            }
        );
    };

    const safeCity = city || 'Москва';
    const safeLatitude = latitude || 55.7558;
    const safeLongitude = longitude || 37.6173;
    const safeCalculationMethod = calculationMethod ?? 3;
    const safeMadhhab = madhhab ?? 0;

    return (
        <div className="page">
            <div className="page-header">
                <h1>{tr('Settings')}</h1>
            </div>
            <div className="settings-container">
                {/* Местоположение */}
                <div className="settings-section">
                    <h2>{tr('Location')}</h2>
                    <div className="current-location">
                        <div className="location-display">
                            <span className="location-icon">📍</span>
                            <div>
                                <div>{safeCity}</div>
                                <div className="location-coords">
                                    {safeLatitude.toFixed(2)}°N, {safeLongitude.toFixed(2)}°E
                                </div>
                            </div>
                        </div>
                        <div className="location-buttons">
                            <button 
                                className="btn btn-outline" 
                                onClick={() => setIsCityModalOpen(true)}
                            >
                                📍 Из списка
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleAutoDetect}
                                disabled={isDetectingLocation}
                            >
                                {isDetectingLocation ? '📡 Определение...' : '📡 Автоопределение'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Метод расчета */}
                <div className="settings-section">
                    <h2>{tr('Calculation Method')}</h2>
                    <select
                        className="select-input"
                        value={safeCalculationMethod}
                        onChange={(e) => setCalculationMethod(e.target.value)}
                    >
                        <option value="0">MWL - Muslim World League</option>
                        <option value="1">ISNA - Islamic Society</option>
                        <option value="2">Egypt - Egyptian Authority</option>
                        <option value="3">Makkah - Umm al-Qura</option>
                        <option value="4">Karachi - Islamic Sciences</option>
                        <option value="5">Tehran - Geophysics</option>
                    </select>
                </div>

                {/* Мазхаб */}
                <div className="settings-section">
                    <h2>Мазхаб (Аср)</h2>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="madhab"
                            value="0"
                            checked={safeMadhhab === 0}
                            onChange={(e) => setMadhhab(e.target.value)}
                        />
                        <span>Шафии, Малики, Ханбали (стандартный)</span>
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="madhab"
                            value="1"
                            checked={safeMadhhab === 1}
                            onChange={(e) => setMadhhab(e.target.value)}
                        />
                        <span>Ханафи (тень в 2 раза больше)</span>
                    </label>
                </div>

                {/* Интерфейс */}
                <div className="settings-section">
                    <h2>Интерфейс</h2>
                    <div className="setting-item">
                        <span>{tr('Dark Theme')}</span>
                        <label className="switch">
                            <input type="checkbox" checked={isDark} onChange={toggleTheme} />
                            <span className="slider"></span>
                        </label>
                    </div>
                    
                    <div className="setting-item">
                        <span>{tr('Notifications')}</span>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={notifications} 
                                onChange={(e) => toggleNotifications(e.target.checked)} 
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                    
                    {notifications && (
                        <>
                            <div className="setting-item" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ width: '100%' }}>
                                    <label htmlFor="notification-warning-time">
                                        ⏰ Время предупреждения (минуты):
                                    </label>
                                    <select
                                        id="notification-warning-time"
                                        className="select-input"
                                        style={{ marginTop: '8px', width: '100%' }}
                                        value={notificationWarningTime}
                                        onChange={(e) => setNotificationWarningTime(parseInt(e.target.value))}
                                    >
                                        <option value="5">5 минут</option>
                                        <option value="10">10 минут</option>
                                        <option value="15">15 минут</option>
                                        <option value="30">30 минут</option>
                                        <option value="60">1 час</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="setting-item">
                                <span>🔊 Звуковые уведомления</span>
                                <label className="switch">
                                    <input 
                                        type="checkbox" 
                                        checked={soundNotifications} 
                                        onChange={(e) => setSoundNotifications(e.target.checked)} 
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            
                            <div className="setting-item" style={{ width: '100%' }}>
                                <button 
                                    className="btn btn-outline" 
                                    onClick={testNotification}
                                    style={{ width: '100%' }}
                                >
                                    🔔 Тестовое уведомление
                                </button>
                            </div>
                        </>
                    )}
                    
                    <div className="setting-item">
                        <span>{tr('Interface Language')}</span>
                        <select className="select-input" value={language} onChange={handleLanguageChange}>
                            <option value="ru">🇷🇺 Русский</option>
                            <option value="en">🇬🇧 English</option>
                            <option value="ar">🇸🇦 العربية</option>
                        </select>
                    </div>
                </div>

                {/* Доступность */}
                <div className="settings-section">
                    <h2>Доступность</h2>
                    <div className="setting-item">
                        <span>🔤 Размер шрифта: {fontSize}px</span>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button className="btn btn-outline" onClick={decreaseFontSize}>-</button>
                            <button className="btn btn-outline" onClick={resetFontSize}>Сброс</button>
                            <button className="btn btn-outline" onClick={increaseFontSize}>+</button>
                        </div>
                    </div>
                    <div className="setting-item">
                        <span>🎨 Высокий контраст</span>
                        <label className="switch">
                            <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} />
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>

                {/* Аккаунт */}
                <div className="settings-section">
                    <h2>{tr('Account')}</h2>
                    {isAuthenticated ? (
                        <>
                            <button
                                className="btn btn-outline"
                                style={{ width: '100%' }}
                                onClick={() => navigate('/profile')}
                            >
                                {tr('Profile')}
                            </button>
                            <button
                                className="btn btn-outline"
                                style={{ width: '100%', marginTop: '8px' }}
                                onClick={handleLogout}
                            >
                                {tr('Logout')}
                            </button>
                            {user && (user.name || user.email) && (
                                <div style={{ marginTop: '8px', textAlign: 'center', color: 'var(--textColor)', fontSize: '14px' }}>
                                    {user.name || user.email}
                                </div>
                            )}
                        </>
                    ) : (
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={() => navigate('/login')}
                        >
                            {tr('Login')}
                        </button>
                    )}
                </div>

                {/* О приложении */}
                <div className="settings-section">
                    <h2>{tr('About')}</h2>
                    <p>Jummah Prayer v1.0.0</p>
                    <p className="about-text">
                        Приложение для расчета точного времени намаза в любой точке мира.
                    </p>
                </div>
            </div>

            <CitySearchModal
                isOpen={isCityModalOpen}
                onClose={() => setIsCityModalOpen(false)}
                onSelectCity={handleCitySelect}
            />
        </div>
    );
};

export default SettingsPage;
