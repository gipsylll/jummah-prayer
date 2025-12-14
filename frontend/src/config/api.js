// Конфигурация API
// Поддерживает разные окружения и правильное формирование URL

const getApiBaseUrl = () => {
    // В production используем переменную окружения или текущий origin
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    
    // В development используем прокси или localhost
    if (import.meta.env.DEV) {
        // Если фронтенд и бэкенд на одном домене (через прокси Vite)
        if (window.location.port === '3000' || window.location.port === '5173') {
            return window.location.origin; // Прокси Vite перенаправит на бэкенд
        }
        // Иначе используем localhost:8080
        return 'http://localhost:8080';
    }
    
    // Production: используем текущий origin (бэкенд на том же домене)
    // Или можно указать явно через переменную окружения
    return window.location.origin;
};

export const API_BASE_URL = getApiBaseUrl();

// Функция для формирования полного URL API
export const getApiUrl = (endpoint) => {
    // Убираем начальный слеш если есть
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // Если endpoint уже содержит полный URL, возвращаем как есть
    if (cleanEndpoint.startsWith('http://') || cleanEndpoint.startsWith('https://')) {
        return cleanEndpoint;
    }
    
    // Формируем полный URL
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const endpointPath = cleanEndpoint.startsWith('api/') ? cleanEndpoint : `api/${cleanEndpoint}`;
    
    return `${baseUrl}/${endpointPath}`;
};

// Логирование для отладки (только в development)
if (import.meta.env.DEV) {
    console.log('API Configuration:', {
        API_BASE_URL,
        currentOrigin: window.location.origin,
        env: import.meta.env.MODE
    });
}
