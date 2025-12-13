cmake_minimum_required(VERSION 3.16)

project(JummahPrayerBackend VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Опции компиляции
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# Исходные файлы
set(BACKEND_SOURCES
    src/server.cpp
    src/PrayerTimesCalculator.cpp
)

# Скачиваем cpp-httplib (header-only библиотека)
include(FetchContent)
FetchContent_Declare(
    httplib
    GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
    GIT_TAG v0.15.3
)
FetchContent_MakeAvailable(httplib)

# Создание исполняемого файла
add_executable(${PROJECT_NAME}
    ${BACKEND_SOURCES}
)

# Включаем директории
target_include_directories(${PROJECT_NAME} PRIVATE
    src
    ${httplib_SOURCE_DIR}
)

# Поиск OpenSSL для HTTPS поддержки
find_package(OpenSSL REQUIRED)

# Линковка
if(APPLE)
    # macOS: используем системные сертификаты
    target_link_libraries(${PROJECT_NAME} PRIVATE 
        OpenSSL::SSL 
        OpenSSL::Crypto
        "-framework CoreFoundation"
        "-framework Security"
    )
elseif(UNIX)
    target_link_libraries(${PROJECT_NAME} PRIVATE 
        OpenSSL::SSL 
        OpenSSL::Crypto
        pthread
    )
endif()

# Информация о сборке
message(STATUS "")
message(STATUS "=== Jummah Prayer Backend v${PROJECT_VERSION} ===")
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "C++ standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "==============================")
message(STATUS "")

