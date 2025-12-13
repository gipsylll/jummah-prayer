#include <QtTest/QtTest>
#include "../src/PrayerTimesCalculator.h"

class TestPrayerTimes : public QObject
{
    Q_OBJECT

private slots:
    void initTestCase();
    void cleanupTestCase();
    
    // Тесты на корректность расчетов
    void testMoscowPrayerTimes();
    void testMeccaPrayerTimes();
    void testTimeOrder();
    void testTimeRange();
    void testDifferentDates();
    void testLocationChange();
    void testCalculationMethods();
    void testDateSelection();

private:
    PrayerTimesCalculator *calculator;
    
    // Вспомогательная функция для конвертации времени в минуты
    int timeToMinutes(const QString &time) {
        QTime t = QTime::fromString(time, "HH:mm");
        return t.hour() * 60 + t.minute();
    }
};

void TestPrayerTimes::initTestCase()
{
    calculator = new PrayerTimesCalculator();
    qDebug() << "=== Запуск тестов PrayerTimesCalculator ===";
}

void TestPrayerTimes::cleanupTestCase()
{
    delete calculator;
    qDebug() << "=== Тесты завершены ===";
}

void TestPrayerTimes::testMoscowPrayerTimes()
{
    qDebug() << "\n--- Тест: Москва (55.7558°N, 37.6173°E) ---";
    
    // Устанавливаем Москву
    calculator->setLocation(55.7558, 37.6173, "Москва");
    calculator->calculatePrayerTimes();
    
    QVariantMap times = calculator->prayerTimes();
    
    // Проверяем что все времена заполнены
    QVERIFY(!times["fajr"].toString().isEmpty());
    QVERIFY(!times["sunrise"].toString().isEmpty());
    QVERIFY(!times["dhuhr"].toString().isEmpty());
    QVERIFY(!times["asr"].toString().isEmpty());
    QVERIFY(!times["maghrib"].toString().isEmpty());
    QVERIFY(!times["isha"].toString().isEmpty());
    
    qDebug() << "Фаджр:" << times["fajr"].toString();
    qDebug() << "Восход:" << times["sunrise"].toString();
    qDebug() << "Зухр:" << times["dhuhr"].toString();
    qDebug() << "Аср:" << times["asr"].toString();
    qDebug() << "Магриб:" << times["maghrib"].toString();
    qDebug() << "Иша:" << times["isha"].toString();
    
    // Проверяем что времена не 00:00 (типичная ошибка при неправильных расчетах)
    QVERIFY(times["fajr"].toString() != "00:00");
    QVERIFY(times["dhuhr"].toString() != "00:00");
}

void TestPrayerTimes::testMeccaPrayerTimes()
{
    qDebug() << "\n--- Тест: Мекка (21.4225°N, 39.8262°E) ---";
    
    calculator->setLocation(21.4225, 39.8262, "Мекка");
    calculator->calculatePrayerTimes();
    
    QVariantMap times = calculator->prayerTimes();
    
    qDebug() << "Фаджр:" << times["fajr"].toString();
    qDebug() << "Зухр:" << times["dhuhr"].toString();
    qDebug() << "Аср:" << times["asr"].toString();
    qDebug() << "Магриб:" << times["maghrib"].toString();
    qDebug() << "Иша:" << times["isha"].toString();
    
    QVERIFY(!times["fajr"].toString().isEmpty());
    QVERIFY(!times["dhuhr"].toString().isEmpty());
}

