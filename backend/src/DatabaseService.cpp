#include "DatabaseService.h"
#include "JsonService.h"
#include <iostream>
#include <sstream>
#include <chrono>
#include <iomanip>
#include <filesystem>

DatabaseService::DatabaseService(const std::string& dbPath) : db(nullptr), dbPath(dbPath) {
    // Создаем директорию для базы данных, если она не существует
    std::filesystem::path path = dbPath;
    std::filesystem::create_directories(path.parent_path());
    
    // Открываем соединение с базой данных
    int rc = sqlite3_open(dbPath.c_str(), &db);
    if (rc != SQLITE_OK) {
        std::cerr << "❌ Ошибка открытия базы данных: " << sqlite3_errmsg(db) << std::endl;
        db = nullptr;
        return;
    }
    
    std::cout << "✅ База данных открыта: " << dbPath << std::endl;
    
    // Включаем поддержку внешних ключей
    executeStatement("PRAGMA foreign_keys = ON;");
    
    // Инициализируем базу данных
    if (!initializeDatabase()) {
        std::cerr << "❌ Ошибка инициализации базы данных" << std::endl;
    }
}

DatabaseService::~DatabaseService() {
    close();
}

void DatabaseService::close() {
    if (db) {
        sqlite3_close(db);
        db = nullptr;
    }
}

bool DatabaseService::executeStatement(const std::string& sql) {
    if (!db) return false;
    
    char* errMsg = nullptr;
    int rc = sqlite3_exec(db, sql.c_str(), nullptr, nullptr, &errMsg);
    
    if (rc != SQLITE_OK) {
        std::cerr << "❌ Ошибка SQL: " << errMsg << std::endl;
        std::cerr << "   Запрос: " << sql << std::endl;
        sqlite3_free(errMsg);
        return false;
    }
    
    return true;
}

bool DatabaseService::createUsersTable() {
    std::string sql = R"(
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            last_login TEXT
        )
    )";
    
    return executeStatement(sql);
}

bool DatabaseService::createTokensTable() {
    std::string sql = R"(
        CREATE TABLE IF NOT EXISTS tokens (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_used TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    )";
    
    return executeStatement(sql);
}

bool DatabaseService::initializeDatabase() {
    bool success = true;
    
    // Создаем таблицу пользователей
    if (!createUsersTable()) {
        std::cerr << "❌ Не удалось создать таблицу users" << std::endl;
        success = false;
    }
    
    // Создаем таблицу токенов
    if (!createTokensTable()) {
        std::cerr << "❌ Не удалось создать таблицу tokens" << std::endl;
        success = false;
    }
    
    // Создаем индексы для улучшения производительности
    executeStatement("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);");
    executeStatement("CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id);");
    executeStatement("CREATE INDEX IF NOT EXISTS idx_tokens_expires ON tokens(expires_at);");
    
    // Удаляем просроченные токены
    deleteExpiredTokens();
    
    return success;
}

bool DatabaseService::createUser(const std::string& email, const std::string& passwordHash, 
                               const std::string& name, const std::string& createdAt) {
    if (!db) return false;
    
    std::string id = JsonService::generateUuid();
    
    std::string sql = "INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)";
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "❌ Ошибка подготовки запроса: " << sqlite3_errmsg(db) << std::endl;
        return false;
    }
    
    sqlite3_bind_text(stmt, 1, id.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, email.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 3, passwordHash.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 4, name.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 5, createdAt.c_str(), -1, SQLITE_STATIC);
    
    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    
    return rc == SQLITE_DONE;
}

