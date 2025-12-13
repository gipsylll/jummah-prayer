#include "LocationService.h"

#include <QDebug>
#include <QJsonDocument>
#include <QJsonObject>
#include <QNetworkRequest>
#include <QUrl>
#include <QProcess>
#include <QStandardPaths>
#include <QGuiApplication>
#include <QPermissions>

LocationService::LocationService(QObject* parent)
    : QObject(parent),
      m_source(nullptr),
      m_networkManager(nullptr),
      m_active(false),
      m_latitude(55.7558)  // Москва по умолчанию
      ,
      m_longitude(37.6173),
      m_status("Готов к определению"),
      m_settingsOpenedRecently(false),
      m_triedRecreateGps(false) {
    // Создаем NetworkAccessManager для онлайн определения местоположения
    m_networkManager = new QNetworkAccessManager(this);
    connect(m_networkManager, &QNetworkAccessManager::finished, this,
            &LocationService::handleIPLocationResponse);

    // Таймер для предотвращения повторного открытия настроек
    m_settingsCooldownTimer = new QTimer(this);
    m_settingsCooldownTimer->setSingleShot(true);
    m_settingsCooldownTimer->setInterval(30000); // 30 секунд
    connect(m_settingsCooldownTimer, &QTimer::timeout, this, [this]() {
        m_settingsOpenedRecently = false;
        qDebug() << "LocationService: Можно снова открывать настройки геолокации";
    });

    // Пробуем создать источник геолокации
    m_source = QGeoPositionInfoSource::createDefaultSource(this);

    if (m_source) {
        connect(m_source, &QGeoPositionInfoSource::positionUpdated, this,
                &LocationService::handlePositionUpdate);
        connect(m_source, &QGeoPositionInfoSource::errorOccurred, this,
                &LocationService::handleError);

        m_source->setUpdateInterval(5000);  // 5 секунд

        qDebug() << "LocationService: Сервис геолокации создан успешно";
        qDebug() << "LocationService: Имя источника:" << m_source->sourceName();
    } else {
        qWarning() << "LocationService: Источник геолокации недоступен на этой платформе";
        qWarning() << "LocationService: Будет использоваться определение по IP";
        m_status = "Доступно (через IP)";
        emit statusChanged();
    }
}

void LocationService::requestLocation() {
    m_active = true;
    emit activeChanged();
    
    // Сбрасываем флаг пересоздания при новом запросе
    m_triedRecreateGps = false;

    if (!m_source) {
        // Если нет GPS, используем определение по IP через API
        qDebug() << "LocationService: GPS недоступен, используем IP геолокацию";
        m_status = "Определение по IP...";
        emit statusChanged();

        // Запрашиваем местоположение через IP API
        QTimer::singleShot(500, this, [this]() { requestIPLocation(); });
        return;
    }

    m_status = "Определение местоположения...";
    emit statusChanged();

    qDebug() << "LocationService: Запрос GPS геолокации";
    qDebug() << "LocationService: Источник:" << m_source->sourceName();
    qDebug() << "LocationService: Минимальный интервал:" << m_source->minimumUpdateInterval()
             << "мс";

    // Проверяем разрешения на Windows (на macOS пропускаем проверку)
#ifdef Q_OS_WIN
    if (!checkLocationPermission()) {
        qDebug() << "LocationService: Разрешение на геолокацию не предоставлено (Windows)";
        m_status = "Нужно разрешение на геолокацию...";
        emit statusChanged();
        
        // На Windows обычно показывается системный диалог запроса разрешения
        // Ждем немного и переключаемся на IP если не получено
        QTimer::singleShot(3000, this, [this]() {
            if (m_active) {
                qDebug() << "LocationService: Переключаемся на IP геолокацию";
                requestIPLocation();
            }
        });
        return;
    }
#endif

    // На macOS разрешения проверяются автоматически при использовании GPS
    // QGeoPositionInfoSource автоматически запрашивает разрешение при первом вызове
    // Если разрешение уже дано в настройках, GPS должен работать сразу
    m_source->setUpdateInterval(1000);  // 1 секунда для быстрого получения
    
    // Пробуем запросить позицию напрямую - если разрешение есть, оно сработает
    // Если нет - получим AccessError в handleError
    qDebug() << "LocationService: Запускаем GPS обновления...";
    m_source->startUpdates();

    // Установим таймер для остановки обновлений после получения позиции
    // Также установим резервный таймер на случай если ничего не придёт
    QTimer::singleShot(15000, this, [this]() {
        if (m_active) {
            qDebug() << "LocationService: Таймаут GPS - переключаемся на IP";
            if (m_source) {
                m_source->stopUpdates();
            }
            m_status = "GPS недоступен, используем IP...";
            emit statusChanged();
            requestIPLocation();
        }
    });
}

