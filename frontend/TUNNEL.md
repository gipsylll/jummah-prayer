# Туннелирование порта для доступа извне

## Использование Tuna (рекомендуется)

Tuna уже установлен через Homebrew.

### Запуск через npm script:
```bash
npm run tuna
```

### Запуск напрямую:
```bash
tuna http 3001
```

После запуска вы увидите URL вида:
```
Forwarding https://xxx-xxx-xxx-xxx.ru.tuna.am -> 127.0.0.1:3001
Web Interface: http://127.0.0.1:4040
```

**Важно:** 
- Vite уже настроен с `host: true` и `allowedHosts: ['.tuna.am']` в `vite.config.js`
- После изменения конфигурации нужно перезапустить Vite (`Ctrl+C` и `npm run dev`)

## Использование localtunnel

### Способ 1: Через npm script
```bash
npm run tunnel
```

### Способ 2: Напрямую через npx
```bash
npx localtunnel --port 3001 --print-requests
```

После запуска вы увидите URL вида:
```
your url is: https://random-subdomain.loca.lt
```

Используйте этот URL для доступа к вашему приложению из любого места в интернете.

### Способ 3: Через скрипт
```bash
./start-tunnel.sh
```

## Важно

1. **Убедитесь, что Vite запущен на порту 3001:**
   ```bash
   npm run dev -- --port 3001
   ```

2. **Туннель активен только пока запущена команда** - не закрывайте терминал.

3. **Для остановки туннеля** нажмите `Ctrl+C` в терминале где он запущен.

## Альтернативы

Если localtunnel не работает, можете использовать:

### ngrok (требует регистрации)
```bash
# Установка
brew install ngrok/ngrok/ngrok

# Запуск
ngrok http 3001
```

### cloudflared (бесплатно)
```bash
# Установка
brew install cloudflare/cloudflare/cloudflared

# Запуск
cloudflared tunnel --url http://localhost:3001
```
