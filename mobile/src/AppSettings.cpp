#include "AppSettings.h"

#include <QDebug>

AppSettings::AppSettings(QObject* parent)
    : QObject(parent), m_settings("JummahPrayer", "Settings") {
    loadSettings();
}

void AppSettings::loadSettings() {
    m_darkTheme = m_settings.value("darkTheme", false).toBool();
    m_notifications = m_settings.value("notifications", true).toBool();
    m_calculationMethod = m_settings.value("calculationMethod", 3).toInt();  // Makkah по умолчанию
    m_madhhab = m_settings.value("madhhab", 0).toInt();
    m_language = m_settings.value("language", "ru").toString();
    m_savedLatitude = m_settings.value("latitude", 55.7558).toDouble();  // Москва по умолчанию
    m_savedLongitude = m_settings.value("longitude", 37.6173).toDouble();
    m_savedCity = m_settings.value("city", "Москва").toString();

    qDebug() << "Настройки загружены:";
    qDebug() << "  Темная тема:" << m_darkTheme;
    qDebug() << "  Уведомления:" << m_notifications;
    qDebug() << "  Метод расчета:" << calculationMethodName();
    qDebug() << "  Мазхаб:" << (m_madhhab == 0 ? "Шафии" : "Ханафи");
    qDebug() << "  Язык:" << m_language;
    qDebug() << "  Локация:" << m_savedCity << "(" << m_savedLatitude << "," << m_savedLongitude
             << ")";
}

void AppSettings::saveSettings() {
    m_settings.setValue("darkTheme", m_darkTheme);
    m_settings.setValue("notifications", m_notifications);
    m_settings.setValue("calculationMethod", m_calculationMethod);
    m_settings.setValue("madhhab", m_madhhab);
    m_settings.setValue("language", m_language);
    m_settings.setValue("latitude", m_savedLatitude);
    m_settings.setValue("longitude", m_savedLongitude);
    m_settings.setValue("city", m_savedCity);
    m_settings.sync();

    qDebug() << "Настройки сохранены";
}

void AppSettings::setDarkTheme(bool value) {
    if (m_darkTheme == value)
        return;

    m_darkTheme = value;
    saveSettings();
    emit darkThemeChanged();

    qDebug() << "Темная тема:" << (value ? "ВКЛ" : "ВЫКЛ");
}

void AppSettings::setNotifications(bool value) {
    if (m_notifications == value)
        return;

    m_notifications = value;
    saveSettings();
    emit notificationsChanged();

    qDebug() << "Уведомления:" << (value ? "ВКЛ" : "ВЫКЛ");
}

void AppSettings::setCalculationMethod(int method) {
    if (m_calculationMethod == method || method < 0 || method > 5)
        return;

    m_calculationMethod = method;
    saveSettings();
    emit calculationMethodChanged();

    qDebug() << "Метод расчета изменен на:" << calculationMethodName();
}

QString AppSettings::calculationMethodName() const {
    switch (m_calculationMethod) {
        case 0:
            return "MWL - Muslim World League";
        case 1:
            return "ISNA - Islamic Society";
        case 2:
            return "Egypt - Egyptian Authority";
        case 3:
            return "Makkah - Umm al-Qura";
        case 4:
            return "Karachi - Islamic Sciences";
        case 5:
            return "Tehran - Geophysics";
        default:
            return "Unknown";
    }
}

void AppSettings::setMadhhab(int value) {
    if (m_madhhab == value || value < 0 || value > 1)
        return;

    m_madhhab = value;
    saveSettings();
    emit madhhabChanged();

    qDebug() << "Мазхаб изменен на:" << (value == 0 ? "Шафии" : "Ханафи");
}

void AppSettings::setLanguage(const QString& lang) {
    if (m_language == lang)
        return;

    m_language = lang;
    saveSettings();
    emit languageChanged();

    qDebug() << "Язык изменен на:" << lang;
}

void AppSettings::setSavedLatitude(double lat) {
    if (qFuzzyCompare(m_savedLatitude, lat))
        return;
    m_savedLatitude = lat;
    saveSettings();
    emit savedLocationChanged();
}

void AppSettings::setSavedLongitude(double lon) {
    if (qFuzzyCompare(m_savedLongitude, lon))
        return;
    m_savedLongitude = lon;
    saveSettings();
    emit savedLocationChanged();
}

void AppSettings::setSavedCity(const QString& city) {
    if (m_savedCity == city)
        return;
    m_savedCity = city;
    saveSettings();
    emit savedLocationChanged();
}

void AppSettings::saveLocation(double lat, double lon, const QString& city) {
    bool changed = false;

    if (!qFuzzyCompare(m_savedLatitude, lat)) {
        m_savedLatitude = lat;
        changed = true;
    }
    if (!qFuzzyCompare(m_savedLongitude, lon)) {
        m_savedLongitude = lon;
        changed = true;
    }
    if (m_savedCity != city) {
        m_savedCity = city;
        changed = true;
    }

    if (changed) {
        saveSettings();
        emit savedLocationChanged();
        qDebug() << "Локация сохранена:" << city << "(" << lat << "," << lon << ")";
    }
}