void LocationService::stopUpdates() {
    if (m_source) {
        m_source->stopUpdates();
    }

    m_active = false;
    emit activeChanged();

    qDebug() << "LocationService: Остановлено";
}

void LocationService::handlePositionUpdate(const QGeoPositionInfo& info) {
    qDebug() << "LocationService: handlePositionUpdate вызван!";
    qDebug() << "LocationService: Info valid:" << info.isValid();

    if (!info.isValid()) {
        qWarning() << "LocationService: Получена невалидная позиция";
        // Не останавливаем обновления, ждем следующего обновления
        return;
    }

    QGeoCoordinate coord = info.coordinate();
    if (!coord.isValid()) {
        qWarning() << "LocationService: Невалидные координаты";
        return;
    }

    m_latitude = coord.latitude();
    m_longitude = coord.longitude();

    qDebug() << "LocationService: ✓ GPS координаты получены:" << m_latitude << m_longitude;
    
    // GPS работает! Сбрасываем флаг пересоздания
    m_triedRecreateGps = false;

    // Останавливаем обновления после получения первой валидной позиции
    if (m_source) {
        m_source->stopUpdates();
    }

    QString cityName = getCityNameFromCoordinates(m_latitude, m_longitude);

    m_status = QString("✓ GPS: %1").arg(cityName);
    emit statusChanged();
    emit positionChanged(m_latitude, m_longitude);
    emit locationFound(m_latitude, m_longitude, cityName);

    m_active = false;
    emit activeChanged();
    
    qDebug() << "LocationService: GPS геолокация успешна:" << cityName;
}

