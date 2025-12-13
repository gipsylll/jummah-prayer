#include "FileService.h"
#include <fstream>
#include <sstream>
#include <iostream>
#include <vector>

std::string FileService::readFile(const std::string& path) {
    std::ifstream file(path, std::ios::binary);
    if (!file) {
        return "";
    }
    
    std::ostringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

std::string FileService::getMimeType(const std::string& path) {
    auto endsWith = [](const std::string& str, const std::string& suffix) {
        return str.size() >= suffix.size() && 
               str.compare(str.size() - suffix.size(), suffix.size(), suffix) == 0;
    };
    
    if (endsWith(path, ".html")) return "text/html; charset=utf-8";
    if (endsWith(path, ".css")) return "text/css";
    if (endsWith(path, ".js")) return "application/javascript";
    if (endsWith(path, ".json")) return "application/json";
    if (endsWith(path, ".png")) return "image/png";
    if (endsWith(path, ".jpg") || endsWith(path, ".jpeg")) return "image/jpeg";
    if (endsWith(path, ".svg")) return "image/svg+xml";
    if (endsWith(path, ".ico")) return "image/x-icon";
    if (endsWith(path, ".webmanifest")) return "application/manifest+json";
    return "text/plain";
}

std::string FileService::findWebRoot(int argc, char* argv[]) {
    std::string webRoot;
    
    // Если путь указан как аргумент командной строки
    if (argc > 1) {
        webRoot = argv[1];
        if (webRoot.back() != '/') {
            webRoot += "/";
        }
        std::cout << "📁 Используем указанный путь: " << webRoot << std::endl;
    } else {
        // Пробуем разные варианты в зависимости от места запуска
        std::vector<std::string> possiblePaths = {
            "../frontend/",                    // Если запускаем из backend/build/
            "../../frontend/",                  // Если запускаем из корня проекта
            "frontend/"                         // Если запускаем из корня проекта
        };
        
        // Ищем существующий путь
        for (const auto& path : possiblePaths) {
            std::ifstream testFile(path + "index.html");
            if (testFile.good()) {
                webRoot = path;
                testFile.close();
                std::cout << "✅ Найдена папка с веб-файлами: " << webRoot << std::endl;
                break;
            }
            testFile.close();
        }
        
        // Если ничего не нашли, используем относительный путь
        if (webRoot.empty()) {
            webRoot = "../frontend/";
            std::cout << "⚠️  Предупреждение: используем путь по умолчанию: " << webRoot << std::endl;
            std::cout << "   Убедитесь, что папка frontend/ существует относительно места запуска" << std::endl;
            std::cout << "   Или укажите путь: ./JummahPrayerBackend /путь/к/frontend/" << std::endl;
        }
    }
    
    // Проверяем, что index.html существует
    std::ifstream checkIndex(webRoot + "index.html");
    if (!checkIndex.good()) {
        std::cerr << "❌ ОШИБКА: Не найден файл " << webRoot << "index.html" << std::endl;
        std::cerr << "   Проверьте путь к веб-файлам!" << std::endl;
        return "";
    }
    checkIndex.close();
    
    return webRoot;
}

