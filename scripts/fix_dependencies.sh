#!/bin/bash
# Скрипт для исправления зависимостей и копирования недостающих библиотек

set -o pipefail

APP_BUNDLE="$1"
if [ -z "$APP_BUNDLE" ]; then
    echo "Использование: $0 <path_to_app_bundle>"
    exit 1
fi

if [ ! -d "$APP_BUNDLE" ]; then
    echo "Ошибка: Bundle не найден: $APP_BUNDLE"
    exit 1
fi

FRAMEWORKS_DIR="$APP_BUNDLE/Contents/Frameworks"
MACOS_DIR="$APP_BUNDLE/Contents/MacOS"
BINARY="$MACOS_DIR/$(basename "$APP_BUNDLE" .app)"

# Создаём директорию для библиотек, если её нет
mkdir -p "$FRAMEWORKS_DIR"

# Определяем пути для поиска библиотек
QT_DIRS=""
if [ -n "${Qt6_DIR:-}" ]; then
    QT_DIRS="$(dirname "$Qt6_DIR")/lib"
fi
if [ -d "/opt/homebrew/opt/qt@6/lib" ]; then
    QT_DIRS="$QT_DIRS /opt/homebrew/opt/qt@6/lib"
fi
if [ -d "/usr/local/opt/qt@6/lib" ]; then
    QT_DIRS="$QT_DIRS /usr/local/opt/qt@6/lib"
fi

SEARCH_DIRS="/opt/homebrew/lib /usr/local/lib $QT_DIRS"

echo "🔍 Поиск недостающих зависимостей..."
echo "📂 Директории поиска: $SEARCH_DIRS"