void LocationService::handleError(QGeoPositionInfoSource::Error error) {
    qDebug() << "LocationService: handleError вызван! Код ошибки:" << error;

    QString errorMsg;

    switch (error) {
        case QGeoPositionInfoSource::AccessError:
            errorMsg =
                "Нет доступа к геолокации. Разрешите доступ в Настройках системы → "
                "Конфиденциальность";
            qWarning() << "LocationService: AccessError - нужны разрешения на геолокацию";
            
            // Останавливаем обновления GPS, чтобы не было бесконечного цикла
            if (m_source) {
                m_source->stopUpdates();
            }
            
            // На macOS иногда нужно пересоздать источник GPS после выдачи разрешения
            // Попробуем пересоздать источник один раз
            if (!m_triedRecreateGps) {
                m_triedRecreateGps = true;
                qDebug() << "LocationService: Пробуем пересоздать GPS источник после AccessError...";
                
                QTimer::singleShot(1500, this, [this]() {
                    // Пересоздаем источник
                    if (m_source) {
                        m_source->deleteLater();
                        m_source = nullptr;
                    }
                    
                    m_source = QGeoPositionInfoSource::createDefaultSource(this);
                    if (m_source) {
                        connect(m_source, &QGeoPositionInfoSource::positionUpdated, this,
                                &LocationService::handlePositionUpdate);
                        connect(m_source, &QGeoPositionInfoSource::errorOccurred, this,
                                &LocationService::handleError);
                        m_source->setUpdateInterval(1000);
                        
                        qDebug() << "LocationService: ✓ Новый GPS источник создан, пробуем снова...";
                        m_status = "Повторная попытка GPS...";
                        emit statusChanged();
                        
                        // Пробуем снова через небольшую задержку
                        QTimer::singleShot(500, this, [this]() {
                            if (m_active && m_source) {
                                m_source->startUpdates();
                                // Сбросим флаг через 5 секунд, чтобы можно было попробовать снова при следующем запросе
                                QTimer::singleShot(5000, this, [this]() {
                                    m_triedRecreateGps = false;
                                });
                            }
                        });
                        return; // Не переключаемся на IP, ждем результат
                    } else {
                        qWarning() << "LocationService: Не удалось пересоздать GPS источник";
                        m_triedRecreateGps = false;
                    }
                });
            }
            
            // Если пересоздание не помогло или уже пробовали - открываем настройки и переключаемся на IP
            if (!m_settingsOpenedRecently) {
                QTimer::singleShot(2000, this, [this]() {
                    qDebug() << "LocationService: Открываем настройки геолокации";
                    openLocationSettings();
                });
            } else {
                qDebug() << "LocationService: Настройки недавно открывались, переключаемся на IP";
            }
            break;
        case QGeoPositionInfoSource::ClosedError:
            errorMsg = "Сервис геолокации закрыт";
            break;
        case QGeoPositionInfoSource::NoError:
            qDebug() << "LocationService: NoError - все ок";
            return;
        default:
            errorMsg = "Таймаут или не удалось определить местоположение";
            qWarning() << "LocationService: Неизвестная ошибка или таймаут";
            break;
    }

    // При любой ошибке GPS переключаемся на IP геолокацию (но не сразу для AccessError)
    if (error != QGeoPositionInfoSource::AccessError) {
        qDebug() << "LocationService: GPS недоступен, переключаемся на IP геолокацию";
        m_status = "GPS недоступен, используем IP...";
        emit statusChanged();
        QTimer::singleShot(1000, this, [this]() { requestIPLocation(); });
    } else {
        // Для AccessError даем время пользователю включить разрешения, затем переключаемся на IP
        qDebug() << "LocationService: Переключаемся на IP геолокацию через 3 секунды";
        m_status = "Разрешение на геолокацию не предоставлено, используем IP...";
        emit statusChanged();
        QTimer::singleShot(3000, this, [this]() { 
            if (m_active) {
                requestIPLocation(); 
            }
        });
    }
}

void LocationService::requestIPLocation() {
    // Проверяем что мы всё ещё активны
    if (!m_active) {
        qDebug() << "LocationService: IP геолокация отменена - уже неактивна";
        return;
    }

    qDebug() << "LocationService: Запрос местоположения через IP API";
    qDebug() << "LocationService: URL: http://ip-api.com/json/";

    // Используем ip-api.com (бесплатный, без ключа)
    // Формат: http://ip-api.com/json/?fields=status,message,country,regionName,city,lat,lon
    QUrl url("http://ip-api.com/json/?fields=status,message,country,regionName,city,lat,lon");
    QNetworkRequest request(url);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    QNetworkReply* reply = m_networkManager->get(request);
    connect(reply, &QNetworkReply::errorOccurred, this,
            [this, reply](QNetworkReply::NetworkError error) {
                qWarning() << "LocationService: Ошибка IP API запроса:" << error;
                reply->deleteLater();

                // Fallback на значения по умолчанию
                if (m_active) {
                    m_latitude = 55.7558;
                    m_longitude = 37.6173;
                    QString cityName = "Москва";

                    m_status = QString("✓ Определено: %1 (по умолчанию)").arg(cityName);
                    emit statusChanged();
                    emit positionChanged(m_latitude, m_longitude);
                    emit locationFound(m_latitude, m_longitude, cityName);

                    m_active = false;
                    emit activeChanged();
                }
            });
}

