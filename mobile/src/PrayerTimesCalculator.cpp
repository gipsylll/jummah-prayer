#include "PrayerTimesCalculator.h"

#include <QDebug>
#include <QJsonDocument>
#include <QJsonObject>
#include <QNetworkReply>
#include <QNetworkRequest>
#include <QTime>
#include <QTimeZone>
#include <QUrl>
#include <QUrlQuery>

#include <cmath>

const double PI = 3.14159265358979323846;

// Helper functions for trigonometry in degrees
inline double dsin(double d) {
    return sin(d * PI / 180.0);
}
inline double dcos(double d) {
    return cos(d * PI / 180.0);
}
inline double dtan(double d) {
    return tan(d * PI / 180.0);
}
inline double darcsin(double x) {
    return asin(x) * 180.0 / PI;
}
inline double darccos(double x) {
    return acos(x) * 180.0 / PI;
}
inline double darctan(double x) {
    return atan(x) * 180.0 / PI;
}
inline double darctan2(double y, double x) {
    return atan2(y, x) * 180.0 / PI;
}
inline double fixangle(double a) {
    return a - 360.0 * floor(a / 360.0);
}
inline double fixhour(double a) {
    return a - 24.0 * floor(a / 24.0);
}

PrayerTimesCalculator::PrayerTimesCalculator(QObject* parent)
    : QObject(parent), m_selectedDate(QDate::currentDate()) {
    m_networkManager = new QNetworkAccessManager(this);
    connect(m_networkManager, &QNetworkAccessManager::finished, this,
            &PrayerTimesCalculator::parseAPIResponse);
    calculatePrayerTimes();
}

void PrayerTimesCalculator::setLatitude(double lat) {
    if (qFuzzyCompare(m_latitude, lat))
        return;
    m_latitude = lat;
    emit locationChanged();
    calculatePrayerTimes();
}

void PrayerTimesCalculator::setLongitude(double lon) {
    if (qFuzzyCompare(m_longitude, lon))
        return;
    m_longitude = lon;
    emit locationChanged();
    calculatePrayerTimes();
}

void PrayerTimesCalculator::setCity(const QString& city) {
    if (m_city == city)
        return;
    m_city = city;
    emit cityChanged();
}

void PrayerTimesCalculator::setLocation(double lat, double lon, const QString& cityName) {
    qDebug() << "PrayerTimesCalculator: setLocation вызван с координатами:" << lat << lon
             << "город:" << cityName;

    bool changed = false;
    if (!qFuzzyCompare(m_latitude, lat)) {
        m_latitude = lat;
        emit locationChanged();
        changed = true;
    }
    if (!qFuzzyCompare(m_longitude, lon)) {
        m_longitude = lon;
        emit locationChanged();
        changed = true;
    }
    if (!cityName.isEmpty() && m_city != cityName) {
        m_city = cityName;
        emit cityChanged();
        changed = true;
    }

    if (changed) {
        calculatePrayerTimes();
    }
}

void PrayerTimesCalculator::setSelectedDate(const QDate& date) {
    if (m_selectedDate == date)
        return;

    m_selectedDate = date;
    emit selectedDateChanged();
    calculatePrayerTimesForDate(date);
}

void PrayerTimesCalculator::calculatePrayerTimesForDate(const QDate& date) {
    m_pendingDate = date;
    fetchPrayerTimesFromAPI(date);
}

void PrayerTimesCalculator::resetToToday() {
    setSelectedDate(QDate::currentDate());
}

void PrayerTimesCalculator::calculatePrayerTimes() {
    QDateTime now = QDateTime::currentDateTime();
    m_selectedDate = now.date();
    m_pendingDate = now.date();
    fetchPrayerTimesFromAPI(now.date());
}

