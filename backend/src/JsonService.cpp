#include "JsonService.h"
#include <sstream>
#include <random>
#include <iomanip>

std::string JsonService::generateUuid() {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 15);
    std::uniform_int_distribution<> dis2(8, 11);
    
    std::stringstream ss;
    ss << std::hex;
    
    for (int i = 0; i < 32; i++) {
        if (i == 8 || i == 12 || i == 16 || i == 20) {
            ss << "-";
        }
        
        if (i == 12) {
            ss << 4; // version 4
        } else if (i == 16) {
            ss << dis2(gen);
        } else {
            ss << dis(gen);
        }
    }
    
    return ss.str();
}

std::map<std::string, std::string> JsonService::parseJson(const std::string& json) {
    std::map<std::string, std::string> result;
    size_t pos = 0;
    
    // Убираем пробелы в начале и конце
    std::string cleanJson = json;
    while (!cleanJson.empty() && (cleanJson[0] == ' ' || cleanJson[0] == '\n' || cleanJson[0] == '\t')) {
        cleanJson.erase(0, 1);
    }
    while (!cleanJson.empty() && (cleanJson.back() == ' ' || cleanJson.back() == '\n' || cleanJson.back() == '\t')) {
        cleanJson.pop_back();
    }
    
    // Убираем фигурные скобки
    if (cleanJson.front() == '{') cleanJson.erase(0, 1);
    if (cleanJson.back() == '}') cleanJson.pop_back();
    
    pos = 0;
    while (pos < cleanJson.length()) {
        // Пропускаем пробелы и запятые
        while (pos < cleanJson.length() && (cleanJson[pos] == ' ' || cleanJson[pos] == ',' || cleanJson[pos] == '\n' || cleanJson[pos] == '\t')) {
            pos++;
        }
        if (pos >= cleanJson.length()) break;
        
        // Ищем ключ
        if (cleanJson[pos] != '"') {
            pos++;
            continue;
        }
        
        size_t keyStart = pos + 1;
        size_t keyEnd = cleanJson.find('"', keyStart);
        if (keyEnd == std::string::npos) break;
        
        std::string key = cleanJson.substr(keyStart, keyEnd - keyStart);
        pos = keyEnd + 1;
        
        // Пропускаем до двоеточия
        while (pos < cleanJson.length() && cleanJson[pos] != ':') pos++;
        if (pos >= cleanJson.length()) break;
        pos++; // Пропускаем двоеточие
        
        // Пропускаем пробелы
        while (pos < cleanJson.length() && (cleanJson[pos] == ' ' || cleanJson[pos] == '\t')) pos++;
        if (pos >= cleanJson.length()) break;
        
        // Ищем значение
        if (cleanJson[pos] == '"') {
            size_t valueStart = pos + 1;
            size_t valueEnd = cleanJson.find('"', valueStart);
            if (valueEnd != std::string::npos) {
                std::string value = cleanJson.substr(valueStart, valueEnd - valueStart);
                result[key] = value;
                pos = valueEnd + 1;
            } else {
                pos++;
            }
        } else {
            // Значение без кавычек (число, true, false, null)
            size_t valueStart = pos;
            while (pos < cleanJson.length() && cleanJson[pos] != ',' && cleanJson[pos] != '}' && cleanJson[pos] != ' ') {
                pos++;
            }
            std::string value = cleanJson.substr(valueStart, pos - valueStart);
            result[key] = value;
        }
    }
    
    return result;
}

std::string JsonService::createResponse(bool success, const std::string& message, 
                                       const std::map<std::string, std::string>& data) {
    std::ostringstream json;
    json << "{\"success\":" << (success ? "true" : "false");
    if (!message.empty()) {
        json << ",\"message\":\"" << message << "\"";
    }
    if (!data.empty()) {
        json << ",\"data\":{";
        bool first = true;
        for (const auto& pair : data) {
            if (!first) json << ",";
            json << "\"" << pair.first << "\":\"" << pair.second << "\"";
            first = false;
        }
        json << "}";
    }
    json << "}";
    return json.str();
}

