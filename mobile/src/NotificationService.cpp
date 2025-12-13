#include "NotificationService.h"
#include "PrayerTimesCalculator.h"

#include <QDebug>
#include <QDateTime>
#include <QTime>
#include <QVariantMap>
#include <QMenu>
#include <QAction>
#include <QSystemTrayIcon>
#include <QIcon>
#include <QPixmap>
#include <QPainter>
#include <QPainterPath>
#include <QPen>
#include <QBrush>
#include <QFont>
#include <QColor>
#include <QCoreApplication>
#include <QApplication>
#include <QThread>
#include <QProcess>
#include <algorithm>

NotificationService::NotificationService(QObject* parent)
    : QObject(parent),
      m_enabled(false),
      m_notificationMinutesBefore(5),
      m_trayIconVisible(false),
      m_prayerCalculator(nullptr) {
    
    // Таймер для проверки времени (проверяем каждую минуту)
    m_checkTimer = new QTimer(this);
    m_checkTimer->setInterval(60000); // 1 минута
    m_checkTimer->setSingleShot(false);
    connect(m_checkTimer, &QTimer::timeout, this, &NotificationService::checkTimeForNotifications);

    // Создаем иконку в трее
    m_trayIcon = new QSystemTrayIcon(this);
    
    // Создаем простую иконку программно (можно заменить на файловую иконку позже)
    // Используем стиль приложения для цвета
    QPixmap pixmap(32, 32);
    pixmap.fill(QColor("#4A90E2")); // Синий цвет (primary color)
    
    QPainter painter(&pixmap);
    painter.setRenderHint(QPainter::Antialiasing);
    painter.setPen(QPen(Qt::white, 2));
    painter.setBrush(QBrush(Qt::white));
    
    // Рисуем простую геометрическую форму (полумесяц и звезда)
    QPainterPath path;
    // Полумесяц
    path.addEllipse(6, 8, 12, 12);
    path.addEllipse(10, 8, 12, 12);
    painter.setCompositionMode(QPainter::CompositionMode_DestinationOut);
    painter.fillPath(path, Qt::white);
    painter.setCompositionMode(QPainter::CompositionMode_SourceOver);
    
    // Звезда (простая точка)
    painter.setBrush(QBrush(Qt::white));
    painter.drawEllipse(20, 10, 4, 4);
    
    QIcon icon(pixmap);
    m_trayIcon->setIcon(icon);
    m_trayIcon->setVisible(false); // Скрываем по умолчанию
    
    // Меню для трея
    QMenu* trayMenu = new QMenu();
    QAction* showAction = new QAction("Показать", trayMenu);
    QAction* quitAction = new QAction("Выход", trayMenu);
    
    connect(showAction, &QAction::triggered, this, [this]() {
        onTrayIconActivated(QSystemTrayIcon::Trigger);
    });
    connect(quitAction, &QAction::triggered, qApp, &QCoreApplication::quit);
    
    trayMenu->addAction(showAction);
    trayMenu->addSeparator();
    trayMenu->addAction(quitAction);
    
    m_trayIcon->setContextMenu(trayMenu);
    m_trayIcon->setToolTip("Jummah Prayer - Времена молитв");
    
    connect(m_trayIcon, &QSystemTrayIcon::activated, this, 
            &NotificationService::onTrayIconActivated);

    qDebug() << "NotificationService: Сервис уведомлений создан";
}

NotificationService::~NotificationService() {
    if (m_checkTimer) {
        m_checkTimer->stop();
    }
    if (m_trayIcon && m_trayIcon->isVisible()) {
        m_trayIcon->hide();
    }
}

void NotificationService::setEnabled(bool enabled) {
    if (m_enabled == enabled)
        return;
    
    m_enabled = enabled;
    
    if (m_enabled) {
        qDebug() << "NotificationService: Уведомления включены";
        checkAndScheduleNotifications();
        m_checkTimer->start();
    } else {
        qDebug() << "NotificationService: Уведомления выключены";
        m_checkTimer->stop();
    }
    
    emit enabledChanged();
}

void NotificationService::setNotificationMinutesBefore(int minutes) {
    if (m_notificationMinutesBefore == minutes || minutes < 0 || minutes > 60)
        return;
    
    m_notificationMinutesBefore = minutes;
    qDebug() << "NotificationService: Уведомления за" << minutes << "минут до молитвы";
    
    if (m_enabled) {
        checkAndScheduleNotifications();
    }
    
    emit notificationMinutesBeforeChanged();
}

void NotificationService::setTrayIconVisible(bool visible) {
    if (m_trayIconVisible == visible)
        return;
    
    m_trayIconVisible = visible;
    
    if (m_trayIconVisible) {
        if (QSystemTrayIcon::isSystemTrayAvailable()) {
            m_trayIcon->show();
            qDebug() << "NotificationService: Иконка в трее показана";
        } else {
            qWarning() << "NotificationService: Системный трей недоступен";
        }
    } else {
        m_trayIcon->hide();
        qDebug() << "NotificationService: Иконка в трее скрыта";
    }
    
    emit trayIconVisibleChanged();
}

