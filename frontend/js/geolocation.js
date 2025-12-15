// Геолокация

// Инициализация геолокации
function initGeolocation() {
    const autoDetectBtn = document.getElementById('auto-detect-btn');
    
    if (autoDetectBtn) {
        autoDetectBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        
                        // Получаем название города через бэкенд API (Nominatim)
                        try {
                            const apiUrl = window.location.origin;
                            const response = await fetch(`${apiUrl}/api/cities/nearest?lat=${lat}&lon=${lon}`);
                            const data = await response.json();
                            
                            if (data.success && data.data) {
                                // Nominatim возвращает объект с address
                                const address = data.data.address || {};
                                const cityName = address.city || 
                                               address.town || 
                                               address.village || 
                                               address.municipality ||
                                               data.data.display_name?.split(',')[0] || 
                                               `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
                                
                                prayerCalc.setLocation(lat, lon, cityName);
                                await loadPrayerTimes();
                                updateSettingsLocation();
                                alert(`Местоположение определено: ${cityName}`);
                            } else {
                                throw new Error('City not found');
                            }
                        } catch (error) {
                            console.error('Ошибка получения названия города:', error);
                            // Используем координаты напрямую
                            prayerCalc.setLocation(lat, lon, `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`);
                            await loadPrayerTimes();
                            updateSettingsLocation();
                            alert(`Местоположение определено по координатам`);
                        }
                    },
                    (error) => {
                        console.error('Ошибка геолокации:', error);
                        alert('Не удалось определить местоположение. Разрешите доступ к геолокации в настройках браузера.');
                    }
                );
            } else {
                alert('Геолокация не поддерживается вашим браузером.');
            }
        });
    }
}




