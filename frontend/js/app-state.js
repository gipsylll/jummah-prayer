// Состояние приложения и данные
const prayerCalc = new PrayerTimesCalculator();

// Данные зикров
const dhikrData = [
    {
        title: "Субханаллах",
        arabic: "سُبْحَانَ ٱللَّٰهِ",
        transliteration: "Subḥānallāh",
        translation: "Слава Аллаху",
        goal: 33
    },
    {
        title: "Альхамдулиллях",
        arabic: "ٱلْحَمْدُ لِلَّٰهِ",
        transliteration: "Alḥamdulillāh",
        translation: "Хвала Аллаху",
        goal: 33
    },
    {
        title: "Аллаху Акбар",
        arabic: "ٱللَّٰهُ أَكْبَرُ",
        transliteration: "Allāhu akbar",
        translation: "Аллах велик",
        goal: 34
    },
    {
        title: "Ля иляха илляллах",
        arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ",
        transliteration: "Lā ilāha illallāh",
        translation: "Нет божества, кроме Аллаха",
        goal: 100
    },
    {
        title: "Астагфируллах",
        arabic: "أَسْتَغْفِرُ ٱللَّٰهَ",
        transliteration: "Astaghfirullāh",
        translation: "Прошу прощения у Аллаха",
        goal: 100
    },
    {
        title: "Дуа перед едой",
        arabic: "بِسْمِ ٱللَّٰهِ",
        transliteration: "Bismillāh",
        translation: "Во имя Аллаха",
        goal: 1
    },
    {
        title: "Дуа после еды",
        arabic: "ٱلْحَمْدُ لِلَّٰهِ ٱلَّذِي أَطْعَمَنَا وَسَقَانَا",
        transliteration: "Alḥamdulillāhil-ladhī aṭ'amanā wa-saqānā",
        translation: "Хвала Аллаху, Который накормил нас и напоил нас",
        goal: 1
    },
    {
        title: "Дуа перед сном",
        arabic: "بِٱسْمِكَ ٱللَّٰهُمَّ أَمُوتُ وَأَحْيَا",
        transliteration: "Bismika Allāhumma amūtu wa-aḥyā",
        translation: "Именем Твоим, о Аллах, умираю и оживаю",
        goal: 1
    }
];

// Состояние приложения
const appState = {
    currentPage: 'main-page',
    darkTheme: localStorage.getItem('darkTheme') === 'true',
    notifications: localStorage.getItem('notifications') === 'true',
    language: localStorage.getItem('language') || 'ru',
    dhikrCount: 0,
    dhikrGoal: 33,
    currentDhikr: null,
    dhikrCounts: {}, // Храним счетчики для каждого зикра
    notificationWarningTime: parseInt(localStorage.getItem('notificationWarningTime')) || 15, // Время предупреждения в минутах
    soundNotifications: localStorage.getItem('soundNotifications') === 'true' // Звуковые уведомления
};

