#ifndef AUTHSERVICE_H
#define AUTHSERVICE_H

#include <string>
#include <map>
#include <mutex>

struct User {
    std::string id;
    std::string email;
    std::string passwordHash;
    std::string name;
    std::string createdAt;
};

struct Token {
    std::string token;
    std::string userId;
    std::string expiresAt;
};

class AuthService {
private:
    std::map<std::string, User> users;
    std::map<std::string, Token> tokens;
    std::mutex authMutex;
    
    static std::string simpleHash(const std::string& str);
    static std::string generateToken();
    
public:
    AuthService();
    
    // Регистрация
    std::string registerUser(const std::string& email, const std::string& password, const std::string& name);
    
    // Вход
    std::string loginUser(const std::string& email, const std::string& password);
    
    // Проверка токена
    std::string validateToken(const std::string& token);
    
    // Получение информации о пользователе
    std::string getUserInfo(const std::string& userId);
    
    // Выход
    bool logoutUser(const std::string& token);
    
    // Получение токена из заголовка
    static std::string getTokenFromHeader(const std::string& authHeader);
};

#endif // AUTHSERVICE_H

