# Makefile для удобной сборки проекта Jummah Prayer
.PHONY: all build build-universal build-arm64 build-x86_64 deploy deploy-universal clean clean-universal clean-all test test-universal run run-universal format lint help web-build web-run web-start web-backend-build web-backend-run web-backend-clean


GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m 

# По умолчанию
all: build

# Создание директории и сборка (локальная - для текущей архитектуры)
build:
	@echo "$(GREEN)🔨 Локальная сборка мобильного приложения (для текущей архитектуры)...$(NC)"
	@mkdir -p mobile/build
	@cd mobile/build && cmake -DBUILD_UNIVERSAL=OFF -DBUILD_ARM64_ONLY=OFF -DBUILD_X86_64_ONLY=OFF .. && cmake --build . -j4
	@echo "$(GREEN)✅ Локальная сборка завершена в mobile/build/$(NC)"

# Универсальная сборка для всех Mac (Intel + Apple Silicon)
build-universal:
	@echo "$(GREEN)🔨 Универсальная сборка мобильного приложения для всех Mac...$(NC)"
	@mkdir -p mobile/build-universal
	@cd mobile/build-universal && cmake -DBUILD_UNIVERSAL=ON -DBUILD_ARM64_ONLY=OFF -DBUILD_X86_64_ONLY=OFF .. && cmake --build . -j4
	@echo "$(GREEN)✅ Универсальная сборка завершена в mobile/build-universal/$(NC)"

# Деплой локальной сборки (упаковка зависимостей Qt)
deploy:
	@echo "$(GREEN)📦 Деплой локальной сборки (упаковка зависимостей Qt)...$(NC)"
	@if [ ! -d mobile/build ]; then echo "$(YELLOW)⚠️  Сначала выполните: make build$(NC)"; exit 1; fi
	@if command -v macdeployqt >/dev/null 2>&1; then \
		if [ -d mobile/build/JummahPrayer.app ]; then \
			echo "$(YELLOW)Удаление старой подписи...$(NC)"; \
			codesign --remove-signature mobile/build/JummahPrayer.app 2>/dev/null || true; \
			find mobile/build/JummahPrayer.app -name "*.dylib" -exec codesign --remove-signature {} \; 2>/dev/null || true; \
			find mobile/build/JummahPrayer.app -name "*.framework" -exec codesign --remove-signature {} \; 2>/dev/null || true; \
			echo "$(YELLOW)Выполнение macdeployqt с QML модулями...$(NC)"; \
			macdeployqt mobile/build/JummahPrayer.app -always-overwrite -qmldir=$$(pwd)/mobile/qml -verbose=2; \
			echo "$(YELLOW)Исправление зависимостей (копирование системных библиотек)...$(NC)"; \
			if [ -f scripts/fix_dependencies.sh ]; then \
				bash scripts/fix_dependencies.sh mobile/build/JummahPrayer.app; \
			else \
				echo "$(YELLOW)⚠️  Скрипт fix_dependencies.sh не найден$(NC)"; \
			fi; \
			echo "$(YELLOW)Подпись приложения...$(NC)"; \
			codesign --force --deep --sign - mobile/build/JummahPrayer.app || echo "$(YELLOW)⚠️  Не удалось подписать (это нормально для разработки)$(NC)"; \
			echo "$(GREEN)✅ Деплой завершён! Приложение готово к распространению в mobile/build/JummahPrayer.app$(NC)"; \
		else \
			echo "$(YELLOW)⚠️  Bundle не найден. Убедитесь, что сборка завершена успешно$(NC)"; \
			exit 1; \
		fi; \
	else \
		echo "$(YELLOW)⚠️  macdeployqt не найден. Установите Qt: brew install qt@6$(NC)"; \
		exit 1; \
	fi

