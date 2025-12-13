import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as App

Rectangle {
    id: root
    
    property string title: ""
    property alias content: contentLoader.sourceComponent
    
    Layout.fillWidth: true
    implicitHeight: mainColumn.implicitHeight + 32
    color: App.Theme.cardColor
    radius: 16
    
    ColumnLayout {
        id: mainColumn
        anchors.fill: parent
        anchors.margins: 20
        spacing: 16
        
        // Заголовок секции
        RowLayout {
            Layout.fillWidth: true
            spacing: 12
            
            Rectangle {
                width: 4
                height: titleText.height
                color: App.Theme.primaryColor
                radius: 2
            }
            
            Text {
                id: titleText
                text: title
                font.pixelSize: 18
                font.bold: true
                color: App.Theme.primaryColor
            }
        }
        
        // Контент
        Loader {
            id: contentLoader
            Layout.fillWidth: true
        }
    }
}

