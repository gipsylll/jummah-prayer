#include "DatabaseService.h"
#include <iostream>

int main() {
    std::cout << "🛠️  Создание базы данных Jummah Prayer..." << std::endl;
    
    DatabaseService dbService;
    
    if (dbService.executeQuery("SELECT 1 FROM users LIMIT 1")) {
        std::cout << "✅ База данных уже существует и настроена" << std::endl;
    } else {
        std::cout << "❌ Ошибка при проверке базы данных" << std::endl;
        return 1;
    }
    
    // Проверяем количество пользователей
    int userCount = dbService.getUserCount();
    std::cout << "📊 Количество пользователей: " << userCount << std::endl;
    
    // Проверяем количество активных токенов
    int tokenCount = dbService.getActiveTokenCount();
    std::cout << "📊 Количество активных токенов: " << tokenCount << std::endl;
    
    // Выводим всех пользователей (если есть)
    if (userCount > 0) {
        std::cout << "\n👥 Список пользователей:" << std::endl;
        auto users = dbService.getAllUsers();
        for (const auto& user : users) {
            std::cout << "   - " << user.at("name") << " <" << user.at("email") << ">" 
                      << " (ID: " << user.at("id") << ")" << std::endl;
        }
    }
    
    std::cout << "\n✅ База данных готова к использованию" << std::endl;
    return 0;
}