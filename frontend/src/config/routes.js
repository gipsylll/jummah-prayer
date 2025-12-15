// Конфигурация маршрутов приложения
// Централизованное управление путями для поддержки разных базовых путей

const BASE_PATH = import.meta.env.VITE_BASE_PATH || '';

export const routes = {
    home: BASE_PATH + '/',
    settings: BASE_PATH + '/settings',
    profile: BASE_PATH + '/profile',
    login: BASE_PATH + '/login',
    register: BASE_PATH + '/register',
    dhikr: BASE_PATH + '/dhikr',
    events: BASE_PATH + '/events',
    articles: BASE_PATH + '/articles'
};

// Функция для создания пути с учетом базового пути
export const createPath = (path) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return BASE_PATH + cleanPath;
};

// Функция для получения пути без базового пути (для React Router)
export const getRoutePath = (path) => {
    if (BASE_PATH && path.startsWith(BASE_PATH)) {
        return path.slice(BASE_PATH.length) || '/';
    }
    return path;
};


