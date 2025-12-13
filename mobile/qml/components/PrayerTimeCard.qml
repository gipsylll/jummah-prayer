import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects
import ".." as App

Rectangle {
    id: root
    
    property string prayerName: ""
    property string prayerTime: ""
    property string icon: ""
    property bool isInfo: false
    property bool isCurrent: false
    property bool isNext: false
    property real progressValue: 0.0 // 0.0 - 1.0
    
    height: 100
    radius: 20
    
    // Основной цвет карточки
    color: {
        if (isCurrent || isNext) return "transparent"
        return App.Theme.cardColor
    }
    
    // Тень для карточки
    layer.enabled: true
    layer.effect: MultiEffect {
        shadowEnabled: true
        shadowColor: App.Theme.shadowColor
        shadowBlur: 0.3
        shadowHorizontalOffset: 0
        shadowVerticalOffset: 4
    }
    
    // Градиент для текущего и следующего намаза
    gradient: {
        if (isCurrent) {
            return currentGradient
        }
        if (isNext) {
            return nextGradient
        }
        return null
    }
    
    Gradient {
        id: currentGradient
        GradientStop { position: 0.0; color: App.Theme.primaryColor }
        GradientStop { position: 1.0; color: Qt.lighter(App.Theme.primaryColor, 1.3) }
    }
    
    Gradient {
        id: nextGradient
        GradientStop { position: 0.0; color: App.Theme.accentColor }
        GradientStop { position: 1.0; color: App.Theme.accentLight }
    }
    
    border.color: {
        if (isInfo) return App.Theme.borderColor
        if (isCurrent || isNext) return "transparent"
        return App.Theme.primaryColor
    }
    border.width: isInfo ? 1 : 2
    
    // Анимация появления
    opacity: 0
    scale: 0.9
    
    Component.onCompleted: {
        appearAnimation.start()
    }
    
    ParallelAnimation {
        id: appearAnimation
        NumberAnimation {
            target: root
            property: "opacity"
            from: 0
            to: 1
            duration: 400
            easing.type: Easing.OutCubic
        }
        NumberAnimation {
            target: root
            property: "scale"
            from: 0.9
            to: 1
            duration: 400
            easing.type: Easing.OutBack
        }
    }
    
    // Фоновый прогресс-бар
    Rectangle {
        visible: isCurrent && progressValue > 0
        anchors.fill: parent
        radius: parent.radius
        color: "transparent"
        clip: true
        
        Rectangle {
            anchors.left: parent.left
            anchors.top: parent.top
            anchors.bottom: parent.bottom
            width: parent.width * progressValue
            color: Qt.rgba(1, 1, 1, 0.2)
            
            Behavior on width {
                NumberAnimation { 
                    duration: 1000
                    easing.type: Easing.OutCubic 
                }
            }
        }
    }
    
    // Эффект при наведении
    Behavior on scale {
        NumberAnimation {
            duration: 200
            easing.type: Easing.OutCubic
        }
    }
    
    MouseArea {
        anchors.fill: parent
        hoverEnabled: true
        onEntered: parent.scale = 1.03
        onExited: parent.scale = 1.0
        cursorShape: Qt.PointingHandCursor
    }
    
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 20
        spacing: 12
        
        // Верхняя часть: иконка + название + время
        RowLayout {
            Layout.fillWidth: true
            spacing: 16
            
            // Анимированная иконка
            Rectangle {
                Layout.preferredWidth: 60
                Layout.preferredHeight: 60
                Layout.alignment: Qt.AlignTop
                radius: 30
                color: isCurrent || isNext ? Qt.rgba(1, 1, 1, 0.9) : App.Theme.backgroundColor
                border.color: isCurrent || isNext ? "transparent" : App.Theme.primaryColor
                border.width: 2
                
                // Тень для иконки
                layer.enabled: true
                layer.effect: MultiEffect {
                    shadowEnabled: true
                    shadowColor: App.Theme.shadowColorLight
                    shadowBlur: 0.2
                    shadowHorizontalOffset: 0
                    shadowVerticalOffset: 2
                }
                
                Text {
                    anchors.centerIn: parent
                    text: icon
                    font.pixelSize: 32
                    
                    // Пульсация для текущего намаза
                    SequentialAnimation on scale {
                        running: isCurrent
                        loops: Animation.Infinite
                        NumberAnimation { to: 1.15; duration: 1000; easing.type: Easing.InOutQuad }
                        NumberAnimation { to: 1.0; duration: 1000; easing.type: Easing.InOutQuad }
                    }
                }
            }
            
            // Информация о намазе
            ColumnLayout {
                Layout.fillWidth: true
                Layout.minimumWidth: 0
                spacing: 6
                
                Text {
                    Layout.fillWidth: true
                    Layout.maximumWidth: parent.width - (isCurrent || isNext ? 80 : 0)
                    text: prayerName
                    font.pixelSize: 18
                    font.weight: isInfo ? Font.Normal : Font.DemiBold
                    color: {
                        if (isCurrent || isNext) return "white"
                        if (isInfo) return App.Theme.secondaryTextColor
                        return App.Theme.textColor
                    }
                    wrapMode: Text.WordWrap
                    maximumLineCount: 2
                }
                
                Text {
                    Layout.fillWidth: true
                    text: isCurrent ? App.Translator.tr("In Progress") : 
                          isNext ? App.Translator.tr("Coming Next") :
                          isInfo ? App.Translator.tr("Not Prayer Time") : 
                          App.Translator.tr("Obligatory Prayer")
                    font.pixelSize: 13
                    font.weight: (isCurrent || isNext) ? Font.Medium : Font.Normal
                    color: {
                        if (isCurrent || isNext) return Qt.rgba(1, 1, 1, 0.9)
                        return App.Theme.secondaryTextColor
                    }
                }
                
                // Прогресс-индикатор для текущего намаза
                Rectangle {
                    visible: isCurrent && progressValue > 0
                    Layout.preferredWidth: 120
                    height: 4
                    radius: 2
                    color: Qt.rgba(1, 1, 1, 0.3)
                    
                    Rectangle {
                        anchors.left: parent.left
                        anchors.top: parent.top
                        anchors.bottom: parent.bottom
                        width: parent.width * progressValue
                        radius: parent.radius
                        color: "white"
                        
                        Behavior on width {
                            NumberAnimation { 
                                duration: 500
                                easing.type: Easing.OutCubic 
                            }
                        }
                    }
                }
            }
            
            // Время справа
            Text {
                Layout.alignment: Qt.AlignTop | Qt.AlignRight
                Layout.rightMargin: 0
                Layout.topMargin: isCurrent || isNext ? 36 : 0
                text: prayerTime || "00:00"
                font.pixelSize: 28
                font.weight: Font.Bold
                font.family: "SF Mono, Menlo, Courier"
                color: {
                    if (isCurrent || isNext) return "white"
                    if (isInfo) return App.Theme.secondaryTextColor
                    return App.Theme.primaryColor
                }
            }
        }
    }
    
    // Индикатор "Текущий"
    Rectangle {
        visible: isCurrent
        anchors.top: parent.top
        anchors.right: parent.right
        anchors.margins: 12
        width: currentLabel.width + 16
        height: 24
        radius: 12
        color: "white"
        
        Text {
            id: currentLabel
            anchors.centerIn: parent
            text: "● " + App.Translator.tr("Current")
            font.pixelSize: 11
            font.bold: true
            color: App.Theme.primaryColor
        }
    }
    
    // Индикатор "Следующий"
    Rectangle {
        visible: isNext
        anchors.top: parent.top
        anchors.right: parent.right
        anchors.margins: 12
        width: nextLabel.width + 16
        height: 24
        radius: 12
        color: "white"
        
        Text {
            id: nextLabel
            anchors.centerIn: parent
            text: "▶ " + App.Translator.tr("Next")
            font.pixelSize: 11
            font.bold: true
            color: "#FF9800"
        }
    }
}

