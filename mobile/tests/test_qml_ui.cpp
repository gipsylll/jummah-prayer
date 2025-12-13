#include <QtQuickTest/quicktest.h>
#include <QQmlEngine>
#include <QQmlContext>
#include "../src/PrayerTimesCalculator.h"

class Setup : public QObject
{
    Q_OBJECT
    
public:
    Setup() {}
    
public slots:
    void qmlEngineAvailable(QQmlEngine *engine)
    {
        // Регистрируем типы для тестов
        qmlRegisterType<PrayerTimesCalculator>("PrayerTimes", 1, 0, "PrayerTimesCalculator");
    }
};

QUICK_TEST_MAIN_WITH_SETUP(qml_ui_tests, Setup)

#include "test_qml_ui.moc"


