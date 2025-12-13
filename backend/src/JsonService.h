#ifndef JSONSERVICE_H
#define JSONSERVICE_H

#include <string>
#include <map>

class JsonService {
public:
    static std::map<std::string, std::string> parseJson(const std::string& json);
    static std::string createResponse(bool success, const std::string& message = "", 
                                      const std::map<std::string, std::string>& data = {});
};

#endif // JSONSERVICE_H

