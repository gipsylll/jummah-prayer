import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects
import ".." as App

Dialog {
    id: root
    
    property var prayerCalc
    property var appSettings
    
    modal: true
    anchors.centerIn: parent
    width: Math.min(parent.width * 0.9, 500)
    height: Math.min(parent.height * 0.8, 600)
    
    // Убираем стандартный заголовок
    header: null
    
    background: Rectangle {
        color: App.Theme.surfaceColor
        radius: App.Theme.radiusXLarge
        border.color: App.Theme.borderColor
        border.width: 1
        
        // Улучшенная тень для диалога
        layer.enabled: true
        layer.effect: MultiEffect {
            shadowEnabled: true
            shadowColor: App.Theme.shadowColor
            shadowBlur: 0.5
            shadowHorizontalOffset: 0
            shadowVerticalOffset: 8
            shadowOpacity: 0.3
        }
    }
    
    property var cityList: []
    property bool isLoading: false
    
    ListModel {
        id: cityListModel
    }
    
    Timer {
        id: searchTimer
        interval: 500 // Задержка 500мс перед поиском
        onTriggered: {
            performSearch(searchField.text)
        }
    }
    
    function performSearch(query) {
        if (query.length < 2) {
            cityList = []
            return
        }
        
        isLoading = true
        
        // Используем Nominatim API от OpenStreetMap (бесплатный, без ключа)
        var url = "https://nominatim.openstreetmap.org/search?format=json&q=" + 
                  encodeURIComponent(query) + 
                  "&limit=20&addressdetails=1"
        
        console.log("CitySearchDialog: Поиск города:", query)
        console.log("CitySearchDialog: URL:", url)
        
        var xhr = new XMLHttpRequest()
        xhr.open("GET", url)
        xhr.setRequestHeader("User-Agent", "JummahPrayer/1.0")
        xhr.setRequestHeader("Accept", "application/json")
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                isLoading = false
                console.log("CitySearchDialog: Статус ответа:", xhr.status)
                
                if (xhr.status === 200) {
                    try {
                        var response = JSON.parse(xhr.responseText)
                        cityListModel.clear()
                        cityList = []
                        
                        console.log("CitySearchDialog: Получено результатов:", response.length)
                        
                        for (var i = 0; i < response.length; i++) {
                            var item = response[i]
                            
                            // Извлекаем название города из разных полей
                            var cityName = item.address.city || 
                                          item.address.town || 
                                          item.address.village || 
                                          item.address.municipality ||
                                          item.address.city_district ||
                                          item.address.county ||
                                          item.name || ""
                            
                            var country = item.address.country || ""
                            var region = item.address.state || item.address.region || item.address.province || ""
                            
                            // Пропускаем элементы без названия города или если это не город
                            if (!cityName || cityName === "" || 
                                (item.type !== "city" && item.type !== "town" && item.type !== "village" && 
                                 item.type !== "municipality" && !item.address.city && !item.address.town && 
                                 !item.address.village && !item.address.municipality)) {
                                // Проверяем, есть ли хотя бы адрес
                                if (!item.address || Object.keys(item.address).length === 0) {
                                    continue
                                }
                            }
                            
                            // Если название города пустое, используем display_name
                            if (!cityName || cityName === "") {
                                cityName = item.display_name ? item.display_name.split(",")[0] : item.name
                            }
                            
                            var displayName = cityName
                            if (region && region !== cityName && region.length > 0) {
                                displayName = cityName + ", " + region
                            }
                            if (country && country !== cityName && country !== region && country.length > 0) {
                                if (displayName === cityName) {
                                    displayName = cityName + ", " + country
                                } else {
                                    displayName = displayName + ", " + country
                                }
                            }
                            
                            var cityData = {
                                name: cityName,
                                displayName: displayName,
                                country: country,
                                latitude: parseFloat(item.lat),
                                longitude: parseFloat(item.lon)
                            }
                            
                            cityList.push(cityData)
                            cityListModel.append(cityData)
                        }
                        
                        console.log("CitySearchDialog: Добавлено городов в модель:", cityListModel.count)
                    } catch (e) {
                        console.error("CitySearchDialog: Ошибка парсинга ответа:", e, xhr.responseText)
                        cityListModel.clear()
                        cityList = []
                    }
                } else {
                    console.error("CitySearchDialog: Ошибка запроса:", xhr.status, xhr.statusText)
                    cityListModel.clear()
                    cityList = []
                }
            }
        }
        xhr.send()
    }
    
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 24
        spacing: 20
        
        // Заголовок с улучшенным дизайном
        Item {
            Layout.fillWidth: true
            Layout.preferredHeight: 40
            
            Text {
                anchors.centerIn: parent
                text: App.Translator.tr("City Selection")
                font.pixelSize: 22
                font.weight: Font.Bold
                color: App.Theme.textColor
            }
            
            // Декоративная линия под заголовком
            Rectangle {
                anchors.bottom: parent.bottom
                anchors.horizontalCenter: parent.horizontalCenter
                width: 40
                height: 3
                radius: 2
                color: App.Theme.primaryColor
            }
        }
        
        // Поле поиска с иконкой
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 50
            color: App.Theme.backgroundColor
            radius: App.Theme.radiusMedium
            border.color: searchField.activeFocus ? App.Theme.primaryColor : App.Theme.borderColor
            border.width: searchField.activeFocus ? 2 : 1
            
            Behavior on border.color {
                ColorAnimation { duration: App.Theme.animationNormal }
            }
            
            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 16
                anchors.rightMargin: 16
                spacing: 12
                
                // Иконка поиска
                Text {
                    text: "🔍"
                    font.pixelSize: 20
                    Layout.alignment: Qt.AlignVCenter
                }
                
                TextField {
                    id: searchField
                    Layout.fillWidth: true
                    placeholderText: App.Translator.tr("Search city...")
                    color: App.Theme.textColor
                    selectionColor: App.Theme.primaryColor
                    selectedTextColor: "white"
                    placeholderTextColor: App.Theme.secondaryTextColor
                    font.pixelSize: 16
                    
                    onTextChanged: {
                        if (text.length >= 2) {
                            searchTimer.restart()
                        } else {
                            searchTimer.stop()
                            cityListModel.clear()
                            cityList = []
                        }
                    }
                    
                    Component.onCompleted: {
                        forceActiveFocus()
                    }
                }
                
                // Индикатор загрузки в поле поиска
                Text {
                    Layout.alignment: Qt.AlignVCenter
                    text: "⏳"
                    font.pixelSize: 16
                    visible: isLoading
                    opacity: isLoading ? 1 : 0
                    
                    Behavior on opacity {
                        NumberAnimation { duration: 200 }
                    }
                }
            }
        }
        
        
        // Список городов
        ScrollView {
            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true
            
            ListView {
                id: cityListView
                model: cityListModel
                spacing: 4
                
                delegate: Rectangle {
                    width: cityListView.width
                    height: 70
                    color: mouseArea.containsMouse ? App.Theme.cardColor : App.Theme.backgroundColor
                    radius: App.Theme.radiusMedium
                    border.color: mouseArea.containsMouse ? App.Theme.primaryColor : App.Theme.borderColor
                    border.width: mouseArea.containsMouse ? 1.5 : 1
                    
                    // Плавные анимации
                    Behavior on color {
                        ColorAnimation { duration: App.Theme.animationNormal }
                    }
                    Behavior on border.color {
                        ColorAnimation { duration: App.Theme.animationNormal }
                    }
                    Behavior on border.width {
                        NumberAnimation { duration: App.Theme.animationNormal }
                    }
                    
                    // Тень при наведении (упрощенная версия)
                    // Убрано для избежания проблем с производительностью
                    
                    RowLayout {
                        anchors.fill: parent
                        anchors.margins: 16
                        spacing: 16
                        
                        // Иконка локации с фоном
                        Rectangle {
                            Layout.preferredWidth: 40
                            Layout.preferredHeight: 40
                            radius: App.Theme.radiusSmall
                            color: App.Theme.primaryColor
                            opacity: 0.1
                            
                            Text {
                                anchors.centerIn: parent
                                text: "📍"
                                font.pixelSize: 22
                            }
                        }
                        
                        ColumnLayout {
                            Layout.fillWidth: true
                            spacing: 6
                            
                            Text {
                                text: displayName || name
                                font.pixelSize: 17
                                font.weight: Font.Medium
                                color: App.Theme.textColor
                                elide: Text.ElideRight
                            }
                            
                            Text {
                                text: country || ""
                                font.pixelSize: 13
                                color: App.Theme.secondaryTextColor
                                visible: country && country !== name
                            }
                        }
                        
                        // Стрелка выбора
                        Text {
                            text: "→"
                            font.pixelSize: 20
                            color: App.Theme.secondaryTextColor
                            opacity: mouseArea.containsMouse ? 1 : 0.5
                            
                            Behavior on opacity {
                                NumberAnimation { duration: App.Theme.animationFast }
                            }
                        }
                    }
                    
                    MouseArea {
                        id: mouseArea
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: {
                            // Сохраняем данные в локальные переменные перед закрытием
                            var cityName = (typeof name !== 'undefined' ? name : "") || ""
                            var lat = (typeof latitude !== 'undefined' ? latitude : 0) || 0
                            var lon = (typeof longitude !== 'undefined' ? longitude : 0) || 0
                            
                            // Проверяем валидность данных
                            if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
                                console.error("CitySearchDialog: Некорректные координаты")
                                root.close()
                                return
                            }
                            
                            // Выполняем операции синхронно перед закрытием
                            if (prayerCalc) {
                                prayerCalc.setLocation(lat, lon, cityName)
                            }
                            
                            if (appSettings) {
                                appSettings.saveLocation(lat, lon, cityName)
                            }
                            
                            // Закрываем диалог
                            root.close()
                        }
                    }
                }
                
                Column {
                    anchors.centerIn: parent
                    spacing: 12
                    visible: cityListView.count === 0
                    
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "🌍"
                        font.pixelSize: 48
                        opacity: 0.5
                    }
                    
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: cityListModel.count === 0 && searchField.text.length >= 2 && !isLoading ? 
                              App.Translator.tr("No cities found") : 
                              (searchField.text.length < 2 ? App.Translator.tr("Type at least 2 characters to search") : "")
                        font.pixelSize: 15
                        color: App.Theme.secondaryTextColor
                        horizontalAlignment: Text.AlignHCenter
                    }
                }
            }
        }
        
        // Кнопка отмены с улучшенным дизайном
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 48
            radius: App.Theme.radiusMedium
            color: cancelButtonMouseArea.pressed ? 
                   (App.Theme.darkMode ? Qt.darker(App.Theme.borderColor, 1.3) : Qt.lighter(App.Theme.borderColor, 1.1)) :
                   (App.Theme.darkMode ? App.Theme.cardColor : App.Theme.backgroundColor)
            border.color: App.Theme.borderColor
            border.width: 1
            
            Behavior on color {
                ColorAnimation { duration: App.Theme.animationFast }
            }
            
            Text {
                anchors.centerIn: parent
                text: App.Translator.tr("Cancel")
                font.pixelSize: 16
                font.weight: Font.Medium
                color: App.Theme.textColor
            }
            
            MouseArea {
                id: cancelButtonMouseArea
                anchors.fill: parent
                onClicked: root.close()
            }
        }
    }
}