void NotificationService::setPrayerTimesCalculator(PrayerTimesCalculator* calculator) {
    if (m_prayerCalculator == calculator)
        return;
    
    // Отключаемся от старого калькулятора
    if (m_prayerCalculator) {
        disconnect(m_prayerCalculator, nullptr, this, nullptr);
    }
    
    m_prayerCalculator = calculator;
    
    if (m_prayerCalculator) {
        connect(m_prayerCalculator, &PrayerTimesCalculator::prayerTimesChanged,
                this, &NotificationService::onPrayerTimesChanged);
        qDebug() << "NotificationService: Подключен к PrayerTimesCalculator";
        onPrayerTimesChanged(); // Обновляем расписание сразу
    }
}

void NotificationService::checkAndScheduleNotifications() {
    if (!m_prayerCalculator) {
        qWarning() << "NotificationService: PrayerTimesCalculator не установлен";
        return;
    }
    
    onPrayerTimesChanged();
}

void NotificationService::onPrayerTimesChanged() {
    if (!m_prayerCalculator)
        return;
    
    QVariantMap times = m_prayerCalculator->prayerTimes();
    
    if (times.isEmpty()) {
        qDebug() << "NotificationService: Времена молитв пусты, пропускаем";
        return;
    }
    
    // Парсим времена молитв (ключи в нижнем регистре: "fajr", "dhuhr" и т.д.)
    m_fajrTime = parsePrayerTime(times["fajr"].toString());
    m_sunriseTime = parsePrayerTime(times["sunrise"].toString());
    m_dhuhrTime = parsePrayerTime(times["dhuhr"].toString());
    m_asrTime = parsePrayerTime(times["asr"].toString());
    m_maghribTime = parsePrayerTime(times["maghrib"].toString());
    m_ishaTime = parsePrayerTime(times["isha"].toString());
    
    qDebug() << "NotificationService: Времена молитв обновлены:";
    qDebug() << "  Фаджр:" << (m_fajrTime.isValid() ? m_fajrTime.toString("HH:mm") : "не задано");
    qDebug() << "  Зухр:" << (m_dhuhrTime.isValid() ? m_dhuhrTime.toString("HH:mm") : "не задано");
    qDebug() << "  Аср:" << (m_asrTime.isValid() ? m_asrTime.toString("HH:mm") : "не задано");
    qDebug() << "  Магриб:" << (m_maghribTime.isValid() ? m_maghribTime.toString("HH:mm") : "не задано");
    qDebug() << "  Иша:" << (m_ishaTime.isValid() ? m_ishaTime.toString("HH:mm") : "не задано");
    
    qDebug() << "NotificationService: Все ключи в prayerTimes:";
    for (auto it = times.begin(); it != times.end(); ++it) {
        qDebug() << "  " << it.key() << "=" << it.value().toString();
    }
    
    scheduleNextNotification();
}

void NotificationService::scheduleNextNotification() {
    m_scheduledPrayers.clear();
    
    QTime currentTime = QTime::currentTime();
    
    // Список всех молитв с временами
    QList<QPair<QString, QTime>> prayers = {
        {"Fajr", m_fajrTime},
        {"Dhuhr", m_dhuhrTime},
        {"Asr", m_asrTime},
        {"Maghrib", m_maghribTime},
        {"Isha", m_ishaTime}
    };
    
    // Находим следующую молитву, для которой еще не показано уведомление
    for (const auto& prayer : prayers) {
        if (!prayer.second.isValid())
            continue;
        
        QTime notificationTime = prayer.second.addSecs(-m_notificationMinutesBefore * 60);
        QTime prayerTime = prayer.second;
        
        // Если время молитвы еще не наступило
        if (prayerTime > currentTime) {
            PrayerNotification notif;
            notif.key = prayer.first;
            notif.name = getPrayerNameInRussian(prayer.first);
            
            // Если время уведомления уже прошло, но молитва еще не наступила
            // - показываем уведомление сразу (при запуске приложения)
            if (notificationTime <= currentTime) {
                // Время уведомления прошло, но молитва еще не наступила
                // Показываем уведомление при следующей проверке (в течение минуты)
                notif.time = currentTime; // Устанавливаем на текущее время, чтобы сработало сразу
                qDebug() << "NotificationService: Время уведомления для" << notif.name 
                         << "уже прошло (" << notificationTime.toString("HH:mm") 
                         << "), но молитва еще не наступила. Покажем уведомление сразу.";
            } else {
                // Время уведомления еще не наступило - планируем на будущее
                notif.time = notificationTime;
            }
            
            notif.notified = false;
            m_scheduledPrayers.append(notif);
            
            qDebug() << "NotificationService: Запланировано уведомление для" 
                     << notif.name << "в" << notif.time.toString("HH:mm") 
                     << "(молитва в" << prayerTime.toString("HH:mm") << ")";
        }
    }
    
    // Если сегодня не осталось молитв, планируем на завтра (Фаджр)
    if (m_scheduledPrayers.isEmpty() && m_fajrTime.isValid()) {
        QTime tomorrowFajrNotification = m_fajrTime.addSecs(-m_notificationMinutesBefore * 60);
        PrayerNotification notif;
        notif.key = "Fajr";
        notif.name = getPrayerNameInRussian("Fajr");
        notif.time = tomorrowFajrNotification;
        notif.notified = false;
        m_scheduledPrayers.append(notif);
        
        qDebug() << "NotificationService: Запланировано уведомление на завтра для Фаджр в" 
                 << tomorrowFajrNotification.toString("HH:mm");
    }
    
    // Если уведомления включены, проверяем сразу (на случай если нужно показать уведомление прямо сейчас)
    if (m_enabled && !m_scheduledPrayers.isEmpty()) {
        QTimer::singleShot(1000, this, &NotificationService::checkTimeForNotifications);
    }
}

