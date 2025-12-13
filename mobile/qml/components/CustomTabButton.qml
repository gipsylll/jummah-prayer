import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as App

TabButton {
    id: root
    
    property string iconText: ""
    property string labelText: ""
    property bool isActive: false
    
    background: Rectangle {
        color: isActive ? Qt.lighter(App.Theme.primaryColor, 1.2) : "transparent"
        
        Behavior on color {
            ColorAnimation {
                duration: 200
                easing.type: Easing.OutCubic
            }
        }
        
        // Индикатор активной вкладки
        Rectangle {
            visible: isActive
            anchors.top: parent.top
            anchors.horizontalCenter: parent.horizontalCenter
            width: parent.width * 0.6
            height: 3
            color: "white"
            radius: 1.5
        }
    }
    
    contentItem: ColumnLayout {
        spacing: 4
        
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: iconText
            font.pixelSize: 24
            
            // Анимация иконки при нажатии
            scale: root.pressed ? 0.9 : 1.0
            Behavior on scale {
                NumberAnimation {
                    duration: 100
                    easing.type: Easing.OutCubic
                }
            }
        }
        
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: labelText
            font.pixelSize: 11
            color: "white"
            opacity: isActive ? 1.0 : 0.7
            
            Behavior on opacity {
                NumberAnimation {
                    duration: 200
                    easing.type: Easing.OutCubic
                }
            }
        }
    }
}

