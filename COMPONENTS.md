# Разделение компонентов проекта

## 📊 Структура проекта

Проект разделен на **3 независимые папки**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Jummah Prayer Project                    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  📱 mobile/  │      │  🔧 backend/ │      │  🌐 frontend/│
│  (Qt/QML)    │      │  (C++ HTTP)  │      │  (Web)       │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## 1️⃣ Мобильное приложение (mobile/)

**Директория:** `mobile/`

### Что относится:
- ✅ `mobile/src/` - C++ логика с Qt
- ✅ `mobile/qml/` - QML интерфейс
- ✅ `mobile/CMakeLists.txt` - сборка приложения
- ✅ `mobile/macos/` - настройки macOS
- ✅ `mobile/tests/` - тесты

### Зависимости:
- Qt 6 (Core, Gui, Qml, Quick, Positioning, Sensors, Network)

### Сборка:
```bash
make build    # Собрать
make run      # Запустить
```

### Платформы:
- Desktop (macOS, Windows, Linux)
- Android

---

## 2️⃣ C++ Backend (backend/)

**Директория:** `backend/`

### Что относится:
- ✅ `backend/src/server.cpp` - HTTP сервер
- ✅ `backend/src/PrayerTimesCalculator.*` - расчет (без Qt)
- ✅ `backend/CMakeLists.txt` - сборка бэкенда

### Зависимости:
- cpp-httplib (header-only, скачивается автоматически)
- C++17 стандартная библиотека

### Сборка:
```bash
make web-backend-build    # Собрать
make web-run              # Запустить
```

### Функции:
- HTTP сервер на порту 8080
- REST API (`/api/prayer-times`)
- Раздача статических файлов из `frontend/`

---

## 3️⃣ Frontend (frontend/)

**Директория:** `frontend/`

### Что относится:
- ✅ `frontend/index.html` - HTML структура
- ✅ `frontend/styles.css` - стили
- ✅ `frontend/app.js` - логика приложения
- ✅ `frontend/prayer-calculator.js` - работа с API
- ✅ `frontend/translations.js` - переводы
- ✅ `frontend/manifest.json` - PWA манифест

### Зависимости:
- Нет (только браузер)

### Сборка:
- Не требуется (просто HTML/CSS/JS)

### Функции:
- Интерфейс в браузере
- Обращается к C++ бэкенду через API
- PWA поддержка

---

## 🔄 Общая логика

### Что общее:
- **Алгоритм расчета времени молитв**
  - `mobile/src/PrayerTimesCalculator.*` - для мобильного приложения (с Qt)
  - `backend/src/PrayerTimesCalculator.*` - для веб-версии (без Qt)

- **Одинаковые методы расчета:**
  - MWL, ISNA, Egypt, Makkah, Karachi, Tehran

- **Одинаковые мазхабы:**
  - Shafi'i, Hanafi

### Различия:
| Аспект | Мобильное приложение | Веб-версия |
|--------|---------------------|------------|
| **Зависимости** | Qt 6 | Только стандартная библиотека |
| **Сеть** | QNetworkAccessManager | cpp-httplib |
| **Настройки** | QSettings | localStorage (в браузере) |
| **Геолокация** | Qt Positioning | Browser Geolocation API |

---

## 📁 Полная структура проекта

```
jummah-prayer/
│
├── 📱 mobile/              # МОБИЛЬНОЕ ПРИЛОЖЕНИЕ
│   ├── src/                # C++ логика (с Qt)
│   │   ├── main.cpp
│   │   ├── PrayerTimesCalculator.*
│   │   ├── LocationService.*
│   │   ├── AppSettings.*
│   │   └── NotificationService.*
│   ├── qml/                # QML интерфейс
│   │   ├── Main.qml
│   │   ├── MainPage.qml
│   │   ├── SettingsPage.qml
│   │   ├── DhikrPage.qml
│   │   └── components/
│   ├── CMakeLists.txt
│   ├── macos/Info.plist
│   └── tests/
│
├── 🔧 backend/            # C++ БЭКЕНД
│   ├── src/
│   │   ├── server.cpp      # HTTP сервер
│   │   └── PrayerTimesCalculator.*  # Логика (без Qt)
│   └── CMakeLists.txt      # Сборка бэкенда
│
├── 🌐 frontend/           # FRONTEND
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── prayer-calculator.js
│   ├── translations.js
│   └── manifest.json
│
├── 🔄 ОБЩЕЕ
│   ├── Makefile                # Команды для всех компонентов
│   ├── PROJECT_STRUCTURE.md     # Эта документация
│   └── README.md               # Главный README
│
└── 📝 ДОКУМЕНТАЦИЯ
    ├── BUILD.md                # Инструкции по сборке
    ├── roadmap.md              # План разработки
    └── COMPONENTS.md           # Этот файл
```

---

## 🎯 К какому компоненту что относится?

### Мобильное приложение:
- Все файлы в `mobile/`

### C++ Backend:
- Все файлы в `backend/`

### Frontend:
- Все файлы в `frontend/` (HTML, CSS, JS)

### Общее:
- `Makefile` - команды для всех компонентов
- Документация (README, BUILD.md, и т.д.)

---

## 🚀 Быстрый старт по компонентам

### Мобильное приложение:
```bash
make build && make run
```

### Веб-версия (все вместе):
```bash
make web-start
```

### Только бэкенд:
```bash
make web-backend-build
make web-run
```

---

**Ассаламу алейкум!** 🌙
