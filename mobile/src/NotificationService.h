#ifndef NOTIFICATIONSERVICE_H
#define NOTIFICATIONSERVICE_H

#include <QObject>
#include <QTimer>
#include <QTime>
#include <QString>
#include <QSystemTrayIcon>
#include <QList>

class PrayerTimesCalculator;

class NotificationService : public QObject {
    Q_OBJECT
    Q_PROPERTY(bool enabled READ enabled WRITE setEnabled NOTIFY enabledChanged)
    Q_PROPERTY(int notificationMinutesBefore READ notificationMinutesBefore 
               WRITE setNotificationMinutesBefore NOTIFY notificationMinutesBeforeChanged)
    Q_PROPERTY(bool trayIconVisible READ trayIconVisible 
               WRITE setTrayIconVisible NOTIFY trayIconVisibleChanged)

   public:
    explicit NotificationService(QObject* parent = nullptr);
    ~NotificationService();

    bool enabled() const { return m_enabled; }
    void setEnabled(bool enabled);

    int notificationMinutesBefore() const { return m_notificationMinutesBefore; }
    void setNotificationMinutesBefore(int minutes);

    bool trayIconVisible() const { return m_trayIconVisible; }
    void setTrayIconVisible(bool visible);

    Q_INVOKABLE void setPrayerTimesCalculator(PrayerTimesCalculator* calculator);
    Q_INVOKABLE void checkAndScheduleNotifications();
    Q_INVOKABLE void showTestNotification(const QString& title, const QString& message);

   signals:
    void enabledChanged();
    void notificationMinutesBeforeChanged();
    void trayIconVisibleChanged();
    void notificationTriggered(const QString& prayerName, const QString& time);

   private slots:
    void onPrayerTimesChanged();
    void checkTimeForNotifications();
    void onTrayIconActivated(QSystemTrayIcon::ActivationReason reason);

   private:
    void scheduleNextNotification();
    void showNotification(const QString& title, const QString& message);
    QTime parsePrayerTime(const QString& timeStr) const;
    QString getPrayerNameInRussian(const QString& prayerKey) const;

    bool m_enabled;
    int m_notificationMinutesBefore;  // За сколько минут показывать уведомление
    bool m_trayIconVisible;
    QTimer* m_checkTimer;
    QSystemTrayIcon* m_trayIcon;
    PrayerTimesCalculator* m_prayerCalculator;
    
    // Времена молитв для сегодня
    QTime m_fajrTime;
    QTime m_sunriseTime;
    QTime m_dhuhrTime;
    QTime m_asrTime;
    QTime m_maghribTime;
    QTime m_ishaTime;
    
    // Список молитв для уведомлений
    struct PrayerNotification {
        QString key;
        QString name;
        QTime time;
        bool notified;
    };
    QList<PrayerNotification> m_scheduledPrayers;
};

#endif  // NOTIFICATIONSERVICE_H

