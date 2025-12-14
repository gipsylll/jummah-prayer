#include "AuthService.h"
#include "DatabaseService.h"
#include "JsonService.h"
#include <random>
#include <sstream>
#include <functional>
#include <chrono>
#include <iomanip>
#include <regex>
#include <iostream>

AuthService::AuthService() {
    dbService = std::make_unique<DatabaseService>();
}

AuthService::~AuthService() {
    // Деструктор автоматически уничтожит unique_ptr
}

bool AuthService::initializeDatabase() {
    // База данных уже инициализирована в конструкторе DatabaseService
    return true;
}

std::string AuthService::simpleHash(const std::string& str) {
    // Более безопасный хеш с солью
    std::string salt = "jummah_prayer_2024";
    std::string saltedStr = str + salt;
    
    std::hash<std::string> hasher;
    std::ostringstream ss;
    ss << std::hex << hasher(saltedStr);
    
    // Добавляем дополнительное хеширование для безопасности
    std::string firstHash = ss.str();
    std::string doubleSalted = firstHash + salt;
    
    std::ostringstream finalHash;
    finalHash << std::hex << hasher(doubleSalted);
    
    return finalHash.str();
}

std::string AuthService::generateToken() {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 15);
    
    const std::string chars = "0123456789abcdef";
    std::string token;
    
    for (int i = 0; i < 64; ++i) {
        token += chars[dis(gen)];
    }
    
    return token;
}

std::string AuthService::getCurrentDateTime() const {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    std::ostringstream ss;
    ss << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S");
    return ss.str();
}

std::string AuthService::getExpirationDateTime(int days) const {
    auto now = std::chrono::system_clock::now();
    auto expires = now + std::chrono::hours(24 * days);
    auto expires_t = std::chrono::system_clock::to_time_t(expires);
    std::ostringstream ss;
    ss << std::put_time(std::localtime(&expires_t), "%Y-%m-%d %H:%M:%S");
    return ss.str();
}

bool AuthService::isPasswordStrong(const std::string& password) {
    // Проверка минимальной длины
    if (password.length() < 8) {
        return false;
    }
    
    // Проверка наличия хотя бы одной цифры
    if (!std::regex_search(password, std::regex("\\d"))) {
        return false;
    }
    
    // Проверка наличия хотя бы одной буквы в верхнем регистре
    if (!std::regex_search(password, std::regex("[A-Z]"))) {
        return false;
    }
    
    // Проверка наличия хотя бы одной буквы в нижнем регистре
    if (!std::regex_search(password, std::regex("[a-z]"))) {
        return false;
    }
    
    return true;
}

std::string AuthService::registerUser(const std::string& email, const std::string& password, const std::string& name) {
    // Проверка валидности email
    std::regex emailPattern(R"(^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$)");
    if (!std::regex_match(email, emailPattern)) {
        return JsonService::createResponse(false, "Неверный формат email");
    }
    
    // Проверка сложности пароля
    if (!isPasswordStrong(password)) {
        return JsonService::createResponse(false, "Пароль должен содержать минимум 8 символов, включая цифры, заглавные и строчные буквы");
    }
    
    std::lock_guard<std::mutex> lock(authMutex);
    
    // Проверка, существует ли пользователь
    if (dbService->userExists(email)) {
        return JsonService::createResponse(false, "Пользователь с таким email уже существует");
    }
    
    // Создание пользователя
    std::string passwordHash = simpleHash(password);
    std::string createdAt = getCurrentDateTime();
    
    bool success = dbService->createUser(email, passwordHash, name, createdAt);
    
    if (!success) {
        return JsonService::createResponse(false, "Ошибка при создании пользователя");
    }
    
    // Получаем созданного пользователя
    auto user = dbService->getUserByEmail(email);
    if (user.empty()) {
        return JsonService::createResponse(false, "Ошибка при получении данных пользователя");
    }
    
    // Создание токена
    std::string token = generateToken();
    std::string expiresAt = getExpirationDateTime(7);
    
    success = dbService->createToken(token, user["id"], expiresAt);
    
    if (!success) {
        return JsonService::createResponse(false, "Ошибка при создании токена");
    }
    
    std::map<std::string, std::string> responseData;
    responseData["token"] = token;
    responseData["userId"] = user["id"];
    responseData["name"] = user["name"];
    responseData["email"] = user["email"];
    responseData["expiresAt"] = expiresAt;
    
    std::cout << "✅ Новый пользователь зарегистрирован: " << email << std::endl;
    
    return JsonService::createResponse(true, "Пользователь успешно зарегистрирован", responseData);
}

