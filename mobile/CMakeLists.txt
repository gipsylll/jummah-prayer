cmake_minimum_required(VERSION 3.16)

project(JummahPrayer VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Опции компиляции
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# Опции для инструментов анализа кода
option(ENABLE_CLANG_TIDY "Enable clang-tidy" OFF)
option(ENABLE_CPPCHECK "Enable cppcheck" OFF)
option(ENABLE_FORMATTING "Enable formatting targets" ON)

# Автоматическая обработка MOC, UIC, RCC
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

# Поиск Qt6
find_package(Qt6 REQUIRED COMPONENTS Core Gui Qml Quick Positioning Sensors Network Widgets)

# Исходные файлы
set(PROJECT_SOURCES
    src/main.cpp
    src/PrayerTimesCalculator.h
    src/PrayerTimesCalculator.cpp
    src/AppSettings.h
    src/AppSettings.cpp
    src/LocationService.h
    src/LocationService.cpp
    src/NotificationService.h
    src/NotificationService.cpp
)

# QML файлы
set(QML_RESOURCES
    qml/qml.qrc
)

# Создание исполняемого файла
qt_add_executable(${PROJECT_NAME}
    ${PROJECT_SOURCES}
    ${QML_RESOURCES}
)

# Линковка с Qt библиотеками
target_link_libraries(${PROJECT_NAME} PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Qml
    Qt6::Quick
    Qt6::Positioning
    Qt6::Sensors
    Qt6::Network
    Qt6::Widgets
)

# Установка свойств для Android
if(ANDROID)
    set_target_properties(${PROJECT_NAME} PROPERTIES
        QT_ANDROID_PACKAGE_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/android"
    )
endif()

# Установка свойств для macOS
if(APPLE)
    # Опции для архитектуры macOS
    option(BUILD_UNIVERSAL "Build universal binary for both Intel and Apple Silicon" OFF)
    option(BUILD_ARM64_ONLY "Build only for Apple Silicon (arm64)" OFF)
    option(BUILD_X86_64_ONLY "Build only for Intel (x86_64)" OFF)
    
    # Настройка архитектур
    if(BUILD_UNIVERSAL)
        set(CMAKE_OSX_ARCHITECTURES "x86_64;arm64" CACHE STRING "macOS architectures")
        message(STATUS "Building universal binary for x86_64 and arm64")
    elseif(BUILD_ARM64_ONLY)
        set(CMAKE_OSX_ARCHITECTURES "arm64" CACHE STRING "macOS architectures")
        message(STATUS "Building for Apple Silicon (arm64) only")
    elseif(BUILD_X86_64_ONLY)
        set(CMAKE_OSX_ARCHITECTURES "x86_64" CACHE STRING "macOS architectures")
        message(STATUS "Building for Intel (x86_64) only")
    else()
        message(STATUS "Building for local architecture (native)")
    endif()
    
    # Минимальная версия macOS (10.15 для поддержки старых Mac)
    if(NOT CMAKE_OSX_DEPLOYMENT_TARGET)
        set(CMAKE_OSX_DEPLOYMENT_TARGET "10.15" CACHE STRING "Minimum macOS version")
    endif()
    
    set_target_properties(${PROJECT_NAME} PROPERTIES
        MACOSX_BUNDLE TRUE
        MACOSX_BUNDLE_INFO_PLIST "${CMAKE_CURRENT_SOURCE_DIR}/macos/Info.plist"
    )
    
    # Добавляем разрешения для геолокации
    set_target_properties(${PROJECT_NAME} PROPERTIES
        MACOSX_BUNDLE_GUI_IDENTIFIER "com.jummahprayer.app"
    )
endif()

# Установка свойств для Windows
if(WIN32)
    # Для Windows 10+ нужно добавить capability для геолокации в манифест
    # Это можно сделать через qt_generate_windeply() или через ресурсный файл
    # Пока используем стандартный подход Qt
    set_target_properties(${PROJECT_NAME} PROPERTIES
        WIN32_EXECUTABLE TRUE
    )
endif()

# Копирование Qt runtime библиотек (для Windows/Linux)
if(WIN32 OR UNIX AND NOT APPLE)
    qt_import_plugins(${PROJECT_NAME}
        INCLUDE Qt::QSvgPlugin
    )
endif()

# Включаем тесты
option(BUILD_TESTS "Build tests" ON)
if(BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()

# Форматирование кода
if(ENABLE_FORMATTING)
    find_program(CLANG_FORMAT_EXE NAMES clang-format)
    if(CLANG_FORMAT_EXE)
        file(GLOB_RECURSE ALL_SOURCE_FILES src/*.cpp src/*.h)
        
        add_custom_target(format
            COMMAND ${CLANG_FORMAT_EXE} -i ${ALL_SOURCE_FILES}
            COMMENT "Formatting code with clang-format"
        )
        
        add_custom_target(format-check
            COMMAND ${CLANG_FORMAT_EXE} --dry-run --Werror ${ALL_SOURCE_FILES}
            COMMENT "Checking code formatting"
        )
        
        message(STATUS "clang-format: ${CLANG_FORMAT_EXE}")
    endif()
endif()

# Статический анализ
if(ENABLE_CLANG_TIDY)
    find_program(CLANG_TIDY_EXE NAMES clang-tidy)
    if(CLANG_TIDY_EXE)
        set(CMAKE_CXX_CLANG_TIDY ${CLANG_TIDY_EXE})
        message(STATUS "clang-tidy: ${CLANG_TIDY_EXE}")
    endif()
endif()

if(ENABLE_CPPCHECK)
    find_program(CPPCHECK_EXE NAMES cppcheck)
    if(CPPCHECK_EXE)
        set(CMAKE_CXX_CPPCHECK ${CPPCHECK_EXE} --enable=warning --inline-suppr)
        message(STATUS "cppcheck: ${CPPCHECK_EXE}")
    endif()
endif()

# Информация о сборке
message(STATUS "")
message(STATUS "=== Jummah Prayer v${PROJECT_VERSION} ===")
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "C++ standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "Tests: ${BUILD_TESTS}")
message(STATUS "==============================")
message(STATUS "")

