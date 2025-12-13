#include <QDebug>
#include <QApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>

#include "AppSettings.h"
#include "LocationService.h"
#include "PrayerTimesCalculator.h"
#include "NotificationService.h"

int main(int argc, char* argv[]) {
    // Создание приложения (QApplication для поддержки QSystemTrayIcon)
    QApplication app(argc, argv);

    // Установка параметров приложения
    QApplication::setApplicationName("Jummah Prayer");
    QApplication::setOrganizationName("JummahPrayer");
    QApplication::setApplicationVersion("1.0.0");

    // Регистрация типов для QML
    qmlRegisterType<PrayerTimesCalculator>("PrayerTimes", 1, 0, "PrayerTimesCalculator");
    qmlRegisterType<AppSettings>("AppSettings", 1, 0, "AppSettings");
    qmlRegisterType<LocationService>("LocationService", 1, 0, "LocationService");
    qmlRegisterType<NotificationService>("NotificationService", 1, 0, "NotificationService");

    // Создаем объекты до движка
    PrayerTimesCalculator prayerCalc;
    AppSettings settings;
    LocationService locationService;
    NotificationService notificationService;

    // Подключаем сигналы: когда найдена локация, обновляем prayerCalc и сохраняем
    QObject::connect(&locationService, &LocationService::locationFound, &prayerCalc,
                     &PrayerTimesCalculator::setLocation);
    QObject::connect(&locationService, &LocationService::locationFound, &settings,
                     &AppSettings::saveLocation);

    // Подключаем сервис уведомлений к калькулятору молитв
    notificationService.setPrayerTimesCalculator(&prayerCalc);

    // Загружаем сохранённую локацию при старте
    if (!settings.savedCity().isEmpty()) {
        prayerCalc.setLocation(settings.savedLatitude(), settings.savedLongitude(),
                               settings.savedCity());
    }

    // Создание QML движка
    QQmlApplicationEngine engine;

    // Устанавливаем контекстные свойства (доступны глобально в QML)
    engine.rootContext()->setContextProperty("globalPrayerCalc", &prayerCalc);
    engine.rootContext()->setContextProperty("globalAppSettings", &settings);
    engine.rootContext()->setContextProperty("globalLocationService", &locationService);
    engine.rootContext()->setContextProperty("globalNotificationService", &notificationService);

    // Загрузка главного QML файла
    const QUrl url(QStringLiteral("qrc:/Main.qml"));

    QObject::connect(
        &engine, &QQmlApplicationEngine::objectCreated, &app,
        [url](QObject* obj, const QUrl& objUrl) {
            if (!obj && url == objUrl)
                QCoreApplication::exit(-1);
        },
        Qt::QueuedConnection);

    engine.load(url);

    if (engine.rootObjects().isEmpty()) {
        qWarning() << "Не удалось загрузить QML файл!";
        return -1;
    }

    qDebug() << "Приложение Jummah Prayer запущено успешно!";

    return app.exec();
}