void LocationService::handleIPLocationResponse(QNetworkReply* reply) {
    if (reply->error() != QNetworkReply::NoError) {
        qWarning() << "LocationService: Ошибка сети при запросе IP API:" << reply->errorString();
        reply->deleteLater();

        // Fallback на значения по умолчанию при ошибке сети
        if (m_active) {
            m_latitude = 55.7558;
            m_longitude = 37.6173;
            QString cityName = "Москва";

            m_status = QString("✓ Определено: %1 (по умолчанию)").arg(cityName);
            emit statusChanged();
            emit positionChanged(m_latitude, m_longitude);
            emit locationFound(m_latitude, m_longitude, cityName);

            m_active = false;
            emit activeChanged();
        }
        return;
    }

    if (!m_active) {
        reply->deleteLater();
        return;
    }

    qDebug() << "LocationService: Получен ответ от IP API";

    QByteArray data = reply->readAll();
    reply->deleteLater();

    qDebug() << "LocationService: Данные от IP API:" << QString::fromUtf8(data);

    QJsonParseError parseError;
    QJsonDocument doc = QJsonDocument::fromJson(data, &parseError);

    if (parseError.error != QJsonParseError::NoError) {
        qWarning() << "LocationService: Ошибка парсинга JSON IP API:" << parseError.errorString();

        // Fallback на значения по умолчанию
        m_latitude = 55.7558;
        m_longitude = 37.6173;
        QString cityName = "Москва";

        m_status = QString("✓ Определено: %1 (по умолчанию)").arg(cityName);
        emit statusChanged();
        emit positionChanged(m_latitude, m_longitude);
        emit locationFound(m_latitude, m_longitude, cityName);

        m_active = false;
        emit activeChanged();
        return;
    }

    QJsonObject root = doc.object();

    // Проверяем статус ответа
    QString status = root["status"].toString();
    if (status != "success") {
        QString message = root["message"].toString();
        qWarning() << "LocationService: IP API вернул ошибку:" << message;

        // Fallback на значения по умолчанию
        m_latitude = 55.7558;
        m_longitude = 37.6173;
        QString cityName = "Москва";

        m_status = QString("✓ Определено: %1 (по умолчанию)").arg(cityName);
        emit statusChanged();
        emit positionChanged(m_latitude, m_longitude);
        emit locationFound(m_latitude, m_longitude, cityName);

        m_active = false;
        emit activeChanged();
        return;
    }

    // Извлекаем данные
    m_latitude = root["lat"].toDouble();
    m_longitude = root["lon"].toDouble();
    QString city = root["city"].toString();
    QString region = root["regionName"].toString();
    QString country = root["country"].toString();

    // Формируем название города
    QString cityName;
    if (!city.isEmpty()) {
        cityName = city;
        if (!region.isEmpty() && region != city) {
            cityName += ", " + region;
        }
    } else if (!region.isEmpty()) {
        cityName = region;
    } else {
        cityName = country;
    }

    if (cityName.isEmpty()) {
        cityName = getCityNameFromCoordinates(m_latitude, m_longitude);
    }

    m_status = QString("✓ Определено: %1").arg(cityName);
    emit statusChanged();
    emit positionChanged(m_latitude, m_longitude);
    emit locationFound(m_latitude, m_longitude, cityName);

    qDebug() << "LocationService: ✓ IP геолокация успешна:" << cityName;
    qDebug() << "LocationService: Координаты:" << m_latitude << m_longitude;
    qDebug() << "LocationService: Страна:" << country << "Регион:" << region;

    m_active = false;
    emit activeChanged();
}

QString LocationService::getCityNameFromCoordinates(double lat, double lon) {
    // Простое определение по приблизительным координатам известных городов
    struct CityCoord {
        QString name;
        double lat;
        double lon;
        double range;  // радиус в градусах (~100км)
    };

    QVector<CityCoord> cities = {
        {"Москва", 55.7558, 37.6173, 1.0},       {"Санкт-Петербург", 59.9311, 30.3609, 1.0},
        {"Казань", 55.7887, 49.1221, 1.0},       {"Сочи", 43.6028, 39.7342, 0.5},
        {"Махачкала", 42.9849, 47.5047, 0.5},    {"Грозный", 43.3178, 45.6986, 0.5},
        {"Екатеринбург", 56.8389, 60.6057, 1.0}, {"Новосибирск", 55.0084, 82.9357, 1.0},
        {"Краснодар", 45.0355, 38.9753, 0.8},    {"Ростов-на-Дону", 47.2357, 39.7015, 0.8},
    };

    for (const auto& city : cities) {
        double distance = qSqrt(qPow(lat - city.lat, 2) + qPow(lon - city.lon, 2));
        if (distance < city.range) {
            return city.name;
        }
    }

    // Если не нашли близкий город, возвращаем координаты
    return QString("Координаты: %1°N, %2°E").arg(lat, 0, 'f', 2).arg(lon, 0, 'f', 2);
}

