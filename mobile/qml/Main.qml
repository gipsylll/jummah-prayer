import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import PrayerTimes 1.0
import AppSettings 1.0
import "." as App
import "components" as Components

ApplicationWindow {
    id: root
    objectName: "mainWindow"
    visible: true
    width: 400
    height: 750
    title: qsTr("Jummah Prayer")

    // Используем глобальные объекты из C++
    property var prayerCalc: globalPrayerCalc
    property var appSettings: globalAppSettings
    property var locationService: globalLocationService
    property var notificationService: globalNotificationService
    
    // Свойство для управления текущей страницей
    property alias currentPageIndex: swipeView.currentIndex
    
    Component.onCompleted: {
        App.Theme.darkMode = appSettings.darkTheme
        App.Translator.setLanguage(appSettings.language)
        console.log("=== Main.qml loaded ===")
        console.log("prayerCalc ID:", prayerCalc)
        console.log("appSettings ID:", appSettings)
        console.log("Prayer times:", prayerCalc.prayerTimes)
    }
    
    Connections {
        target: appSettings
        function onDarkThemeChanged() {
            App.Theme.darkMode = appSettings.darkTheme
            console.log("Темная тема изменена:", appSettings.darkTheme)
        }
        function onLanguageChanged() {
            App.Translator.setLanguage(appSettings.language)
            console.log("Язык изменён:", appSettings.language)
        }
    }

    // Применяем фон
    background: Rectangle {
        color: App.Theme.backgroundColor
    }

    // Таймер для обновления
    Timer {
        interval: 60000
        running: true
        repeat: true
        onTriggered: prayerCalc.calculatePrayerTimes()
    }

    // SwipeView для навигации между страницами
    SwipeView {
        id: swipeView
        anchors.fill: parent
        currentIndex: 0
        interactive: true // Включаем свайп
        
        MainPage {
            prayerCalc: root.prayerCalc
            appSettings: root.appSettings
            notificationService: root.notificationService
        }
        
        // QiblaPage {
        //     prayerCalc: root.prayerCalc
        //     appSettings: root.appSettings
        // }
        
        DhikrPage {
            appSettings: root.appSettings
        }
        
        SettingsPage {
            prayerCalc: root.prayerCalc
            appSettings: root.appSettings
            locationService: root.locationService
            notificationService: root.notificationService
        }
    }

    // Нижняя навигационная панель с улучшенным дизайном
    footer: Rectangle {
        height: 80
        color: App.Theme.surfaceColor
        
        // Верхняя граница
        Rectangle {
            anchors.top: parent.top
            width: parent.width
            height: 1
            color: App.Theme.dividerColor
        }
        
        // Анимированный индикатор активной вкладки
        Rectangle {
            id: activeIndicator
            anchors.bottom: parent.top
            anchors.bottomMargin: -3
            width: parent.width / 3
            height: 3
            color: App.Theme.primaryColor
            radius: 1.5
            
            Behavior on x {
                NumberAnimation { 
                    duration: App.Theme.animationNormal
                    easing.type: Easing.OutCubic 
                }
            }
            
            x: swipeView.currentIndex * (parent.width / 3)
        }
        
        Row {
            anchors.fill: parent
            spacing: 0
            
            // Улучшенные кнопки навигации
            Repeater {
                model: [
                    {icon: "🏠", text: "Time", index: 0},
                    // {icon: "🧭", text: "Qibla", index: 1},
                    {icon: "📿", text: "Dhikr", index: 1},
                    {icon: "⚙️", text: "Settings", index: 2}
                ]
                
                Rectangle {
                    width: parent.width / 3
                    height: parent.height
                    color: "transparent"
                    
                    ColumnLayout {
                        anchors.centerIn: parent
                        spacing: 6
                        
                        Text {
                            Layout.alignment: Qt.AlignHCenter
                            text: modelData.icon
                            font.pixelSize: swipeView.currentIndex === modelData.index ? 30 : 26
                            scale: swipeView.currentIndex === modelData.index ? 1.0 : 0.95
                            
                            Behavior on font.pixelSize {
                                NumberAnimation { duration: App.Theme.animationFast }
                            }
                            
                            Behavior on scale {
                                NumberAnimation { duration: App.Theme.animationFast }
                            }
                        }
                        
                        Text {
                            Layout.alignment: Qt.AlignHCenter
                            text: App.Translator.tr(modelData.text)
                            font.pixelSize: 12
                            font.weight: swipeView.currentIndex === modelData.index ? Font.Bold : Font.Normal
                            color: swipeView.currentIndex === modelData.index ? 
                                   App.Theme.primaryColor : App.Theme.secondaryTextColor
                            
                            Behavior on color {
                                ColorAnimation { duration: App.Theme.animationFast }
                            }
                            
                            Behavior on font.weight {
                                NumberAnimation { duration: App.Theme.animationFast }
                            }
                        }
                    }
                    
                    MouseArea {
                        anchors.fill: parent
                        onClicked: {
                            swipeView.currentIndex = modelData.index
                        }
                        
                        onPressed: parent.scale = 0.92
                        onReleased: parent.scale = 1.0
                        onCanceled: parent.scale = 1.0
                    }
                    
                    Behavior on scale {
                        NumberAnimation { duration: 100 }
                    }
                }
            }
        }
    }
}
