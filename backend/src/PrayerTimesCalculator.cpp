#include "PrayerTimesCalculator.h"
#include <iomanip>
#include <sstream>
#include <algorithm>

PrayerTimesCalculator::PrayerTimesCalculator() {
    // Устанавливаем текущую дату
    std::time_t t = std::time(nullptr);
    std::tm* now = std::localtime(&t);
    m_year = now->tm_year + 1900;
    m_month = now->tm_mon + 1;
    m_day = now->tm_mday;
}

void PrayerTimesCalculator::setLocation(double lat, double lon, const std::string& cityName) {
    m_latitude = lat;
    m_longitude = lon;
    if (!cityName.empty()) {
        m_city = cityName;
    }
}

void PrayerTimesCalculator::setCalculationMethod(int method) {
    m_calculationMethod = method;
}

void PrayerTimesCalculator::setMadhhab(int madhhab) {
    m_madhhab = madhhab;
}

void PrayerTimesCalculator::setDate(int year, int month, int day) {
    m_year = year;
    m_month = month;
    m_day = day;
}

std::map<std::string, std::string> PrayerTimesCalculator::calculatePrayerTimes() {
    Times times = computePrayerTimes(m_year, m_month, m_day);
    
    m_prayerTimes.clear();
    m_prayerTimes["fajr"] = formatTime(times.fajr);
    m_prayerTimes["sunrise"] = formatTime(times.sunrise);
    m_prayerTimes["dhuhr"] = formatTime(times.dhuhr);
    m_prayerTimes["asr"] = formatTime(times.asr);
    m_prayerTimes["maghrib"] = formatTime(times.maghrib);
    m_prayerTimes["isha"] = formatTime(times.isha);
    
    // Форматируем дату
    std::ostringstream dateStream;
    dateStream << std::setfill('0') << std::setw(2) << m_day << "."
               << std::setw(2) << m_month << "."
               << m_year;
    m_prayerTimes["date"] = dateStream.str();
    
    return m_prayerTimes;
}

PrayerTimesCalculator::Times PrayerTimesCalculator::computePrayerTimes(int year, int month, int day) {
    Times times;
    
    // Получаем часовой пояс правильно
    std::time_t t = std::time(nullptr);
    std::tm* local = std::localtime(&t);
    std::tm* utc = std::gmtime(&t);
    
    // Вычисляем смещение в часах (более точный метод)
    int timezone = local->tm_hour - utc->tm_hour;
    if (local->tm_mday != utc->tm_mday) {
        if (local->tm_mday < utc->tm_mday) {
            timezone -= 24;
        } else {
            timezone += 24;
        }
    }
    
    // Юлианская дата
    double jdate = julianDate(year, month, day);
    // Корректируем на долготу для местного солнечного времени
    jdate = jdate - m_longitude / (15.0 * 24.0);
    
    // Склонение солнца и уравнение времени
    double decl = sunDeclination(jdate + 0.5);
    double noon = computeMidDay(jdate + 0.5);
    
    // Получаем углы для текущего метода расчёта
    double fajrAngle, ishaAngle;
    getMethodAngles(m_calculationMethod, fajrAngle, ishaAngle);
    
    // Вычисление времен (все времена в местном солнечном времени)
    times.fajr = sunAngleTime(fajrAngle, noon, decl, true);
    times.sunrise = sunAngleTime(0.833, noon, decl, true);
    // Dhuhr - это полдень, долгота уже учтена в noon через jdate
    times.dhuhr = noon;
    
    // Asr зависит от мазхаба
    double asrFactor = (m_madhhab == 1) ? 2.0 : 1.0;  // Hanafi = 2, Shafi'i = 1
    times.asr = asrTime(asrFactor, noon, decl);
    times.maghrib = sunAngleTime(0.833, noon, decl, false);
    times.isha = sunAngleTime(ishaAngle, noon, decl, false);
    
    // Добавляем часовой пояс ко всем временам (переводим в местное стандартное время)
    times.fajr += timezone;
    times.sunrise += timezone;
    times.dhuhr += timezone;
    times.asr += timezone;
    times.maghrib += timezone;
    times.isha += timezone;
    
    // Для метода Makkah (3) - Иша рассчитывается как Магриб + 90 минут
    if (m_calculationMethod == 3) {
        times.isha = times.maghrib + 1.5;  // 90 минут = 1.5 часа
    }
    
    // Нормализация (0-24 часа)
    times.fajr = fixhour(times.fajr);
    times.sunrise = fixhour(times.sunrise);
    times.dhuhr = fixhour(times.dhuhr);
    times.asr = fixhour(times.asr);
    times.maghrib = fixhour(times.maghrib);
    times.isha = fixhour(times.isha);
    
    return times;
}