void LocationService::openLocationSettings() {
    // Проверяем, не открывали ли мы настройки недавно
    if (m_settingsOpenedRecently) {
        qDebug() << "LocationService: Настройки недавно открывались, пропускаем";
        return;
    }
    
#ifdef Q_OS_MACOS
    qDebug() << "LocationService: Открытие настроек геолокации macOS";
    
    // Устанавливаем флаг, что мы только что открыли настройки
    m_settingsOpenedRecently = true;
    m_settingsCooldownTimer->start();
    
    // Открываем системные настройки macOS на странице геолокации
    QProcess process;
    process.start("open", QStringList() << "x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices");
    process.waitForFinished(3000);
    
    if (process.exitCode() == 0) {
        qDebug() << "LocationService: ✓ Настройки геолокации открыты";
        m_status = "Включите геолокацию для JummahPrayer в настройках. Затем перезапустите приложение.";
        emit statusChanged();
        
        // Через 10 секунд после открытия настроек автоматически перепроверяем разрешение
        // Но не делаем это если уже переключились на IP
        QTimer::singleShot(10000, this, [this]() {
            if (m_active && m_source) {
                qDebug() << "LocationService: Автоматическая перепроверка разрешения через 10 секунд";
                m_status = "Проверка разрешения...";
                emit statusChanged();
                recheckPermission();
            }
        });
    } else {
        qWarning() << "LocationService: Не удалось открыть настройки";
        // Альтернативный способ - открыть общие настройки
        QProcess::execute("open", QStringList() << "x-apple.systempreferences:com.apple.preference.security");
        m_settingsOpenedRecently = false; // Сбрасываем флаг при ошибке
    }
    
#elif defined(Q_OS_WIN)
    qDebug() << "LocationService: Открытие настроек геолокации Windows";
    
    // Устанавливаем флаг, что мы только что открыли настройки
    m_settingsOpenedRecently = true;
    m_settingsCooldownTimer->start();
    
    // На Windows 10/11 открываем настройки конфиденциальности через ms-settings
    QProcess process;
    
    // Windows 10/11: открываем настройки конфиденциальности -> Расположение
    // Способ 1: через ms-settings URI (Windows 10+)
    process.start("cmd", QStringList() << "/c" << "start" << "ms-settings:privacy-location");
    process.waitForFinished(2000);
    
    if (process.exitCode() == 0) {
        qDebug() << "LocationService: ✓ Настройки геолокации Windows открыты";
        m_status = "Включите геолокацию для этого устройства в настройках Windows";
        emit statusChanged();
        
        // Через 10 секунд перепроверяем разрешение
        QTimer::singleShot(10000, this, [this]() {
            if (m_active && m_source) {
                qDebug() << "LocationService: Автоматическая перепроверка разрешения через 10 секунд";
                m_status = "Проверка разрешения...";
                emit statusChanged();
                recheckPermission();
            }
        });
    } else {
        qWarning() << "LocationService: Не удалось открыть настройки Windows";
        // Альтернативный способ - открыть общие настройки
        QProcess::execute("cmd", QStringList() << "/c" << "start" << "ms-settings:");
        m_settingsOpenedRecently = false;
    }
    
#elif defined(Q_OS_LINUX)
    qDebug() << "LocationService: Открытие настроек геолокации Linux";
    
    // На Linux обычно используется GeoClue или другие сервисы
    // Попробуем открыть настройки через различные инструменты
    QProcess process;
    
    // Попробуем открыть через различные DE настройки
    QStringList commands = {
        "gnome-control-center privacy",  // GNOME
        "kde5-systemsettings",            // KDE
        "systemsettings",                 // KDE (старая версия)
        "unity-control-center privacy"    // Unity
    };
    
    bool opened = false;
    for (const QString& cmd : commands) {
        QString program = cmd.split(' ').first();
        QStringList args = cmd.split(' ').mid(1);
        
        process.start(program, args);
        if (process.waitForFinished(1000) && process.exitCode() == 0) {
            qDebug() << "LocationService: ✓ Настройки открыты через" << program;
            opened = true;
            break;
        }
    }
    
    if (!opened) {
        qWarning() << "LocationService: Не удалось открыть настройки Linux автоматически";
        m_status = "Пожалуйста, включите геолокацию в настройках вашей системы";
        emit statusChanged();
    } else {
        m_settingsOpenedRecently = true;
        m_settingsCooldownTimer->start();
    }
    
#else
    qWarning() << "LocationService: openLocationSettings не реализован для этой платформы";
    m_status = "Пожалуйста, включите геолокацию в настройках системы";
    emit statusChanged();
#endif
}

