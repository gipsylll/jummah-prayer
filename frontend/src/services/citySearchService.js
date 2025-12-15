import { getApiUrl } from '../config/api';

export const citySearchService = {
    async searchCities(query) {
        if (!query || query.length < 2) {
            return [];
        }

        try {
            const url = `${getApiUrl('/cities/search')}?q=${encodeURIComponent(query)}&limit=20`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                },
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            const data = await response.json();
            const cities = Array.isArray(data.data?.cities) ? data.data.cities : 
                          Array.isArray(data.cities) ? data.cities : [];

            return cities.map(city => {
                const address = city.address || {};
                const cityName = address.city || 
                               address.town || 
                               address.village || 
                               address.municipality ||
                               address.city_district ||
                               address.county ||
                               city.name || 
                               (city.display_name ? city.display_name.split(',')[0] : '') ||
                               'Неизвестно';
                
                const country = address.country || '';
                const region = address.state || 
                             address.region || 
                             address.province || '';
                
                let fullName = cityName;
                if (region && region !== cityName) {
                    fullName += ', ' + region;
                }
                if (country) {
                    fullName += ', ' + country;
                }
                
                const lat = parseFloat(city.lat);
                const lon = parseFloat(city.lon);
                
                if (isNaN(lat) || isNaN(lon)) {
                    return null;
                }
                
                return {
                    name: cityName,
                    fullName,
                    lat,
                    lon,
                    region,
                    country
                };
            }).filter(city => city !== null);
        } catch (error) {
            console.error('Ошибка поиска городов:', error);
            throw error;
        }
    },

    async getNearestCity(lat, lon) {
        try {
            const url = `${getApiUrl('/cities/nearest')}?lat=${lat}&lon=${lon}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success && data.data) {
                const address = data.data.address || {};
                const cityName = address.city || 
                               address.town || 
                               address.village || 
                               address.municipality ||
                               data.data.display_name?.split(',')[0] || 
                               `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
                
                return {
                    name: cityName,
                    lat,
                    lon
                };
            }
            throw new Error('City not found');
        } catch (error) {
            console.error('Ошибка получения города:', error);
            return {
                name: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
                lat,
                lon
            };
        }
    }
};


