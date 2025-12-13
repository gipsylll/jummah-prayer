#define CPPHTTPLIB_OPENSSL_SUPPORT
#define CPPHTTPLIB_USE_CERTS_FROM_MACOSX_KEYCHAIN
#include "CitySearchService.h"
#include <httplib.h>
#include <iostream>
#include <sstream>
#include <iomanip>
#include <thread>
#include <map>

std::mutex CitySearchService::nominatimMutex;
std::chrono::steady_clock::time_point CitySearchService::lastNominatimRequest = std::chrono::steady_clock::now();

std::string CitySearchService::urlEncode(const std::string& str) {
    std::ostringstream encoded;
    encoded.fill('0');
    encoded << std::hex;
    
    for (unsigned char c : str) {
        if (std::isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
            encoded << static_cast<char>(c);
        } else if (c == ' ') {
            encoded << '+';
        } else {
            encoded << '%' << std::setw(2) << static_cast<int>(c);
        }
    }
    
    return encoded.str();
}

std::string CitySearchService::httpGetNominatim(const std::string& endpoint, const std::map<std::string, std::string>& params) {
    std::cout << "🚀 Начало запроса к Nominatim, endpoint: " << endpoint << std::endl;
    
    // Добавляем задержку между запросами (Nominatim требует минимум 1 секунду между запросами)
    {
        std::lock_guard<std::mutex> lock(nominatimMutex);
        auto now = std::chrono::steady_clock::now();
        auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - lastNominatimRequest);
        
        if (elapsed.count() < 1000) {
            int delay = 1000 - elapsed.count();
            std::cout << "⏳ Задержка " << delay << " мс перед запросом (политика Nominatim)" << std::endl;
            std::this_thread::sleep_for(std::chrono::milliseconds(delay));
        }
        
        lastNominatimRequest = std::chrono::steady_clock::now();
    }
    
    try {
        httplib::SSLClient cli("nominatim.openstreetmap.org", 443);
        cli.set_follow_location(true);
        cli.set_connection_timeout(10);
        cli.set_read_timeout(10);
        
        std::ostringstream url;
        url << endpoint << "?";
        
        bool first = true;
        for (const auto& [key, value] : params) {
            if (!first) url << "&";
            first = false;
            url << urlEncode(key) << "=" << urlEncode(value);
        }
        
        httplib::Headers headers = {
            {"User-Agent", "JummahPrayer/1.0 (https://github.com/jummah-prayer; contact@jummahprayer.app)"},
            {"Accept", "application/json"},
            {"Accept-Language", "ru,en"}
        };
        
        std::string fullUrl = url.str();
        std::cout << "🌐 Полный URL запроса: https://nominatim.openstreetmap.org" << fullUrl << std::endl;
        
        auto response = cli.Get(fullUrl.c_str(), headers);
        
        if (response && response->status == 200) {
            std::cout << "✅ Получен ответ от Nominatim, размер: " << response->body.size() << " байт" << std::endl;
            return response->body;
        } else {
            std::cout << "❌ Ошибка подключения к Nominatim" << std::endl;
            if (response) {
                std::cout << "   Статус: " << response->status << std::endl;
            }
        }
    } catch (const std::exception& e) {
        std::cout << "❌ Исключение при запросе к Nominatim: " << e.what() << std::endl;
    }
    
    return "";
}

std::string CitySearchService::searchCities(const std::string& query, int limit) {
    std::map<std::string, std::string> params;
    params["q"] = query;
    params["format"] = "json";
    params["limit"] = std::to_string(limit);
    params["addressdetails"] = "1";
    
    return CitySearchService::httpGetNominatim("/search", params);
}

std::string CitySearchService::findNearestCity(double lat, double lon) {
    std::map<std::string, std::string> params;
    params["lat"] = std::to_string(lat);
    params["lon"] = std::to_string(lon);
    params["format"] = "json";
    params["addressdetails"] = "1";
    
    return CitySearchService::httpGetNominatim("/reverse", params);
}

