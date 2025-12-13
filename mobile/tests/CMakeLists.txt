cmake_minimum_required(VERSION 3.16)

# Поиск Qt компонентов
find_package(Qt6 REQUIRED COMPONENTS Test QuickTest Qml Network)

# Включаем автоматическую обработку
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)

# Тест для PrayerTimesCalculator (C++)
add_executable(test_prayertimes
    test_prayertimes.cpp
    ../src/PrayerTimesCalculator.cpp
    ../src/PrayerTimesCalculator.h
)

target_link_libraries(test_prayertimes PRIVATE
    Qt6::Core
    Qt6::Test
    Qt6::Network
)

# Тест для QML UI
add_executable(test_qml_ui
    test_qml_ui.cpp
    qml_tests.qrc
    ../src/PrayerTimesCalculator.cpp
    ../src/PrayerTimesCalculator.h
)

target_link_libraries(test_qml_ui PRIVATE
    Qt6::Core
    Qt6::Qml
    Qt6::QuickTest
    Qt6::Network
)

# Регистрируем типы для QML тестов
target_compile_definitions(test_qml_ui PRIVATE
    QUICK_TEST_SOURCE_DIR="${CMAKE_CURRENT_SOURCE_DIR}"
)

# Включаем CTest
enable_testing()
add_test(NAME PrayerTimesTest COMMAND test_prayertimes)
add_test(NAME QmlUiTest COMMAND test_qml_ui -input ${CMAKE_CURRENT_SOURCE_DIR})

