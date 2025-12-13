#ifndef HTTPSERVER_H
#define HTTPSERVER_H

#include <QObject>
#include <QTcpServer>
#include <QTcpSocket>
#include <QJsonDocument>
#include <QJsonObject>
#include <QMap>
#include <QString>

#include "../src/PrayerTimesCalculator.h"
#include "../src/LocationService.h"
#include "../src/AppSettings.h"

class HttpServer : public QObject {
    Q_OBJECT

   public:
    explicit HttpServer(QObject* parent = nullptr);
    ~HttpServer();

    bool start(quint16 port = 8080);
    void stop();

   private slots:
    void handleNewConnection();
    void handleClientData();
    void handleClientDisconnected();

   private:
    void setupServices();
    QByteArray processRequest(const QString& method, const QString& path, 
                             const QMap<QString, QString>& queryParams,
                             const QByteArray& body);
    
    // API endpoints
    QByteArray handlePrayerTimes(const QMap<QString, QString>& params);
    QByteArray handleLocation(const QMap<QString, QString>& params);
    QByteArray handleSearchCity(const QMap<QString, QString>& params);
    QByteArray handleSettings(const QMap<QString, QString>& params, const QByteArray& body);
    QByteArray handleStaticFile(const QString& path);
    
    // CORS headers
    QByteArray getCorsHeaders();
    
    // JSON response helpers
    QByteArray jsonResponse(const QJsonObject& data, int statusCode = 200);
    QByteArray errorResponse(const QString& message, int statusCode = 400);
    
    // Send response to client
    void sendResponse(QTcpSocket* socket, const QByteArray& response);

    QTcpServer* m_server;
    QMap<QTcpSocket*, QByteArray> m_clientBuffers;
    
    // Services (используем вашу логику)
    PrayerTimesCalculator* m_prayerCalc;
    LocationService* m_locationService;
    AppSettings* m_appSettings;
    
    QString m_webRoot; // Путь к веб-файлам
};

#endif  // HTTPSERVER_H

