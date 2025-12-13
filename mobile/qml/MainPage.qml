import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects
import PrayerTimes 1.0
import "." as App
import "components" as Components

Page {
    id: root
    
    property var prayerCalc
    property var appSettings
    property var notificationService
    
    // Функция для переключения страниц
    function switchToPage(pageIndex) {
        // Ищем родительское окно с SwipeView
        var obj = root
        while (obj) {
            // Ищем SwipeView
            if (obj.toString().indexOf("SwipeView") >= 0) {
                console.log("Found SwipeView, switching to page:", pageIndex)
                obj.currentIndex = pageIndex
                return
            }
            // Проверяем, есть ли у родителя свойство currentPageIndex
            if (obj.parent && obj.parent.currentPageIndex !== undefined) {
                console.log("Found parent with currentPageIndex, switching to:", pageIndex)
                obj.parent.currentPageIndex = pageIndex
                return
            }
            obj = obj.parent
        }
        console.log("Could not find SwipeView or mainWindow to switch pages")
    }
    
    background: Rectangle {
        color: App.Theme.backgroundColor
    }
    
    // Таймер для обновления текущего и следующего намаза (раз в минуту)
    Timer {
        id: prayerUpdateTimer
        interval: 60000 // Обновляем раз в минуту
        running: true
        repeat: true
        onTriggered: {
            updatePrayerInfo()
        }
    }
    
    // Таймер для обновления обратного отсчета (каждую секунду)
    Timer {
        id: countdownTimer
        interval: 1000
        running: true
        repeat: true
        onTriggered: {
            updateCountdown()
        }
    }
    
    property string timeRemaining: "00:00:00"
    property real progressToNext: 0.0
    property string cachedCurrentPrayer: ""
    property string cachedNextPrayer: ""
    property string cachedNextTimeStr: ""
    property string cachedCurrentTimeStr: ""
    
    function updatePrayerInfo() {
        if (!prayerCalc || !prayerCalc.prayerTimes) return
        
        cachedCurrentPrayer = prayerCalc.getCurrentPrayer()
        cachedNextPrayer = prayerCalc.getNextPrayer()
        
        switch(cachedNextPrayer) {
            case "Fajr": cachedNextTimeStr = prayerCalc.prayerTimes.fajr; break
            case "Sunrise": cachedNextTimeStr = prayerCalc.prayerTimes.sunrise; break
            case "Dhuhr": cachedNextTimeStr = prayerCalc.prayerTimes.dhuhr; break
            case "Asr": cachedNextTimeStr = prayerCalc.prayerTimes.asr; break
            case "Maghrib": cachedNextTimeStr = prayerCalc.prayerTimes.maghrib; break
            case "Isha": cachedNextTimeStr = prayerCalc.prayerTimes.isha; break
        }
        
        switch(cachedCurrentPrayer) {
            case "Fajr": cachedCurrentTimeStr = prayerCalc.prayerTimes.fajr; break
            case "Dhuhr": cachedCurrentTimeStr = prayerCalc.prayerTimes.dhuhr; break
            case "Asr": cachedCurrentTimeStr = prayerCalc.prayerTimes.asr; break
            case "Maghrib": cachedCurrentTimeStr = prayerCalc.prayerTimes.maghrib; break
            case "Isha": cachedCurrentTimeStr = prayerCalc.prayerTimes.isha; break
        }
    }
    
    function updateCountdown() {
        if (!prayerCalc || !prayerCalc.prayerTimes) return
        
        // Получаем актуальную информацию о молитвах напрямую, а не из кеша
        // Это предотвращает рассинхронизацию между отображением и обратным отсчетом
        var currentPrayer = prayerCalc.getCurrentPrayer()
        var nextPrayer = prayerCalc.getNextPrayer()
        
        // Определяем время следующей молитвы
        var nextTimeStr = ""
        switch(nextPrayer) {
            case "Fajr": nextTimeStr = prayerCalc.prayerTimes.fajr; break
            case "Sunrise": nextTimeStr = prayerCalc.prayerTimes.sunrise; break
            case "Dhuhr": nextTimeStr = prayerCalc.prayerTimes.dhuhr; break
            case "Asr": nextTimeStr = prayerCalc.prayerTimes.asr; break
            case "Maghrib": nextTimeStr = prayerCalc.prayerTimes.maghrib; break
            case "Isha": nextTimeStr = prayerCalc.prayerTimes.isha; break
        }
        
        // Определяем время текущей молитвы
        var currentTimeStr = ""
        switch(currentPrayer) {
            case "Fajr": currentTimeStr = prayerCalc.prayerTimes.fajr; break
            case "Dhuhr": currentTimeStr = prayerCalc.prayerTimes.dhuhr; break
            case "Asr": currentTimeStr = prayerCalc.prayerTimes.asr; break
            case "Maghrib": currentTimeStr = prayerCalc.prayerTimes.maghrib; break
            case "Isha": currentTimeStr = prayerCalc.prayerTimes.isha; break
        }
        
        // Берем локальное время с устройства
        var now = new Date()
        var currentHour = now.getHours()
        var currentMinute = now.getMinutes()
        var currentSecond = now.getSeconds()
        var currentTotalSeconds = currentHour * 3600 + currentMinute * 60 + currentSecond
        
        if (nextTimeStr) {
            var parts = nextTimeStr.split(":")
            var nextHour = parseInt(parts[0])
            var nextMinute = parseInt(parts[1])
            var nextTotalSeconds = nextHour * 3600 + nextMinute * 60
            
            var diff = nextTotalSeconds - currentTotalSeconds
            if (diff < 0) {
                diff += 86400 // Добавляем 24 часа
            }
            
            var hours = Math.floor(diff / 3600)
            var minutes = Math.floor((diff % 3600) / 60)
            var seconds = diff % 60
            
            timeRemaining = String(hours).padStart(2, '0') + ":" + 
                          String(minutes).padStart(2, '0') + ":" + 
                          String(seconds).padStart(2, '0')
            
            // Вычисляем прогресс (от текущей молитвы до следующей)
            if (currentTimeStr) {
                var currentParts = currentTimeStr.split(":")
                var currentPrayerHour = parseInt(currentParts[0])
                var currentPrayerMinute = parseInt(currentParts[1])
                var currentPrayerSeconds = currentPrayerHour * 3600 + currentPrayerMinute * 60
                
                var totalDuration = nextTotalSeconds - currentPrayerSeconds
                if (totalDuration < 0) totalDuration += 86400
                
                var elapsed = currentTotalSeconds - currentPrayerSeconds
                if (elapsed < 0) elapsed += 86400
                
                progressToNext = totalDuration > 0 ? elapsed / totalDuration : 0
            }
        }
        
        // Обновляем кеш для отображения (чтобы UI показывал актуальную информацию)
        cachedCurrentPrayer = currentPrayer
        cachedNextPrayer = nextPrayer
        cachedNextTimeStr = nextTimeStr
        cachedCurrentTimeStr = currentTimeStr
    }
    
    Component.onCompleted: {
        updatePrayerInfo()
        updateCountdown()
    }
    
    // Обновляем текущий и следующий намаз при изменении времен молитв
    Connections {
        target: prayerCalc
        function onPrayerTimesChanged() {
            updatePrayerInfo()
        }
    }
    
    // Функция для получения Хиджра даты (упрощенная версия)
    function getHijriDate() {
        // Это упрощенная версия. В реальном приложении нужен точный конвертер
        var now = new Date()
        var gregorianYear = now.getFullYear()
        var gregorianMonth = now.getMonth() + 1
        var gregorianDay = now.getDate()
        
        // Приблизительная конверсия (требует доработки для точности)
        var hijriYear = Math.floor((gregorianYear - 622) * 1.030684)
        
        // Короткие названия месяцев
        var months = ["Muharram", "Safar", "Rabi I", "Rabi II", 
                     "Jumada I", "Jumada II", "Rajab", "Sha'ban", 
                     "Ramadan", "Shawwal", "Dhu al-Qi", "Dhu al-Hijja"]
        
        var hijriMonth = months[gregorianMonth % 12]
        
        return gregorianDay + " " + hijriMonth + "\n" + hijriYear
    }
    
    ScrollView {
        anchors.fill: parent
        
        ColumnLayout {
            width: parent.parent.width
            spacing: 0

            // Заголовок с градиентом и таймером обратного отсчета
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 200
                gradient: Gradient {
                    GradientStop { position: 0.0; color: App.Theme.primaryColor }
                    GradientStop { position: 0.5; color: Qt.lighter(App.Theme.primaryColor, 1.2) }
                    GradientStop { position: 1.0; color: App.Theme.primaryLight }
                }

                ColumnLayout {
                    anchors.centerIn: parent
                    anchors.margins: 20
                    spacing: 16
                    
                    // Время до следующего намаза
                    Rectangle {
                        Layout.alignment: Qt.AlignHCenter
                        Layout.preferredWidth: 320
                        Layout.preferredHeight: 90
                        radius: 16
                        color: Qt.rgba(1, 1, 1, 0.2)
                        border.color: Qt.rgba(1, 1, 1, 0.3)
                        border.width: 1
                        
                        ColumnLayout {
                            anchors.centerIn: parent
                            spacing: 8
                            
                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                text: App.Translator.tr("Time Until") + " " + (cachedNextPrayer ? App.Translator.tr(cachedNextPrayer) : "")
                                font.pixelSize: 14
                                font.weight: Font.Medium
                                color: "white"
                                opacity: 0.95
                            }
                            
                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                text: timeRemaining
                                font.pixelSize: 40
                                font.weight: Font.Bold
                                color: "white"
                                font.family: "SF Mono, Menlo, Courier"
                                
                                // Мигание двоеточий
                                SequentialAnimation on opacity {
                                    running: true
                                    loops: Animation.Infinite
                                    NumberAnimation { to: 0.7; duration: 500 }
                                    NumberAnimation { to: 1.0; duration: 500 }
                                }
                            }
                        }
                    }
                    
                    // Текущее местоположение
                    Row {
                        Layout.alignment: Qt.AlignHCenter
                        spacing: 6
                        
                        Text {
                            text: "📍"
                            font.pixelSize: 16
                        }
                        
                        Text {
                            text: prayerCalc ? prayerCalc.city : "Загрузка..."
                            font.pixelSize: 16
                            color: "white"
                            font.weight: Font.Medium
                        }
                        
                        // Кнопка календаря
                        Button {
                            flat: true
                            text: "📅"
                            font.pixelSize: 18
                            width: 36
                            height: 36
                            
                            contentItem: Text {
                                text: parent.text
                                font: parent.font
                                color: "white"
                                horizontalAlignment: Text.AlignHCenter
                                verticalAlignment: Text.AlignVCenter
                            }
                            
                            background: Rectangle {
                                color: parent.pressed ? Qt.rgba(1, 1, 1, 0.25) : Qt.rgba(1, 1, 1, 0.15)
                                radius: 18
                            }
                            
                            onClicked: dateDialog.open()
                        }
                    }
                }
            }

            // Карточки текущего и следующего намаза
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 130
                color: App.Theme.surfaceColor

                RowLayout {
                    anchors.fill: parent
                    anchors.margins: 16
                    spacing: 12

                    // Текущий намаз
                    Rectangle {
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        radius: App.Theme.radiusLarge
                        gradient: Gradient {
                            GradientStop { position: 0.0; color: "#4CAF50" }
                            GradientStop { position: 1.0; color: "#66BB6A" }
                        }

                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: 16
                            spacing: 8

                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                Layout.fillWidth: true
                                text: App.Translator.tr("Current")
                                font.pixelSize: 12
                                color: Qt.rgba(1, 1, 1, 0.9)
                                horizontalAlignment: Text.AlignHCenter
                            }
                            
                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                Layout.fillWidth: true
                                text: cachedCurrentPrayer ? App.Translator.tr(cachedCurrentPrayer) : "---"
                                font.pixelSize: 20
                                font.weight: Font.Bold
                                color: "white"
                                horizontalAlignment: Text.AlignHCenter
                                wrapMode: Text.WordWrap
                                maximumLineCount: 2
                            }
                        }
                    }

                    // Следующий намаз
                    Rectangle {
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        radius: App.Theme.radiusLarge
                        gradient: Gradient {
                            GradientStop { position: 0.0; color: "#FF9800" }
                            GradientStop { position: 1.0; color: "#FFB74D" }
                        }

                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: 16
                            spacing: 8

                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                Layout.fillWidth: true
                                text: App.Translator.tr("Next")
                                font.pixelSize: 12
                                color: Qt.rgba(1, 1, 1, 0.9)
                                horizontalAlignment: Text.AlignHCenter
                            }
                            
                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                Layout.fillWidth: true
                                text: cachedNextPrayer ? App.Translator.tr(cachedNextPrayer) : "---"
                                font.pixelSize: 20
                                font.weight: Font.Bold
                                color: "white"
                                horizontalAlignment: Text.AlignHCenter
                                wrapMode: Text.WordWrap
                                maximumLineCount: 2
                            }
                        }
                    }
                }
            }

            // Список времен намазов
            Item {
                Layout.fillWidth: true
                Layout.preferredHeight: 620
                Layout.margins: 16

                ColumnLayout {
                    anchors.fill: parent
                    spacing: 12

                    Components.PrayerTimeCard {
                        Layout.fillWidth: true
                        prayerName: App.Translator.tr("Fajr (Dawn) Full")
                        prayerTime: (prayerCalc && prayerCalc.prayerTimes) ? prayerCalc.prayerTimes.fajr : "00:00"
                        icon: "🌅"
                        isCurrent: cachedCurrentPrayer === "Fajr"
                        isNext: cachedNextPrayer === "Fajr"
                        progressValue: cachedCurrentPrayer === "Fajr" ? progressToNext : 0
                    }

                    Components.PrayerTimeCard {
                        Layout.fillWidth: true
                        prayerName: App.Translator.tr("Sunrise Full")
                        prayerTime: (prayerCalc && prayerCalc.prayerTimes) ? prayerCalc.prayerTimes.sunrise : "00:00"
                        icon: "☀️"
                        isInfo: true
                        progressValue: 0
                    }

                    Components.PrayerTimeCard {
                        Layout.fillWidth: true
                        prayerName: App.Translator.tr("Dhuhr (Noon) Full")
                        prayerTime: (prayerCalc && prayerCalc.prayerTimes) ? prayerCalc.prayerTimes.dhuhr : "00:00"
                        icon: "🌞"
                        isCurrent: cachedCurrentPrayer === "Dhuhr"
                        isNext: cachedNextPrayer === "Dhuhr"
                        progressValue: cachedCurrentPrayer === "Dhuhr" ? progressToNext : 0
                    }

                    Components.PrayerTimeCard {
                        Layout.fillWidth: true
                        prayerName: App.Translator.tr("Asr (Afternoon) Full")
                        prayerTime: (prayerCalc && prayerCalc.prayerTimes) ? prayerCalc.prayerTimes.asr : "00:00"
                        icon: "🌤️"
                        isCurrent: cachedCurrentPrayer === "Asr"
                        isNext: cachedNextPrayer === "Asr"
                        progressValue: cachedCurrentPrayer === "Asr" ? progressToNext : 0
                    }

                    Components.PrayerTimeCard {
                        Layout.fillWidth: true
                        prayerName: App.Translator.tr("Maghrib (Sunset) Full")
                        prayerTime: (prayerCalc && prayerCalc.prayerTimes) ? prayerCalc.prayerTimes.maghrib : "00:00"
                        icon: "🌆"
                        isCurrent: cachedCurrentPrayer === "Maghrib"
                        isNext: cachedNextPrayer === "Maghrib"
                        progressValue: cachedCurrentPrayer === "Maghrib" ? progressToNext : 0
                    }

                    Components.PrayerTimeCard {
                        Layout.fillWidth: true
                        prayerName: App.Translator.tr("Isha (Night) Full")
                        prayerTime: (prayerCalc && prayerCalc.prayerTimes) ? prayerCalc.prayerTimes.isha : "00:00"
                        icon: "🌙"
                        isCurrent: cachedCurrentPrayer === "Isha"
                        isNext: cachedNextPrayer === "Isha"
                        progressValue: cachedCurrentPrayer === "Isha" ? progressToNext : 0
                    }
                }
            }
            
            // Отступ перед виджетами
            Item {
                Layout.fillWidth: true
                Layout.preferredHeight: 40
            }
            
            // Виджет с дополнительной информацией
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 135
                Layout.leftMargin: 16
                Layout.rightMargin: 16
                Layout.bottomMargin: 16
                color: "transparent"
                
                RowLayout {
                    anchors.fill: parent
                    spacing: 12
                    
                    // Направление Киблы
                    Rectangle {
                        id: qiblaWidget
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        radius: App.Theme.radiusLarge
                        color: App.Theme.cardColor
                        border.color: App.Theme.borderColor
                        border.width: 1
                        
                        // Тень
                        layer.enabled: true
                        layer.effect: MultiEffect {
                            shadowEnabled: true
                            shadowColor: App.Theme.shadowColorLight
                            shadowBlur: 0.2
                            shadowHorizontalOffset: 0
                            shadowVerticalOffset: 2
                        }
                        
                        // Анимация scale
                        Behavior on scale {
                            NumberAnimation { duration: 150; easing.type: Easing.OutCubic }
                        }
                        
                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: 8
                            spacing: 8
                            
                            Rectangle {
                                Layout.alignment: Qt.AlignHCenter
                                width: 50
                                height: 50
                                radius: 25
                                color: App.Theme.islamicGreen
                                opacity: 0.15
                                
                                Text {
                                    anchors.centerIn: parent
                                    text: "🧭"
                                    font.pixelSize: 32
                                }
                            }
                            
                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                Layout.fillWidth: true
                                text: App.Translator.tr("Qibla Direction")
                                font.pixelSize: 11
                                font.weight: Font.Medium
                                color: App.Theme.secondaryTextColor
                                horizontalAlignment: Text.AlignHCenter
                                wrapMode: Text.WordWrap
                            }
                            
                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                text: "→" // Placeholder
                                font.pixelSize: 24
                                font.weight: Font.Bold
                                color: App.Theme.islamicGreen
                            }
                        }
                        
                        MouseArea {
                            anchors.fill: parent
                            enabled: false // Отключено временно
                            onClicked: {
                                console.log("Qibla widget clicked!")
                                // switchToPage(1) // Страница Киблы - временно отключено
                            }
                            cursorShape: Qt.PointingHandCursor
                            hoverEnabled: true
                            onEntered: qiblaWidget.scale = 1.05
                            onExited: qiblaWidget.scale = 1.0
                            onPressed: qiblaWidget.scale = 0.98
                            onReleased: qiblaWidget.scale = 1.05
                        }
                    }
                    
                    // Хиджра календарь
                    Rectangle {
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        radius: App.Theme.radiusLarge
                        color: App.Theme.cardColor
                        border.color: App.Theme.borderColor
                        border.width: 1
                        
                        // Тень
                        layer.enabled: true
                        layer.effect: MultiEffect {
                            shadowEnabled: true
                            shadowColor: App.Theme.shadowColorLight
                            shadowBlur: 0.2
                            shadowHorizontalOffset: 0
                            shadowVerticalOffset: 2
                        }
                        
                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: 8
                            spacing: 8
                            
                            Rectangle {
                                Layout.alignment: Qt.AlignHCenter
                                width: 50
                                height: 50
                                radius: 25
                                color: App.Theme.goldAccent
                                opacity: 0.15
                                
                                Text {
                                    anchors.centerIn: parent
                                    text: "☪️"
                                    font.pixelSize: 28
                                }
                            }
                            
                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                Layout.fillWidth: true
                                text: App.Translator.tr("Hijri Date")
                                font.pixelSize: 11
                                font.weight: Font.Medium
                                color: App.Theme.secondaryTextColor
                                horizontalAlignment: Text.AlignHCenter
                                wrapMode: Text.WordWrap
                            }
                            
                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                Layout.fillWidth: true
                                text: getHijriDate()
                                font.pixelSize: 10
                                font.weight: Font.Bold
                                color: App.Theme.textColor
                                horizontalAlignment: Text.AlignHCenter
                                wrapMode: Text.NoWrap
                                lineHeight: 1.1
                                maximumLineCount: 3
                            }
                        }
                    }
                    
                    // Уведомления
                    Rectangle {
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        radius: App.Theme.radiusLarge
                        color: App.Theme.cardColor
                        border.color: App.Theme.borderColor
                        border.width: 1
                        
                        // Тень
                        layer.enabled: true
                        layer.effect: MultiEffect {
                            shadowEnabled: true
                            shadowColor: App.Theme.shadowColorLight
                            shadowBlur: 0.2
                            shadowHorizontalOffset: 0
                            shadowVerticalOffset: 2
                        }
                        
                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: 8
                            spacing: 8
                            
                            Rectangle {
                                Layout.alignment: Qt.AlignHCenter
                                width: 50
                                height: 50
                                radius: 25
                                color: (notificationService && notificationService.enabled) || (appSettings && appSettings.notifications) ? 
                                       App.Theme.successColor : App.Theme.secondaryTextColor
                                opacity: 0.15
                                
                                Text {
                                    anchors.centerIn: parent
                                    text: (notificationService && notificationService.enabled) || (appSettings && appSettings.notifications) ? "🔔" : "🔕"
                                    font.pixelSize: 28
                                }
                            }
                            
                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                Layout.fillWidth: true
                                text: App.Translator.tr("Notifications")
                                font.pixelSize: 11
                                font.weight: Font.Medium
                                color: App.Theme.secondaryTextColor
                                horizontalAlignment: Text.AlignHCenter
                                wrapMode: Text.WordWrap
                            }
                            
                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                Layout.fillWidth: true
                                property bool isEnabled: (notificationService && notificationService.enabled) || (appSettings && appSettings.notifications)
                                text: isEnabled ? 
                                      App.Translator.tr("Enabled") : App.Translator.tr("Disabled")
                                font.pixelSize: 11
                                font.weight: Font.Bold
                                color: isEnabled ? 
                                       App.Theme.successColor : App.Theme.secondaryTextColor
                                horizontalAlignment: Text.AlignHCenter
                            }
                        }
                        
                        MouseArea {
                            anchors.fill: parent
                            onClicked: switchToPage(3) // Страница Настроек
                            cursorShape: Qt.PointingHandCursor
                            hoverEnabled: true
                            onEntered: parent.scale = 1.05
                            onExited: parent.scale = 1.0
                        }
                        
                        Behavior on scale {
                            NumberAnimation { duration: 150 }
                        }
                    }
                }
            }

            // Дата и кнопки управления
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 80
                Layout.margins: 16
                color: App.Theme.cardColor
                radius: App.Theme.radiusLarge
                
                RowLayout {
                    anchors.fill: parent
                    anchors.margins: 16
                    spacing: 12
                    
                    Text {
                        Layout.fillWidth: true
                        text: App.Translator.tr("Date:") + " " + ((prayerCalc && prayerCalc.prayerTimes) ? prayerCalc.prayerTimes.date : "")
                        font.pixelSize: 14
                        color: App.Theme.textColor
                        verticalAlignment: Text.AlignVCenter
                    }
                    
                    Button {
                        text: App.Translator.tr("Select Date")
                        font.pixelSize: 13
                        
                        background: Rectangle {
                            color: parent.pressed ? Qt.darker(App.Theme.accentColor, 1.2) : App.Theme.accentColor
                            radius: 8
                        }
                        
                        contentItem: Text {
                            text: parent.text
                            font: parent.font
                            color: "white"
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                            padding: 8
                        }
                        
                        onClicked: dateDialog.open()
                    }
                    
                    Button {
                        text: "🔄"
                        font.pixelSize: 18
                        width: 44
                        height: 44
                        
                        background: Rectangle {
                            color: parent.pressed ? Qt.darker(App.Theme.primaryColor, 1.2) : App.Theme.primaryColor
                            radius: 8
                        }
                        
                        contentItem: Text {
                            text: parent.text
                            font: parent.font
                            color: "white"
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                        
                        onClicked: {
                            if (prayerCalc) {
                                prayerCalc.calculatePrayerTimes()
                            }
                        }
                    }
                }
            }
            
            // Отступ внизу
            Item {
                Layout.fillWidth: true
                Layout.preferredHeight: 20
            }
        }
    }

    // Диалог выбора даты
    Dialog {
        id: dateDialog
        title: App.Translator.tr("Date Selection")
        modal: true
        anchors.centerIn: parent
        width: Math.min(parent.width * 0.95, 420)
        height: Math.min(parent.height * 0.8, 600)
        
        background: Rectangle {
            color: App.Theme.surfaceColor
            radius: App.Theme.radiusLarge
            border.color: App.Theme.borderColor
            border.width: 1
        }
        
        onOpened: {
            // Обновляем календарь при открытии
            if (prayerCalc && prayerCalc.selectedDate) {
                calendarContainer.displayedDate = new Date(prayerCalc.selectedDate.getFullYear(),
                                                           prayerCalc.selectedDate.getMonth(), 1)
                calendarContainer.selectedDate = prayerCalc.selectedDate
            } else {
                let today = new Date()
                calendarContainer.displayedDate = new Date(today.getFullYear(), today.getMonth(), 1)
                calendarContainer.selectedDate = today
            }
        }
        
        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 20
            spacing: 20
            
            // Заголовок с текущей датой
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 60
                color: App.Theme.cardColor
                radius: App.Theme.radiusMedium
                border.color: App.Theme.primaryColor
                border.width: 1
                
                RowLayout {
                    anchors.fill: parent
                    anchors.margins: 12
                    spacing: 12
                    
                    Text {
                        text: "📅"
                        font.pixelSize: 24
                    }
                    
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 4
                        
                        Text {
                            text: App.Translator.tr("Selected Date")
                            font.pixelSize: 12
                            color: App.Theme.secondaryTextColor
                        }
                        
                        Text {
                            text: prayerCalc && prayerCalc.prayerTimes ? prayerCalc.prayerTimes.date : new Date().toLocaleDateString()
                            font.pixelSize: 16
                            font.weight: Font.Bold
                            color: App.Theme.textColor
                        }
                    }
                }
            }
            
            // Календарь
            Rectangle {
                id: calendarContainer
                Layout.fillWidth: true
                Layout.preferredHeight: 320
                color: App.Theme.cardColor
                radius: App.Theme.radiusMedium
                border.color: App.Theme.borderColor
                border.width: 1
                
                property var displayedDate: prayerCalc && prayerCalc.selectedDate ? 
                    new Date(prayerCalc.selectedDate.getFullYear(), 
                            prayerCalc.selectedDate.getMonth(), 1) : new Date()
                property var selectedDate: prayerCalc && prayerCalc.selectedDate ? 
                    new Date(prayerCalc.selectedDate.getFullYear(), 
                            prayerCalc.selectedDate.getMonth(), 
                            prayerCalc.selectedDate.getDate()) : new Date()
                
                function getDaysInMonth(date) {
                    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
                }
                
                function getFirstDayOfMonth(date) {
                    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
                }
                
                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 12
                    spacing: 8
                    
                    // Заголовок с навигацией
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 8
                        
                        Button {
                            Layout.preferredWidth: 40
                            Layout.preferredHeight: 40
                            text: "◄"
                            
                            background: Rectangle {
                                color: parent.pressed ? Qt.darker(App.Theme.cardColor, 1.1) : App.Theme.backgroundColor
                                radius: App.Theme.radiusSmall
                                border.color: App.Theme.borderColor
                                border.width: 1
                            }
                            
                            contentItem: Text {
                                text: parent.text
                                font.pixelSize: 18
                                font.weight: Font.Bold
                                color: App.Theme.textColor
                                horizontalAlignment: Text.AlignHCenter
                                verticalAlignment: Text.AlignVCenter
                            }
                            
                            onClicked: {
                                let newDate = new Date(calendarContainer.displayedDate)
                                newDate.setMonth(newDate.getMonth() - 1)
                                calendarContainer.displayedDate = newDate
                            }
                        }
                        
                        Text {
                            Layout.fillWidth: true
                            text: {
                                let months = [App.Translator.tr("January"), App.Translator.tr("February"), 
                                             App.Translator.tr("March"), App.Translator.tr("April"),
                                             App.Translator.tr("May"), App.Translator.tr("June"),
                                             App.Translator.tr("July"), App.Translator.tr("August"),
                                             App.Translator.tr("September"), App.Translator.tr("October"),
                                             App.Translator.tr("November"), App.Translator.tr("December")]
                                return months[calendarContainer.displayedDate.getMonth()] + " " + calendarContainer.displayedDate.getFullYear()
                            }
                            font.pixelSize: 16
                            font.weight: Font.Bold
                            color: App.Theme.textColor
                            horizontalAlignment: Text.AlignHCenter
                        }
                        
                        Button {
                            Layout.preferredWidth: 40
                            Layout.preferredHeight: 40
                            text: "►"
                            
                            background: Rectangle {
                                color: parent.pressed ? Qt.darker(App.Theme.cardColor, 1.1) : App.Theme.backgroundColor
                                radius: App.Theme.radiusSmall
                                border.color: App.Theme.borderColor
                                border.width: 1
                            }
                            
                            contentItem: Text {
                                text: parent.text
                                font.pixelSize: 18
                                font.weight: Font.Bold
                                color: App.Theme.textColor
                                horizontalAlignment: Text.AlignHCenter
                                verticalAlignment: Text.AlignVCenter
                            }
                            
                            onClicked: {
                                let newDate = new Date(calendarContainer.displayedDate)
                                newDate.setMonth(newDate.getMonth() + 1)
                                calendarContainer.displayedDate = newDate
                            }
                        }
                    }
                    
                    // Дни недели
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 4
                        
                        Repeater {
                            model: [App.Translator.tr("Mo"), App.Translator.tr("Tu"), 
                                   App.Translator.tr("We"), App.Translator.tr("Th"), 
                                   App.Translator.tr("Fr"), App.Translator.tr("Sa"), 
                                   App.Translator.tr("Su")]
                            
                            Text {
                                Layout.fillWidth: true
                                text: modelData
                                font.pixelSize: 12
                                font.weight: Font.Medium
                                color: App.Theme.secondaryTextColor
                                horizontalAlignment: Text.AlignHCenter
                            }
                        }
                    }
                    
                    // Сетка дней
                    GridLayout {
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        columns: 7
                        rowSpacing: 4
                        columnSpacing: 4
                        
                        Repeater {
                            model: 42 // 6 недель * 7 дней
                            
                            Rectangle {
                                Layout.fillWidth: true
                                Layout.preferredHeight: 35
                                radius: App.Theme.radiusSmall
                                
                                property int dayNumber: {
                                    let firstDay = calendarContainer.getFirstDayOfMonth(calendarContainer.displayedDate)
                                    let daysInMonth = calendarContainer.getDaysInMonth(calendarContainer.displayedDate)
                                    let day = index - firstDay + 1
                                    
                                    if (day < 1 || day > daysInMonth) {
                                        return -1 // День из другого месяца
                                    }
                                    return day
                                }
                                
                                property bool isSelected: {
                                    if (dayNumber === -1) return false
                                    let date = new Date(calendarContainer.displayedDate.getFullYear(),
                                                       calendarContainer.displayedDate.getMonth(),
                                                       dayNumber)
                                    return date.getTime() === calendarContainer.selectedDate.getTime()
                                }
                                
                                property bool isToday: {
                                    if (dayNumber === -1) return false
                                    let today = new Date()
                                    let date = new Date(calendarContainer.displayedDate.getFullYear(),
                                                       calendarContainer.displayedDate.getMonth(),
                                                       dayNumber)
                                    return date.toDateString() === today.toDateString()
                                }
                                
                                color: {
                                    if (dayNumber === -1) return "transparent"
                                    if (isSelected) return App.Theme.primaryColor
                                    if (isToday) return App.Theme.accentColor
                                    return parent.pressed ? Qt.darker(App.Theme.backgroundColor, 1.1) : App.Theme.backgroundColor
                                }
                                
                                border.color: isSelected ? App.Theme.primaryColor : App.Theme.borderColor
                                border.width: isSelected ? 2 : (isToday ? 1 : 0)
                                
                                Text {
                                    anchors.centerIn: parent
                                    text: parent.dayNumber > 0 ? parent.dayNumber : ""
                                    font.pixelSize: 14
                                    font.weight: parent.isSelected || parent.isToday ? Font.Bold : Font.Normal
                                    color: {
                                        if (parent.dayNumber === -1) return "transparent"
                                        if (parent.isSelected) return "white"
                                        return App.Theme.textColor
                                    }
                                }
                                
                                MouseArea {
                                    anchors.fill: parent
                                    enabled: parent.dayNumber > 0
                                    onClicked: {
                                        if (prayerCalc && parent.dayNumber > 0) {
                                            let newDate = new Date(calendarContainer.displayedDate.getFullYear(),
                                                                  calendarContainer.displayedDate.getMonth(),
                                                                  parent.dayNumber)
                                            calendarContainer.selectedDate = newDate
                                            prayerCalc.selectedDate = newDate
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            // Быстрый выбор
            RowLayout {
                Layout.fillWidth: true
                spacing: 8
                
                Button {
                    Layout.fillWidth: true
                    text: "◄◄ " + App.Translator.tr("Yesterday")
                    
                    background: Rectangle {
                        color: parent.pressed ? Qt.darker(App.Theme.cardColor, 1.1) : App.Theme.cardColor
                        radius: App.Theme.radiusMedium
                        border.color: App.Theme.borderColor
                        border.width: 1
                    }
                    
                    contentItem: Text {
                        text: parent.text
                        font: parent.font
                        color: App.Theme.textColor
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    
                    onClicked: {
                        if (prayerCalc) {
                            let yesterday = new Date()
                            yesterday.setDate(yesterday.getDate() - 1)
                            calendarContainer.displayedDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), 1)
                            calendarContainer.selectedDate = yesterday
                            prayerCalc.selectedDate = yesterday
                        }
                    }
                }
                
                Button {
                    Layout.fillWidth: true
                    text: App.Translator.tr("Today")
                    
                    background: Rectangle {
                        color: parent.pressed ? Qt.darker(App.Theme.primaryColor, 1.1) : App.Theme.primaryColor
                        radius: App.Theme.radiusMedium
                    }
                    
                    contentItem: Text {
                        text: parent.text
                        font.pixelSize: parent.font.pixelSize
                        font.family: parent.font.family
                        font.weight: Font.Bold
                        color: "white"
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    
                    onClicked: {
                        if (prayerCalc) {
                            let today = new Date()
                            calendarContainer.displayedDate = new Date(today.getFullYear(), today.getMonth(), 1)
                            calendarContainer.selectedDate = today
                            prayerCalc.resetToToday()
                        }
                    }
                }
                
                Button {
                    Layout.fillWidth: true
                    text: App.Translator.tr("Tomorrow") + " ►►"
                    
                    background: Rectangle {
                        color: parent.pressed ? Qt.darker(App.Theme.cardColor, 1.1) : App.Theme.cardColor
                        radius: App.Theme.radiusMedium
                        border.color: App.Theme.borderColor
                        border.width: 1
                    }
                    
                    contentItem: Text {
                        text: parent.text
                        font: parent.font
                        color: App.Theme.textColor
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    
                    onClicked: {
                        if (prayerCalc) {
                            let tomorrow = new Date()
                            tomorrow.setDate(tomorrow.getDate() + 1)
                            calendarContainer.displayedDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1)
                            calendarContainer.selectedDate = tomorrow
                            prayerCalc.selectedDate = tomorrow
                        }
                    }
                }
            }
            
            // Кнопка закрытия
            Button {
                Layout.fillWidth: true
                Layout.preferredHeight: 44
                text: App.Translator.tr("Close")
                
                background: Rectangle {
                    color: parent.pressed ? Qt.darker(App.Theme.secondaryTextColor, 1.2) : App.Theme.secondaryTextColor
                    radius: App.Theme.radiusMedium
                }
                
                contentItem: Text {
                    text: parent.text
                    font: parent.font
                    color: "white"
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                
                onClicked: dateDialog.close()
            }
        }
    }
}

