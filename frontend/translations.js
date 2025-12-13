// Система переводов
const translations = {
    // Главная страница
    "Prayer Times": {
        "ru": "Время Намаза",
        "en": "Prayer Times",
        "ar": "أوقات الصلاة"
    },
    "Current": {
        "ru": "Прошедший",
        "en": "Past",
        "ar": "الحالي"
    },
    "Next": {
        "ru": "Следующий",
        "en": "Next",
        "ar": "التالي"
    },
    "Time Until": {
        "ru": "Осталось до",
        "en": "Time Until",
        "ar": "الوقت حتى"
    },
    "Qibla Direction": {
        "ru": "Направление Киблы",
        "en": "Qibla Direction",
        "ar": "اتجاه القبلة"
    },
    "Hijri Date": {
        "ru": "Дата Хиджры",
        "en": "Hijri Date",
        "ar": "التاريخ الهجري"
    },
    "Notifications": {
        "ru": "Уведомления",
        "en": "Notifications",
        "ar": "الإشعارات"
    },
    "Enabled": {
        "ru": "Включено",
        "en": "Enabled",
        "ar": "مفعل"
    },
    "Disabled": {
        "ru": "Отключено",
        "en": "Disabled",
        "ar": "معطل"
    },
    "Date:": {
        "ru": "Дата:",
        "en": "Date:",
        "ar": "التاريخ:"
    },
    "Select Date": {
        "ru": "Выбрать дату",
        "en": "Select Date",
        "ar": "اختر التاريخ"
    },
    "Fajr (Dawn) Full": {
        "ru": "Фаджр (Рассвет)",
        "en": "Fajr (Dawn)",
        "ar": "الفجر (الفجر)"
    },
    "Sunrise Full": {
        "ru": "Восход солнца",
        "en": "Sunrise",
        "ar": "الشروق"
    },
    "Dhuhr (Noon) Full": {
        "ru": "Зухр (Полдень)",
        "en": "Dhuhr (Noon)",
        "ar": "الظهر (الظهيرة)"
    },
    "Asr (Afternoon) Full": {
        "ru": "Аср (Послеполуденный)",
        "en": "Asr (Afternoon)",
        "ar": "العصر (بعد الظهر)"
    },
    "Maghrib (Sunset) Full": {
        "ru": "Магриб (Закат)",
        "en": "Maghrib (Sunset)",
        "ar": "المغرب (الغروب)"
    },
    "Isha (Night) Full": {
        "ru": "Иша (Ночь)",
        "en": "Isha (Night)",
        "ar": "العشاء (الليل)"
    },
    "Fajr": {
        "ru": "Фаджр",
        "en": "Fajr",
        "ar": "الفجر"
    },
    "Sunrise": {
        "ru": "Восход",
        "en": "Sunrise",
        "ar": "الشروق"
    },
    "Dhuhr": {
        "ru": "Зухр",
        "en": "Dhuhr",
        "ar": "الظهر"
    },
    "Asr": {
        "ru": "Аср",
        "en": "Asr",
        "ar": "العصر"
    },
    "Maghrib": {
        "ru": "Магриб",
        "en": "Maghrib",
        "ar": "المغرب"
    },
    "Isha": {
        "ru": "Иша",
        "en": "Isha",
        "ar": "العشاء"
    },
    // Навигация
    "Time": {
        "ru": "Время",
        "en": "Time",
        "ar": "الوقت"
    },
    "Dhikr": {
        "ru": "Зикры",
        "en": "Dhikr",
        "ar": "الأذكار"
    },
    "Settings": {
        "ru": "Настройки",
        "en": "Settings",
        "ar": "الإعدادات"
    },
    // Зикр
    "Dhikr and Duas": {
        "ru": "📿 Зикры и Дуа",
        "en": "📿 Dhikr and Duas",
        "ar": "📿 الأذكار والأدعية"
    },
    "Press": {
        "ru": "Нажать",
        "en": "Press",
        "ar": "اضغط"
    },
    "Reset": {
        "ru": "🔄 Сбросить",
        "en": "🔄 Reset",
        "ar": "🔄 إعادة تعيين"
    },
    "Goal:": {
        "ru": "Цель:",
        "en": "Goal:",
        "ar": "الهدف:"
    },
    "Counter instruction": {
        "ru": "Нажимайте кнопку \"Нажать\" для подсчёта. Счётчик обнулится при достижении цели.",
        "en": "Press the \"Press\" button to count. Counter resets when goal is reached.",
        "ar": "اضغط على زر \"اضغط\" للعد. يعيد العداد تعيين عند الوصول إلى الهدف."
    },
    "Prayer in 15 minutes": {
        "ru": "Молитва через 15 минут",
        "en": "Prayer in 15 minutes",
        "ar": "الصلاة بعد 15 دقيقة"
    },
    "Prayer in 5 minutes": {
        "ru": "Молитва через 5 минут",
        "en": "Prayer in 5 minutes",
        "ar": "الصلاة بعد 5 دقائق"
    },
    "Time for prayer": {
        "ru": "Время молитвы",
        "en": "Time for prayer",
        "ar": "وقت الصلاة"
    },
    // Настройки
    "Location": {
        "ru": "Местоположение",
        "en": "Location",
        "ar": "الموقع"
    },
    "From List": {
        "ru": "📍 Из списка",
        "en": "📍 From List",
        "ar": "📍 من القائمة"
    },
    "Auto-detect": {
        "ru": "📡 Автоопределение",
        "en": "📡 Auto-detect",
        "ar": "📡 تحديد تلقائي"
    },
    "Calculation Method": {
        "ru": "Метод расчета",
        "en": "Calculation Method",
        "ar": "طريقة الحساب"
    },
    "Madhab (Asr)": {
        "ru": "Мазхаб (Аср)",
        "en": "Madhab (Asr)",
        "ar": "المذهب (العصر)"
    },
    "Shafii, Maliki, Hanbali": {
        "ru": "Шафии, Малики, Ханбали (стандартный)",
        "en": "Shafi'i, Maliki, Hanbali (standard)",
        "ar": "الشافعي، المالكي، الحنبلي (قياسي)"
    },
    "Hanafi": {
        "ru": "Ханафи (тень в 2 раза больше)",
        "en": "Hanafi (shadow 2x longer)",
        "ar": "الحنفي (الظل ضعفين)"
    },
    "Interface": {
        "ru": "Интерфейс",
        "en": "Interface",
        "ar": "الواجهة"
    },
    "Dark Theme": {
        "ru": "🌙 Темная тема",
        "en": "🌙 Dark Theme",
        "ar": "🌙 الوضع الليلي"
    },
    "Interface Language": {
        "ru": "🌐 Язык интерфейса",
        "en": "🌐 Interface Language",
        "ar": "🌐 لغة الواجهة"
    },
    "About": {
        "ru": "О приложении",
        "en": "About",
        "ar": "حول"
    },
    "App description": {
        "ru": "Приложение для расчета точного времени намаза в любой точке мира.",
        "en": "Application for calculating precise prayer times anywhere in the world.",
        "ar": "تطبيق لحساب أوقات الصلاة الدقيقة في أي مكان في العالم."
    },
    // Календарь
    "Date Selection": {
        "ru": "Выбор даты",
        "en": "Date Selection",
        "ar": "اختيار التاريخ"
    },
    "Yesterday": {
        "ru": "⏮ Вчера",
        "en": "⏮ Yesterday",
        "ar": "⏮ أمس"
    },
    "Today": {
        "ru": "📅 Сегодня",
        "en": "📅 Today",
        "ar": "📅 اليوم"
    },
    "Tomorrow": {
        "ru": "Завтра ⏭",
        "en": "Tomorrow ⏭",
        "ar": "غداً ⏭"
    },
    "Close": {
        "ru": "✕ Закрыть",
        "en": "✕ Close",
        "ar": "✕ إغلاق"
    },
    // Поиск города
    "City Selection": {
        "ru": "Выбор города",
        "en": "City Selection",
        "ar": "اختيار المدينة"
    },
    "Search city...": {
        "ru": "Поиск города...",
        "en": "Search city...",
        "ar": "البحث عن مدينة..."
    },
    "Cancel": {
        "ru": "Отмена",
        "en": "Cancel",
        "ar": "إلغاء"
    },
    // Исламские события
    "Islamic Events": {
        "ru": "События",
        "en": "Events",
        "ar": "الأحداث"
    },
    "Ramadan Countdown": {
        "ru": "Отсчет до Рамадана",
        "en": "Ramadan Countdown",
        "ar": "العد التنازلي لرمضان"
    },
    "Current Events": {
        "ru": "Текущие события",
        "en": "Current Events",
        "ar": "الأحداث الحالية"
    },
    "Upcoming Events": {
        "ru": "Ближайшие события",
        "en": "Upcoming Events",
        "ar": "الأحداث القادمة"
    },
    "Fasting Calendar": {
        "ru": "Календарь поста",
        "en": "Fasting Calendar",
        "ar": "تقويم الصيام"
    },
    "Ramadan has started": {
        "ru": "Рамадан уже начался!",
        "en": "Ramadan has started!",
        "ar": "بدأ رمضان بالفعل!"
    },
    "days": {
        "ru": "дней",
        "en": "days",
        "ar": "أيام"
    },
    "No current events": {
        "ru": "Нет текущих событий",
        "en": "No current events",
        "ar": "لا توجد أحداث حالية"
    },
    "No upcoming events": {
        "ru": "Нет предстоящих событий",
        "en": "No upcoming events",
        "ar": "لا توجد أحداث قادمة"
    },
    "Ramadan - Day": {
        "ru": "Рамадан - День",
        "en": "Ramadan - Day",
        "ar": "رمضان - اليوم"
    },
    "Fasting today": {
        "ru": "Сегодня пост",
        "en": "Fasting today",
        "ar": "صيام اليوم"
    },
    "Fasting not required": {
        "ru": "Пост не обязателен",
        "en": "Fasting not required",
        "ar": "الصيام غير مطلوب"
    },
    "Ramadan starts on": {
        "ru": "Рамадан начнется",
        "en": "Ramadan starts on",
        "ar": "يبدأ رمضان في"
    },
    "Suhur (before dawn)": {
        "ru": "Сухур (до рассвета)",
        "en": "Suhur (before dawn)",
        "ar": "السحور (قبل الفجر)"
    },
    "Iftar (after sunset)": {
        "ru": "Ифтар (после заката)",
        "en": "Iftar (after sunset)",
        "ar": "الإفطار (بعد الغروب)"
    },
    "Days left": {
        "ru": "Через",
        "en": "Days left",
        "ar": "متبقي"
    },
    // Статьи
    "Educational Articles": {
        "ru": "Статьи",
        "en": "Articles",
        "ar": "المقالات"
    },
    // Дополнительные переводы
    "Select": {
        "ru": "Выбрать",
        "en": "Select",
        "ar": "اختر"
    },
    "Date": {
        "ru": "дату",
        "en": "date",
        "ar": "التاريخ"
    },
    "Distance to Makkah": {
        "ru": "Расстояние до Мекки",
        "en": "Distance to Makkah",
        "ar": "المسافة إلى مكة"
    },
    "Warning Time (minutes)": {
        "ru": "⏰ Время предупреждения (минуты):",
        "en": "⏰ Warning Time (minutes):",
        "ar": "⏰ وقت التحذير (بالدقائق):"
    },
    "Sound Notifications": {
        "ru": "🔊 Звуковые уведомления",
        "en": "🔊 Sound Notifications",
        "ar": "🔊 الإشعارات الصوتية"
    },
    "Test Notification": {
        "ru": "🔔 Тестовое уведомление",
        "en": "🔔 Test Notification",
        "ar": "🔔 إشعار تجريبي"
    },
    "Search": {
        "ru": "🔍 Поиск",
        "en": "🔍 Search",
        "ar": "🔍 بحث"
    },
    "Additional": {
        "ru": "Дополнительно",
        "en": "Additional",
        "ar": "إضافي"
    }
};

// Текущий язык
let currentLanguage = localStorage.getItem('language') || 'ru';

// Функция перевода
function tr(key) {
    if (translations[key] && translations[key][currentLanguage]) {
        return translations[key][currentLanguage];
    }
    return key;
}

// Установка языка
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updateTranslations();
}

// Обновление всех переводов на странице
function updateTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = tr(key);
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = tr(key);
    });
}

// Инициализация переводов при загрузке
document.addEventListener('DOMContentLoaded', () => {
    updateTranslations();
});

