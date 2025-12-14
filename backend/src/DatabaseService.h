#ifndef DATABASESERVICE_H
#define DATABASESERVICE_H

#include <sqlite3.h>
#include <string>
#include <vector>
#include <map>
#include <memory>

class DatabaseService {
private:
    sqlite3* db;
    std::string dbPath;
    
    bool executeStatement(const std::string& sql);
    bool initializeDatabase();
    bool createUsersTable();
    bool createTokensTable();
    
public:
    DatabaseService(const std::string& dbPath = "data/jummah_prayer.db");
    ~DatabaseService();
    
    // Методы для работы с пользователями
    bool createUser(const std::string& email, const std::string& passwordHash, 
                   const std::string& name, const std::string& createdAt);
    std::map<std::string, std::string> getUserByEmail(const std::string& email);
    std::map<std::string, std::string> getUserById(const std::string& userId);
    std::vector<std::map<std::string, std::string>> getAllUsers();
    bool updateUserPassword(const std::string& userId, const std::string& newPasswordHash);
    
    // Методы для работы с токенами
    bool createToken(const std::string& token, const std::string& userId, 
                    const std::string& expiresAt);
    std::map<std::string, std::string> getToken(const std::string& token);
    std::vector<std::map<std::string, std::string>> getUserTokens(const std::string& userId);
    bool deleteToken(const std::string& token);
    bool deleteExpiredTokens();
    
    // Проверка существования пользователя
    bool userExists(const std::string& email);
    
    // Закрытие соединения
    void close();
    
    // Получение последней ошибки
    std::string getLastError() const;
    
    // Выполнение произвольного SQL запроса (для отладки)
    bool executeQuery(const std::string& sql);
    
    // Получение количества пользователей
    int getUserCount();
    
    // Получение количества активных токенов
    int getActiveTokenCount();
};

#endif // DATABASESERVICE_H