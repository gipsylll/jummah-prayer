// Календарь для выбора даты

// Инициализация календаря
function initCalendar() {
    const dateDialog = document.getElementById('date-dialog');
    const calendarBtn = document.getElementById('calendar-btn');
    const selectDateBtn = document.getElementById('select-date-btn');
    const closeDateDialog = document.getElementById('close-date-dialog');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarMonth = document.getElementById('calendar-month');
    const yesterdayBtn = document.getElementById('yesterday-btn');
    const todayBtn = document.getElementById('today-btn');
    const tomorrowBtn = document.getElementById('tomorrow-btn');
    
    let currentCalendarDate = new Date();
    
    function openCalendar() {
        currentCalendarDate = new Date(prayerCalc.selectedDate);
        renderCalendar();
        dateDialog.classList.add('active');
    }
    
    function closeCalendar() {
        dateDialog.classList.remove('active');
    }
    
    function renderCalendar() {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        
        // Заголовок месяца
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                           'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        if (calendarMonth) {
            calendarMonth.textContent = `${monthNames[month]} ${year}`;
        }
        
        // Первый день месяца
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Дни недели
        const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        
        if (calendarGrid) {
            let html = '';
            
            // Заголовки дней
            dayNames.forEach(day => {
                html += `<div class="calendar-day-header">${day}</div>`;
            });
            
            // Пустые ячейки до первого дня
            for (let i = 0; i < startingDayOfWeek; i++) {
                html += '<div class="calendar-day other-month"></div>';
            }
            
            // Дни месяца
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const isToday = isSameDay(date, new Date());
                const isSelected = isSameDay(date, prayerCalc.selectedDate);
                
                let classes = 'calendar-day';
                if (isToday) classes += ' today';
                if (isSelected) classes += ' selected';
                
                html += `<div class="${classes}" data-day="${day}">${day}</div>`;
            }
            
            calendarGrid.innerHTML = html;
            
            // Обработчики кликов на дни
            calendarGrid.querySelectorAll('.calendar-day:not(.other-month)').forEach(dayEl => {
                dayEl.addEventListener('click', async () => {
                    const day = parseInt(dayEl.getAttribute('data-day'));
                    const selectedDate = new Date(year, month, day);
                    prayerCalc.selectedDate = selectedDate;
                    await prayerCalc.fetchPrayerTimes(selectedDate);
                    updateUI();
                    updatePrayerInfo();
                    renderCalendar();
                });
            });
        }
    }
    
    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    if (calendarBtn) {
        calendarBtn.addEventListener('click', openCalendar);
    }
    if (selectDateBtn) {
        selectDateBtn.addEventListener('click', openCalendar);
    }
    if (closeDateDialog) {
        closeDateDialog.addEventListener('click', closeCalendar);
    }
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendar();
        });
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendar();
        });
    }
    if (yesterdayBtn) {
        yesterdayBtn.addEventListener('click', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            prayerCalc.selectedDate = yesterday;
            await prayerCalc.fetchPrayerTimes(yesterday);
            updateUI();
            updatePrayerInfo();
            currentCalendarDate = new Date(yesterday);
            renderCalendar();
        });
    }
    if (todayBtn) {
        todayBtn.addEventListener('click', async () => {
            const today = new Date();
            prayerCalc.selectedDate = today;
            await prayerCalc.fetchPrayerTimes(today);
            updateUI();
            updatePrayerInfo();
            currentCalendarDate = new Date(today);
            renderCalendar();
        });
    }
    if (tomorrowBtn) {
        tomorrowBtn.addEventListener('click', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            prayerCalc.selectedDate = tomorrow;
            await prayerCalc.fetchPrayerTimes(tomorrow);
            updateUI();
            updatePrayerInfo();
            currentCalendarDate = new Date(tomorrow);
            renderCalendar();
        });
    }
    
    // Закрытие по клику вне модального окна
    if (dateDialog) {
        dateDialog.addEventListener('click', (e) => {
            if (e.target === dateDialog) {
                closeCalendar();
            }
        });
    }
}