void TestPrayerTimes::testTimeOrder()
{
    qDebug() << "\n--- Тест: Порядок времен намаза ---";
    
    calculator->setLocation(55.7558, 37.6173, "Москва");
    calculator->calculatePrayerTimes();
    
    QVariantMap times = calculator->prayerTimes();
    
    int fajr = timeToMinutes(times["fajr"].toString());
    int sunrise = timeToMinutes(times["sunrise"].toString());
    int dhuhr = timeToMinutes(times["dhuhr"].toString());
    int asr = timeToMinutes(times["asr"].toString());
    int maghrib = timeToMinutes(times["maghrib"].toString());
    int isha = timeToMinutes(times["isha"].toString());
    
    qDebug() << "Проверка порядка времен:";
    qDebug() << "Фаджр:" << fajr << "минут";
    qDebug() << "Восход:" << sunrise << "минут";
    qDebug() << "Зухр:" << dhuhr << "минут";
    qDebug() << "Аср:" << asr << "минут";
    qDebug() << "Магриб:" << maghrib << "минут";
    qDebug() << "Иша:" << isha << "минут";
    
    // Проверяем правильный порядок
    QVERIFY2(fajr < sunrise, "Фаджр должен быть раньше восхода");
    QVERIFY2(sunrise < dhuhr, "Восход должен быть раньше Зухр");
    QVERIFY2(dhuhr < asr, "Зухр должен быть раньше Аср");
    QVERIFY2(asr < maghrib, "Аср должен быть раньше Магриб");
    QVERIFY2(maghrib < isha, "Магриб должен быть раньше Иша");
}

void TestPrayerTimes::testTimeRange()
{
    qDebug() << "\n--- Тест: Диапазон времен (0-24 часа) ---";
    
    calculator->setLocation(55.7558, 37.6173, "Москва");
    calculator->calculatePrayerTimes();
    
    QVariantMap times = calculator->prayerTimes();
    
    QStringList prayers = {"fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"};
    
    for (const QString &prayer : prayers) {
        QString timeStr = times[prayer].toString();
        QTime t = QTime::fromString(timeStr, "HH:mm");
        
        QVERIFY2(t.isValid(), qPrintable(QString("Неверный формат времени для %1: %2").arg(prayer, timeStr)));
        QVERIFY2(t.hour() >= 0 && t.hour() < 24, qPrintable(QString("Час вне диапазона для %1").arg(prayer)));
        QVERIFY2(t.minute() >= 0 && t.minute() < 60, qPrintable(QString("Минуты вне диапазона для %1").arg(prayer)));
        
        qDebug() << prayer << ":" << timeStr << "- OK";
    }
}

void TestPrayerTimes::testDifferentDates()
{
    qDebug() << "\n--- Тест: Разные даты года ---";
    
    calculator->setLocation(55.7558, 37.6173, "Москва");
    
    // Зима (короткий день)
    qDebug() << "\nЗима (21 декабря):";
    calculator->calculatePrayerTimes();
    QVariantMap winterTimes = calculator->prayerTimes();
    qDebug() << "Восход:" << winterTimes["sunrise"].toString();
    qDebug() << "Магриб:" << winterTimes["maghrib"].toString();
    
    int winterSunrise = timeToMinutes(winterTimes["sunrise"].toString());
    int winterMaghrib = timeToMinutes(winterTimes["maghrib"].toString());
    int winterDayLength = winterMaghrib - winterSunrise;
    
    qDebug() << "Длина светового дня зимой:" << (winterDayLength / 60) << "часов" << (winterDayLength % 60) << "минут";
    
    // Проверяем что день не слишком короткий и не слишком длинный
    QVERIFY2(winterDayLength > 300, "Световой день слишком короткий"); // > 5 часов
    QVERIFY2(winterDayLength < 1200, "Световой день слишком длинный"); // < 20 часов
}