void LocationService::forceRequestPermission() {
    qDebug() << "LocationService: Принудительный запрос разрешения на геолокацию";
    
    if (!m_source) {
        qWarning() << "LocationService: GPS источник недоступен";
        openLocationSettings();
        return;
    }
    
    // Останавливаем текущие обновления если они есть
    if (m_source) {
        m_source->stopUpdates();
    }
    
    // Сбрасываем источник и создаем заново для принудительного запроса разрешения
    m_source->deleteLater();
    m_source = nullptr;
    
    // Создаем новый источник
    m_source = QGeoPositionInfoSource::createDefaultSource(this);
    
    if (m_source) {
        connect(m_source, &QGeoPositionInfoSource::positionUpdated, this,
                &LocationService::handlePositionUpdate);
        connect(m_source, &QGeoPositionInfoSource::errorOccurred, this,
                &LocationService::handleError);
        
        m_source->setUpdateInterval(1000);
        
        qDebug() << "LocationService: Новый GPS источник создан, запрашиваем разрешение...";
        
        // Пробуем запросить позицию - это должно вызвать диалог разрешения
        m_active = true;
        emit activeChanged();
        
        m_status = "Запрос разрешения на геолокацию...";
        emit statusChanged();
        
        // Используем startUpdates для принудительного запроса разрешения
        m_source->startUpdates();
        
        // Установим таймер на случай если разрешение не будет предоставлено
        QTimer::singleShot(5000, this, [this]() {
            if (m_active && m_source) {
                qDebug() << "LocationService: Разрешение не получено, открываем настройки";
                if (m_source) {
                    m_source->stopUpdates();
                }
                openLocationSettings();
            }
        });
    } else {
        qWarning() << "LocationService: Не удалось создать GPS источник";
        openLocationSettings();
    }
}

