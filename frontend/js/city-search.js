// Поиск городов

// Инициализация поиска города
function initCitySearch() {
    console.log('🔧 Инициализация поиска городов...');
    
    const cityDialog = document.getElementById('city-dialog');
    const selectCityBtn = document.getElementById('select-city-btn');
    const citySearch = document.getElementById('city-search');
    const cityResults = document.getElementById('city-results');
    const closeCityDialog = document.getElementById('close-city-dialog');
    const searchCityBtn = document.getElementById('search-city-btn');
    
    // Проверяем, что все элементы найдены
    if (!cityDialog) console.warn('⚠️ city-dialog не найден');
    if (!selectCityBtn) console.warn('⚠️ select-city-btn не найден');
    if (!citySearch) console.warn('⚠️ city-search не найден');
    if (!cityResults) console.warn('⚠️ city-results не найден');
    if (!closeCityDialog) console.warn('⚠️ close-city-dialog не найден');
    
    if (!citySearch || !cityResults) {
        console.error('❌ Критические элементы для поиска городов не найдены!');
        return;
    }
    
    console.log('✅ Все элементы для поиска городов найдены');
    
    let searchTimeout;
    
    function openCityDialog() {
        console.log('📂 Открытие диалога выбора города');
        if (cityDialog) {
            cityDialog.classList.add('active');
            console.log('   ✅ Класс active добавлен к city-dialog');
        } else {
            console.error('   ❌ cityDialog не найден!');
        }
        if (citySearch) {
            citySearch.focus();
            console.log('   ✅ Фокус установлен на city-search');
            console.log('   📝 Текущее значение поля:', citySearch.value);
        } else {
            console.error('   ❌ citySearch не найден!');
        }
    }
    
    function closeCityDialogFunc() {
        console.log('📂 Закрытие диалога выбора города');
        if (cityDialog) {
            cityDialog.classList.remove('active');
        }
        if (citySearch) {
            citySearch.value = '';
        }
        if (cityResults) {
            cityResults.innerHTML = '';
        }
    }
    
    async function searchCities(query) {
        console.log('🔍 searchCities вызвана с запросом:', query);
        console.log('   Длина запроса:', query.length);
        console.log('   cityResults существует:', !!cityResults);
        
        if (!query || query.length < 2) {
            console.log('⚠️ Запрос слишком короткий, пропускаем');
            if (cityResults) {
                cityResults.innerHTML = '<div class="city-result-item">Введите хотя бы 2 символа для поиска</div>';
            }
            return;
        }
        
        // Показываем индикатор загрузки
        if (cityResults) {
            cityResults.innerHTML = '<div class="city-result-item">Поиск...</div>';
            console.log('📊 Индикатор загрузки показан');
        } else {
            console.error('❌ cityResults не существует!');
            return;
        }
        
        try {
            // Используем C++ бэкенд API для поиска городов
            const apiUrl = window.location.origin;
            const url = `${apiUrl}/api/cities/search?q=${encodeURIComponent(query)}&limit=20`;
            
            console.log('🔍 Поиск городов:', query);
            console.log('📡 URL запроса:', url);
            
            const startTime = Date.now();
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                },
                cache: 'no-store'
            });
            const endTime = Date.now();
            
            console.log('📥 Получен ответ за', endTime - startTime, 'мс');
            console.log('   Статус:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ошибка HTTP:', response.status, response.statusText);
                console.error('   Ответ сервера:', errorText);
                throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📥 Получен ответ от API:', data);
            
            if (cityResults) {
                // Проверяем оба формата ответа
                const cities = Array.isArray(data.data?.cities) ? data.data.cities : 
                              Array.isArray(data.cities) ? data.cities : [];
                
                console.log('🏙️ Найдено городов:', cities.length);
                
                if (!data.success) {
                    const errorMsg = data.error || 'Неизвестная ошибка';
                    cityResults.innerHTML = `<div class="city-result-item">Ошибка: ${errorMsg}</div>`;
                    return;
                }
                
                if (cities.length === 0) {
                    cityResults.innerHTML = '<div class="city-result-item">Города не найдены. Попробуйте другой запрос.</div>';
                    return;
                }
                
                // Формируем список городов
                cityResults.innerHTML = cities.map(city => {
                    // Извлекаем название города из ответа Nominatim
                    const cityName = city.address?.city || 
                                   city.address?.town || 
                                   city.address?.village || 
                                   city.address?.municipality ||
                                   city.address?.city_district ||
                                   city.address?.county ||
                                   city.name || 
                                   (city.display_name ? city.display_name.split(',')[0] : '') ||
                                   'Неизвестно';
                    
                    const country = city.address?.country || '';
                    const region = city.address?.state || 
                                 city.address?.region || 
                                 city.address?.province || '';
                    
                    // Формируем полное название с регионом и страной
                    let fullName = cityName;
                    if (region && region !== cityName) {
                        fullName += ', ' + region;
                    }
                    if (country) {
                        fullName += ', ' + country;
                    }
                    
                    const lat = parseFloat(city.lat);
                    const lon = parseFloat(city.lon);
                    
                    // Проверяем валидность координат
                    if (isNaN(lat) || isNaN(lon)) {
                        console.warn('⚠️ Некорректные координаты для города:', cityName);
                        return null;
                    }
                    
                    return `
                        <div class="city-result-item" data-lat="${lat}" data-lon="${lon}" data-name="${cityName}">
                            <strong>${cityName}</strong>${region && region !== cityName ? ', ' + region : ''}${country ? ', ' + country : ''}
                        </div>
                    `;
                }).filter(item => item !== null).join('');
                
                // Обработчики кликов
                cityResults.querySelectorAll('.city-result-item').forEach(item => {
                    item.addEventListener('click', async () => {
                        const lat = parseFloat(item.getAttribute('data-lat'));
                        const lon = parseFloat(item.getAttribute('data-lon'));
                        const name = item.getAttribute('data-name');
                        
                        console.log('📍 Выбран город:', name, 'координаты:', lat, lon);
                        
                        if (isNaN(lat) || isNaN(lon)) {
                            console.error('❌ Некорректные координаты');
                            return;
                        }
                        
                        prayerCalc.setLocation(lat, lon, name);
                        await loadPrayerTimes();
                        updateSettingsLocation();
                        closeCityDialogFunc();
                    });
                });
            }
        } catch (error) {
            console.error('❌ Ошибка поиска городов:', error);
            console.error('   Детали:', error.message);
            if (cityResults) {
                cityResults.innerHTML = `<div class="city-result-item">Ошибка при поиске городов: ${error.message}</div>`;
            }
        }
    }
    
    if (selectCityBtn) {
        console.log('✅ Кнопка select-city-btn найдена, привязываем обработчик');
        selectCityBtn.addEventListener('click', () => {
            console.log('🖱️ Клик по кнопке выбора города');
            openCityDialog();
        });
    } else {
        console.warn('⚠️ Кнопка select-city-btn не найдена');
    }
    
    // Обработчик кнопки поиска
    if (searchCityBtn) {
        console.log('✅ Кнопка search-city-btn найдена, привязываем обработчик');
        
        searchCityBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔍 КЛИК ПО КНОПКЕ ПОИСКА!');
            
            if (citySearch && citySearch.value) {
                const query = citySearch.value.trim();
                console.log('   Запрос:', query, 'длина:', query.length);
                
                if (query.length >= 2) {
                    console.log('   ✅ Запуск поиска для:', query);
                    clearTimeout(searchTimeout);
                    searchCities(query);
                } else {
                    console.log('   ⚠️ Запрос слишком короткий');
                    if (cityResults) {
                        cityResults.innerHTML = '<div class="city-result-item">Введите хотя бы 2 символа для поиска</div>';
                    }
                }
            } else {
                console.log('   ⚠️ Поле поиска пустое');
                if (cityResults) {
                    cityResults.innerHTML = '<div class="city-result-item">Введите название города</div>';
                }
            }
        });
        
        // Также добавляем обработчик через делегирование
        if (cityDialog) {
            cityDialog.addEventListener('click', (e) => {
                if (e.target && e.target.id === 'search-city-btn') {
                    console.log('🔍 [Делегирование] Клик по кнопке поиска');
                    e.preventDefault();
                    e.stopPropagation();
                    if (citySearch && citySearch.value) {
                        const query = citySearch.value.trim();
                        if (query.length >= 2) {
                            clearTimeout(searchTimeout);
                            searchCities(query);
                        }
                    }
                }
            });
        }
    } else {
        console.error('❌ Кнопка search-city-btn НЕ НАЙДЕНА! Проверьте HTML.');
    }
    
    if (closeCityDialog) {
        console.log('✅ Кнопка close-city-dialog найдена, привязываем обработчик');
        closeCityDialog.addEventListener('click', closeCityDialogFunc);
    } else {
        console.warn('⚠️ Кнопка close-city-dialog не найдена');
    }
    
    // Используем делегирование событий на cityDialog
    if (cityDialog) {
        console.log('✅ Используем делегирование событий на city-dialog');
        
        // Обработчик input через делегирование
        cityDialog.addEventListener('input', (e) => {
            if (e.target && e.target.id === 'city-search') {
                try {
                    const value = e.target.value;
                    console.log('⌨️ [Делегирование] Ввод в поле поиска:', value);
                    
                    if (!value || value.trim().length === 0) {
                        console.log('⚠️ Пустое значение, очищаем результаты');
                        if (cityResults) {
                            cityResults.innerHTML = '';
                        }
                        return;
                    }
                    
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        console.log('⏱️ Таймаут истек (300ms), запуск поиска для:', value);
                        try {
                            searchCities(value.trim());
                        } catch (error) {
                            console.error('❌ Ошибка в searchCities:', error);
                            if (cityResults) {
                                cityResults.innerHTML = `<div class="city-result-item">Ошибка: ${error.message}</div>`;
                            }
                        }
                    }, 300);
                } catch (error) {
                    console.error('❌ Ошибка в обработчике input (делегирование):', error);
                }
            }
        });
        
        // Обработчик keyup через делегирование
        cityDialog.addEventListener('keyup', (e) => {
            if (e.target && e.target.id === 'city-search') {
                try {
                    if (e.key === 'Enter') {
                        const value = e.target.value;
                        console.log('⌨️ [Делегирование] Нажата Enter, запуск поиска для:', value);
                        clearTimeout(searchTimeout);
                        try {
                            searchCities(value.trim());
                        } catch (error) {
                            console.error('❌ Ошибка в searchCities (Enter):', error);
                        }
                    }
                } catch (error) {
                    console.error('❌ Ошибка в обработчике keyup (делегирование):', error);
                }
            }
        });
    }
    
    // Также привязываем напрямую к элементу
    if (citySearch) {
        console.log('✅ Обработчик input привязан напрямую к city-search');
        
        const handleInput = (e) => {
            try {
                const value = e.target.value;
                console.log('⌨️ [Прямой] Ввод в поле поиска:', value);
                
                if (!value || value.trim().length === 0) {
                    console.log('⚠️ Пустое значение, очищаем результаты');
                    if (cityResults) {
                        cityResults.innerHTML = '';
                    }
                    return;
                }
                
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    console.log('⏱️ Таймаут истек (300ms), запуск поиска для:', value);
                    try {
                        searchCities(value.trim());
                    } catch (error) {
                        console.error('❌ Ошибка в searchCities:', error);
                        if (cityResults) {
                            cityResults.innerHTML = `<div class="city-result-item">Ошибка: ${error.message}</div>`;
                        }
                    }
                }, 300);
            } catch (error) {
                console.error('❌ Ошибка в обработчике input (прямой):', error);
            }
        };
        
        citySearch.addEventListener('input', handleInput);
        citySearch.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const value = e.target.value;
                console.log('⌨️ [Прямой] Нажата Enter, запуск поиска для:', value);
                clearTimeout(searchTimeout);
                try {
                    if (value && value.trim().length >= 2) {
                        searchCities(value.trim());
                    } else {
                        console.log('   ⚠️ Запрос слишком короткий');
                        if (cityResults) {
                            cityResults.innerHTML = '<div class="city-result-item">Введите хотя бы 2 символа для поиска</div>';
                        }
                    }
                } catch (error) {
                    console.error('❌ Ошибка в searchCities (Enter):', error);
                }
            }
        });
    } else {
        console.error('❌ citySearch не найден, обработчик не привязан!');
    }
    
    // Закрытие по клику вне модального окна
    if (cityDialog) {
        cityDialog.addEventListener('click', (e) => {
            if (e.target === cityDialog) {
                closeCityDialogFunc();
            }
        });
    }
    
    // Экспортируем функции для тестирования из консоли
    window.testCitySearch = function(query = 'Москва') {
        console.log('🧪 ТЕСТ: Ручной вызов поиска городов для:', query);
        try {
            searchCities(query);
        } catch (error) {
            console.error('❌ Ошибка при тестовом вызове:', error);
        }
    };
    
    window.testCitySearchInput = function(query = 'Москва') {
        console.log('🧪 ТЕСТ: Симуляция ввода для:', query);
        if (citySearch) {
            citySearch.value = query;
            const event = new Event('input', { bubbles: true, cancelable: true });
            citySearch.dispatchEvent(event);
            console.log('   ✅ Событие input отправлено');
        } else {
            console.error('❌ citySearch не найден для теста');
        }
    };
    
    window.searchCitiesDirect = searchCities;
    
    console.log('✅ Инициализация поиска городов завершена');
}


