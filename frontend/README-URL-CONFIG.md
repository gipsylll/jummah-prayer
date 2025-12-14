# Конфигурация URL для множества пользователей

## Обзор

Приложение настроено для правильной работы с множеством пользователей и в разных окружениях (development, production).

## Конфигурация API

### Переменные окружения

Создайте файл `.env` в папке `frontend/`:

```env
# Базовый URL API (опционально)
# Если не указан, используется текущий origin
VITE_API_BASE_URL=https://api.example.com

# Базовый путь приложения (для деплоя в подпапку)
# Например, если приложение доступно по адресу https://example.com/app/
VITE_BASE_PATH=/app
```

### Автоматическое определение

Приложение автоматически определяет правильный URL API:

1. **Development (npm run dev)**:
   - Использует прокси Vite на порту 3000
   - Прокси перенаправляет `/api/*` на `http://localhost:8080`

2. **Production**:
   - Если указан `VITE_API_BASE_URL` - использует его
   - Иначе использует `window.location.origin` (бэкенд на том же домене)

## Использование

### API запросы

Все сервисы используют централизованную функцию `getApiUrl()`:

```javascript
import { getApiUrl } from '../config/api';

const response = await fetch(getApiUrl('/auth/login'), {
    // ...
});
```

### Маршруты

Используйте централизованные маршруты:

```javascript
import { routes } from '../config/routes';
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate(routes.profile);
```

## Примеры конфигурации

### Локальная разработка
```env
# .env не нужен, используется автоматическое определение
```

### Production на одном домене
```env
# .env не нужен, используется window.location.origin
```

### Production с отдельным API сервером
```env
VITE_API_BASE_URL=https://api.example.com
```

### Production в подпапке
```env
VITE_BASE_PATH=/app
VITE_API_BASE_URL=https://api.example.com
```

## Проверка конфигурации

В development режиме конфигурация выводится в консоль браузера:

```
API Configuration: {
  API_BASE_URL: "http://localhost:8080",
  currentOrigin: "http://localhost:3000",
  env: "development"
}
```