PrayerTimesCalculator::Times PrayerTimesCalculator::computePrayerTimes(const QDateTime& date) {
    Times times;

    // Часовой пояс
    int timezone = date.offsetFromUtc() / 3600;

    // Юлианская дата
    double jdate = julianDate(date.date().year(), date.date().month(), date.date().day());
    jdate = jdate - m_longitude / (15.0 * 24.0);

    // Склонение солнца и уравнение времени
    double decl = sunDeclination(jdate + 0.5);
    double noon = computeMidDay(jdate + 0.5);

    // Получаем углы для текущего метода расчёта
    double fajrAngle, ishaAngle;
    getMethodAngles(m_calculationMethod, fajrAngle, ishaAngle);

    // Вычисление времен
    times.fajr = sunAngleTime(fajrAngle, noon, decl, true);
    times.sunrise = sunAngleTime(0.833, noon, decl, true);
    times.dhuhr = noon + timezone - m_longitude / 15.0;
    times.asr = asrTime(1, noon, decl);  // 1 = Shafi метод
    times.maghrib = sunAngleTime(0.833, noon, decl, false);

    times.isha = sunAngleTime(ishaAngle, noon, decl, false);

    // Добавляем часовой пояс
    times.fajr += timezone;
    times.sunrise += timezone;
    times.asr += timezone;
    times.maghrib += timezone;
    times.isha += timezone;

    // Для метода Makkah (3) - Иша рассчитывается как Магриб + 90 минут
    // Делаем это ПОСЛЕ добавления timezone
    if (m_calculationMethod == 3) {
        times.isha = times.maghrib + 1.5;  // 90 минут = 1.5 часа
        qDebug() << "Makkah метод: Иша = Магриб + 90 мин =" << times.isha;
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
    double V =
        darccos((-dsin(angle) - dsin(decl) * dsin(m_latitude)) / (dcos(decl) * dcos(m_latitude))) /
        15.0;

    return noon + (ccw ? -V : V);
}

double PrayerTimesCalculator::asrTime(double factor, double noon, double decl) {
    double angle = -darctan(1.0 / (factor + dtan(fabs(m_latitude - decl))));
    return sunAngleTime(angle, noon, decl, false);
}

double PrayerTimesCalculator::computeTime(double /*g*/, double /*t*/) {
    // Эта функция больше не используется
    return 0;
}

double PrayerTimesCalculator::computeAsrTime(double /*asrFactor*/, double /*t*/) {
    // Эта функция больше не используется
    return 0;
}

QString PrayerTimesCalculator::getCurrentPrayer() const {
    QTime now = QTime::currentTime();
    QString currentTimeStr = now.toString("HH:mm");

    QStringList prayers = {"fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"};
    QStringList prayerNames = {"Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"};

    for (int i = prayers.size() - 1; i >= 0; --i) {
        QString prayerTime = m_prayerTimes[prayers[i]].toString();
        if (currentTimeStr >= prayerTime) {
            return prayerNames[i];
        }
    }

    return "Isha";
}

QString PrayerTimesCalculator::getNextPrayer() const {
    QTime now = QTime::currentTime();
    QString currentTimeStr = now.toString("HH:mm");

    QStringList prayers = {"fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"};
    QStringList prayerNames = {"Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"};

    for (int i = 0; i < prayers.size(); ++i) {
        QString prayerTime = m_prayerTimes[prayers[i]].toString();
        if (currentTimeStr < prayerTime) {
            return prayerNames[i];
        }
    }

    return "Fajr";
}

void PrayerTimesCalculator::setCalculationMethod(int method) {
    if (m_calculationMethod == method)
        return;

    m_calculationMethod = method;
    qDebug() << "PrayerTimesCalculator: Метод расчёта изменён на:" << method;
    calculatePrayerTimes();
}

void PrayerTimesCalculator::getMethodAngles(int method, double& fajrAngle, double& ishaAngle) {
    // Различные методы расчёта времени намаза
    switch (method) {
        case 0:  // MWL - Muslim World League
            fajrAngle = 18.0;
            ishaAngle = 17.0;
            qDebug() << "Метод: MWL - Фаджр:" << fajrAngle << "°, Иша:" << ishaAngle << "°";
            break;
        case 1:  // ISNA - Islamic Society of North America
            fajrAngle = 15.0;
            ishaAngle = 15.0;
            qDebug() << "Метод: ISNA - Фаджр:" << fajrAngle << "°, Иша:" << ishaAngle << "°";
            break;
        case 2:  // Egypt - Egyptian General Authority of Survey
            fajrAngle = 19.5;
            ishaAngle = 17.5;
            qDebug() << "Метод: Egypt - Фаджр:" << fajrAngle << "°, Иша:" << ishaAngle << "°";
            break;
        case 3:  // Makkah - Umm al-Qura University
            fajrAngle = 18.5;
            ishaAngle = 90.0;  // фиксированное время 90 минут после магриб
            qDebug() << "Метод: Makkah - Фаджр:" << fajrAngle << "°, Иша: 90 мин после Магриб";
            break;
        case 4:  // Karachi - University of Islamic Sciences
            fajrAngle = 18.0;
            ishaAngle = 18.0;
            qDebug() << "Метод: Karachi - Фаджр:" << fajrAngle << "°, Иша:" << ishaAngle << "°";
            break;
        case 5:  // Tehran - Institute of Geophysics
            fajrAngle = 17.7;
            ishaAngle = 14.0;
            qDebug() << "Метод: Tehran - Фаджр:" << fajrAngle << "°, Иша:" << ishaAngle << "°";
            break;
        default:
            fajrAngle = 18.0;
            ishaAngle = 18.0;
            qDebug() << "Метод: По умолчанию - Фаджр:" << fajrAngle << "°, Иша:" << ishaAngle
                     << "°";
            break;
    }
}

QString PrayerTimesCalculator::getMethodCode(int method) {
    // Коды методов для Aladhan API
    switch (method) {
        case 0:
            return "3";  // MWL
        case 1:
            return "2";  // ISNA
        case 2:
            return "5";  // Egypt
        case 3:
            return "4";  // Makkah
        case 4:
            return "1";  // Karachi
        case 5:
            return "7";  // Tehran
        default:
            return "4";  // Makkah по умолчанию
    }
}

void PrayerTimesCalculator::fetchPrayerTimesFromAPI(const QDate& date) {
    if (m_latitude == 0.0 && m_longitude == 0.0) {
        qWarning()
            << "PrayerTimesCalculator: Координаты не установлены, используем локальный расчет";
        // Fallback на локальный расчет
        QDateTime dateTime(date, QTime(12, 0));
        Times times = computePrayerTimes(dateTime);

        auto toQTime = [](double hours) {
            int h = static_cast<int>(hours);
            int m = static_cast<int>((hours - h) * 60);
            return QTime(h, m).toString("HH:mm");
        };

        m_prayerTimes.clear();
        m_prayerTimes["fajr"] = toQTime(times.fajr);
        m_prayerTimes["sunrise"] = toQTime(times.sunrise);
        m_prayerTimes["dhuhr"] = toQTime(times.dhuhr);
        m_prayerTimes["asr"] = toQTime(times.asr);
        m_prayerTimes["maghrib"] = toQTime(times.maghrib);
        m_prayerTimes["isha"] = toQTime(times.isha);
        m_prayerTimes["date"] = date.toString("dd.MM.yyyy");
        emit prayerTimesChanged();
        return;
    }

    // Формируем URL для Aladhan API
    QString dateStr = QString("%1-%2-%3")
                          .arg(date.year())
                          .arg(date.month(), 2, 10, QChar('0'))
                          .arg(date.day(), 2, 10, QChar('0'));
    QString methodCode = getMethodCode(m_calculationMethod);

    QUrl url("https://api.aladhan.com/v1/timings/" + dateStr);
    QUrlQuery query;
    query.addQueryItem("latitude", QString::number(m_latitude));
    query.addQueryItem("longitude", QString::number(m_longitude));
    query.addQueryItem("method", methodCode);
    query.addQueryItem("school", "1");  // Hanafi для Asr
    url.setQuery(query);

    QNetworkRequest request(url);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    qDebug() << "PrayerTimesCalculator: Запрос к API:" << url.toString();

    QNetworkReply* reply = m_networkManager->get(request);
    connect(reply, &QNetworkReply::errorOccurred, this,
            [this, date, reply]() {
                qWarning() << "PrayerTimesCalculator: Ошибка API запроса:" << reply->error();
                
                // Fallback на локальный расчет при ошибке
                QDateTime dateTime(date, QTime(12, 0));
                Times times = computePrayerTimes(dateTime);

                auto toQTime = [](double hours) {
                    int h = static_cast<int>(hours);
                    int m = static_cast<int>((hours - h) * 60);
                    return QTime(h, m).toString("HH:mm");
                };

                m_prayerTimes.clear();
                m_prayerTimes["fajr"] = toQTime(times.fajr);
                m_prayerTimes["sunrise"] = toQTime(times.sunrise);
                m_prayerTimes["dhuhr"] = toQTime(times.dhuhr);
                m_prayerTimes["asr"] = toQTime(times.asr);
                m_prayerTimes["maghrib"] = toQTime(times.maghrib);
                m_prayerTimes["isha"] = toQTime(times.isha);
                m_prayerTimes["date"] = date.toString("dd.MM.yyyy");
                emit prayerTimesChanged();
                
                // Освобождаем память - критично для предотвращения утечки
                // parseAPIResponse также может быть вызван через finished сигнал,
                // но он проверяет ошибку в начале, так что это безопасно
                reply->deleteLater();
            });
}

void PrayerTimesCalculator::parseAPIResponse(QNetworkReply* reply) {
    if (reply->error() != QNetworkReply::NoError) {
        qWarning() << "PrayerTimesCalculator: Ошибка сети:" << reply->errorString();
        reply->deleteLater();
        return;
    }

    QByteArray data = reply->readAll();
    reply->deleteLater();

    QJsonParseError parseError;
    QJsonDocument doc = QJsonDocument::fromJson(data, &parseError);

    if (parseError.error != QJsonParseError::NoError) {
        qWarning() << "PrayerTimesCalculator: Ошибка парсинга JSON:" << parseError.errorString();
        // Fallback на локальный расчет
        QDateTime dateTime(m_pendingDate, QTime(12, 0));
        Times times = computePrayerTimes(dateTime);

        auto toQTime = [](double hours) {
            int h = static_cast<int>(hours);
            int m = static_cast<int>((hours - h) * 60);
            return QTime(h, m).toString("HH:mm");
        };

        m_prayerTimes.clear();
        m_prayerTimes["fajr"] = toQTime(times.fajr);
        m_prayerTimes["sunrise"] = toQTime(times.sunrise);
        m_prayerTimes["dhuhr"] = toQTime(times.dhuhr);
        m_prayerTimes["asr"] = toQTime(times.asr);
        m_prayerTimes["maghrib"] = toQTime(times.maghrib);
        m_prayerTimes["isha"] = toQTime(times.isha);
        m_prayerTimes["date"] = m_pendingDate.toString("dd.MM.yyyy");
        emit prayerTimesChanged();
        return;
    }

    QJsonObject root = doc.object();
    QJsonObject dataObj = root["data"].toObject();
    QJsonObject timings = dataObj["timings"].toObject();

    // Извлекаем времена молитв
    QString fajr = timings["Fajr"].toString();
    QString sunrise = timings["Sunrise"].toString();
    QString dhuhr = timings["Dhuhr"].toString();
    QString asr = timings["Asr"].toString();
    QString maghrib = timings["Maghrib"].toString();
    QString isha = timings["Isha"].toString();

    // Конвертируем из формата "HH:mm" (24-часовой) в нужный формат
    // API возвращает время в формате "HH:mm"

    m_prayerTimes.clear();
    m_prayerTimes["fajr"] = fajr;
    m_prayerTimes["sunrise"] = sunrise;
    m_prayerTimes["dhuhr"] = dhuhr;
    m_prayerTimes["asr"] = asr;
    m_prayerTimes["maghrib"] = maghrib;
    m_prayerTimes["isha"] = isha;
    m_prayerTimes["date"] = m_pendingDate.toString("dd.MM.yyyy");

    emit prayerTimesChanged();

    qDebug() << "PrayerTimesCalculator: Времена молитв получены из API для" << m_city;
    qDebug() << "Fajr:" << fajr;
    qDebug() << "Sunrise:" << sunrise;
    qDebug() << "Dhuhr:" << dhuhr;
    qDebug() << "Asr:" << asr;
    qDebug() << "Maghrib:" << maghrib;
    qDebug() << "Isha:" << isha;
}