void NotificationService::checkTimeForNotifications() {
    if (!m_enabled) {
        return;
    }
    
    if (m_scheduledPrayers.isEmpty()) {
        qDebug() << "NotificationService: Нет запланированных уведомлений";
        return;
    }
    
    QTime currentTime = QTime::currentTime();
    qDebug() << "NotificationService: Проверка времени уведомлений, текущее время:" << currentTime.toString("HH:mm");
    
    // Проверяем все запланированные уведомления
    for (auto& notif : m_scheduledPrayers) {
        if (notif.notified)
            continue;
        
        // Проверяем, не пришло ли время уведомления
        // Показываем если:
        // 1. Время уведомления уже прошло (включая текущую минуту)
        // 2. Или время уведомления в пределах следующей минуты
        int timeDiff = QTime(0, 0).secsTo(currentTime) - QTime(0, 0).secsTo(notif.time);
        
        // Показываем если время уведомления прошло (в пределах минуты) или наступило
        if (timeDiff >= -60 && timeDiff <= 300) { // От -60 секунд (минуту назад) до +300 секунд (5 минут вперед)
            QString prayerTime;
            if (notif.key == "Fajr") prayerTime = m_fajrTime.toString("HH:mm");
            else if (notif.key == "Dhuhr") prayerTime = m_dhuhrTime.toString("HH:mm");
            else if (notif.key == "Asr") prayerTime = m_asrTime.toString("HH:mm");
            else if (notif.key == "Maghrib") prayerTime = m_maghribTime.toString("HH:mm");
            else if (notif.key == "Isha") prayerTime = m_ishaTime.toString("HH:mm");
            
            QString title = QString("Время молитвы: %1").arg(notif.name);
            QString message = QString("Через %1 минут начинается %2 (%3)")
                                 .arg(m_notificationMinutesBefore)
                                 .arg(notif.name)
                                 .arg(prayerTime);
            
            showNotification(title, message);
            emit notificationTriggered(notif.key, prayerTime);
            
            notif.notified = true;
            
            qDebug() << "NotificationService: Показано уведомление для" << notif.name;
        }
    }
    
    // Удаляем уже показанные уведомления
    m_scheduledPrayers.erase(
        std::remove_if(m_scheduledPrayers.begin(), m_scheduledPrayers.end(),
                      [](const PrayerNotification& n) { return n.notified; }),
        m_scheduledPrayers.end());
}