void LocationService::recheckPermission() {
    qDebug() << "LocationService: Перепроверка разрешения на геолокацию";
    
    // Останавливаем текущие обновления
    if (m_source) {
        m_source->stopUpdates();
        m_source->deleteLater();
        m_source = nullptr;
    }
    
    // Создаем новый источник - это должно подхватить новое разрешение
    m_source = QGeoPositionInfoSource::createDefaultSource(this);
    
    if (m_source) {
        connect(m_source, &QGeoPositionInfoSource::positionUpdated, this,
                &LocationService::handlePositionUpdate);
        connect(m_source, &QGeoPositionInfoSource::errorOccurred, this,
                &LocationService::handleError);
        
        m_source->setUpdateInterval(1000);
        
        qDebug() << "LocationService: ✓ Новый GPS источник создан, пробуем GPS...";
        m_status = "Проверка GPS...";
        emit statusChanged();
        
        // Пробуем запросить позицию напрямую - если разрешение есть, оно сработает
        m_active = true;
        emit activeChanged();
        
        // Запускаем обновления - если разрешение дано, GPS заработает
        m_source->startUpdates();
        
        // Установим таймер на случай если GPS все еще не работает
        QTimer::singleShot(8000, this, [this]() {
            if (m_active && m_source) {
                // Проверяем, получили ли мы позицию (не значения по умолчанию)
                bool isDefaultLocation = (qAbs(m_latitude - 55.7558) < 0.01 && qAbs(m_longitude - 37.6173) < 0.01);
                if (isDefaultLocation) {
                    // Это значения по умолчанию, значит GPS не сработал
                    qWarning() << "LocationService: GPS не отвечает после предоставления разрешения";
                    qWarning() << "LocationService: Возможно нужно перезапустить приложение";
                    m_status = "GPS не отвечает. Перезапустите приложение после выдачи разрешения.";
                    emit statusChanged();
                    if (m_source) {
                        m_source->stopUpdates();
                    }
                    // Переключаемся на IP геолокацию
                    requestIPLocation();
                } else {
                    qDebug() << "LocationService: ✓ GPS работает! Координаты получены";
                }
            }
        });
    } else {
        qWarning() << "LocationService: Не удалось создать GPS источник";
        m_status = "GPS недоступен";
        emit statusChanged();
        // Переключаемся на IP геолокацию
        if (m_active) {
            requestIPLocation();
        }
    }
}

bool LocationService::checkLocationPermission() {
#ifdef Q_OS_MACOS
    // ВАЖНО: QLocationPermission API не работает на macOS без permission plugin
    // Поэтому мы НЕ используем эту функцию для проверки разрешений
    // Вместо этого просто пробуем использовать GPS напрямую
    // Если разрешение дано в системных настройках, GPS заработает
    // Если нет - получим AccessError в handleError
    
    qDebug() << "LocationService: checkLocationPermission вызывается, но на macOS не используется";
    qDebug() << "LocationService: Вместо этого используем GPS напрямую";
    
    // Всегда возвращаем true, чтобы не блокировать попытку использовать GPS
    // Реальная проверка произойдет когда попытаемся использовать GPS
    return true;
    
#elif defined(Q_OS_WIN)
    // На Windows QLocationPermission API работает лучше
    QLocationPermission permission;
    permission.setAvailability(QLocationPermission::WhenInUse);
    
    QGuiApplication* app = qobject_cast<QGuiApplication*>(QGuiApplication::instance());
    if (!app) {
        qWarning() << "LocationService: Не удалось получить экземпляр приложения";
        return false;
    }
    
    Qt::PermissionStatus status = app->checkPermission(permission);
    qDebug() << "LocationService: Статус разрешения на геолокацию (Windows):" << status;
    
    if (status == Qt::PermissionStatus::Undetermined) {
        // Разрешение еще не запрашивалось - запрашиваем
        qDebug() << "LocationService: Запрашиваем разрешение на геолокацию (Windows)";
        app->requestPermission(permission, this, [this](const QPermission &p) {
            Qt::PermissionStatus newStatus = p.status();
            qDebug() << "LocationService: Результат запроса разрешения (Windows):" << newStatus;
            if (newStatus == Qt::PermissionStatus::Granted) {
                // Если разрешение предоставлено, пробуем снова запросить местоположение
                QTimer::singleShot(500, this, [this]() {
                    if (m_active && m_source) {
                        qDebug() << "LocationService: Разрешение получено (Windows), запускаем GPS";
                        m_source->startUpdates();
                    }
                });
            }
        });
        return false; // Пока разрешение не предоставлено
    }
    
    bool granted = (status == Qt::PermissionStatus::Granted);
    if (granted) {
        qDebug() << "LocationService: ✓ Разрешение на геолокацию предоставлено (Windows)";
    } else {
        qDebug() << "LocationService: ✗ Разрешение на геолокацию не предоставлено (Windows)";
    }
    
    return granted;
    
#else
    // На Linux и других платформах обычно разрешение не требуется явно
    // или запрашивается автоматически
    return true;
#endif
}