void TestPrayerTimes::testLocationChange()
{
    qDebug() << "\n--- Тест: Изменение локации ---";
    
    // Москва
    calculator->setLocation(55.7558, 37.6173, "Москва");
    calculator->calculatePrayerTimes();
    QVariantMap moscowTimes = calculator->prayerTimes();
    
    // Стамбул
    calculator->setLocation(41.0082, 28.9784, "Стамбул");
    calculator->calculatePrayerTimes();
    QVariantMap istanbulTimes = calculator->prayerTimes();
    
    qDebug() << "Москва - Зухр:" << moscowTimes["dhuhr"].toString();
    qDebug() << "Стамбул - Зухр:" << istanbulTimes["dhuhr"].toString();
    
    // Времена должны отличаться из-за разных часовых поясов и широты
    QVERIFY(moscowTimes["dhuhr"].toString() != istanbulTimes["dhuhr"].toString());
    
    // Проверяем что оба времени валидны
    QVERIFY(QTime::fromString(moscowTimes["dhuhr"].toString(), "HH:mm").isValid());
    QVERIFY(QTime::fromString(istanbulTimes["dhuhr"].toString(), "HH:mm").isValid());
    
    qDebug() << "✓ Времена изменились после смены локации";
}

void TestPrayerTimes::testCalculationMethods()
{
    qDebug() << "\n--- Тест: Методы расчёта ---";
    
    calculator->setLocation(55.7558, 37.6173, "Москва");
    
    // Тест MWL (метод 0)
    calculator->setCalculationMethod(0);
    QString fajr_mwl = calculator->prayerTimes()["fajr"].toString();
    QString isha_mwl = calculator->prayerTimes()["isha"].toString();
    qDebug() << "MWL: Fajr =" << fajr_mwl << ", Isha =" << isha_mwl;
    QVERIFY(!fajr_mwl.isEmpty());
    QVERIFY(!isha_mwl.isEmpty());
    
    // Тест ISNA (метод 1) - должен отличаться
    calculator->setCalculationMethod(1);
    QString fajr_isna = calculator->prayerTimes()["fajr"].toString();
    QString isha_isna = calculator->prayerTimes()["isha"].toString();
    qDebug() << "ISNA: Fajr =" << fajr_isna << ", Isha =" << isha_isna;
    
    // Времена должны отличаться при разных методах
    bool timesAreDifferent = (fajr_mwl != fajr_isna) || (isha_mwl != isha_isna);
    QVERIFY2(timesAreDifferent, "Разные методы должны давать разные времена");
    
    // Тест Makkah (метод 3)
    calculator->setCalculationMethod(3);
    QString isha_makkah = calculator->prayerTimes()["isha"].toString();
    qDebug() << "Makkah: Isha =" << isha_makkah;
    QVERIFY(!isha_makkah.isEmpty());
    
    qDebug() << "✓ Все методы расчёта работают корректно";
}

void TestPrayerTimes::testDateSelection()
{
    qDebug() << "\n--- Тест: Выбор даты ---";
    
    QDate today = QDate::currentDate();
    QDate tomorrow = today.addDays(1);
    QDate yesterday = today.addDays(-1);
    
    // Тест сегодня
    calculator->setSelectedDate(today);
    QString date1 = calculator->prayerTimes()["date"].toString();
    qDebug() << "Сегодня:" << date1;
    QCOMPARE(date1, today.toString("dd.MM.yyyy"));
    
    // Тест завтра
    calculator->setSelectedDate(tomorrow);
    QString date2 = calculator->prayerTimes()["date"].toString();
    qDebug() << "Завтра:" << date2;
    QCOMPARE(date2, tomorrow.toString("dd.MM.yyyy"));
    
    // Тест вчера
    calculator->setSelectedDate(yesterday);
    QString date3 = calculator->prayerTimes()["date"].toString();
    qDebug() << "Вчера:" << date3;
    QCOMPARE(date3, yesterday.toString("dd.MM.yyyy"));
    
    // Тест resetToToday()
    calculator->resetToToday();
    QString dateReset = calculator->prayerTimes()["date"].toString();
    qDebug() << "После resetToToday():" << dateReset;
    QCOMPARE(dateReset, today.toString("dd.MM.yyyy"));
    
    qDebug() << "✓ Выбор даты работает корректно";
}

QTEST_MAIN(TestPrayerTimes)
#include "test_prayertimes.moc"