void NotificationService::showNotification(const QString& title, const QString& message) {
    if (!m_enabled && !title.contains("Test")) {
        qDebug() << "NotificationService: Уведомления выключены, пропускаем";
        return;
    }
    
    qDebug() << "NotificationService: Показываем уведомление:" << title << "-" << message;
    
    // На macOS используем нативные уведомления через osascript (они работают лучше)
    #ifdef Q_OS_MACOS
    QProcess process;
    QString escapedMessage = message;
    QString escapedTitle = title;
    
    // Экранируем специальные символы для AppleScript
    escapedMessage.replace("\\", "\\\\");  // Сначала экранируем обратные слеши
    escapedMessage.replace("\"", "\\\"");  // Затем кавычки
    escapedMessage.replace("\n", " ");
    escapedTitle.replace("\\", "\\\\");
    escapedTitle.replace("\"", "\\\"");
    
    QString script = QString("display notification \"%1\" with title \"%2\" sound name \"Glass\"")
                        .arg(escapedMessage)
                        .arg(escapedTitle);
    
    qDebug() << "NotificationService: Запускаем osascript для уведомления";
    process.start("osascript", QStringList() << "-e" << script);
    
    if (!process.waitForFinished(3000)) {
        qWarning() << "NotificationService: osascript не ответил в течение 3 секунд";
        process.kill();
        process.waitForFinished(1000);
    } else {
        if (process.exitCode() == 0) {
            qDebug() << "NotificationService: ✓ Уведомление успешно показано через osascript";
        } else {
            QString errorOutput = process.readAllStandardError();
            qWarning() << "NotificationService: Ошибка osascript:" << process.exitCode() << errorOutput;
        }
    }
    
    // Дополнительно пробуем через системный трей (если доступен)
    if (QSystemTrayIcon::isSystemTrayAvailable() && m_trayIcon) {
        if (m_trayIcon->icon().isNull()) {
            // Создаем иконку если её нет
            QPixmap pixmap(32, 32);
            pixmap.fill(QColor("#4A90E2"));
            QPainter painter(&pixmap);
            painter.setRenderHint(QPainter::Antialiasing);
            painter.setPen(QPen(Qt::white, 2));
            painter.setBrush(QBrush(Qt::white));
            QPainterPath path;
            path.addEllipse(6, 8, 12, 12);
            path.addEllipse(10, 8, 12, 12);
            painter.setCompositionMode(QPainter::CompositionMode_DestinationOut);
            painter.fillPath(path, Qt::white);
            painter.setCompositionMode(QPainter::CompositionMode_SourceOver);
            painter.setBrush(QBrush(Qt::white));
            painter.drawEllipse(20, 10, 4, 4);
            m_trayIcon->setIcon(QIcon(pixmap));
        }
        
        bool wasVisible = m_trayIcon->isVisible();
        if (!wasVisible) {
            m_trayIcon->show();
            QApplication::processEvents();
            QThread::msleep(50);
        }
        
        m_trayIcon->showMessage(title, message, QSystemTrayIcon::Information, 5000);
        
        if (!wasVisible && !m_trayIconVisible) {
            QTimer::singleShot(1000, this, [this]() {
                if (!m_trayIconVisible) {
                    m_trayIcon->hide();
                }
            });
        }
    }
    return;
    #endif
    
    // Для других платформ используем системный трей
    if (!QSystemTrayIcon::isSystemTrayAvailable()) {
        qWarning() << "NotificationService: Системный трей недоступен";
        return;
    }
    
    if (!m_trayIcon) {
        qWarning() << "NotificationService: m_trayIcon не инициализирован";
        return;
    }
    
    // Проверяем что иконка установлена
    if (m_trayIcon->icon().isNull()) {
        QPixmap pixmap(32, 32);
        pixmap.fill(QColor("#4A90E2"));
        QPainter painter(&pixmap);
        painter.setRenderHint(QPainter::Antialiasing);
        painter.setPen(QPen(Qt::white, 2));
        painter.setBrush(QBrush(Qt::white));
        QPainterPath path;
        path.addEllipse(6, 8, 12, 12);
        path.addEllipse(10, 8, 12, 12);
        painter.setCompositionMode(QPainter::CompositionMode_DestinationOut);
        painter.fillPath(path, Qt::white);
        painter.setCompositionMode(QPainter::CompositionMode_SourceOver);
        painter.setBrush(QBrush(Qt::white));
        painter.drawEllipse(20, 10, 4, 4);
        m_trayIcon->setIcon(QIcon(pixmap));
    }
    
    // Показываем уведомление
    m_trayIcon->showMessage(title, message, QSystemTrayIcon::Information, 10000);
    qDebug() << "NotificationService: showMessage вызван для:" << title;
}

void NotificationService::showTestNotification(const QString& title, const QString& message) {
    showNotification(title, message);
}

QTime NotificationService::parsePrayerTime(const QString& timeStr) const {
    if (timeStr.isEmpty())
        return QTime();
    
    // Формат: "HH:mm" или "H:mm"
    return QTime::fromString(timeStr, "HH:mm");
}

QString NotificationService::getPrayerNameInRussian(const QString& prayerKey) const {
    if (prayerKey == "Fajr") return "Фаджр";
    if (prayerKey == "Sunrise") return "Восход";
    if (prayerKey == "Dhuhr") return "Зухр";
    if (prayerKey == "Asr") return "Аср";
    if (prayerKey == "Maghrib") return "Магриб";
    if (prayerKey == "Isha") return "Иша";
    return prayerKey;
}

void NotificationService::onTrayIconActivated(QSystemTrayIcon::ActivationReason reason) {
    if (reason == QSystemTrayIcon::Trigger || reason == QSystemTrayIcon::DoubleClick) {
        // Эмитируем сигнал для показа главного окна
        // Это можно подключить в QML или main.cpp
        qDebug() << "NotificationService: Активация иконки в трее";
    }
}

