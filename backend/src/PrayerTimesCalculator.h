#ifndef PRAYERTIMESCALCULATOR_H
#define PRAYERTIMESCALCULATOR_H

#include <string>
#include <map>
#include <cmath>
#include <ctime>

class PrayerTimesCalculator {
public:
    PrayerTimesCalculator();
    
    void setLocation(double lat, double lon, const std::string& cityName = "");
    void setCalculationMethod(int method);
    void setMadhhab(int madhhab); // 0 = Shafi'i, 1 = Hanafi
    void setDate(int year, int month, int day);
    
    // Получить время молитв для текущей даты
    std::map<std::string, std::string> calculatePrayerTimes();
    
    // Получить текущую и следующую молитву
    std::string getCurrentPrayer() const;
    std::string getNextPrayer() const;
    
    // Геттеры
    double latitude() const { return m_latitude; }
    double longitude() const { return m_longitude; }
    std::string city() const { return m_city; }
    int calculationMethod() const { return m_calculationMethod; }
    int madhhab() const { return m_madhhab; }

private:
    struct Times {
        double fajr;
        double sunrise;
        double dhuhr;
        double asr;
        double maghrib;
        double isha;
    };
    
    Times computePrayerTimes(int year, int month, int day);
    
    // Математические функции
    double julianDate(int year, int month, int day);
    double equationOfTime(double jd);
    double sunDeclination(double jd);
    double computeMidDay(double jd);
    double sunAngleTime(double angle, double noon, double decl, bool ccw);
    double asrTime(double factor, double noon, double decl);
    
    // Вспомогательные функции
    double dsin(double d) const { return sin(d * PI / 180.0); }
    double dcos(double d) const { return cos(d * PI / 180.0); }
    double dtan(double d) const { return tan(d * PI / 180.0); }
    double darcsin(double x) const { return asin(x) * 180.0 / PI; }
    double darccos(double x) const { return acos(x) * 180.0 / PI; }
    double darctan(double x) const { return atan(x) * 180.0 / PI; }
    double darctan2(double y, double x) const { return atan2(y, x) * 180.0 / PI; }
    double fixangle(double a) const { return a - 360.0 * floor(a / 360.0); }
    double fixhour(double a) const { return a - 24.0 * floor(a / 24.0); }
    
    void getMethodAngles(int method, double& fajrAngle, double& ishaAngle);
    std::string formatTime(double hours) const;
    
    static constexpr double PI = 3.14159265358979323846;
    
    double m_latitude = 55.7558;  // Москва по умолчанию
    double m_longitude = 37.6173;
    std::string m_city = "Москва";
    int m_calculationMethod = 3;  // Makkah по умолчанию
    int m_madhhab = 0;  // Shafi'i по умолчанию
    
    // Текущая дата
    int m_year;
    int m_month;
    int m_day;
    
    // Кэш последних рассчитанных времен
    std::map<std::string, std::string> m_prayerTimes;
};

#endif  // PRAYERTIMESCALCULATOR_H

