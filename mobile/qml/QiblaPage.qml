import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtSensors
import "." as App

Page {
    id: root
    
    property var prayerCalc
    property var appSettings
    property real deviceHeading: 0  // Текущее направление телефона
    
    title: qsTr("Компас Киблы")
    
    // Датчик компаса телефона
    Compass {
        id: compassSensor
        active: true
        dataRate: 25  // 25 Hz обновление
        
        onReadingChanged: {
            if (reading && reading.azimuth !== undefined) {
                deviceHeading = reading.azimuth
                console.log("Компас: направление устройства =", deviceHeading.toFixed(1), "°")
            }
        }
        
        Component.onCompleted: {
            if (compassSensor.connectedToBackend) {
                console.log("✓ Компас подключен")
            } else {
                console.log("⚠ Компас недоступен, используется ручная симуляция")
            }
        }
    }
    
    // Функция для симуляции поворота телефона
    function rotateDevice(degrees) {
        deviceHeading = (deviceHeading + degrees + 360) % 360
        console.log("Симуляция: телефон повёрнут на", degrees, "°, новое направление =", deviceHeading.toFixed(1), "°")
    }
    
    background: Rectangle {
        color: App.Theme.backgroundColor
    }
    
    Rectangle {
        anchors.fill: parent
        color: App.Theme.backgroundColor
        
        ColumnLayout {
            anchors.fill: parent
            spacing: 0
            
            // Заголовок с градиентом
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 90
                gradient: Gradient {
                    GradientStop { position: 0.0; color: App.Theme.primaryColor }
                    GradientStop { position: 1.0; color: App.Theme.primaryLight }
                }
                
                Text {
                    anchors.centerIn: parent
                    text: App.Translator.tr("Direction to Kaaba")
                    font.pixelSize: 26
                    font.bold: true
                    color: "white"
                }
            }
            
            // Информация о местоположении
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 110
                color: App.Theme.surfaceColor
                
                ColumnLayout {
                    anchors.centerIn: parent
                    spacing: 10
                    
                    Text {
                        Layout.alignment: Qt.AlignHCenter
                        text: "📍"
                        font.pixelSize: 28
                    }
                    
                    Text {
                        Layout.alignment: Qt.AlignHCenter
                        text: prayerCalc ? prayerCalc.city : "Москва"
                        font.pixelSize: 22
                        font.bold: true
                        color: App.Theme.textColor
                    }
                    
                    Text {
                        Layout.alignment: Qt.AlignHCenter
                        text: prayerCalc ? `${prayerCalc.latitude.toFixed(2)}°N, ${prayerCalc.longitude.toFixed(2)}°E` : ""
                        font.pixelSize: 13
                        color: App.Theme.secondaryTextColor
                    }
                }
            }
            
            // Компас
            Item {
                Layout.fillWidth: true
                Layout.fillHeight: true
                
                // Круг компаса
                Rectangle {
                    id: compassCircle
                    width: Math.min(parent.width, parent.height) * 0.7
                    height: width
                    anchors.centerIn: parent
                    radius: width / 2
                    color: App.Theme.cardColor
                    border.color: App.Theme.primaryColor
                    border.width: 6
                    
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        anchors.top: parent.top
                        anchors.topMargin: 20
                        text: App.Translator.tr("N")
                        font.pixelSize: 24
                        font.bold: true
                        color: App.Theme.primaryColor
                        rotation: -deviceHeading
                        transformOrigin: Item.Center
                        
                        Behavior on rotation {
                            RotationAnimation {
                                duration: 100
                                direction: RotationAnimation.Shortest
                            }
                        }
                    }
                    
                    // Стрелка направления на Киблу (вращается относительно устройства)
                    Rectangle {
                        width: parent.width * 0.6
                        height: 6
                        color: App.Theme.primaryColor
                        anchors.centerIn: parent
                        // Стрелка = азимут Киблы минус текущее направление устройства
                        rotation: calculateQiblaDirection() - deviceHeading
                        transformOrigin: Item.Center
                        
                        Behavior on rotation {
                            RotationAnimation {
                                duration: 200
                                direction: RotationAnimation.Shortest
                            }
                        }
                        
                        // Наконечник стрелки (треугольник)
                        Canvas {
                            width: 30
                            height: 30
                            anchors.right: parent.right
                            anchors.verticalCenter: parent.verticalCenter
                            
                            onPaint: {
                                var ctx = getContext("2d")
                                ctx.fillStyle = App.Theme.primaryColor
                                ctx.beginPath()
                                ctx.moveTo(0, 15)
                                ctx.lineTo(30, 15)
                                ctx.lineTo(15, 0)
                                ctx.closePath()
                                ctx.fill()
                            }
                        }
                    }
                    
                    // Кааба в центре
                    Text {
                        anchors.centerIn: parent
                        text: "🕋"
                        font.pixelSize: 48
                    }
                }
            }
            
            // Информация о направлении
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 180
                color: App.Theme.surfaceColor
                
                ColumnLayout {
                    anchors.centerIn: parent
                    spacing: 20
                    
                    Text {
                        Layout.alignment: Qt.AlignHCenter
                        text: App.Translator.tr("Qibla Azimuth")
                        font.pixelSize: 18
                        font.bold: true
                        color: App.Theme.textColor
                    }
                    
                    RowLayout {
                        Layout.alignment: Qt.AlignHCenter
                        spacing: 24
                        
                        // Карточка направления
                        Rectangle {
                            Layout.preferredWidth: 150
                            Layout.preferredHeight: 90
                            radius: App.Theme.radiusMedium
                            color: App.Theme.cardColor
                            border.color: App.Theme.primaryColor
                            border.width: 2
                            
                            ColumnLayout {
                                anchors.centerIn: parent
                                spacing: 8
                                
                                Text {
                                    Layout.alignment: Qt.AlignHCenter
                                    text: App.Translator.tr("Direction")
                                    font.pixelSize: 13
                                    color: App.Theme.secondaryTextColor
                                }
                                
                                Text {
                                    Layout.alignment: Qt.AlignHCenter
                                    text: Math.round(calculateQiblaDirection()) + "°"
                                    font.pixelSize: 36
                                    font.bold: true
                                    color: App.Theme.primaryColor
                                }
                            }
                        }
                        
                        // Карточка расстояния
                        Rectangle {
                            Layout.preferredWidth: 150
                            Layout.preferredHeight: 90
                            radius: App.Theme.radiusMedium
                            color: App.Theme.cardColor
                            border.color: App.Theme.accentColor
                            border.width: 2
                            
                            ColumnLayout {
                                anchors.centerIn: parent
                                spacing: 8
                                
                                Text {
                                    Layout.alignment: Qt.AlignHCenter
                                    text: App.Translator.tr("Distance")
                                    font.pixelSize: 13
                                    color: App.Theme.secondaryTextColor
                                }
                                
                                Text {
                                    Layout.alignment: Qt.AlignHCenter
                                    text: Math.round(calculateDistance()) + " км"
                                    font.pixelSize: 36
                                    font.bold: true
                                    color: App.Theme.accentColor
                                }
                            }
                        }
                    }
                }
            }
            
            // Инструкция
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 70
                Layout.leftMargin: 20
                Layout.rightMargin: 20
                Layout.bottomMargin: 20
                radius: App.Theme.radiusMedium
                gradient: Gradient {
                    GradientStop { position: 0.0; color: "#E8F5E9" }
                    GradientStop { position: 1.0; color: "#C8E6C9" }
                }
                
                RowLayout {
                    anchors.fill: parent
                    anchors.margins: 16
                    spacing: 12
                    
                    Text {
                        text: "💡"
                        font.pixelSize: 28
                    }
                    
                    Text {
                        Layout.fillWidth: true
                        text: App.Translator.tr("Rotate device instruction")
                        font.pixelSize: 13
                        color: "#1B5E20"
                        wrapMode: Text.WordWrap
                        verticalAlignment: Text.AlignVCenter
                    }
                }
            }
        }
    }
    
    // Расчет направления на Киблу (Мекка: 21.4225°N, 39.8262°E)
    function calculateQiblaDirection() {
        if (!prayerCalc) return 0
        
        const meccaLat = 21.4225
        const meccaLon = 39.8262
        const lat = prayerCalc.latitude
        const lon = prayerCalc.longitude
        
        const dLon = (meccaLon - lon) * Math.PI / 180
        const lat1 = lat * Math.PI / 180
        const lat2 = meccaLat * Math.PI / 180
        
        const y = Math.sin(dLon) * Math.cos(lat2)
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
        
        let bearing = Math.atan2(y, x) * 180 / Math.PI
        return (bearing + 360) % 360
    }
    
    // Расчет расстояния до Мекки
    function calculateDistance() {
        if (!prayerCalc) return 0
        
        const meccaLat = 21.4225
        const meccaLon = 39.8262
        const lat = prayerCalc.latitude
        const lon = prayerCalc.longitude
        
        const R = 6371 // Радиус Земли в км
        const dLat = (meccaLat - lat) * Math.PI / 180
        const dLon = (meccaLon - lon) * Math.PI / 180
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(meccaLat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2)
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        return R * c
    }
}

