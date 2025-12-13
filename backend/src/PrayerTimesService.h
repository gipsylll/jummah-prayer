#ifndef PRAYERTIMESSERVICE_H
#define PRAYERTIMESSERVICE_H

#include <string>
#include "PrayerTimesCalculator.h"

class PrayerTimesService {
private:
    PrayerTimesCalculator& calculator;
    
    static std::string getMethodCode(int method);
    static std::string httpGetAladhan(double lat, double lon, int method, int madhhab, int year, int month, int day);
    static std::string extractJsonValue(const std::string& json, const std::string& key);
    
public:
    PrayerTimesService(PrayerTimesCalculator& calc);
    
    std::string getPrayerTimes(double lat, double lon, const std::string& city, 
                               int method, int madhhab, int year, int month, int day);
};

#endif // PRAYERTIMESSERVICE_H

