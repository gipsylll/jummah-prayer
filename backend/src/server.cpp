#define CPPHTTPLIB_OPENSSL_SUPPORT
#define CPPHTTPLIB_USE_CERTS_FROM_MACOSX_KEYCHAIN
#include <httplib.h>
#include "PrayerTimesCalculator.h"
#include "FileService.h"
#include "JsonService.h"
#include "AuthService.h"
#include "CitySearchService.h"
#include <iostream>
#include <sstream>
#include <fstream>
#include <string>
#include <map>
#include <vector>
#include <iomanip>
#include <thread>
#include <future>
#include <cctype>
#include <cstdio>
#include <chrono>
#include <mutex>


int main(int argc, char* argv[]) {
    httplib::Server server;
    PrayerTimesCalculator calculator;
    AuthService authService;
    
    // Определяем путь к веб-файлам
    std::string webRoot = FileService::findWebRoot(argc, argv);
    if (webRoot.empty()) {
        return 1;
    }
    
    // CORS headers
    auto setCorsHeaders = [](httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    };
    
    // OPTIONS для CORS preflight (должен быть первым)
    server.Options(".*", [&setCorsHeaders](const httplib::Request& /*req*/, httplib::Response& res) {
        setCorsHeaders(res);
        res.status = 200;
    });
    
    // Обработчик для всех остальных запросов (статические файлы)
    // Регистрируем ДО API, но с проверкой внутри
    auto handleStaticFile = [&webRoot, &setCorsHeaders](const httplib::Request& req, httplib::Response& res) {
        // Пропускаем API запросы
        if (req.path.find("/api/") == 0) {
            res.status = 404;
            res.set_content("Not Found", "text/plain");
            return;
        }
        
        std::string path = req.path;
        if (path == "/") {
            path = "/index.html";
        }
        
        std::string filePath = webRoot + path.substr(1);
        std::cout << "📄 Запрос: " << req.path << " -> файл: " << filePath << std::endl;
        
        std::string content = FileService::readFile(filePath);
        
        if (content.empty()) {
            std::cout << "⚠️  Файл не найден: " << filePath << std::endl;
            res.status = 404;
            res.set_content("Not Found: " + filePath, "text/plain");
        } else {
            std::cout << "✅ Файл найден, размер: " << content.size() << " байт" << std::endl;
            res.set_content(content, FileService::getMimeType(filePath));
        }
        
        setCorsHeaders(res);
    };
    
    // Регистрируем обработчик для корня ПЕРВЫМ
    server.Get("/", handleStaticFile);
    
    // ========== API ENDPOINTS ДЛЯ АУТЕНТИФИКАЦИИ ==========
    
    // Регистрация
    server.Post("/api/auth/register", [&authService, &setCorsHeaders](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        res.set_header("Content-Type", "application/json");
        
        try {
            auto params = JsonService::parseJson(req.body);
            
            if (params.find("email") == params.end() || params.find("password") == params.end() || params.find("name") == params.end()) {
                res.status = 400;
                res.set_content(JsonService::createResponse(false, "Email, password and name are required"), "application/json");
                return;
            }
            
            std::string result = authService.registerUser(params["email"], params["password"], params["name"]);
            if (result.find("\"success\":true") != std::string::npos) {
                res.status = 201;
            } else {
                res.status = 400;
            }
            res.set_content(result, "application/json");
        } catch (const std::exception& e) {
            res.status = 500;
            res.set_content(JsonService::createResponse(false, "Server error: " + std::string(e.what())), "application/json");
        }
    });
    
    // Вход
    server.Post("/api/auth/login", [&authService, &setCorsHeaders](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        res.set_header("Content-Type", "application/json");
        
        try {
            auto params = JsonService::parseJson(req.body);
            
            if (params.find("email") == params.end() || params.find("password") == params.end()) {
                res.status = 400;
                res.set_content(JsonService::createResponse(false, "Email and password are required"), "application/json");
                return;
            }
            
            std::string result = authService.loginUser(params["email"], params["password"]);
            if (result.find("\"success\":true") != std::string::npos) {
                res.status = 200;
            } else {
                res.status = 401;
            }
            res.set_content(result, "application/json");
        } catch (const std::exception& e) {
            res.status = 500;
            res.set_content(JsonService::createResponse(false, "Server error: " + std::string(e.what())), "application/json");
        }
    });
    
    // Получение информации о текущем пользователе
    server.Get("/api/auth/me", [&authService, &setCorsHeaders](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        res.set_header("Content-Type", "application/json");
        
        std::string authHeader = req.has_header("Authorization") ? req.get_header_value("Authorization") : "";
        std::string token = AuthService::getTokenFromHeader(authHeader);
        
        if (token.empty()) {
            res.status = 401;
            res.set_content(JsonService::createResponse(false, "Token required"), "application/json");
            return;
        }
        
        std::string userId = authService.validateToken(token);
        if (userId.empty()) {
            res.status = 401;
            res.set_content(JsonService::createResponse(false, "Invalid or expired token"), "application/json");
            return;
        }
        
        std::string result = authService.getUserInfo(userId);
        res.status = 200;
        res.set_content(result, "application/json");
    });
    
    // Выход
    server.Post("/api/auth/logout", [&authService, &setCorsHeaders](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        res.set_header("Content-Type", "application/json");
        
        std::string authHeader = req.has_header("Authorization") ? req.get_header_value("Authorization") : "";
        std::string token = AuthService::getTokenFromHeader(authHeader);
        
        if (token.empty()) {
            res.status = 401;
            res.set_content(JsonService::createResponse(false, "Token required"), "application/json");
            return;
        }
        
        bool success = authService.logoutUser(token);
        if (success) {
            res.status = 200;
            res.set_content(JsonService::createResponse(true, "Logged out successfully"), "application/json");
        } else {
            res.status = 400;
            res.set_content(JsonService::createResponse(false, "Invalid token"), "application/json");
        }
    });
    
    // Функция для получения кода метода для Aladhan API
    auto getMethodCode = [](int method) -> std::string {
        switch (method) {
            case 0: return "3";  // MWL
            case 1: return "2";  // ISNA
            case 2: return "5";  // Egypt
            case 3: return "4";  // Makkah
            case 4: return "1";  // Karachi
            case 5: return "7";  // Tehran
            default: return "4";  // Makkah по умолчанию
        }
    };
    
    // Функция для запроса времени молитв из Aladhan API
    auto httpGetAladhan = [&getMethodCode](double lat, double lon, int method, int madhhab, int year, int month, int day) -> std::string {
        std::cout << "🕌 Запрос времени молитв из Aladhan API" << std::endl;
        
        httplib::SSLClient cli("api.aladhan.com", 443);
        cli.set_follow_location(true);
        cli.set_connection_timeout(10);
        cli.set_read_timeout(10);
        
        // Формируем дату в формате DD-MM-YYYY для явного указания григорианского календаря
        // Aladhan API интерпретирует YYYY-MM-DD как хиджру, а DD-MM-YYYY как григорианский календарь
        std::ostringstream dateStr;
        dateStr << std::setfill('0') << std::setw(2) << day << "-"
                << std::setw(2) << month << "-" << year;
        
        std::ostringstream url;
        // Используем дату в формате DD-MM-YYYY для григорианского календаря
        // Согласно документации Aladhan API: https://aladhan.com/prayer-times-api
        url << "/v1/timings/" << dateStr.str() << "?";
        url << "latitude=" << lat << "&";
        url << "longitude=" << lon << "&";
        url << "method=" << getMethodCode(method) << "&";
        url << "school=" << (madhhab == 1 ? "1" : "0") << "&";  // 1 = Hanafi, 0 = Shafi'i
        url << "calendar=gregorian";  // Явно указываем григорианский календарь
        
        httplib::Headers headers = {
            {"Accept", "application/json"},
            {"Cache-Control", "no-cache, no-store, must-revalidate"},
            {"Pragma", "no-cache"}
        };
        
        std::string fullUrl = url.str();
        std::cout << "🌐 Запрос к Aladhan: https://api.aladhan.com" << fullUrl << std::endl;
        std::cout << "   Дата запроса: " << dateStr.str() << std::endl;
        
        auto response = cli.Get(fullUrl.c_str(), headers);
        if (response && response->status == 200) {
            std::cout << "✅ Получен ответ от Aladhan, размер: " << response->body.size() << " байт" << std::endl;
            return response->body;
        } else {
            std::cout << "❌ Ошибка подключения к Aladhan API" << std::endl;
            if (response) {
                std::cout << "   Статус: " << response->status << std::endl;
                std::cout << "   Тело ответа: " << response->body.substr(0, 200) << std::endl;
            }
        }
        return "";
    };
    
    // Простая функция для извлечения значения из JSON (упрощенный парсер)
    // Ищет значение внутри структуры {"data":{"timings":{"Fajr":"05:30","Sunrise":"07:00",...}}}
    auto extractJsonValue = [](const std::string& json, const std::string& key) -> std::string {
        // Сначала ищем внутри "timings"
        std::string timingsKey = "\"timings\"";
        size_t timingsPos = json.find(timingsKey);
        if (timingsPos == std::string::npos) {
            // Если timings не найден, ищем ключ напрямую
            timingsPos = 0;
        } else {
            // Ищем открывающую скобку после "timings"
            timingsPos = json.find("{", timingsPos);
            if (timingsPos == std::string::npos) return "";
        }
        
        // Ищем ключ в формате "Fajr", "Sunrise" и т.д.
        std::string searchKey = "\"" + key + "\"";
        size_t pos = json.find(searchKey, timingsPos);
        if (pos == std::string::npos) {
            std::cout << "   ⚠️ Ключ \"" << key << "\" не найден в JSON" << std::endl;
            return "";
        }
        
        // Находим двоеточие после ключа
        pos = json.find(":", pos);
        if (pos == std::string::npos) return "";
        pos++;
        
        // Пропускаем пробелы и табы
        while (pos < json.size() && (json[pos] == ' ' || json[pos] == '\t' || json[pos] == '\n' || json[pos] == '\r')) {
            pos++;
        }
        
        if (pos >= json.size() || json[pos] != '"') {
            std::cout << "   ⚠️ Ожидалась кавычка после ключа \"" << key << "\"" << std::endl;
            return "";
        }
        pos++; // Пропускаем открывающую кавычку
        
        // Извлекаем значение до закрывающей кавычки
        size_t end = pos;
        while (end < json.size() && json[end] != '"') {
            if (json[end] == '\\' && end + 1 < json.size()) {
                end += 2; // Пропускаем экранированные символы
            } else {
                end++;
            }
        }
        
        if (end > pos) {
            std::string value = json.substr(pos, end - pos);
            // Убираем возможные экранированные символы (упрощенно)
            size_t escPos = 0;
            while ((escPos = value.find("\\", escPos)) != std::string::npos && escPos + 1 < value.size()) {
                value.erase(escPos, 1);
            }
            return value;
        }
        return "";
    };
    
    // Функция для запроса восхода/заката из Sunrise-Sunset API (более точные данные)
    auto httpGetSunriseSunset = [&extractJsonValue](double lat, double lon, int year, int month, int day) -> std::pair<std::string, std::string> {
        std::cout << "🌅 Запрос восхода/заката из Sunrise-Sunset API" << std::endl;
        
        try {
            httplib::SSLClient cli("api.sunrise-sunset.org", 443);
            cli.set_follow_location(true);
            cli.set_connection_timeout(10);
            cli.set_read_timeout(10);
            
            std::ostringstream url;
            url << "/json?lat=" << lat << "&lng=" << lon 
                << "&date=" << year << "-" << std::setfill('0') << std::setw(2) << month 
                << "-" << std::setw(2) << day << "&formatted=1";
            
            httplib::Headers headers = {
                {"Accept", "application/json"}
            };
            
            std::string fullUrl = url.str();
            std::cout << "🌐 Запрос к Sunrise-Sunset: https://api.sunrise-sunset.org" << fullUrl << std::endl;
            
            auto response = cli.Get(fullUrl.c_str(), headers);
            if (response && response->status == 200) {
                std::cout << "✅ Получен ответ от Sunrise-Sunset API" << std::endl;
                std::cout << "   Полный ответ: " << response->body << std::endl;
                
                // Парсим ответ: {"results":{"sunrise":"7:46:00 AM","sunset":"4:44:00 PM",...}}
                // С formatted=1 API возвращает время в локальном часовом поясе в формате "H:MM:SS AM/PM"
                // Ищем внутри "results"
                std::string resultsKey = "\"results\"";
                size_t resultsPos = response->body.find(resultsKey);
                if (resultsPos == std::string::npos) {
                    std::cout << "⚠️  В ответе отсутствует объект 'results'" << std::endl;
                    std::cout << "   Ответ: " << response->body << std::endl;
                    return {"", ""};
                }
                
                // Ищем открывающую скобку после "results"
                resultsPos = response->body.find("{", resultsPos);
                if (resultsPos == std::string::npos) {
                    std::cout << "⚠️  Не найдена открывающая скобка после 'results'" << std::endl;
                    return {"", ""};
                }
                
                // Извлекаем sunrise и sunset из results
                std::string resultsJson = response->body.substr(resultsPos);
                std::string sunrise = extractJsonValue(resultsJson, "sunrise");
                std::string sunset = extractJsonValue(resultsJson, "sunset");
                
                std::cout << "   Извлечено из JSON - sunrise: '" << sunrise << "', sunset: '" << sunset << "'" << std::endl;
                
                // Конвертируем из формата "H:MM:SS AM/PM" в "HH:mm"
                auto convertTo24Hour = [](const std::string& time12h) -> std::string {
                    if (time12h.empty()) {
                        return "";
                    }
                    
                    // Формат: "7:46:00 AM" или "4:44:00 PM"
                    size_t spacePos = time12h.find(" ");
                    if (spacePos == std::string::npos) {
                        return "";
                    }
                    
                    std::string timePart = time12h.substr(0, spacePos); // "7:46:00" или "4:44:00"
                    std::string ampm = time12h.substr(spacePos + 1); // "AM" или "PM"
                    
                    size_t colonPos = timePart.find(":");
                    if (colonPos == std::string::npos) {
                        return "";
                    }
                    
                    int hour = std::stoi(timePart.substr(0, colonPos));
                    size_t colonPos2 = timePart.find(":", colonPos + 1);
                    if (colonPos2 == std::string::npos) {
                        return "";
                    }
                    int minute = std::stoi(timePart.substr(colonPos + 1, colonPos2 - colonPos - 1));
                    
                    // Конвертируем в 24-часовой формат
                    if (ampm == "PM" && hour != 12) {
                        hour += 12;
                    } else if (ampm == "AM" && hour == 12) {
                        hour = 0;
                    }
                    
                    std::ostringstream result;
                    result << std::setfill('0') << std::setw(2) << hour << ":"
                           << std::setw(2) << minute;
                    
                    return result.str();
                };
                
                sunrise = convertTo24Hour(sunrise);
                sunset = convertTo24Hour(sunset);
                
                std::cout << "   Восход (локальное время): " << sunrise << ", Закат (локальное время): " << sunset << std::endl;
                return {sunrise, sunset};
            } else {
                std::cout << "❌ Ошибка подключения к Sunrise-Sunset API" << std::endl;
                if (response) {
                    std::cout << "   Статус: " << response->status << std::endl;
                }
            }
        } catch (const std::exception& e) {
            std::cout << "❌ Исключение при запросе к Sunrise-Sunset API: " << e.what() << std::endl;
        }
        
        return {"", ""};
    };
    
    // API: Получить время молитв из Aladhan API
    server.Get("/api/prayer-times", [&httpGetAladhan, &extractJsonValue, &calculator, &setCorsHeaders](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        
        // Отключаем кэширование ответа
        res.set_header("Cache-Control", "no-cache, no-store, must-revalidate");
        res.set_header("Pragma", "no-cache");
        res.set_header("Expires", "0");
        
        // Парсинг параметров
        std::map<std::string, std::string> params;
        for (const auto& param : req.params) {
            params[param.first] = param.second;
        }
        
        // Получаем координаты
        if (params.find("lat") == params.end() || params.find("lon") == params.end()) {
            res.status = 400;
            res.set_content("{\"success\": false, \"error\": \"lat and lon parameters are required\"}", "application/json");
            return;
        }
        
        double lat, lon;
        try {
            lat = std::stod(params["lat"]);
            lon = std::stod(params["lon"]);
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content("{\"success\": false, \"error\": \"Invalid latitude or longitude\"}", "application/json");
            return;
        }
        
        std::string city = (params.find("city") != params.end()) ? params["city"] : "";
        
        // Получаем метод и мазхаб
        int method = 3; // Makkah по умолчанию
        int madhhab = 0; // Shafi'i по умолчанию
        
        if (params.find("method") != params.end()) {
            try {
                method = std::stoi(params["method"]);
            } catch (const std::exception& e) {}
        }
        if (params.find("madhhab") != params.end()) {
            try {
                madhhab = std::stoi(params["madhhab"]);
            } catch (const std::exception& e) {}
        }
        
        // Получаем дату
        std::time_t t = std::time(nullptr);
        std::tm* now = std::localtime(&t);
        int year = now->tm_year + 1900;
        int month = now->tm_mon + 1;
        int day = now->tm_mday;
        
        if (params.find("year") != params.end()) {
            try { year = std::stoi(params["year"]); } catch (const std::exception& e) {}
        }
        if (params.find("month") != params.end()) {
            try { month = std::stoi(params["month"]); } catch (const std::exception& e) {}
        }
        if (params.find("day") != params.end()) {
            try { day = std::stoi(params["day"]); } catch (const std::exception& e) {}
        }
        
        // Запрос к Aladhan API
        std::string apiResponse = httpGetAladhan(lat, lon, method, madhhab, year, month, day);
        
        if (apiResponse.empty()) {
            res.status = 500;
            res.set_content("{\"success\": false, \"error\": \"Failed to fetch prayer times from API\"}", "application/json");
            return;
        }
        
        // Парсим ответ от Aladhan API
        // Формат: {"data":{"timings":{"Fajr":"05:30","Sunrise":"07:00",...}}}
        std::cout << "📋 Парсинг ответа от Aladhan API для даты: " << year << "-" << month << "-" << day << std::endl;
        std::cout << "   Координаты: " << lat << ", " << lon << std::endl;
        std::cout << "   Первые 800 символов ответа: " << apiResponse.substr(0, 800) << std::endl;
        
        // Проверяем наличие ключевых полей в ответе
        if (apiResponse.find("\"timings\"") == std::string::npos) {
            std::cout << "⚠️  В ответе API отсутствует объект 'timings'!" << std::endl;
            std::cout << "   Полный ответ: " << apiResponse << std::endl;
        }
        
        std::string fajr = extractJsonValue(apiResponse, "Fajr");
        std::string sunrise = extractJsonValue(apiResponse, "Sunrise");
        std::string dhuhr = extractJsonValue(apiResponse, "Dhuhr");
        std::string asr = extractJsonValue(apiResponse, "Asr");
        std::string maghrib = extractJsonValue(apiResponse, "Maghrib");
        std::string isha = extractJsonValue(apiResponse, "Isha");
        
        // НЕ используем Sunrise-Sunset API, так как он возвращает время в UTC, а не в локальном часовом поясе
        // Aladhan API уже возвращает правильные времена в локальном часовом поясе
        // Если нужно использовать Sunrise-Sunset API, нужно добавить конвертацию UTC -> локальное время
        
        std::cout << "📊 Извлеченные времена:" << std::endl;
        std::cout << "   Fajr: " << (fajr.empty() ? "(пусто)" : fajr) << std::endl;
        std::cout << "   Sunrise: " << (sunrise.empty() ? "(пусто)" : sunrise) << std::endl;
        std::cout << "   Dhuhr: " << (dhuhr.empty() ? "(пусто)" : dhuhr) << std::endl;
        std::cout << "   Asr: " << (asr.empty() ? "(пусто)" : asr) << std::endl;
        std::cout << "   Maghrib: " << (maghrib.empty() ? "(пусто)" : maghrib) << std::endl;
        std::cout << "   Isha: " << (isha.empty() ? "(пусто)" : isha) << std::endl;
        
        // Проверяем, что все времена извлечены
        if (fajr.empty() || sunrise.empty() || dhuhr.empty() || asr.empty() || maghrib.empty() || isha.empty()) {
            std::cout << "⚠️  Не все времена молитв извлечены из ответа API!" << std::endl;
        }
        
        // Форматируем дату
        std::ostringstream dateStream;
        dateStream << std::setfill('0') << std::setw(2) << day << "."
                   << std::setw(2) << month << "." << year;
        
        // Устанавливаем местоположение для определения текущей/следующей молитвы
        calculator.setLocation(lat, lon, city);
        calculator.setDate(year, month, day);
        
        // Формируем JSON ответ
        std::ostringstream json;
        json << "{\n";
        json << "  \"success\": true,\n";
        json << "  \"data\": {\n";
        json << "    \"fajr\": \"" << fajr << "\",\n";
        json << "    \"sunrise\": \"" << sunrise << "\",\n";
        json << "    \"dhuhr\": \"" << dhuhr << "\",\n";
        json << "    \"asr\": \"" << asr << "\",\n";
        json << "    \"maghrib\": \"" << maghrib << "\",\n";
        json << "    \"isha\": \"" << isha << "\",\n";
        json << "    \"date\": \"" << dateStream.str() << "\",\n";
        json << "    \"city\": \"" << city << "\",\n";
        json << "    \"latitude\": " << lat << ",\n";
        json << "    \"longitude\": " << lon << ",\n";
        json << "    \"currentPrayer\": \"" << calculator.getCurrentPrayer() << "\",\n";
        json << "    \"nextPrayer\": \"" << calculator.getNextPrayer() << "\"\n";
        json << "  }\n";
        json << "}";
        
        res.set_content(json.str(), "application/json");
    });
    
    // API: Поиск городов через Nominatim (OpenStreetMap)
    server.Get("/api/cities/search", [&setCorsHeaders](const httplib::Request& req, httplib::Response& res) {
        std::cout << "🔍 API запрос: /api/cities/search" << std::endl;
        setCorsHeaders(res);
        
        // Получаем параметр запроса
        std::string query;
        if (req.has_param("q")) {
            query = req.get_param_value("q");
        } else if (req.has_param("query")) {
            query = req.get_param_value("query");
        }
        
        std::cout << "📝 Параметр запроса: \"" << query << "\"" << std::endl;
        
        if (query.empty() || query.length() < 2) {
            std::cout << "⚠️  Запрос слишком короткий или пустой" << std::endl;
            res.status = 400;
            res.set_content("{\"success\": false, \"error\": \"Query must be at least 2 characters\"}", "application/json");
            return;
        }
        
        // Получаем лимит результатов
        int limit = 20;
        if (req.has_param("limit")) {
            try {
                limit = std::stoi(req.get_param_value("limit"));
                if (limit < 1) limit = 1;
                if (limit > 50) limit = 50; // Nominatim ограничивает до 50
            } catch (const std::exception& e) {
                std::cout << "⚠️  Некорректный лимит, используем значение по умолчанию: 20" << std::endl;
                limit = 20;
            }
        }
        
        std::cout << "📊 Лимит результатов: " << limit << std::endl;
        
        // Формируем параметры для Nominatim
        std::map<std::string, std::string> params;
        params["q"] = query;
        params["format"] = "json";
        params["limit"] = std::to_string(limit);
        params["addressdetails"] = "1";
        params["extratags"] = "1";
        params["accept-language"] = "ru,en";
        
        std::cout << "🌐 Отправка запроса к Nominatim..." << std::endl;
        
        // Делаем запрос к Nominatim
        std::string responseBody = CitySearchService::searchCities(query, limit);
        
        if (responseBody.empty()) {
            std::cout << "❌ Пустой ответ от Nominatim" << std::endl;
            res.status = 500;
            res.set_content("{\"success\": false, \"error\": \"Failed to fetch cities from external API\"}", "application/json");
            return;
        }
        
        // Проверяем, что ответ валидный JSON (начинается с [ или {)
        if (responseBody.empty() || (responseBody[0] != '[' && responseBody[0] != '{')) {
            std::cout << "⚠️  Некорректный формат ответа от Nominatim" << std::endl;
            res.status = 500;
            res.set_content("{\"success\": false, \"error\": \"Invalid response format from external API\"}", "application/json");
            return;
        }
        
        // Возвращаем ответ от Nominatim в формате, который ожидает фронтенд
        std::ostringstream json;
        json << "{\n";
        json << "  \"success\": true,\n";
        json << "  \"query\": \"" << query << "\",\n";
        json << "  \"data\": {\n";
        json << "    \"cities\": " << responseBody << "\n";
        json << "  }\n";
        json << "}";
        
        std::string jsonResponse = json.str();
        std::cout << "✅ Отправка ответа клиенту, размер: " << jsonResponse.size() << " байт" << std::endl;
        
        res.set_content(jsonResponse, "application/json");
    });
    
    // API: Получить город по координатам через Nominatim (обратное геокодирование)
    server.Get("/api/cities/nearest", [&setCorsHeaders](const httplib::Request& req, httplib::Response& res) {
        setCorsHeaders(res);
        
        if (!req.has_param("lat") || !req.has_param("lon")) {
            res.status = 400;
            res.set_content("{\"success\": false, \"error\": \"lat and lon parameters are required\"}", "application/json");
            return;
        }
        
        try {
            double lat = std::stod(req.get_param_value("lat"));
            double lon = std::stod(req.get_param_value("lon"));
            
            // Формируем параметры для обратного геокодирования
            std::map<std::string, std::string> params;
            params["lat"] = std::to_string(lat);
            params["lon"] = std::to_string(lon);
            params["format"] = "json";
            params["addressdetails"] = "1";
            params["accept-language"] = "ru,en";
            
            // Делаем запрос к Nominatim через сервис
            std::string responseBody = CitySearchService::findNearestCity(lat, lon);
            
            if (responseBody.empty()) {
                res.status = 500;
                res.set_content("{\"success\": false, \"error\": \"Failed to fetch city from external API\"}", "application/json");
                return;
            }
            
            // Возвращаем ответ от Nominatim
            std::ostringstream json;
            json << "{\n";
            json << "  \"success\": true,\n";
            json << "  \"data\": " << responseBody << "\n";
            json << "}";
            
            res.set_content(json.str(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content("{\"success\": false, \"error\": \"Invalid latitude or longitude\"}", "application/json");
        }
    });
    
    // API: Установить местоположение
    server.Post("/api/location", [&setCorsHeaders](const httplib::Request& /*req*/, httplib::Response& res) {
        setCorsHeaders(res);
        
        // Парсим JSON (упрощенная версия)
        // В реальности лучше использовать библиотеку для JSON
        std::ostringstream json;
        json << "{\"success\": true}";
        res.set_content(json.str(), "application/json");
    });
    
    // Регистрируем обработчики для статических файлов (после API)
    server.Get("/styles.css", handleStaticFile);
    server.Get("/app.js", handleStaticFile);
    server.Get("/prayer-calculator.js", handleStaticFile);
    server.Get("/translations.js", handleStaticFile);
    server.Get("/manifest.json", handleStaticFile);
    
    // Fallback для всех остальных файлов (должен быть последним)
    // Используем паттерн, который не перехватывает /api/
    server.Get(".*", [&webRoot, &setCorsHeaders](const httplib::Request& req, httplib::Response& res) {
        // Пропускаем API запросы
        if (req.path.find("/api/") == 0) {
            res.status = 404;
            res.set_content("Not Found", "text/plain");
            return;
        }
        
        // Пропускаем уже зарегистрированные пути
        if (req.path == "/" || req.path == "/styles.css" || req.path == "/app.js" || 
            req.path == "/prayer-calculator.js" || req.path == "/translations.js" || 
            req.path == "/manifest.json") {
            res.status = 404;
            res.set_content("Not Found", "text/plain");
            return;
        }
        
        std::string path = req.path;
        std::string filePath = webRoot + path.substr(1);
        std::cout << "📄 Запрос: " << req.path << " -> файл: " << filePath << std::endl;
        
        std::string content = FileService::readFile(filePath);
        
        if (content.empty()) {
            std::cout << "⚠️  Файл не найден: " << filePath << std::endl;
            res.status = 404;
            res.set_content("Not Found: " + filePath, "text/plain");
        } else {
            std::cout << "✅ Файл найден, размер: " << content.size() << " байт" << std::endl;
            res.set_content(content, FileService::getMimeType(filePath));
        }
        
        setCorsHeaders(res);
    });
    
    std::cout << "Сервер запущен на http://localhost:8080\n";
    std::cout << "Откройте http://localhost:8080 в браузере\n";
    
    if (!server.listen("0.0.0.0", 8080)) {
        std::cerr << "Ошибка запуска сервера!\n";
        return 1;
    }
    
    return 0;
}