# Деплой универсальной сборки (упаковка зависимостей Qt)
deploy-universal:
	@echo "$(GREEN)📦 Деплой универсальной сборки (упаковка зависимостей Qt)...$(NC)"
	@if [ ! -d mobile/build-universal ]; then echo "$(YELLOW)⚠️  Сначала выполните: make build-universal$(NC)"; exit 1; fi
	@if command -v macdeployqt >/dev/null 2>&1; then \
		if [ -d mobile/build-universal/JummahPrayer.app ]; then \
			echo "$(YELLOW)Удаление старой подписи...$(NC)"; \
			codesign --remove-signature mobile/build-universal/JummahPrayer.app 2>/dev/null || true; \
			find mobile/build-universal/JummahPrayer.app -name "*.dylib" -exec codesign --remove-signature {} \; 2>/dev/null || true; \
			find mobile/build-universal/JummahPrayer.app -name "*.framework" -exec codesign --remove-signature {} \; 2>/dev/null || true; \
			echo "$(YELLOW)Выполнение macdeployqt с QML модулями...$(NC)"; \
			macdeployqt mobile/build-universal/JummahPrayer.app -always-overwrite -qmldir=$$(pwd)/mobile/qml -verbose=2; \
			echo "$(YELLOW)Исправление зависимостей (копирование системных библиотек)...$(NC)"; \
			if [ -f scripts/fix_dependencies.sh ]; then \
				bash scripts/fix_dependencies.sh mobile/build-universal/JummahPrayer.app; \
			else \
				echo "$(YELLOW)⚠️  Скрипт fix_dependencies.sh не найден$(NC)"; \
			fi; \
			echo "$(YELLOW)Подпись приложения...$(NC)"; \
			codesign --force --deep --sign - mobile/build-universal/JummahPrayer.app || echo "$(YELLOW)⚠️  Не удалось подписать (это нормально для разработки)$(NC)"; \
			echo "$(GREEN)✅ Деплой завершён! Приложение готово к распространению в mobile/build-universal/JummahPrayer.app$(NC)"; \
		else \
			echo "$(YELLOW)⚠️  Bundle не найден. Убедитесь, что сборка завершена успешно$(NC)"; \
			exit 1; \
		fi; \
	else \
		echo "$(YELLOW)⚠️  macdeployqt не найден. Установите Qt: brew install qt@6$(NC)"; \
		exit 1; \
	fi

# Сборка только для Apple Silicon
build-arm64:
	@echo "$(GREEN)🔨 Сборка для Apple Silicon (arm64)...$(NC)"
	@mkdir -p mobile/build-arm64
	@cd mobile/build-arm64 && cmake -DBUILD_ARM64_ONLY=ON -DBUILD_UNIVERSAL=OFF .. && cmake --build . -j4
	@echo "$(GREEN)✅ Сборка для Apple Silicon завершена в mobile/build-arm64/$(NC)"

# Сборка только для Intel Mac
build-x86_64:
	@echo "$(GREEN)🔨 Сборка для Intel Mac (x86_64)...$(NC)"
	@mkdir -p mobile/build-x86_64
	@cd mobile/build-x86_64 && cmake -DBUILD_X86_64_ONLY=ON -DBUILD_UNIVERSAL=OFF .. && cmake --build . -j4
	@echo "$(GREEN)✅ Сборка для Intel Mac завершена в mobile/build-x86_64/$(NC)"

# Сборка с линтерами
build-lint:
	@echo "$(GREEN)🔍 Сборка с clang-tidy...$(NC)"
	@mkdir -p mobile/build
	@cd mobile/build && cmake -DENABLE_CLANG_TIDY=ON .. && cmake --build . -j4

# Сборка с cppcheck
build-cppcheck:
	@echo "$(GREEN)🔍 Сборка с cppcheck...$(NC)"
	@mkdir -p mobile/build
	@cd mobile/build && cmake -DENABLE_CPPCHECK=ON .. && cmake --build . -j4

# Очистка локальной сборки
clean:
	@echo "$(YELLOW)🧹 Очистка локальной сборки...$(NC)"
	@rm -rf mobile/build
	@echo "$(GREEN)✅ Локальная сборка очищена$(NC)"

# Очистка универсальной сборки
clean-universal:
	@echo "$(YELLOW)🧹 Очистка универсальной сборки...$(NC)"
	@rm -rf mobile/build-universal mobile/build-arm64 mobile/build-x86_64
	@echo "$(GREEN)✅ Универсальная сборка очищена$(NC)"