# Функция для копирования библиотеки и исправления путей
copy_and_fix_library() {
    local lib_path="$1"
    local lib_name=$(basename "$lib_path")
    
    # Пропускаем системные библиотеки macOS
    if [[ "$lib_path" == /System/* ]] || [[ "$lib_path" == /usr/lib/* ]] || [[ "$lib_path" == /usr/local/lib/* ]]; then
        return 0
    fi
    
    # Пропускаем библиотеки, которые уже в bundle
    if [[ "$lib_path" == @executable_path/* ]] || [[ "$lib_path" == @rpath/* ]]; then
        return 0
    fi
    
    # Если библиотека уже скопирована, пропускаем
    if [ -f "$FRAMEWORKS_DIR/$lib_name" ]; then
        return 0
    fi
    
    # Проверяем, существует ли файл библиотеки
    if [ ! -f "$lib_path" ]; then
        echo "⚠️  Предупреждение: библиотека не найдена: $lib_path"
        return 0
    fi
    
    echo "📦 Копирование: $lib_name"
    cp "$lib_path" "$FRAMEWORKS_DIR/$lib_name"
    
    # Исправляем пути в скопированной библиотеке
    install_name_tool -id "@executable_path/../Frameworks/$lib_name" "$FRAMEWORKS_DIR/$lib_name" 2>/dev/null || {
        echo "⚠️  Не удалось изменить ID для $lib_name (возможно, уже правильный)"
    }
    
    # Рекурсивно обрабатываем зависимости этой библиотеки
    process_dependencies "$FRAMEWORKS_DIR/$lib_name"
}

# Функция для обработки зависимостей бинарника или библиотеки
process_dependencies() {
    local binary="$1"
    
    if [ ! -f "$binary" ]; then
        return 0
    fi
    
    # Получаем список зависимостей
    otool -L "$binary" 2>/dev/null | grep -v ":" | grep -v "^$" | awk '{print $1}' | while read -r lib_path; do
        # Пропускаем пустые строки
        [ -z "$lib_path" ] && continue
        
        # Пропускаем сам бинарник
        if [[ "$lib_path" == *"$(basename "$binary")" ]]; then
            continue
        fi
        
        # Пропускаем системные библиотеки macOS
        if [[ "$lib_path" == /System/* ]] || [[ "$lib_path" == /usr/lib/* ]]; then
            continue
        fi
        
        # Если это @executable_path, проверяем, существует ли файл
        if [[ "$lib_path" == @executable_path/* ]]; then
            local rel_path="${lib_path#@executable_path/}"
            local lib_name=$(basename "$lib_path")
            if [ ! -f "$MACOS_DIR/$rel_path" ] && [ ! -f "$FRAMEWORKS_DIR/$lib_name" ]; then
                # Пытаемся найти библиотеку в системе
                local found_lib=""
                for search_dir in $SEARCH_DIRS; do
                    if [ -d "$search_dir" ]; then
                        found_lib=$(find "$search_dir" -name "$lib_name" 2>/dev/null | head -1)
                        [ -n "$found_lib" ] && break
                    fi
                done
                if [ -n "$found_lib" ] && [ -f "$found_lib" ]; then
                    copy_and_fix_library "$found_lib"
                    install_name_tool -change "$lib_path" "@executable_path/../Frameworks/$lib_name" "$binary" 2>/dev/null || {
                        echo "⚠️  Не удалось изменить путь для $lib_name в $binary (возможно, уже правильный)"
                    }
                else
                    echo "⚠️  Не найдена библиотека: $lib_name"
                fi
            fi
            continue
        fi
        
        # Если это @rpath, пытаемся найти библиотеку
        if [[ "$lib_path" == @rpath/* ]]; then
            local lib_name=$(basename "$lib_path")
            if [ ! -f "$FRAMEWORKS_DIR/$lib_name" ]; then
                local found_lib=""
                for search_dir in $SEARCH_DIRS; do
                    if [ -d "$search_dir" ]; then
                        found_lib=$(find "$search_dir" -name "$lib_name" 2>/dev/null | head -1)
                        [ -n "$found_lib" ] && break
                    fi
                done
                if [ -n "$found_lib" ] && [ -f "$found_lib" ]; then
                    copy_and_fix_library "$found_lib"
                    install_name_tool -change "$lib_path" "@executable_path/../Frameworks/$lib_name" "$binary" 2>/dev/null || {
                        echo "⚠️  Не удалось изменить путь для $lib_name в $binary (возможно, уже правильный)"
                    }
                else
                    echo "⚠️  Не найдена библиотека: $lib_name"
                fi
            fi
            continue
        fi
        
        # Если это абсолютный путь к библиотеке вне bundle
        if [[ "$lib_path" == /* ]] && [[ "$lib_path" != "$APP_BUNDLE"* ]]; then
            # Пропускаем системные библиотеки macOS
            if [[ "$lib_path" != /System/* ]] && [[ "$lib_path" != /usr/lib/* ]]; then
                copy_and_fix_library "$lib_path"
                local lib_name=$(basename "$lib_path")
                install_name_tool -change "$lib_path" "@executable_path/../Frameworks/$lib_name" "$binary" 2>/dev/null || {
                    echo "⚠️  Не удалось изменить путь для $lib_name в $binary"
                }
            fi
        fi
    done
}

# Обрабатываем главный бинарник
if [ -f "$BINARY" ]; then
    echo "🔧 Обработка зависимостей главного бинарника..."
    process_dependencies "$BINARY"
fi

# Обрабатываем все библиотеки в Frameworks (несколько итераций для обработки вложенных зависимостей)
if [ -d "$FRAMEWORKS_DIR" ]; then
    echo "🔧 Обработка зависимостей библиотек..."
    # Выполняем несколько проходов для обработки всех зависимостей
    for iteration in 1 2 3; do
        if [ $iteration -gt 1 ]; then
            echo "  Проход $iteration..."
        fi
        find "$FRAMEWORKS_DIR" -type f \( -name "*.dylib" -o -name "*.so" \) | while read -r lib; do
            process_dependencies "$lib"
        done
        
        # Обрабатываем frameworks
        find "$FRAMEWORKS_DIR" -type d -name "*.framework" | while read -r framework; do
            local framework_binary="$framework/$(basename "$framework" .framework)"
            if [ -f "$framework_binary" ]; then
                process_dependencies "$framework_binary"
            fi
            # Также обрабатываем библиотеки внутри framework
            find "$framework" -type f \( -name "*.dylib" -o -name "*.so" \) | while read -r lib; do
                process_dependencies "$lib"
            done
        done
    done
fi

echo "✅ Обработка зависимостей завершена!"

