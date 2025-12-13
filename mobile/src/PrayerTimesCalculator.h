#ifndef PRAYERTIMESCALCULATOR_H
#define PRAYERTIMESCALCULATOR_H

#include <QDateTime>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QObject>
#include <QVariantMap>

#include <cmath>

class PrayerTimesCalculator : public QObject {
    Q_OBJECT
    Q_PROPERTY(double latitude READ latitude WRITE setLatitude NOTIFY locationChanged)
    Q_PROPERTY(double longitude READ longitude WRITE setLongitude NOTIFY locationChanged)
    Q_PROPERTY(QString city READ city WRITE setCity NOTIFY cityChanged)
    Q_PROPERTY(QVariantMap prayerTimes READ prayerTimes NOTIFY prayerTimesChanged)
    Q_PROPERTY(
        QDate selectedDate READ selectedDate WRITE setSelectedDate NOTIFY selectedDateChanged)

   public:
    explicit PrayerTimesCalculator(QObject* parent = nullptr);

    double latitude() const { return m_latitude; }
    void setLatitude(double lat);

    double longitude() const { return m_longitude; }
    void setLongitude(double lon);

    QString city() const { return m_city; }
    void setCity(const QString& city);

    QVariantMap prayerTimes() const { return m_prayerTimes; }

    QDate selectedDate() const { return m_selectedDate; }
    void setSelectedDate(const QDate& date);

    Q_INVOKABLE void calculatePrayerTimes();
    Q_INVOKABLE void calculatePrayerTimesForDate(const QDate& date);
    Q_INVOKABLE void setLocation(double lat, double lon, const QString& cityName = "");
    Q_INVOKABLE QString getCurrentPrayer() const;
    Q_INVOKABLE QString getNextPrayer() const;
    Q_INVOKABLE void resetToToday();
    Q_INVOKABLE void setCalculationMethod(int method);

   signals:
    void locationChanged();
    void cityChanged();
    void prayerTimesChanged();
    void selectedDateChanged();

   private:
    struct Times {
        double fajr;
        double sunrise;
        double dhuhr;
        double asr;
        double maghrib;
        double isha;
    };

    Times computePrayerTimes(const QDateTime& date);
    double julianDate(int year, int month, int day);
    double equationOfTime(double jd);
    double sunDeclination(double jd);
    double computeMidDay(double t);
    double sunAngleTime(double angle, double noon, double decl, bool ccw);
    double asrTime(double factor, double noon, double decl);
    double computeTime(double g, double t);             // deprecated
    double computeAsrTime(double asrFactor, double t);  // deprecated

    double m_latitude = 55.7558;  // Москва по умолчанию
    double m_longitude = 37.6173;
    QString m_city = "Москва";
    QVariantMap m_prayerTimes;
    QDate m_selectedDate;
    int m_calculationMethod = 3;  // По умолчанию Makkah

    // Получить углы для выбранного метода
    void getMethodAngles(int method, double& fajrAngle, double& ishaAngle);

    // API методы
    void fetchPrayerTimesFromAPI(const QDate& date);
    void parseAPIResponse(QNetworkReply* reply);
    QString getMethodCode(int method);

    QNetworkAccessManager* m_networkManager;
    QDate m_pendingDate;
};

#endif  // PRAYERTIMESCALCULATOR_H
