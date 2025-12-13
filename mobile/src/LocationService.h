#ifndef LOCATIONSERVICE_H
#define LOCATIONSERVICE_H

#include <QGeoPositionInfo>
#include <QGeoPositionInfoSource>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QObject>
#include <QTimer>
#include <QProcess>
#include <QPermissions>

class LocationService : public QObject {
    Q_OBJECT
    Q_PROPERTY(bool active READ active NOTIFY activeChanged)
    Q_PROPERTY(double latitude READ latitude NOTIFY positionChanged)
    Q_PROPERTY(double longitude READ longitude NOTIFY positionChanged)
    Q_PROPERTY(QString status READ status NOTIFY statusChanged)

   public:
    explicit LocationService(QObject* parent = nullptr);

    bool active() const { return m_active; }
    double latitude() const { return m_latitude; }
    double longitude() const { return m_longitude; }
    QString status() const { return m_status; }

    Q_INVOKABLE void requestLocation();
    Q_INVOKABLE void stopUpdates();
    Q_INVOKABLE void openLocationSettings();
    Q_INVOKABLE void forceRequestPermission();
    Q_INVOKABLE void recheckPermission();

   signals:
    void activeChanged();
    void positionChanged(double latitude, double longitude);
    void statusChanged();
    void locationFound(double latitude, double longitude, QString cityName);
    void error(QString message);

   private slots:
    void handlePositionUpdate(const QGeoPositionInfo& info);
    void handleError(QGeoPositionInfoSource::Error error);

   private slots:
    void handleIPLocationResponse(QNetworkReply* reply);

   private:
    void requestIPLocation();
    bool checkLocationPermission();
    QGeoPositionInfoSource* m_source;
    QNetworkAccessManager* m_networkManager;
    bool m_active;
    double m_latitude;
    double m_longitude;
    QString m_status;
    bool m_settingsOpenedRecently;
    QTimer* m_settingsCooldownTimer;
    bool m_triedRecreateGps; // Флаг для отслеживания попыток пересоздания GPS

    QString getCityNameFromCoordinates(double lat, double lon);
};

#endif  // LOCATIONSERVICE_H
