#include "AuthService.h"
#include "JsonService.h"
#include <random>
#include <sstream>
#include <functional>
#include <chrono>
#include <iomanip>

AuthService::AuthService() {
}

std::string AuthService::simpleHash(const std::string& str) {
    std::hash<std::string> hasher;
    std::ostringstream ss;
    ss << std::hex << hasher(str);
    return ss.str();
}

std::string AuthService::generateToken() {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 15);
    
    std::ostringstream token;
    for (int i = 0; i < 64; ++i) {
        token << std::hex << dis(gen);
    }
    return token.str();
}

std::string AuthService::registerUser(const std::string& email, const std::string& password, const std::string& name) {
    // Проверка валидности email
    if (email.find("@") == std::string::npos) {
        return JsonService::createResponse(false, "Invalid email format");
    }
    
    // Проверка длины пароля
    if (password.length() < 6) {
        return JsonService::createResponse(false, "Password must be at least 6 characters");
    }
    
    std::lock_guard<std::mutex> lock(authMutex);
    
    // Проверка, существует ли пользователь
    if (users.find(email) != users.end()) {
        return JsonService::createResponse(false, "User already exists");
    }
    
    // Создание пользователя
    User newUser;
    newUser.id = generateToken().substr(0, 16);
    newUser.email = email;
    newUser.passwordHash = simpleHash(password);
    newUser.name = name;
    
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    std::ostringstream ss;
    ss << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S");
    newUser.createdAt = ss.str();
    
    users[email] = newUser;
    
    // Создание токена
    Token token;
    token.token = generateToken();
    token.userId = newUser.id;
    
    auto expires = now + std::chrono::hours(24 * 7); // 7 дней
    auto expires_t = std::chrono::system_clock::to_time_t(expires);
    std::ostringstream exp_ss;
    exp_ss << std::put_time(std::localtime(&expires_t), "%Y-%m-%d %H:%M:%S");
    token.expiresAt = exp_ss.str();
    
    tokens[token.token] = token;
    
    std::map<std::string, std::string> responseData;
    responseData["token"] = token.token;
    responseData["userId"] = newUser.id;
    responseData["name"] = newUser.name;
    responseData["email"] = newUser.email;
    
    return JsonService::createResponse(true, "User registered successfully", responseData);
}

std::string AuthService::loginUser(const std::string& email, const std::string& password) {
    std::string passwordHash = simpleHash(password);
    
    std::lock_guard<std::mutex> lock(authMutex);
    
    auto userIt = users.find(email);
    if (userIt == users.end() || userIt->second.passwordHash != passwordHash) {
        return JsonService::createResponse(false, "Invalid email or password");
    }
    
    // Создание нового токена
    Token token;
    token.token = generateToken();
    token.userId = userIt->second.id;
    
    auto now = std::chrono::system_clock::now();
    auto expires = now + std::chrono::hours(24 * 7); // 7 дней
    auto expires_t = std::chrono::system_clock::to_time_t(expires);
    std::ostringstream exp_ss;
    exp_ss << std::put_time(std::localtime(&expires_t), "%Y-%m-%d %H:%M:%S");
    token.expiresAt = exp_ss.str();
    
    tokens[token.token] = token;
    
    std::map<std::string, std::string> responseData;
    responseData["token"] = token.token;
    responseData["userId"] = userIt->second.id;
    responseData["name"] = userIt->second.name;
    responseData["email"] = userIt->second.email;
    
    return JsonService::createResponse(true, "Login successful", responseData);
}

std::string AuthService::validateToken(const std::string& token) {
    std::lock_guard<std::mutex> lock(authMutex);
    auto it = tokens.find(token);
    if (it != tokens.end()) {
        return it->second.userId;
    }
    return "";
}

std::string AuthService::getUserInfo(const std::string& userId) {
    std::lock_guard<std::mutex> lock(authMutex);
    
    // Находим пользователя по ID
    User* user = nullptr;
    for (auto& pair : users) {
        if (pair.second.id == userId) {
            user = &pair.second;
            break;
        }
    }
    
    if (!user) {
        return JsonService::createResponse(false, "User not found");
    }
    
    std::map<std::string, std::string> responseData;
    responseData["userId"] = user->id;
    responseData["name"] = user->name;
    responseData["email"] = user->email;
    responseData["createdAt"] = user->createdAt;
    
    return JsonService::createResponse(true, "User information", responseData);
}

bool AuthService::logoutUser(const std::string& token) {
    std::lock_guard<std::mutex> lock(authMutex);
    auto it = tokens.find(token);
    if (it != tokens.end()) {
        tokens.erase(it);
        return true;
    }
    return false;
}

std::string AuthService::getTokenFromHeader(const std::string& authHeader) {
    if (authHeader.find("Bearer ") == 0) {
        return authHeader.substr(7);
    }
    return "";
}

