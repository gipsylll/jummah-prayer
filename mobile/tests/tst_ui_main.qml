import QtQuick
import QtTest
import PrayerTimes 1.0

TestCase {
    id: testCase
    name: "MainPageTests"
    when: windowShown
    
    // Создаем экземпляр калькулятора
    PrayerTimesCalculator {
        id: testCalc
    }
    
    // Тест 1: Проверка создания калькулятора
    function test_01_calculator_creation() {
        verify(testCalc !== null, "Калькулятор должен быть создан")
        verify(testCalc.city !== "", "Город должен быть установлен")
    }
    
    // Тест 2: Проверка что времена намаза не пустые
    function test_02_prayer_times_not_empty() {
        testCalc.calculatePrayerTimes()
        
        var times = testCalc.prayerTimes
        
        verify(times.fajr !== undefined, "Время Фаджр должно быть определено")
        verify(times.fajr !== "", "Время Фаджр не должно быть пустым")
        verify(times.fajr !== "00:00", "Время Фаджр не должно быть 00:00")
        
        verify(times.dhuhr !== undefined, "Время Зухр должно быть определено")
        verify(times.dhuhr !== "", "Время Зухр не должно быть пустым")
        
        verify(times.asr !== undefined, "Время Аср должно быть определено")
        verify(times.maghrib !== undefined, "Время Магриб должно быть определено")
        verify(times.isha !== undefined, "Время Иша должно быть определено")
        
        console.log("✓ Все времена намаза корректны:")
        console.log("  Фаджр:", times.fajr)
        console.log("  Зухр:", times.dhuhr)
        console.log("  Аср:", times.asr)
        console.log("  Магриб:", times.maghrib)
        console.log("  Иша:", times.isha)
    }
    
    // Тест 3: Проверка формата времени (HH:MM)
    function test_03_time_format() {
        testCalc.calculatePrayerTimes()
        var times = testCalc.prayerTimes
        
        var timeRegex = /^\d{2}:\d{2}$/
        
        verify(timeRegex.test(times.fajr), "Фаджр должен быть в формате HH:MM: " + times.fajr)
        verify(timeRegex.test(times.sunrise), "Восход должен быть в формате HH:MM: " + times.sunrise)
        verify(timeRegex.test(times.dhuhr), "Зухр должен быть в формате HH:MM: " + times.dhuhr)
        verify(timeRegex.test(times.asr), "Аср должен быть в формате HH:MM: " + times.asr)
        verify(timeRegex.test(times.maghrib), "Магриб должен быть в формате HH:MM: " + times.maghrib)
        verify(timeRegex.test(times.isha), "Иша должен быть в формате HH:MM: " + times.isha)
    }
    
    // Тест 4: Проверка изменения местоположения
    function test_04_location_change() {
        // Москва
        testCalc.setLocation(55.7558, 37.6173, "Москва")
        compare(testCalc.city, "Москва", "Город должен быть Москва")
        compare(testCalc.latitude, 55.7558, "Широта Москвы")
        compare(testCalc.longitude, 37.6173, "Долгота Москвы")
        
        var moscowDhuhr = testCalc.prayerTimes.dhuhr
        
        // Мекка
        testCalc.setLocation(21.4225, 39.8262, "Мекка")
        compare(testCalc.city, "Мекка", "Город должен быть Мекка")
        
        var meccaDhuhr = testCalc.prayerTimes.dhuhr
        
        // Времена должны отличаться
        verify(moscowDhuhr !== meccaDhuhr, "Время Зухр в Москве и Мекке должно отличаться")
        
        console.log("✓ Москва Зухр:", moscowDhuhr)
        console.log("✓ Мекка Зухр:", meccaDhuhr)
    }
    
    // Тест 5: Проверка getCurrentPrayer и getNextPrayer
    function test_05_current_and_next_prayer() {
        testCalc.setLocation(55.7558, 37.6173, "Москва")
        testCalc.calculatePrayerTimes()
        
        var current = testCalc.getCurrentPrayer()
        var next = testCalc.getNextPrayer()
        
        verify(current !== "", "Текущий намаз не должен быть пустым")
        verify(next !== "", "Следующий намаз не должен быть пустым")
        verify(current !== next, "Текущий и следующий намаз должны отличаться")
        
        var validPrayers = ["Фаджр", "Восход", "Зухр", "Аср", "Магриб", "Иша"]
        verify(validPrayers.indexOf(current) !== -1, "Текущий намаз должен быть валидным: " + current)
        verify(validPrayers.indexOf(next) !== -1, "Следующий намаз должен быть валидным: " + next)
        
        console.log("✓ Текущий намаз:", current)
        console.log("✓ Следующий намаз:", next)
    }
    
    // Тест 6: Проверка сигналов
    SignalSpy {
        id: timesChangedSpy
        target: testCalc
        signalName: "prayerTimesChanged"
    }
    
    SignalSpy {
        id: locationChangedSpy
        target: testCalc
        signalName: "locationChanged"
    }
    
    function test_06_signals() {
        timesChangedSpy.clear()
        locationChangedSpy.clear()
        
        // Изменение местоположения должно вызвать сигналы
        testCalc.setLocation(51.5074, -0.1278, "Лондон")
        
        verify(locationChangedSpy.count > 0, "Сигнал locationChanged должен быть вызван")
        verify(timesChangedSpy.count > 0, "Сигнал prayerTimesChanged должен быть вызван")
        
        console.log("✓ Сигналы работают корректно")
    }
    
    // Тест 7: Граничные условия для координат
    function test_07_boundary_coordinates() {
        // Северный полюс
        testCalc.setLocation(90, 0, "Северный полюс")
        testCalc.calculatePrayerTimes()
        var northTimes = testCalc.prayerTimes
        verify(northTimes.dhuhr !== "", "Должны быть времена даже для Северного полюса")
        
        // Экватор
        testCalc.setLocation(0, 0, "Экватор")
        testCalc.calculatePrayerTimes()
        var equatorTimes = testCalc.prayerTimes
        verify(equatorTimes.dhuhr !== "", "Должны быть времена для экватора")
        
        // Южное полушарие
        testCalc.setLocation(-33.8688, 151.2093, "Сидней")
        testCalc.calculatePrayerTimes()
        var sydneyTimes = testCalc.prayerTimes
        verify(sydneyTimes.dhuhr !== "", "Должны быть времена для южного полушария")
        
        console.log("✓ Граничные условия проверены")
    }
    
    // Тест 8: Производительность расчета
    function test_08_performance() {
        var startTime = new Date().getTime()
        
        for (var i = 0; i < 100; i++) {
            testCalc.calculatePrayerTimes()
        }
        
        var endTime = new Date().getTime()
        var duration = endTime - startTime
        var avgTime = duration / 100
        
        verify(avgTime < 50, "Средний расчет должен быть быстрее 50мс, текущий: " + avgTime + "мс")
        
        console.log("✓ 100 расчетов выполнено за", duration, "мс (среднее:", avgTime, "мс)")
    }
    
    // Тест 9: Проверка date
    function test_09_date_format() {
        testCalc.calculatePrayerTimes()
        var dateStr = testCalc.prayerTimes.date
        
        verify(dateStr !== undefined, "Дата должна быть определена")
        verify(dateStr !== "", "Дата не должна быть пустой")
        
        // Формат DD.MM.YYYY
        var dateRegex = /^\d{2}\.\d{2}\.\d{4}$/
        verify(dateRegex.test(dateStr), "Дата должна быть в формате DD.MM.YYYY: " + dateStr)
        
        console.log("✓ Дата:", dateStr)
    }
    
    // Тест 10: Стресс-тест - быстрая смена городов
    function test_10_rapid_location_changes() {
        var cities = [
            {lat: 55.7558, lon: 37.6173, name: "Москва"},
            {lat: 21.4225, lon: 39.8262, name: "Мекка"},
            {lat: 41.0082, lon: 28.9784, name: "Стамбул"},
            {lat: 51.5074, lon: -0.1278, name: "Лондон"},
            {lat: 25.2048, lon: 55.2708, name: "Дубай"}
        ]
        
        for (var i = 0; i < cities.length; i++) {
            testCalc.setLocation(cities[i].lat, cities[i].lon, cities[i].name)
            verify(testCalc.prayerTimes.dhuhr !== "", "Время должно быть рассчитано для " + cities[i].name)
        }
        
        console.log("✓ Стресс-тест пройден: все города обработаны корректно")
    }
}

