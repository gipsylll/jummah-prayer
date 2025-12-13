#ifndef APPSETTINGS_H
#define APPSETTINGS_H

#include <QObject>
#include <QSettings>

class AppSettings : public QObject {
    Q_OBJECT
    Q_PROPERTY(bool darkTheme READ darkTheme WRITE setDarkTheme NOTIFY darkThemeChanged)
    Q_PROPERTY(
        bool notifications READ notifications WRITE setNotifications NOTIFY notificationsChanged)
    Q_PROPERTY(int calculationMethod READ calculationMethod WRITE setCalculationMethod NOTIFY
                   calculationMethodChanged)
    Q_PROPERTY(
        QString calculationMethodName READ calculationMethodName NOTIFY calculationMethodChanged)
    Q_PROPERTY(int madhhab READ madhhab WRITE setMadhhab NOTIFY madhhabChanged)
    Q_PROPERTY(QString language READ language WRITE setLanguage NOTIFY languageChanged)
    Q_PROPERTY(
        double savedLatitude READ savedLatitude WRITE setSavedLatitude NOTIFY savedLocationChanged)
    Q_PROPERTY(double savedLongitude READ savedLongitude WRITE setSavedLongitude NOTIFY
                   savedLocationChanged)
    Q_PROPERTY(QString savedCity READ savedCity WRITE setSavedCity NOTIFY savedLocationChanged)

   public:
    explicit AppSettings(QObject* parent = nullptr);

    bool darkTheme() const { return m_darkTheme; }
    void setDarkTheme(bool value);

    bool notifications() const { return m_notifications; }
    void setNotifications(bool value);

    int calculationMethod() const { return m_calculationMethod; }
    void setCalculationMethod(int method);
    QString calculationMethodName() const;

    int madhhab() const { return m_madhhab; }
    void setMadhhab(int value);

    QString language() const { return m_language; }
    void setLanguage(const QString& lang);

    double savedLatitude() const { return m_savedLatitude; }
    void setSavedLatitude(double lat);

    double savedLongitude() const { return m_savedLongitude; }
    void setSavedLongitude(double lon);

    QString savedCity() const { return m_savedCity; }
    void setSavedCity(const QString& city);

    Q_INVOKABLE void saveLocation(double lat, double lon, const QString& city);

   signals:
    void darkThemeChanged();
    void notificationsChanged();
    void calculationMethodChanged();
    void madhhabChanged();
    void languageChanged();
    void savedLocationChanged();

   private:
    QSettings m_settings;
    bool m_darkTheme;
    bool m_notifications;
    int m_calculationMethod;  // 0-5
    int m_madhhab;            // 0=Shafi, 1=Hanafi
    QString m_language;
    double m_savedLatitude;
    double m_savedLongitude;
    QString m_savedCity;

    void loadSettings();
    void saveSettings();
};

#endif  // APPSETTINGS_H
