import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import NotificationService 1.0
import "." as App
import "components" as Components

Page {
    id: root
    
    property var prayerCalc
    property var appSettings
    property var locationService
    property var notificationService
    
    title: qsTr("Настройки")
    
    background: Rectangle {
        color: App.Theme.backgroundColor
    }
    
    ScrollView {
        anchors.fill: parent
        clip: true
        contentWidth: availableWidth
        
        ColumnLayout {
            width: parent.width
            spacing: 0
            
            // Заголовок
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 90
                gradient: Gradient {
                    GradientStop { position: 0.0; color: App.Theme.primaryColor }
                    GradientStop { position: 1.0; color: App.Theme.primaryLight }
                }
                
                Text {
                    anchors.centerIn: parent
                    text: "⚙️ " + App.Translator.tr("Settings")
                    font.pixelSize: 26
                    font.bold: true
                    color: "white"
                }
            }
            
            // Отступ сверху
            Item {
                Layout.fillWidth: true
                Layout.preferredHeight: 20
            }
            
            // Секция: Местоположение
            Rectangle {
                Layout.fillWidth: true
                Layout.margins: 16
                Layout.topMargin: 0
                implicitHeight: locationColumn.implicitHeight + 40
                color: App.Theme.cardColor
                radius: App.Theme.radiusLarge
                
                ColumnLayout {
                    id: locationColumn
                    anchors.fill: parent
                    anchors.margins: 20
                    spacing: 16
                    
                    // Заголовок секции
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 12
                        
                        Rectangle {
                            width: 4
                            height: sectionTitle1.height
                            color: App.Theme.primaryColor
                            radius: 2
                        }
                        
                        Text {
                            id: sectionTitle1
                            text: App.Translator.tr("Location")
                            font.pixelSize: 20
                            font.bold: true
                            color: App.Theme.primaryColor
                        }
                    }
                    
                    // Текущий город
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 10
                        
                        Text {
                            text: App.Translator.tr("Current City")
                            font.pixelSize: 14
                            color: App.Theme.secondaryTextColor
                        }
                        
                        Rectangle {
                            Layout.fillWidth: true
                            height: 60
                            radius: App.Theme.radiusMedium
                            color: App.Theme.backgroundColor
                            
                            RowLayout {
                                anchors.fill: parent
                                anchors.margins: 16
                                spacing: 12
                                
                                Text {
                                    text: "📍"
                                    font.pixelSize: 24
                                }
                                
                                ColumnLayout {
                                    Layout.fillWidth: true
                                    spacing: 4
                                    
                                    Text {
                                        text: prayerCalc ? prayerCalc.city : "Москва"
                                        font.pixelSize: 16
                                        font.bold: true
                                        color: App.Theme.textColor
                                    }
                                    
                                    Text {
                                        text: prayerCalc ? `${prayerCalc.latitude.toFixed(2)}°N, ${prayerCalc.longitude.toFixed(2)}°E` : ""
                                        font.pixelSize: 11
                                        color: App.Theme.secondaryTextColor
                                    }
                                }
                            }
                        }
                    }
                    
                    // Кнопки выбора местоположения
                    Row {
                        Layout.fillWidth: true
                        spacing: 12
                        
                        Button {
                            width: (parent.width - parent.spacing) / 2
                            height: 50
                            text: App.Translator.tr("From List")
                            
                            contentItem: Text {
                                text: parent.text
                                font: parent.font
                                color: App.Theme.primaryColor
                                horizontalAlignment: Text.AlignHCenter
                                verticalAlignment: Text.AlignVCenter
                            }
                            
                            background: Rectangle {
                                color: parent.pressed ? Qt.darker(App.Theme.backgroundColor, 1.1) : App.Theme.backgroundColor
                                border.color: App.Theme.primaryColor
                                border.width: 2
                                radius: App.Theme.radiusMedium
                            }
                            
                            onClicked: cityDialog.open()
                        }
                        
                        Button {
                            width: (parent.width - parent.spacing) / 2
                            height: 50
                            text: App.Translator.tr("Auto-detect")
                            
                            contentItem: Text {
                                text: parent.text
                                font: parent.font
                                color: "white"
                                horizontalAlignment: Text.AlignHCenter
                                verticalAlignment: Text.AlignVCenter
                            }
                            
                            background: Rectangle {
                                gradient: Gradient {
                                    GradientStop { position: 0.0; color: parent.pressed ? Qt.darker(App.Theme.primaryColor, 1.3) : App.Theme.primaryColor }
                                    GradientStop { position: 1.0; color: parent.pressed ? Qt.darker(App.Theme.primaryLight, 1.3) : App.Theme.primaryLight }
                                }
                                radius: App.Theme.radiusMedium
                            }
                            
                            onClicked: {
                                if (locationService) {
                                    locationService.requestLocation()
                                }
                            }
                        }
                    }
                    
                    // Статус геолокации
                    Text {
                        Layout.fillWidth: true
                        text: locationService ? locationService.status : ""
                        font.pixelSize: 12
                        color: App.Theme.secondaryTextColor
                        wrapMode: Text.WordWrap
                        visible: locationService && locationService.status !== "Не активно"
                    }
                }
            }
            
            // Секция: Метод расчета
            Rectangle {
                Layout.fillWidth: true
                Layout.margins: 16
                implicitHeight: methodColumn.implicitHeight + 40
                color: App.Theme.cardColor
                radius: App.Theme.radiusLarge
                
                ColumnLayout {
                    id: methodColumn
                    anchors.fill: parent
                    anchors.margins: 20
                    spacing: 16
                    
                    // Заголовок секции
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 12
                        
                        Rectangle {
                            width: 4
                            height: sectionTitle2.height
                            color: App.Theme.primaryColor
                            radius: 2
                        }
                        
                        Text {
                            id: sectionTitle2
                            text: App.Translator.tr("Calculation Method")
                            font.pixelSize: 20
                            font.bold: true
                            color: App.Theme.primaryColor
                        }
                    }
                    
                    ComboBox {
                        id: calculationMethodCombo
                        Layout.fillWidth: true
                        model: ListModel {
                            ListElement { text: "MWL - Muslim World League" }
                            ListElement { text: "ISNA - Islamic Society" }
                            ListElement { text: "Egypt - Egyptian Authority" }
                            ListElement { text: "Makkah - Umm al-Qura" }
                            ListElement { text: "Karachi - Islamic Sciences" }
                            ListElement { text: "Tehran - Geophysics" }
                        }
                        textRole: "text"
                        currentIndex: 0
                        
                        delegate: ItemDelegate {
                            width: calculationMethodCombo.width
                            text: model.text
                            highlighted: calculationMethodCombo.highlightedIndex === index
                        }
                        
                        contentItem: Text {
                            text: calculationMethodCombo.displayText
                            font: calculationMethodCombo.font
                            color: App.Theme.textColor
                            verticalAlignment: Text.AlignVCenter
                            elide: Text.ElideRight
                            leftPadding: 16
                        }
                        
                        background: Rectangle {
                            color: App.Theme.backgroundColor
                            border.color: App.Theme.borderColor
                            border.width: 1
                            radius: App.Theme.radiusMedium
                        }
                        
                        Component.onCompleted: {
                            if (appSettings) {
                                currentIndex = appSettings.calculationMethod
                            }
                        }
                        
                        onActivated: function(index) {
                            if (appSettings && prayerCalc) {
                                appSettings.calculationMethod = index
                                prayerCalc.setCalculationMethod(index)
                            }
                        }
                    }
                    
                    Rectangle {
                        Layout.fillWidth: true
                        implicitHeight: methodAnglesText.implicitHeight + 20
                        radius: App.Theme.radiusMedium
                        color: Qt.rgba(App.Theme.infoColor.r, App.Theme.infoColor.g, App.Theme.infoColor.b, 0.1)
                        
                        Text {
                            id: methodAnglesText
                            anchors.fill: parent
                            anchors.margins: 10
                            text: getMethodDescription(calculationMethodCombo.currentIndex)
                            font.pixelSize: 12
                            color: App.Theme.secondaryTextColor
                            wrapMode: Text.WordWrap
                            
                            function getMethodDescription(index) {
                                switch(index) {
                                    case 0: return qsTr("Угол Фаджр: 18°, угол Иша: 17°")
                                    case 1: return qsTr("Угол Фаджр: 15°, угол Иша: 15°")
                                    case 2: return qsTr("Угол Фаджр: 19.5°, угол Иша: 17.5°")
                                    case 3: return qsTr("Угол Фаджр: 18.5°, Иша: 90 мин после Магриб")
                                    case 4: return qsTr("Угол Фаджр: 18°, угол Иша: 18°")
                                    case 5: return qsTr("Угол Фаджр: 17.7°, угол Иша: 14°")
                                    default: return qsTr("Угол Фаджр: 18°, угол Иша: 18°")
                                }
                            }
                            
                            Connections {
                                target: calculationMethodCombo
                                function onCurrentIndexChanged() {
                                    methodAnglesText.text = methodAnglesText.getMethodDescription(calculationMethodCombo.currentIndex)
                                }
                            }
                        }
                    }
                }
            }
            
            // Секция: Мазхаб
            Rectangle {
                Layout.fillWidth: true
                Layout.margins: 16
                implicitHeight: madhhabColumn.implicitHeight + 40
                color: App.Theme.cardColor
                radius: App.Theme.radiusLarge
                
                ColumnLayout {
                    id: madhhabColumn
                    anchors.fill: parent
                    anchors.margins: 20
                    spacing: 16
                    
                    // Заголовок секции
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 12
                        
                        Rectangle {
                            width: 4
                            height: sectionTitle3.height
                            color: App.Theme.primaryColor
                            radius: 2
                        }
                        
                        Text {
                            id: sectionTitle3
                            text: App.Translator.tr("Madhab (Asr)")
                            font.pixelSize: 20
                            font.bold: true
                            color: App.Theme.primaryColor
                        }
                    }
                    
                    RadioButton {
                        Layout.fillWidth: true
                        text: App.Translator.tr("Shafii, Maliki, Hanbali")
                        checked: appSettings ? appSettings.madhhab === 0 : true
                        
                        contentItem: Text {
                            text: parent.text
                            font.pixelSize: 15
                            color: App.Theme.textColor
                            verticalAlignment: Text.AlignVCenter
                            leftPadding: parent.indicator.width + 16
                            wrapMode: Text.WordWrap
                        }
                        
                        onClicked: {
                            if (appSettings) {
                                appSettings.madhhab = 0
                                prayerCalc.calculatePrayerTimes()
                            }
                        }
                    }
                    
                    RadioButton {
                        Layout.fillWidth: true
                        text: App.Translator.tr("Hanafi")
                        checked: appSettings ? appSettings.madhhab === 1 : false
                        
                        contentItem: Text {
                            text: parent.text
                            font.pixelSize: 15
                            color: App.Theme.textColor
                            verticalAlignment: Text.AlignVCenter
                            leftPadding: parent.indicator.width + 16
                            wrapMode: Text.WordWrap
                        }
                        
                        onClicked: {
                            if (appSettings) {
                                appSettings.madhhab = 1
                                prayerCalc.calculatePrayerTimes()
                            }
                        }
                    }
                }
            }
            
            // Секция: Интерфейс
            Rectangle {
                Layout.fillWidth: true
                Layout.margins: 16
                implicitHeight: interfaceColumn.implicitHeight + 40
                color: App.Theme.cardColor
                radius: App.Theme.radiusLarge
                
                ColumnLayout {
                    id: interfaceColumn
                    anchors.fill: parent
                    anchors.margins: 20
                    spacing: 20
                    
                    // Заголовок секции
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 12
                        
                        Rectangle {
                            width: 4
                            height: sectionTitle4.height
                            color: App.Theme.primaryColor
                            radius: 2
                        }
                        
                        Text {
                            id: sectionTitle4
                            text: App.Translator.tr("Interface")
                            font.pixelSize: 20
                            font.bold: true
                            color: App.Theme.primaryColor
                        }
                    }
                    
                    // Темная тема
                    Rectangle {
                        Layout.fillWidth: true
                        height: 60
                        radius: App.Theme.radiusMedium
                        color: App.Theme.backgroundColor
                        
                        RowLayout {
                            anchors.fill: parent
                            anchors.margins: 16
                            
                            Text {
                                Layout.fillWidth: true
                                text: "🌙 " + App.Translator.tr("Dark Theme")
                                font.pixelSize: 16
                                color: App.Theme.textColor
                            }
                            
                            Switch {
                                checked: appSettings ? appSettings.darkTheme : false
                                
                                onToggled: {
                                    if (appSettings) {
                                        appSettings.darkTheme = checked
                                    }
                                }
                            }
                        }
                    }
                    
                    // Уведомления
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 12
                        
                        Rectangle {
                            Layout.fillWidth: true
                            height: 60
                            radius: App.Theme.radiusMedium
                            color: App.Theme.backgroundColor
                            
                            RowLayout {
                                anchors.fill: parent
                                anchors.margins: 16
                                
                                Text {
                                    Layout.fillWidth: true
                                    text: "🔔 " + App.Translator.tr("Notifications")
                                    font.pixelSize: 16
                                    color: App.Theme.textColor
                                }
                                
                                Switch {
                                    id: notificationsSwitch
                                    checked: notificationService ? notificationService.enabled : (appSettings ? appSettings.notifications : false)
                                    
                                    Component.onCompleted: {
                                        // Синхронизируем при загрузке: если есть сохраненное значение в appSettings, используем его
                                        if (notificationService && appSettings) {
                                            notificationService.enabled = appSettings.notifications
                                        }
                                    }
                                    
                                    onToggled: {
                                        var newValue = checked
                                        if (notificationService) {
                                            notificationService.enabled = newValue
                                        }
                                        if (appSettings) {
                                            appSettings.notifications = newValue
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Настройки уведомлений (показываются только если включены)
                        ColumnLayout {
                            Layout.fillWidth: true
                            spacing: 8
                            visible: notificationsSwitch.checked
                            
                            // Время предупреждения
                            Rectangle {
                                Layout.fillWidth: true
                                height: 60
                                radius: App.Theme.radiusMedium
                                color: App.Theme.backgroundColor
                                
                                RowLayout {
                                    anchors.fill: parent
                                    anchors.margins: 16
                                    
                                    Text {
                                        Layout.fillWidth: true
                                        text: "⏰ " + App.Translator.tr("Notify before (minutes)")
                                        font.pixelSize: 14
                                        color: App.Theme.textColor
                                    }
                                    
                                    SpinBox {
                                        id: minutesBeforeSpinBox
                                        from: 0
                                        to: 60
                                        stepSize: 1
                                        value: notificationService ? notificationService.notificationMinutesBefore : 5
                                        
                                        onValueChanged: {
                                            if (notificationService) {
                                                notificationService.notificationMinutesBefore = value
                                            }
                                        }
                                        
                                        contentItem: Text {
                                            text: minutesBeforeSpinBox.value + " мин"
                                            font: minutesBeforeSpinBox.font
                                            color: App.Theme.textColor
                                            horizontalAlignment: Text.AlignHCenter
                                            verticalAlignment: Text.AlignVCenter
                                        }
                                        
                                        background: Rectangle {
                                            color: App.Theme.cardColor
                                            border.color: App.Theme.borderColor
                                            border.width: 1
                                            radius: App.Theme.radiusMedium
                                        }
                                    }
                                }
                            }
                            
                            // Иконка в трее
                            Rectangle {
                                Layout.fillWidth: true
                                height: 60
                                radius: App.Theme.radiusMedium
                                color: App.Theme.backgroundColor
                                
                                RowLayout {
                                    anchors.fill: parent
                                    anchors.margins: 16
                                    
                                    Text {
                                        Layout.fillWidth: true
                                        text: "📌 " + App.Translator.tr("Show tray icon")
                                        font.pixelSize: 14
                                        color: App.Theme.textColor
                                    }
                                    
                                    Switch {
                                        checked: notificationService ? notificationService.trayIconVisible : false
                                        
                                        onToggled: {
                                            if (notificationService) {
                                                notificationService.trayIconVisible = checked
                                            }
                                        }
                                    }
                                }
                            }
                            
                            // Кнопка тестирования уведомления
                            Button {
                                Layout.fillWidth: true
                                height: 50
                                text: "🧪 " + App.Translator.tr("Test Notification")
                                
                                contentItem: Text {
                                    text: parent.text
                                    font: parent.font
                                    color: "white"
                                    horizontalAlignment: Text.AlignHCenter
                                    verticalAlignment: Text.AlignVCenter
                                }
                                
                                background: Rectangle {
                                    gradient: Gradient {
                                        GradientStop { position: 0.0; color: parent.pressed ? Qt.darker(App.Theme.primaryColor, 1.3) : App.Theme.primaryColor }
                                        GradientStop { position: 1.0; color: parent.pressed ? Qt.darker(App.Theme.primaryLight, 1.3) : App.Theme.primaryLight }
                                    }
                                    radius: App.Theme.radiusMedium
                                }
                                
                                onClicked: {
                                    if (notificationService) {
                                        notificationService.showTestNotification(
                                            App.Translator.tr("Test Notification"),
                                            App.Translator.tr("This is a test notification. If you see this, notifications are working!")
                                        )
                                    }
                                }
                            }
                        }
                    }
                    
                    // Язык
                    Rectangle {
                        Layout.fillWidth: true
                        height: 60
                        radius: App.Theme.radiusMedium
                        color: App.Theme.backgroundColor
                        
                        RowLayout {
                            anchors.fill: parent
                            anchors.margins: 16
                            spacing: 16
                            
                            Text {
                                Layout.fillWidth: true
                                text: "🌐 " + App.Translator.tr("Interface Language")
                                font.pixelSize: 16
                                color: App.Theme.textColor
                            }
                            
                            ComboBox {
                                id: languageCombo
                                width: 140
                                model: ListModel {
                                    ListElement { flag: "🇷🇺"; lang: "ru"; name: "Русский" }
                                    ListElement { flag: "🇬🇧"; lang: "en"; name: "English" }
                                    ListElement { flag: "🇸🇦"; lang: "ar"; name: "العربية" }
                                }
                                textRole: "name"
                                currentIndex: 0
                                
                                delegate: ItemDelegate {
                                    width: languageCombo.width
                                    text: model.flag + " " + model.name
                                }
                                
                                contentItem: Text {
                                    text: languageCombo.model.get(languageCombo.currentIndex).flag + " " + 
                                          languageCombo.model.get(languageCombo.currentIndex).name
                                    font: languageCombo.font
                                    color: App.Theme.textColor
                                    verticalAlignment: Text.AlignVCenter
                                    elide: Text.ElideRight
                                    leftPadding: 12
                                }
                                
                                background: Rectangle {
                                    color: App.Theme.cardColor
                                    border.color: App.Theme.borderColor
                                    border.width: 1
                                    radius: 8
                                }
                                
                                Component.onCompleted: {
                                    if (appSettings) {
                                        if (appSettings.language === "ru") currentIndex = 0
                                        else if (appSettings.language === "en") currentIndex = 1
                                        else if (appSettings.language === "ar") currentIndex = 2
                                    }
                                }
                                
                                onActivated: function(index) {
                                    if (appSettings) {
                                        appSettings.language = model.get(index).lang
                                        console.log("Язык изменён на:", model.get(index).name)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            // Секция: О приложении
            Rectangle {
                Layout.fillWidth: true
                Layout.margins: 16
                implicitHeight: aboutColumn.implicitHeight + 40
                color: App.Theme.cardColor
                radius: App.Theme.radiusLarge
                
                ColumnLayout {
                    id: aboutColumn
                    anchors.fill: parent
                    anchors.margins: 20
                    spacing: 16
                    
                    // Заголовок секции
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 12
                        
                        Rectangle {
                            width: 4
                            height: sectionTitle5.height
                            color: App.Theme.primaryColor
                            radius: 2
                        }
                        
                        Text {
                            id: sectionTitle5
                            text: App.Translator.tr("About")
                            font.pixelSize: 20
                            font.bold: true
                            color: App.Theme.primaryColor
                        }
                    }
                    
                    Text {
                        text: qsTr("Jummah Prayer v1.0.0")
                        font.pixelSize: 18
                        font.bold: true
                        color: App.Theme.textColor
                    }
                    
                    Text {
                        Layout.fillWidth: true
                        text: App.Translator.tr("App description")
                        font.pixelSize: 14
                        color: App.Theme.secondaryTextColor
                        wrapMode: Text.WordWrap
                    }
                    
                    Button {
                        text: App.Translator.tr("License")
                        flat: true
                        
                        contentItem: Text {
                            text: parent.text
                            font: parent.font
                            color: App.Theme.primaryColor
                            horizontalAlignment: Text.AlignHCenter
                        }
                    }
                }
            }
            
            // Отступ внизу
            Item {
                Layout.fillWidth: true
                Layout.preferredHeight: 40
            }
        }
    }
    
    // Диалог поиска города через API
    Components.CitySearchDialog {
        id: cityDialog
        prayerCalc: root.prayerCalc
        appSettings: root.appSettings
    }
}
