import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import "." as App

Page {
    id: root
    
    property var appSettings
    
    title: qsTr("Зикры и Дуа")
    
    background: Rectangle {
        color: App.Theme.backgroundColor
    }
    
    header: Rectangle {
        width: parent.width
        height: 90
        gradient: Gradient {
            GradientStop { position: 0.0; color: App.Theme.primaryColor }
            GradientStop { position: 1.0; color: App.Theme.primaryLight }
        }
        
        Text {
            anchors.centerIn: parent
            text: App.Translator.tr("Dhikr and Duas")
            font.pixelSize: 26
            font.bold: true
            color: "white"
        }
    }
    
    ListView {
        anchors.fill: parent
        clip: true
        spacing: 8
        
        Component.onCompleted: {
            console.log("ListView создан, количество элементов:", count)
        }
        
        model: ListModel {
            ListElement {
                title: "Субханаллах"
                arabic: "سُبْحَانَ ٱللَّٰهِ"
                transliteration: "Subḥānallāh"
                translation: "Слава Аллаху"
                count: 33
            }
            ListElement {
                title: "Альхамдулиллях"
                arabic: "ٱلْحَمْدُ لِلَّٰهِ"
                transliteration: "Alḥamdulillāh"
                translation: "Хвала Аллаху"
                count: 33
            }
            ListElement {
                title: "Аллаху Акбар"
                arabic: "ٱللَّٰهُ أَكْبَرُ"
                transliteration: "Allāhu akbar"
                translation: "Аллах велик"
                count: 34
            }
            ListElement {
                title: "Ля иляха илляллах"
                arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ"
                transliteration: "Lā ilāha illallāh"
                translation: "Нет божества, кроме Аллаха"
                count: 100
            }
            ListElement {
                title: "Астагфируллах"
                arabic: "أَسْتَغْفِرُ ٱللَّٰهَ"
                transliteration: "Astaghfirullāh"
                translation: "Прошу прощения у Аллаха"
                count: 100
            }
            ListElement {
                title: "Дуа перед едой"
                arabic: "بِسْمِ ٱللَّٰهِ"
                transliteration: "Bismillāh"
                translation: "Во имя Аллаха"
                count: 1
            }
            ListElement {
                title: "Дуа после еды"
                arabic: "ٱلْحَمْدُ لِلَّٰهِ ٱلَّذِي أَطْعَمَنَا وَسَقَانَا"
                transliteration: "Alḥamdulillāhil-ladhī aṭ'amanā wa-saqānā"
                translation: "Хвала Аллаху, Который накормил нас и напоил нас"
                count: 1
            }
            ListElement {
                title: "Дуа перед сном"
                arabic: "بِٱسْمِكَ ٱللَّٰهُمَّ أَمُوتُ وَأَحْيَا"
                transliteration: "Bismika Allāhumma amūtu wa-aḥyā"
                translation: "Именем Твоим, о Аллах, умираю и оживаю"
                count: 1
            }
        }
        
        delegate: Rectangle {
            width: ListView.view.width
            height: column.implicitHeight + 40
            color: "transparent"
            
            Component.onCompleted: {
                console.log("Delegate создан для:", model.title)
            }
            
            Rectangle {
                id: cardRect
                anchors.fill: parent
                anchors.margins: 12
                radius: App.Theme.radiusLarge
                color: App.Theme.cardColor
                border.color: App.Theme.borderColor
                border.width: 1
                
                // Анимация scale
                Behavior on scale {
                    NumberAnimation { duration: 150; easing.type: Easing.OutCubic }
                }
                
                // MouseArea для кликабельности
                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    hoverEnabled: true
                    
                    onClicked: {
                        counterDialog.dhikrTitle = model.title
                        counterDialog.dhikrArabic = model.arabic
                        counterDialog.targetCount = model.count
                        counterDialog.currentCount = 0
                        counterDialog.open()
                    }
                    
                    onEntered: cardRect.scale = 1.02
                    onExited: cardRect.scale = 1.0
                    onPressed: cardRect.scale = 0.98
                    onReleased: cardRect.scale = 1.02
                }
                
                ColumnLayout {
                    id: column
                    width: parent.width - 40
                    anchors.centerIn: parent
                    spacing: 14
                    
                    RowLayout {
                        Layout.fillWidth: true
                        Layout.maximumWidth: parent.width
                        spacing: 12
                        
                        Rectangle {
                            width: 4
                            height: titleText.height
                            radius: 2
                            color: App.Theme.primaryColor
                        }
                        
                        Text {
                            id: titleText
                            Layout.fillWidth: true
                            text: model.title
                            font.pixelSize: 19
                            font.bold: true
                            color: App.Theme.textColor
                            wrapMode: Text.WordWrap
                            elide: Text.ElideRight
                            maximumLineCount: 2
                        }
                        
                        Rectangle {
                            id: counterRect
                            Layout.preferredWidth: counterText.width + 20
                            Layout.maximumWidth: counterText.width + 20
                            Layout.alignment: Qt.AlignTop
                            height: 30
                            radius: 15
                            gradient: Gradient {
                                GradientStop { position: 0.0; color: App.Theme.primaryColor }
                                GradientStop { position: 1.0; color: App.Theme.primaryLight }
                            }
                            
                            Text {
                                id: counterText
                                anchors.centerIn: parent
                                text: model.count + "×"
                                font.pixelSize: 13
                                font.bold: true
                                color: "white"
                            }
                        }
                    }
                    
                    Text {
                        Layout.fillWidth: true
                        Layout.maximumWidth: parent.width
                        text: model.arabic
                        font.pixelSize: 26
                        font.family: "Arial"
                        color: App.Theme.primaryColor
                        horizontalAlignment: Text.AlignRight
                        wrapMode: Text.WrapAtWordBoundaryOrAnywhere
                    }
                    
                    Text {
                        Layout.fillWidth: true
                        Layout.maximumWidth: parent.width
                        text: model.transliteration
                        font.pixelSize: 13
                        font.italic: true
                        color: App.Theme.secondaryTextColor
                        wrapMode: Text.WordWrap
                    }
                    
                    Text {
                        Layout.fillWidth: true
                        Layout.maximumWidth: parent.width
                        text: model.translation
                        font.pixelSize: 14
                        color: App.Theme.textColor
                        wrapMode: Text.WordWrap
                    }
                }
            }
        }
    }
    
    // Диалог счетчика
    Dialog {
        id: counterDialog
        modal: true
        anchors.centerIn: parent
        width: Math.min(parent.width * 0.9, 400)
        height: 550
        
        property string dhikrTitle: ""
        property string dhikrArabic: ""
        property int targetCount: 0
        property int currentCount: 0
        
        title: dhikrTitle
        
        // Функция для увеличения счетчика (общая для круга и кнопки)
        function incrementCounter() {
            currentCount++
            // Пульсация круга при увеличении
            if (counterCircle) {
                counterCircle.scale = 1.05
                Qt.callLater(function() {
                    if (counterCircle) {
                        counterCircle.scale = 1.0
                    }
                })
            }
            
            if (currentCount >= targetCount) {
                // Достигли цели - показываем диалог и сбрасываем счетчик
                Qt.callLater(function() {
                    completionDialog.open()
                    currentCount = 0
                })
            }
        }
        
        background: Rectangle {
            color: App.Theme.surfaceColor
            radius: App.Theme.radiusLarge
        }
        
        ColumnLayout {
            anchors.fill: parent
            spacing: 20
            
            Text {
                Layout.fillWidth: true
                Layout.alignment: Qt.AlignHCenter
                text: counterDialog.dhikrArabic
                font.pixelSize: 34
                font.bold: true
                color: App.Theme.primaryColor
                horizontalAlignment: Text.AlignHCenter
                wrapMode: Text.WordWrap
            }
            
            // Инструкция
            Rectangle {
                Layout.fillWidth: true
                implicitHeight: instructionText.implicitHeight + 20
                radius: App.Theme.radiusMedium
                gradient: Gradient {
                    GradientStop { position: 0.0; color: "#E3F2FD" }
                    GradientStop { position: 1.0; color: "#BBDEFB" }
                }
                
                RowLayout {
                    anchors.fill: parent
                    anchors.margins: 12
                    spacing: 10
                    
                    Text {
                        text: "💡"
                        font.pixelSize: 22
                    }
                    
                    Text {
                        id: instructionText
                        Layout.fillWidth: true
                        text: App.Translator.tr("Counter instruction")
                        font.pixelSize: 12
                        color: "#1565C0"
                        wrapMode: Text.WordWrap
                        verticalAlignment: Text.AlignVCenter
                    }
                }
            }
            
            // Счетчик (кликабельный круг)
            Rectangle {
                id: counterCircle
                Layout.alignment: Qt.AlignHCenter
                width: 220
                height: 220
                radius: 110
                gradient: Gradient {
                    GradientStop { position: 0.0; color: "#E8F5E9" }
                    GradientStop { position: 1.0; color: "#C8E6C9" }
                }
                border.color: App.Theme.primaryColor
                border.width: 6
                
                // Пульсация при изменении счетчика
                scale: 1.0
                Behavior on scale {
                    SequentialAnimation {
                        NumberAnimation { to: 1.05; duration: 100 }
                        NumberAnimation { to: 1.0; duration: 100 }
                    }
                }
                
                // Анимация при нажатии
                Behavior on opacity {
                    NumberAnimation { duration: 150 }
                }
                
                Text {
                    anchors.centerIn: parent
                    text: counterDialog.currentCount
                    font.pixelSize: 68
                    font.bold: true
                    color: App.Theme.primaryColor
                }
                
                // MouseArea для кликабельности круга
                MouseArea {
                    id: circleMouseArea
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    
                    onClicked: {
                        counterDialog.incrementCounter()
                    }
                    
                    onPressed: {
                        counterCircle.scale = 0.95
                        counterCircle.opacity = 0.8
                    }
                    
                    onReleased: {
                        counterCircle.scale = 1.0
                        counterCircle.opacity = 1.0
                    }
                }
            }
            
            // Цель и прогресс
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 70
                radius: App.Theme.radiusMedium
                color: App.Theme.cardColor
                
                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 12
                    spacing: 8
                    
                    RowLayout {
                        Layout.fillWidth: true
                        
                        Text {
                            text: qsTr("Цель:")
                            font.pixelSize: 14
                            color: App.Theme.secondaryTextColor
                        }
                        
                        Text {
                            Layout.fillWidth: true
                            text: counterDialog.targetCount + " раз"
                            font.pixelSize: 16
                            font.bold: true
                            color: App.Theme.textColor
                            horizontalAlignment: Text.AlignRight
                        }
                    }
                    
                    ProgressBar {
                        Layout.fillWidth: true
                        from: 0
                        to: counterDialog.targetCount
                        value: counterDialog.currentCount
                        
                        background: Rectangle {
                            implicitWidth: 200
                            implicitHeight: 8
                            color: App.Theme.borderColor
                            radius: 4
                        }
                        
                        contentItem: Item {
                            implicitWidth: 200
                            implicitHeight: 8
                            
                            Rectangle {
                                width: parent.parent.visualPosition * parent.width
                                height: parent.height
                                radius: 4
                                gradient: Gradient {
                                    GradientStop { position: 0.0; color: App.Theme.primaryColor }
                                    GradientStop { position: 1.0; color: App.Theme.primaryLight }
                                }
                            }
                        }
                    }
                }
            }
            
            Button {
                Layout.fillWidth: true
                Layout.preferredHeight: 70
                text: App.Translator.tr("Press")
                font.pixelSize: 22
                font.bold: true
                
                background: Rectangle {
                    gradient: Gradient {
                        GradientStop { position: 0.0; color: parent.pressed ? Qt.darker(App.Theme.primaryColor, 1.3) : App.Theme.primaryColor }
                        GradientStop { position: 1.0; color: parent.pressed ? Qt.darker(App.Theme.primaryLight, 1.3) : App.Theme.primaryLight }
                    }
                    radius: App.Theme.radiusMedium
                    
                    // Эффект при нажатии
                    scale: parent.pressed ? 0.97 : 1.0
                    Behavior on scale {
                        NumberAnimation { duration: 100 }
                    }
                }
                
                contentItem: Text {
                    text: parent.text
                    font: parent.font
                    color: "white"
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                
                onClicked: {
                    counterDialog.incrementCounter()
                }
            }
            
            // Кнопки управления
            Row {
                Layout.fillWidth: true
                spacing: 12
                
                Button {
                    width: (parent.width - parent.spacing) / 2
                    height: 50
                    text: App.Translator.tr("Reset")
                    font.pixelSize: 15
                    
                    background: Rectangle {
                        color: parent.pressed ? Qt.darker(App.Theme.accentColor, 1.3) : App.Theme.accentColor
                        radius: App.Theme.radiusMedium
                    }
                    
                    contentItem: Text {
                        text: parent.text
                        font: parent.font
                        color: "white"
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    
                    onClicked: {
                        counterDialog.currentCount = 0
                    }
                }
                
                Button {
                    width: (parent.width - parent.spacing) / 2
                    height: 50
                    text: App.Translator.tr("Close")
                    font.pixelSize: 15
                    
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
                    
                    onClicked: {
                        counterDialog.close()
                    }
                }
            }
        }
    }
    
    // Диалог завершения
    Dialog {
        id: completionDialog
        modal: true
        anchors.centerIn: parent
        title: qsTr("Машаллах!")
        standardButtons: Dialog.Ok
        width: Math.min(parent.width * 0.8, 350)
        
        background: Rectangle {
            color: App.Theme.surfaceColor
            radius: App.Theme.radiusLarge
        }
        
        ColumnLayout {
            width: parent.width
            spacing: 16
            
            Text {
                text: "✨"
                font.pixelSize: 48
                Layout.alignment: Qt.AlignHCenter
            }
            
            Text {
                Layout.fillWidth: true
                text: qsTr("Вы достигли цели!\nДа примет Аллах ваши деяния.")
                font.pixelSize: 16
                color: App.Theme.textColor
                wrapMode: Text.WordWrap
                horizontalAlignment: Text.AlignHCenter
            }
        }
        
        onAccepted: {
            counterDialog.currentCount = 0
            counterDialog.close()
        }
    }
}

