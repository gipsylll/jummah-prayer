#ifndef JSONSERVICE_H
#define JSONSERVICE_H

#include <string>
#include <map>
#include <vector>




class JsonService {
public:
    // Парсинг JSON строки в map
    static std::map<std::string, std::string> parseJson(const std::string& json);
    
    // Создание JSON ответа
    static std::string createResponse(bool success, const std::string& message, 
                                     const std::map<std::string, std::string>& data = {});
    
    // Генерация UUID
    static std::string generateUuid();
    
    // Создание JSON массива
    static std::string createArrayResponse(bool success, const std::string& message,
                                         const std::vector<std::map<std::string, std::string>>& data);
    
    // Экранирование строки для JSON
    static std::string escapeJsonString(const std::string& str);
};
#endif // JSONSERVICE_H