# Очистка всех сборок
clean-all:
	@echo "$(YELLOW)🧹 Очистка всех сборок...$(NC)"
	@rm -rf mobile/build mobile/build-universal mobile/build-arm64 mobile/build-x86_64
	@echo "$(GREEN)✅ Все сборки очищены$(NC)"

# Тесты (локальная сборка)
test:
	@echo "$(GREEN)🧪 Запуск тестов (локальная сборка)...$(NC)"
	@if [ ! -d mobile/build ]; then echo "$(YELLOW)⚠️  Сначала выполните: make build$(NC)"; exit 1; fi
	@cd mobile/build && ctest --output-on-failure

# Тесты (универсальная сборка)
test-universal:
	@echo "$(GREEN)🧪 Запуск тестов (универсальная сборка)...$(NC)"
	@if [ ! -d mobile/build-universal ]; then echo "$(YELLOW)⚠️  Сначала выполните: make build-universal$(NC)"; exit 1; fi
	@cd mobile/build-universal && ctest --output-on-failure

# Запуск приложения (локальная сборка)
run:
	@echo "$(GREEN)🚀 Запуск приложения (локальная сборка)...$(NC)"
	@if [ -f mobile/build/JummahPrayer.app/Contents/MacOS/JummahPrayer ]; then \
		./mobile/build/JummahPrayer.app/Contents/MacOS/JummahPrayer; \
	elif [ -f mobile/build/JummahPrayer ]; then \
		./mobile/build/JummahPrayer; \
	else \
		echo "$(YELLOW)⚠️  Приложение не найдено. Сначала выполните: make build$(NC)"; \
		exit 1; \
	fi

# Запуск приложения (универсальная сборка)
run-universal:
	@echo "$(GREEN)🚀 Запуск приложения (универсальная сборка)...$(NC)"
	@if [ -f mobile/build-universal/JummahPrayer.app/Contents/MacOS/JummahPrayer ]; then \
		./mobile/build-universal/JummahPrayer.app/Contents/MacOS/JummahPrayer; \
	elif [ -f mobile/build-universal/JummahPrayer ]; then \
		./mobile/build-universal/JummahPrayer; \
	else \
		echo "$(YELLOW)⚠️  Приложение не найдено. Сначала выполните: make build-universal$(NC)"; \
		exit 1; \
	fi

# Форматирование кода
format:
	@echo "$(GREEN)📝 Форматирование кода...$(NC)"
	@if [ ! -d mobile/build ]; then mkdir -p mobile/build && cd mobile/build && cmake ..; fi
	@if command -v clang-format >/dev/null 2>&1; then \
		find mobile/src -name "*.cpp" -o -name "*.h" | xargs clang-format -i; \
		echo "$(GREEN)✅ Форматирование завершено$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  clang-format не найден. Установите: brew install clang-format$(NC)"; \
	fi

# Проверка форматирования
format-check:
	@echo "$(GREEN)🔍 Проверка форматирования...$(NC)"
	@if command -v clang-format >/dev/null 2>&1; then \
		find mobile/src -name "*.cpp" -o -name "*.h" | xargs clang-format --dry-run --Werror; \
		echo "$(GREEN)✅ Форматирование корректно$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  clang-format не найден$(NC)"; \
	fi

# Линтинг
lint:
	@echo "$(GREEN)🔍 Статический анализ...$(NC)"
	@if command -v clang-tidy >/dev/null 2>&1; then \
		find mobile/src -name "*.cpp" -o -name "*.h" | xargs clang-tidy -p mobile/build; \
	else \
		echo "$(YELLOW)⚠️  clang-tidy не найден. Установите: brew install llvm$(NC)"; \
	fi

# Полная проверка кода
check: format-check lint test
	@echo "$(GREEN)✅ Все проверки пройдены!$(NC)"