std::map<std::string, std::string> DatabaseService::getUserByEmail(const std::string& email) {
    std::map<std::string, std::string> user;
    
    if (!db) return user;
    
    std::string sql = "SELECT id, email, password_hash, name, created_at, is_active, last_login FROM users WHERE email = ?";
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "❌ Ошибка подготовки запроса: " << sqlite3_errmsg(db) << std::endl;
        return user;
    }
    
    sqlite3_bind_text(stmt, 1, email.c_str(), -1, SQLITE_STATIC);
    
    rc = sqlite3_step(stmt);
    if (rc == SQLITE_ROW) {
        user["id"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 0));
        user["email"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
        user["password_hash"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
        user["name"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
        user["created_at"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
        user["is_active"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 5));
        user["last_login"] = sqlite3_column_text(stmt, 6) ? 
            reinterpret_cast<const char*>(sqlite3_column_text(stmt, 6)) : "";
    }
    
    sqlite3_finalize(stmt);
    return user;
}

std::map<std::string, std::string> DatabaseService::getUserById(const std::string& userId) {
    std::map<std::string, std::string> user;
    
    if (!db) return user;
    
    std::string sql = "SELECT id, email, password_hash, name, created_at, is_active, last_login FROM users WHERE id = ?";
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "❌ Ошибка подготовки запроса: " << sqlite3_errmsg(db) << std::endl;
        return user;
    }
    
    sqlite3_bind_text(stmt, 1, userId.c_str(), -1, SQLITE_STATIC);
    
    rc = sqlite3_step(stmt);
    if (rc == SQLITE_ROW) {
        user["id"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 0));
        user["email"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
        user["password_hash"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
        user["name"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
        user["created_at"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
        user["is_active"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 5));
        user["last_login"] = sqlite3_column_text(stmt, 6) ? 
            reinterpret_cast<const char*>(sqlite3_column_text(stmt, 6)) : "";
    }
    
    sqlite3_finalize(stmt);
    return user;
}

std::vector<std::map<std::string, std::string>> DatabaseService::getAllUsers() {
    std::vector<std::map<std::string, std::string>> users;
    
    if (!db) return users;
    
    std::string sql = "SELECT id, email, name, created_at, is_active FROM users ORDER BY created_at DESC";
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "❌ Ошибка подготовки запроса: " << sqlite3_errmsg(db) << std::endl;
        return users;
    }
    
    while ((rc = sqlite3_step(stmt)) == SQLITE_ROW) {
        std::map<std::string, std::string> user;
        user["id"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 0));
        user["email"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
        user["name"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
        user["created_at"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
        user["is_active"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
        users.push_back(user);
    }
    
    sqlite3_finalize(stmt);
    return users;
}

bool DatabaseService::updateUserPassword(const std::string& userId, const std::string& newPasswordHash) {
    if (!db) return false;
    
    std::string sql = "UPDATE users SET password_hash = ? WHERE id = ?";
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "❌ Ошибка подготовки запроса: " << sqlite3_errmsg(db) << std::endl;
        return false;
    }
    
    sqlite3_bind_text(stmt, 1, newPasswordHash.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, userId.c_str(), -1, SQLITE_STATIC);
    
    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    
    return rc == SQLITE_DONE && sqlite3_changes(db) > 0;
}

bool DatabaseService::createToken(const std::string& token, const std::string& userId, 
                                const std::string& expiresAt) {
    if (!db) return false;
    
    // Сначала обновляем время последнего входа пользователя
    std::string updateUserSql = "UPDATE users SET last_login = datetime('now') WHERE id = ?";
    sqlite3_stmt* updateStmt;
    sqlite3_prepare_v2(db, updateUserSql.c_str(), -1, &updateStmt, nullptr);
    sqlite3_bind_text(updateStmt, 1, userId.c_str(), -1, SQLITE_STATIC);
    sqlite3_step(updateStmt);
    sqlite3_finalize(updateStmt);
    
    // Создаем токен
    std::string sql = "INSERT INTO tokens (token, user_id, expires_at) VALUES (?, ?, ?)";
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "❌ Ошибка подготовки запроса: " << sqlite3_errmsg(db) << std::endl;
        return false;
    }
    
    sqlite3_bind_text(stmt, 1, token.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, userId.c_str(), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 3, expiresAt.c_str(), -1, SQLITE_STATIC);
    
    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    
    return rc == SQLITE_DONE;
}

std::map<std::string, std::string> DatabaseService::getToken(const std::string& token) {
    std::map<std::string, std::string> tokenInfo;
    
    if (!db) return tokenInfo;
    
    std::string sql = "SELECT token, user_id, expires_at, created_at FROM tokens WHERE token = ?";
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "❌ Ошибка подготовки запроса: " << sqlite3_errmsg(db) << std::endl;
        return tokenInfo;
    }
    
    sqlite3_bind_text(stmt, 1, token.c_str(), -1, SQLITE_STATIC);
    
    rc = sqlite3_step(stmt);
    if (rc == SQLITE_ROW) {
        tokenInfo["token"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 0));
        tokenInfo["user_id"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
        tokenInfo["expires_at"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
        tokenInfo["created_at"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
    }
    
    sqlite3_finalize(stmt);
    return tokenInfo;
}

std::vector<std::map<std::string, std::string>> DatabaseService::getUserTokens(const std::string& userId) {
    std::vector<std::map<std::string, std::string>> tokens;
    
    if (!db) return tokens;
    
    std::string sql = "SELECT token, expires_at, created_at FROM tokens WHERE user_id = ? ORDER BY created_at DESC";
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "❌ Ошибка подготовки запроса: " << sqlite3_errmsg(db) << std::endl;
        return tokens;
    }
    
    sqlite3_bind_text(stmt, 1, userId.c_str(), -1, SQLITE_STATIC);
    
    while ((rc = sqlite3_step(stmt)) == SQLITE_ROW) {
        std::map<std::string, std::string> token;
        token["token"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 0));
        token["expires_at"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
        token["created_at"] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
        tokens.push_back(token);
    }
    
    sqlite3_finalize(stmt);
    return tokens;
}

bool DatabaseService::deleteToken(const std::string& token) {
    if (!db) return false;
    
    std::string sql = "DELETE FROM tokens WHERE token = ?";
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "❌ Ошибка подготовки запроса: " << sqlite3_errmsg(db) << std::endl;
        return false;
    }
    
    sqlite3_bind_text(stmt, 1, token.c_str(), -1, SQLITE_STATIC);
    
    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    
    return rc == SQLITE_DONE && sqlite3_changes(db) > 0;
}

bool DatabaseService::deleteExpiredTokens() {
    if (!db) return false;
    
    std::string sql = "DELETE FROM tokens WHERE expires_at < datetime('now')";
    
    return executeStatement(sql);
}

bool DatabaseService::userExists(const std::string& email) {
    if (!db) return false;
    
    std::string sql = "SELECT COUNT(*) FROM users WHERE email = ?";
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "❌ Ошибка подготовки запроса: " << sqlite3_errmsg(db) << std::endl;
        return false;
    }
    
    sqlite3_bind_text(stmt, 1, email.c_str(), -1, SQLITE_STATIC);
    
    rc = sqlite3_step(stmt);
    int count = 0;
    if (rc == SQLITE_ROW) {
        count = sqlite3_column_int(stmt, 0);
    }
    
    sqlite3_finalize(stmt);
    return count > 0;
}

std::string DatabaseService::getLastError() const {
    if (!db) return "Database not initialized";
    return sqlite3_errmsg(db);
}

bool DatabaseService::executeQuery(const std::string& sql) {
    return executeStatement(sql);
}

int DatabaseService::getUserCount() {
    if (!db) return 0;
    
    std::string sql = "SELECT COUNT(*) FROM users";
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "❌ Ошибка подготовки запроса: " << sqlite3_errmsg(db) << std::endl;
        return 0;
    }
    
    rc = sqlite3_step(stmt);
    int count = 0;
    if (rc == SQLITE_ROW) {
        count = sqlite3_column_int(stmt, 0);
    }
    
    sqlite3_finalize(stmt);
    return count;
}

int DatabaseService::getActiveTokenCount() {
    if (!db) return 0;
    
    std::string sql = "SELECT COUNT(*) FROM tokens WHERE expires_at > datetime('now')";
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "❌ Ошибка подготовки запроса: " << sqlite3_errmsg(db) << std::endl;
        return 0;
    }
    
    rc = sqlite3_step(stmt);
    int count = 0;
    if (rc == SQLITE_ROW) {
        count = sqlite3_column_int(stmt, 0);
    }
    
    sqlite3_finalize(stmt);
    return count;
}