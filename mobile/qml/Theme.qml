pragma Singleton
import QtQuick

QtObject {
    id: theme
    
    property bool darkMode: false
    
    // Основные цвета с улучшенной контрастностью
    readonly property color primaryColor: darkMode ? "#4CAF50" : "#2E7D32"
    readonly property color primaryLight: darkMode ? "#81C784" : "#66BB6A"
    readonly property color primaryDark: darkMode ? "#2E7D32" : "#1B5E20"
    
    readonly property color accentColor: darkMode ? "#FF9800" : "#FF6F00"
    readonly property color accentLight: darkMode ? "#FFB74D" : "#FFA726"
    
    readonly property color backgroundColor: darkMode ? "#121212" : "#F5F5F5"
    readonly property color surfaceColor: darkMode ? "#1E1E1E" : "#FFFFFF"
    readonly property color cardColor: darkMode ? "#2C2C2C" : "#FFFFFF"
    
    readonly property color textColor: darkMode ? "#FFFFFF" : "#212121"
    readonly property color secondaryTextColor: darkMode ? "#B0B0B0" : "#757575"
    readonly property color disabledTextColor: darkMode ? "#666666" : "#BDBDBD"
    
    readonly property color borderColor: darkMode ? "#424242" : "#E0E0E0"
    readonly property color dividerColor: darkMode ? "#303030" : "#EEEEEE"
    
    // Специальные цвета
    readonly property color successColor: darkMode ? "#66BB6A" : "#4CAF50"
    readonly property color warningColor: darkMode ? "#FFB74D" : "#FF9800"
    readonly property color errorColor: darkMode ? "#EF5350" : "#F44336"
    readonly property color infoColor: darkMode ? "#64B5F6" : "#2196F3"
    
    // Цвета для карточек намазов
    readonly property color fajrColor: "#9C27B0"
    readonly property color sunriseColor: "#FF9800"
    readonly property color dhuhrColor: "#2196F3"
    readonly property color asrColor: "#4CAF50"
    readonly property color maghribColor: "#FF5722"
    readonly property color ishaColor: "#3F51B5"
    
    // Исламские акцентные цвета
    readonly property color goldAccent: "#FFD700"
    readonly property color islamicGreen: "#009688"
    readonly property color islamicTeal: "#00BCD4"
    
    // Градиенты для основных цветов
    readonly property var primaryGradient: darkMode 
        ? ["#4CAF50", "#66BB6A"]
        : ["#2E7D32", "#4CAF50"]
    
    readonly property var accentGradient: darkMode
        ? ["#FF9800", "#FFB74D"]
        : ["#FF6F00", "#FF9800"]
    
    // Градиенты для разных времен суток намазов
    readonly property var fajrGradient: darkMode
        ? ["#667eea", "#764ba2"]
        : ["#5e72e4", "#825ee4"]
    
    readonly property var sunriseGradient: darkMode
        ? ["#f093fb", "#f5576c"]
        : ["#fa709a", "#fee140"]
    
    readonly property var dhuhrGradient: darkMode
        ? ["#4facfe", "#00f2fe"]
        : ["#4facfe", "#00f2fe"]
    
    readonly property var asrGradient: darkMode
        ? ["#43e97b", "#38f9d7"]
        : ["#56ab2f", "#a8e063"]
    
    readonly property var maghribGradient: darkMode
        ? ["#fa709a", "#fee140"]
        : ["#ff9966", "#ff5e62"]
    
    readonly property var ishaGradient: darkMode
        ? ["#30cfd0", "#330867"]
        : ["#434343", "#000000"]
    
    // Размеры
    readonly property int radiusSmall: 8
    readonly property int radiusMedium: 12
    readonly property int radiusLarge: 16
    readonly property int radiusXLarge: 24
    
    // Отступы
    readonly property int paddingSmall: 8
    readonly property int paddingMedium: 16
    readonly property int paddingLarge: 24
    
    // Анимация
    readonly property int animationFast: 150
    readonly property int animationNormal: 250
    readonly property int animationSlow: 400
    
    // Тени (улучшенные)
    readonly property color shadowColor: Qt.rgba(0, 0, 0, darkMode ? 0.4 : 0.08)
    readonly property color shadowColorLight: Qt.rgba(0, 0, 0, darkMode ? 0.2 : 0.04)
    readonly property int shadowRadius: 8
    readonly property int shadowBlur: 16
    readonly property int shadowOffset: 2
    
    // Функция для получения градиента по имени намаза
    function getPrayerGradient(prayerName) {
        switch(prayerName) {
            case "Fajr": return fajrGradient
            case "Sunrise": return sunriseGradient
            case "Dhuhr": return dhuhrGradient
            case "Asr": return asrGradient
            case "Maghrib": return maghribGradient
            case "Isha": return ishaGradient
            default: return primaryGradient
        }
    }
    
    // Функция для получения цвета намаза
    function getPrayerColor(prayerName) {
        switch(prayerName) {
            case "Fajr": return fajrColor
            case "Sunrise": return sunriseColor
            case "Dhuhr": return dhuhrColor
            case "Asr": return asrColor
            case "Maghrib": return maghribColor
            case "Isha": return ishaColor
            default: return primaryColor
        }
    }
}