# Установка зависимостей (macOS)
deps-macos:
	@echo "$(GREEN)📦 Установка зависимостей для macOS...$(NC)"
	@brew install cmake qt@6 llvm cppcheck
	@echo "$(GREEN)✅ Зависимости установлены$(NC)"
	@echo "$(YELLOW)Добавьте в ~/.zshrc:$(NC)"
	@echo "export Qt6_DIR=\"/opt/homebrew/opt/qt@6/lib/cmake/Qt6\""
	@echo "export PATH=\"/opt/homebrew/opt/llvm/bin:\$$PATH\""

# Установка зависимостей (Ubuntu/Debian)
deps-ubuntu:
	@echo "$(GREEN)📦 Установка зависимостей для Ubuntu...$(NC)"
	@sudo apt update
	@sudo apt install -y build-essential cmake git \
		qt6-base-dev qt6-declarative-dev qt6-positioning-dev qt6-sensors-dev \
		clang-tidy clang-format cppcheck
	@echo "$(GREEN)✅ Зависимости установлены$(NC)"

# Информация
info:
	@echo "$(GREEN)📊 Информация о проекте$(NC)"
	@echo "Имя: Jummah Prayer"
	@echo "Версия: 1.0.0"
	@echo "Язык: C++ (Qt 6)"
	@echo ""
	@echo "Статус сборок:"
	@if [ -d mobile/build ]; then \
		echo "  ✅ Локальная (mobile/build/)"; \
		if [ -f mobile/build/JummahPrayer.app/Contents/MacOS/JummahPrayer ]; then \
			echo "     Размер: $$(du -sh mobile/build/JummahPrayer.app 2>/dev/null | cut -f1)"; \
		elif [ -f mobile/build/JummahPrayer ]; then \
			echo "     Размер: $$(du -sh mobile/build/JummahPrayer 2>/dev/null | cut -f1)"; \
		fi; \
	else \
		echo "  ❌ Локальная (mobile/build/) - не собрана"; \
	fi
	@if [ -d mobile/build-universal ]; then \
		echo "  ✅ Универсальная (mobile/build-universal/)"; \
		if [ -f mobile/build-universal/JummahPrayer.app/Contents/MacOS/JummahPrayer ]; then \
			echo "     Размер: $$(du -sh mobile/build-universal/JummahPrayer.app 2>/dev/null | cut -f1)"; \
		elif [ -f mobile/build-universal/JummahPrayer ]; then \
			echo "     Размер: $$(du -sh mobile/build-universal/JummahPrayer 2>/dev/null | cut -f1)"; \
		fi; \
	else \
		echo "  ❌ Универсальная (mobile/build-universal/) - не собрана"; \
	fi

# ============================================
# Веб-версия (C++ бэкенд + фронтенд)
# ============================================

# Сборка C++ бэкенда
web-backend-build:
	@echo "$(GREEN)🔨 Сборка C++ бэкенда...$(NC)"
	@mkdir -p backend/build
	@cd backend/build && cmake .. && cmake --build . -j4
	@echo "$(GREEN)✅ Бэкенд собран в backend/build/$(NC)"

# Запуск только C++ бэкенда (интерактивно, с логами)
web-backend-run:
	@echo "$(GREEN)🚀 Запуск C++ бэкенда (интерактивный режим)...$(NC)"
	@if [ ! -f backend/build/JummahPrayerBackend ]; then \
		echo "$(YELLOW)⚠️  Бэкенд не собран. Выполняю сборку...$(NC)"; \
		$(MAKE) web-backend-build; \
	fi
	@echo "$(GREEN)✅ Бэкенд запущен на http://localhost:8080$(NC)"
	@echo "$(GREEN)✅ Фронтенд доступен на http://localhost:8080$(NC)"
	@echo "$(YELLOW)Нажмите Ctrl+C для остановки$(NC)"
	@echo ""
	@FRONTEND_PATH=$$(pwd)/frontend; \
	cd backend/build && ./JummahPrayerBackend "$$FRONTEND_PATH"

# Очистка сборки бэкенда
web-backend-clean:
	@echo "$(YELLOW)🧹 Очистка сборки бэкенда...$(NC)"
	@rm -rf backend/build
	@echo "$(GREEN)✅ Сборка бэкенда очищена$(NC)"

