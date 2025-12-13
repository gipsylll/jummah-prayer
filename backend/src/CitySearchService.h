#ifndef CITYSEARCHSERVICE_H
#define CITYSEARCHSERVICE_H

#include <string>
#include <mutex>
#include <chrono>
#include <map>

class CitySearchService {
private:
    static std::mutex nominatimMutex;
    static std::chrono::steady_clock::time_point lastNominatimRequest;
    
    static std::string urlEncode(const std::string& str);
    static std::string httpGetNominatim(const std::string& endpoint, const std::map<std::string, std::string>& params);
    
public:
    static std::string searchCities(const std::string& query, int limit = 20);
    static std::string findNearestCity(double lat, double lon);
};

#endif // CITYSEARCHSERVICE_H