double PrayerTimesCalculator::julianDate(int year, int month, int day) {
    if (month <= 2) {
        year -= 1;
        month += 12;
    }
    
    double A = floor(year / 100.0);
    double B = 2 - A + floor(A / 4.0);
    
    return floor(365.25 * (year + 4716)) + floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

double PrayerTimesCalculator::sunDeclination(double jd) {
    double T = (jd - 2451545.0) / 36525.0;
    double e = 23.43929 - 0.0130125 * T;
    
    double L = 280.466 + 36000.770 * T;
    double G = 357.528 + 35999.050 * T;
    
    double lambda = L + 1.915 * dsin(G) + 0.020 * dsin(2 * G);
    
    return darcsin(dsin(e) * dsin(lambda));
}

double PrayerTimesCalculator::equationOfTime(double jd) {
    double T = (jd - 2451545.0) / 36525.0;
    double L0 = 280.466 + 36000.770 * T;
    double L = fixangle(L0);
    double G = 357.528 + 35999.050 * T;
    double e = 23.43929 - 0.0130125 * T;
    
    double lambda = L + 1.915 * dsin(G) + 0.020 * dsin(2 * G);
    double RA = darctan2(dcos(e) * dsin(lambda), dcos(lambda)) / 15.0;
    
    double Eq = (L0 / 15.0) - fixhour(RA);
    
    return Eq;
}

double PrayerTimesCalculator::computeMidDay(double jd) {
    double T = equationOfTime(jd);
    return fixhour(12 - T);
}

double PrayerTimesCalculator::sunAngleTime(double angle, double noon, double decl, bool ccw) {
    double V = darccos((-dsin(angle) - dsin(decl) * dsin(m_latitude)) / 
                       (dcos(decl) * dcos(m_latitude))) / 15.0;
    
    return noon + (ccw ? -V : V);
}

double PrayerTimesCalculator::asrTime(double factor, double noon, double decl) {
    double angle = -darctan(1.0 / (factor + dtan(std::abs(m_latitude - decl))));
    return sunAngleTime(angle, noon, decl, false);
}

void PrayerTimesCalculator::getMethodAngles(int method, double& fajrAngle, double& ishaAngle) {
    switch (method) {
        case 0:  // MWL - Muslim World League
            fajrAngle = 18.0;
            ishaAngle = 17.0;
            break;
        case 1:  // ISNA - Islamic Society of North America
            fajrAngle = 15.0;
            ishaAngle = 15.0;
            break;
        case 2:  // Egypt - Egyptian General Authority of Survey
            fajrAngle = 19.5;
            ishaAngle = 17.5;
            break;
        case 3:  // Makkah - Umm al-Qura University
            fajrAngle = 18.5;
            ishaAngle = 90.0;  // фиксированное время 90 минут после магриб
            break;
        case 4:  // Karachi - University of Islamic Sciences
            fajrAngle = 18.0;
            ishaAngle = 18.0;
            break;
        case 5:  // Tehran - Institute of Geophysics
            fajrAngle = 17.7;
            ishaAngle = 14.0;
            break;
        default:
            fajrAngle = 18.0;
            ishaAngle = 18.0;
            break;
    }
}

std::string PrayerTimesCalculator::formatTime(double hours) const {
    int h = static_cast<int>(hours);
    int m = static_cast<int>((hours - h) * 60);
    
    std::ostringstream stream;
    stream << std::setfill('0') << std::setw(2) << h << ":"
           << std::setw(2) << m;
    return stream.str();
}

std::string PrayerTimesCalculator::getCurrentPrayer() const {
    if (m_prayerTimes.empty()) {
        return "Isha";
    }
    
    // Получаем текущее время
    std::time_t t = std::time(nullptr);
    std::tm* now = std::localtime(&t);
    std::ostringstream currentTime;
    currentTime << std::setfill('0') << std::setw(2) << now->tm_hour << ":"
                << std::setw(2) << now->tm_min;
    std::string currentTimeStr = currentTime.str();
    
    std::vector<std::pair<std::string, std::string>> prayers = {
        {"isha", "Isha"},
        {"maghrib", "Maghrib"},
        {"asr", "Asr"},
        {"dhuhr", "Dhuhr"},
        {"sunrise", "Sunrise"},
        {"fajr", "Fajr"}
    };
    
    for (auto it = prayers.rbegin(); it != prayers.rend(); ++it) {
        if (currentTimeStr >= m_prayerTimes.at(it->first)) {
            return it->second;
        }
    }
    
    return "Isha";
}

std::string PrayerTimesCalculator::getNextPrayer() const {
    if (m_prayerTimes.empty()) {
        return "Fajr";
    }
    
    // Получаем текущее время
    std::time_t t = std::time(nullptr);
    std::tm* now = std::localtime(&t);
    std::ostringstream currentTime;
    currentTime << std::setfill('0') << std::setw(2) << now->tm_hour << ":"
                << std::setw(2) << now->tm_min;
    std::string currentTimeStr = currentTime.str();
    
    std::vector<std::pair<std::string, std::string>> prayers = {
        {"fajr", "Fajr"},
        {"sunrise", "Sunrise"},
        {"dhuhr", "Dhuhr"},
        {"asr", "Asr"},
        {"maghrib", "Maghrib"},
        {"isha", "Isha"}
    };
    
    for (const auto& prayer : prayers) {
        if (currentTimeStr < m_prayerTimes.at(prayer.first)) {
            return prayer.second;
        }
    }
    
    return "Fajr";
}