# Запуск веб-версии (бэкенд + фронтенд в браузере)
web-start:
	@echo "$(GREEN)🌐 Запуск веб-версии (бэкенд + фронтенд)...$(NC)"
	@echo "$(YELLOW)Проверка бэкенда...$(NC)"
	@if [ ! -f backend/build/JummahPrayerBackend ]; then \
		echo "$(YELLOW)⚠️  Бэкенд не собран. Выполняю сборку...$(NC)"; \
		$(MAKE) web-backend-build; \
	fi
	@echo "$(GREEN)✅ Бэкенд готов$(NC)"
	@echo "$(GREEN)🚀 Запуск C++ бэкенда (раздает фронтенд)...$(NC)"
	@echo "$(YELLOW)Бэкенд будет работать в фоне$(NC)"
	@FRONTEND_PATH=$$(pwd)/frontend; \
	cd backend/build && \
	(./JummahPrayerBackend "$$FRONTEND_PATH" > /tmp/jummah-backend.log 2>&1 & echo $$! > /tmp/jummah-backend.pid) && \
	sleep 3 && \
	if [ -f /tmp/jummah-backend.pid ]; then \
		BACKEND_PID=$$(cat /tmp/jummah-backend.pid); \
		if ps -p $$BACKEND_PID > /dev/null 2>&1; then \
			echo "$(GREEN)✅ Бэкенд запущен (PID: $$BACKEND_PID)$(NC)"; \
			echo "$(GREEN)🌐 Открываю фронтенд в браузере...$(NC)"; \
			sleep 1; \
			if command -v open >/dev/null 2>&1; then \
				open http://localhost:8080; \
			elif command -v xdg-open >/dev/null 2>&1; then \
				xdg-open http://localhost:8080; \
			else \
				echo "$(YELLOW)Откройте в браузере: http://localhost:8080$(NC)"; \
			fi; \
			echo ""; \
			echo "$(GREEN)════════════════════════════════════════$(NC)"; \
			echo "$(GREEN)✅ Веб-версия запущена!$(NC)"; \
			echo "$(GREEN)   Бэкенд: http://localhost:8080$(NC)"; \
			echo "$(GREEN)   Фронтенд: http://localhost:8080 (раздается бэкендом)$(NC)"; \
			echo "$(GREEN)════════════════════════════════════════$(NC)"; \
			echo ""; \
			echo "$(YELLOW)Для остановки выполните: make web-stop$(NC)"; \
			echo "$(YELLOW)Логи бэкенда: tail -f /tmp/jummah-backend.log$(NC)"; \
		else \
			echo "$(YELLOW)⚠️  Бэкенд не запустился. Проверьте логи:$(NC)"; \
			cat /tmp/jummah-backend.log 2>/dev/null || echo "Логи не найдены"; \
			rm -f /tmp/jummah-backend.pid; \
			exit 1; \
		fi; \
	else \
		echo "$(YELLOW)⚠️  Не удалось запустить бэкенд$(NC)"; \
		exit 1; \
	fi

# Остановка бэкенда
web-stop:
	@echo "$(YELLOW)🛑 Остановка бэкенда и фронтенда...$(NC)"
	@if [ -f /tmp/jummah-backend.pid ]; then \
		BACKEND_PID=$$(cat /tmp/jummah-backend.pid); \
		if ps -p $$BACKEND_PID > /dev/null 2>&1; then \
			kill $$BACKEND_PID 2>/dev/null && echo "$(GREEN)✅ Бэкенд остановлен$(NC)" || echo "$(YELLOW)⚠️  Не удалось остановить процесс$(NC)"; \
		else \
			echo "$(YELLOW)⚠️  Процесс уже не запущен$(NC)"; \
		fi; \
		rm -f /tmp/jummah-backend.pid; \
		echo "$(GREEN)✅ Очистка завершена$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  PID файл не найден. Ищу процесс вручную...$(NC)"; \
		BACKEND_PID=$$(pgrep -f JummahPrayerBackend | head -1); \
		if [ -n "$$BACKEND_PID" ]; then \
			kill $$BACKEND_PID 2>/dev/null && echo "$(GREEN)✅ Бэкенд остановлен (PID: $$BACKEND_PID)$(NC)" || echo "$(YELLOW)⚠️  Не удалось остановить$(NC)"; \
		else \
			echo "$(YELLOW)⚠️  Процесс не найден$(NC)"; \
		fi; \
	fi

