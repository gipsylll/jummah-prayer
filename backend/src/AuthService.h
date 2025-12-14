#ifndef AUTHSERVICE_H
#define AUTHSERVICE_H

#include <string>
#include <mutex>
#include <memory>

class DatabaseService;

struct User {
    std::string id;
    std::string email;
    std::string passwordHash;
    std::string name;
    std::string createdAt;
    std::string lastLogin;
    bool isActive;
};

struct Token {
    std::string token;
    std::string userId;
    std::string expiresAt;
    std::string createdAt;
};

class AuthService {
private:
    std::unique_ptr<DatabaseService> dbService;
    std::mutex authMutex;
    
    static std::string simpleHash(const std::string& str);
    static std::string generateToken();
    std::string getCurrentDateTime() const;
    std::string getExpirationDateTime(int days = 7) const;
    
public:
    AuthService();
    ~AuthService();
    
    // Инициализация базы данных
    bool initializeDatabase();
    
    // Регистрация
    std::string registerUser(const std::string& email, const std::string& password, const std::string& name);
    
    // Вход
    std::string loginUser(const std::string& email, const std::string& password);
    
    // Проверка токена
    std::string validateToken(const std::string& token);
    
    // Получение информации о пользователе
    std::string getUserInfo(const std::string& userId);
    
    // Получение информации о текущем пользователе по токену
    std::string getCurrentUserInfo(const std::string& token);
    
    // Выход
    bool logoutUser(const std::string& token);
    
    // Получение токена из заголовка
    static std::string getTokenFromHeader(const std::string& authHeader);
    
    // Получение статистики
    std::string getStats();
    
    // Изменение пароля
    std::string changePassword(const std::string& userId, const std::string& oldPassword, const std::string& newPassword);
    
    // Проверка сложности пароля
    static bool isPasswordStrong(const std::string& password);
};

#endif // AUTHSERVICE_H