std::string AuthService::loginUser(const std::string& email, const std::string& password) {
    std::string passwordHash = simpleHash(password);
    
    std::lock_guard<std::mutex> lock(authMutex);
    
    auto user = dbService->getUserByEmail(email);
    
    if (user.empty() || user["password_hash"] != passwordHash) {
        return JsonService::createResponse(false, "Неверный email или пароль");
    }
    
    // Проверяем активен ли пользователь
    if (user["is_active"] == "0") {
        return JsonService::createResponse(false, "Аккаунт деактивирован");
    }
    
    // Создание нового токена
    std::string token = generateToken();
    std::string expiresAt = getExpirationDateTime(7);
    
    bool success = dbService->createToken(token, user["id"], expiresAt);
    
    if (!success) {
        return JsonService::createResponse(false, "Ошибка при создании токена");
    }
    
    std::map<std::string, std::string> responseData;
    responseData["token"] = token;
    responseData["userId"] = user["id"];
    responseData["name"] = user["name"];
    responseData["email"] = user["email"];
    responseData["expiresAt"] = expiresAt;
    responseData["lastLogin"] = user["last_login"];
    
    std::cout << "✅ Пользователь вошел в систему: " << email << std::endl;
    
    return JsonService::createResponse(true, "Вход выполнен успешно", responseData);
}

std::string AuthService::validateToken(const std::string& token) {
    std::lock_guard<std::mutex> lock(authMutex);
    
    auto tokenInfo = dbService->getToken(token);
    if (!tokenInfo.empty()) {
        // Проверяем не истек ли токен
        std::string expiresAt = tokenInfo["expires_at"];
        auto now = std::chrono::system_clock::now();
        auto now_t = std::chrono::system_clock::to_time_t(now);
        std::tm* now_tm = std::localtime(&now_t);
        
        std::tm expires_tm = {};
        std::istringstream ss(expiresAt);
        ss >> std::get_time(&expires_tm, "%Y-%m-%d %H:%M:%S");
        
        auto expires = std::chrono::system_clock::from_time_t(std::mktime(&expires_tm));
        
        if (now < expires) {
            return tokenInfo["user_id"];
        } else {
            // Удаляем просроченный токен
            dbService->deleteToken(token);
        }
    }
    
    return "";
}

std::string AuthService::getUserInfo(const std::string& userId) {
    std::lock_guard<std::mutex> lock(authMutex);
    
    auto user = dbService->getUserById(userId);
    
    if (user.empty()) {
        return JsonService::createResponse(false, "Пользователь не найден");
    }
    
    std::map<std::string, std::string> responseData;
    responseData["userId"] = user["id"];
    responseData["name"] = user["name"];
    responseData["email"] = user["email"];
    responseData["createdAt"] = user["created_at"];
    responseData["lastLogin"] = user["last_login"];
    responseData["isActive"] = user["is_active"];
    
    // Получаем активные токены пользователя
    auto tokens = dbService->getUserTokens(userId);
    responseData["activeSessions"] = std::to_string(tokens.size());
    
    return JsonService::createResponse(true, "Информация о пользователе", responseData);
}

std::string AuthService::getCurrentUserInfo(const std::string& token) {
    std::string userId = validateToken(token);
    if (userId.empty()) {
        return JsonService::createResponse(false, "Неверный или истекший токен");
    }
    
    return getUserInfo(userId);
}

bool AuthService::logoutUser(const std::string& token) {
    std::lock_guard<std::mutex> lock(authMutex);
    
    return dbService->deleteToken(token);
}

std::string AuthService::getTokenFromHeader(const std::string& authHeader) {
    if (authHeader.find("Bearer ") == 0) {
        return authHeader.substr(7);
    }
    return "";
}

std::string AuthService::getStats() {
    std::lock_guard<std::mutex> lock(authMutex);
    
    int userCount = dbService->getUserCount();
    int activeTokenCount = dbService->getActiveTokenCount();
    
    std::map<std::string, std::string> stats;
    stats["totalUsers"] = std::to_string(userCount);
    stats["activeSessions"] = std::to_string(activeTokenCount);
    
    return JsonService::createResponse(true, "Статистика системы", stats);
}

std::string AuthService::changePassword(const std::string& userId, const std::string& oldPassword, const std::string& newPassword) {
    std::lock_guard<std::mutex> lock(authMutex);
    
    // Получаем пользователя
    auto user = dbService->getUserById(userId);
    if (user.empty()) {
        return JsonService::createResponse(false, "Пользователь не найден");
    }
    
    // Проверяем старый пароль
    std::string oldPasswordHash = simpleHash(oldPassword);
    if (user["password_hash"] != oldPasswordHash) {
        return JsonService::createResponse(false, "Неверный старый пароль");
    }
    
    // Проверяем сложность нового пароля
    if (!isPasswordStrong(newPassword)) {
        return JsonService::createResponse(false, "Новый пароль должен содержать минимум 8 символов, включая цифры, заглавные и строчные буквы");
    }
    
    // Обновляем пароль
    std::string newPasswordHash = simpleHash(newPassword);
    bool success = dbService->updateUserPassword(userId, newPasswordHash);
    
    if (!success) {
        return JsonService::createResponse(false, "Ошибка при изменении пароля");
    }
    
    return JsonService::createResponse(true, "Пароль успешно изменен");
}