# Сборка веб-версии (бэкенд)
web-build: web-backend-build
	@echo "$(GREEN)✅ Веб-версия собрана$(NC)"

# Запуск веб-версии (только бэкенд, без браузера)
web-run: web-backend-run

# Помощь
help:
	@echo "$(GREEN)🕌 Jummah Prayer - Команды сборки$(NC)"
	@echo ""
	@echo "$(YELLOW)Проект состоит из 3 компонентов:$(NC)"
	@echo "  1. 📱 Мобильное приложение (Qt/QML) - mobile/"
	@echo "  2. 🔧 C++ Backend - backend/"
	@echo "  3. 🌐 Frontend (Web) - frontend/"
	@echo ""
	@echo "$(YELLOW)Подробнее: $(NC)cat PROJECT_STRUCTURE.md"
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "$(GREEN)📱 НАТИВНОЕ ПРИЛОЖЕНИЕ (Qt/QML)$(NC)"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "Основные команды:"
	@echo "  make build          - Локальная сборка (build/)"
	@echo "  make deploy         - Деплой локальной сборки (упаковка Qt)"
	@echo "  make clean          - Очистить локальную сборку"
	@echo "  make clean-all      - Очистить все сборки"
	@echo "  make test           - Запустить тесты (локальная)"
	@echo "  make run            - Запустить приложение (локальная)"
	@echo ""
	@echo "Сборка для разных архитектур macOS:"
	@echo "  make build-universal - Универсальная сборка (build-universal/)"
	@echo "  make deploy-universal - Деплой универсальной сборки (упаковка Qt)"
	@echo "  make build-arm64     - Только для Apple Silicon (build-arm64/)"
	@echo "  make build-x86_64    - Только для Intel Mac (build-x86_64/)"
	@echo "  make clean-universal - Очистить универсальные сборки"
	@echo "  make test-universal  - Тесты (универсальная сборка)"
	@echo "  make run-universal   - Запуск (универсальная сборка)"
	@echo ""
	@echo "Качество кода:"
	@echo "  make format         - Отформатировать код (clang-format)"
	@echo "  make format-check   - Проверить форматирование"
	@echo "  make lint           - Статический анализ (clang-tidy)"
	@echo "  make check          - Полная проверка (format + lint + test)"
	@echo ""
	@echo "Линтеры:"
	@echo "  make build-lint     - Сборка с clang-tidy"
	@echo "  make build-cppcheck - Сборка с cppcheck"
	@echo ""
	@echo "Установка:"
	@echo "  make deps-macos     - Установить зависимости (macOS)"
	@echo "  make deps-ubuntu    - Установить зависимости (Ubuntu)"
	@echo ""
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "$(GREEN)🌐 ВЕБ-ВЕРСИЯ (C++ Backend + Frontend)$(NC)"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "$(YELLOW)C++ Backend (backend/):$(NC)"
	@echo "  make web-backend-build - Собрать C++ бэкенд"
	@echo "  make web-backend-clean - Очистить сборку бэкенда"
	@echo ""
	@echo "$(YELLOW)Frontend (frontend/):$(NC)"
	@echo "  (Раздается автоматически бэкендом)"
	@echo ""
	@echo "$(YELLOW)Запуск веб-версии:$(NC)"
	@echo "  make web-start      - Запустить бэкенд + фронтенд (в фоне + браузер)"
	@echo "  make web-run        - Запустить бэкенд + фронтенд (интерактивно)"
	@echo "  make web-stop       - Остановить бэкенд и фронтенд"
	@echo ""
	@echo "Прочее:"
	@echo "  make info           - Информация о проекте"
	@echo "  make help           - Эта справка"

