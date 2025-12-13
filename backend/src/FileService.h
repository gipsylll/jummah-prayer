#ifndef FILESERVICE_H
#define FILESERVICE_H

#include <string>

class FileService {
public:
    static std::string readFile(const std::string& path);
    static std::string getMimeType(const std::string& path);
    static std::string findWebRoot(int argc, char* argv[]);
};

#endif // FILESERVICE_H

