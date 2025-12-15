import React, { useState, useEffect } from 'react';
import { tr } from '../utils/translations';

const DatePicker = ({ isOpen, onClose, onSelectDate, selectedDate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const today = new Date();

    useEffect(() => {
        if (isOpen && selectedDate) {
            setCurrentMonth(new Date(selectedDate));
        }
    }, [isOpen, selectedDate]);

    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    const isSameDay = (date1, date2) => {
        if (!date1 || !date2) return false;
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    };

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        let startingDayOfWeek = firstDay.getDay();
        // Преобразуем: воскресенье (0) -> 6, понедельник (1) -> 0, и т.д.
        startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
        
        const days = [];
        
        // Заголовки дней недели
        dayNames.forEach(day => {
            days.push(
                <div key={`header-${day}`} className="calendar-day-header">
                    {day}
                </div>
            );
        });
        
        // Пустые ячейки до первого дня
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day other-month"></div>);
        }
        
        // Дни месяца
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            
            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            
            days.push(
                <div
                    key={`day-${day}`}
                    className={classes}
                    onClick={() => handleDateSelect(date)}
                >
                    {day}
                </div>
            );
        }
        
        return days;
    };

    const handleDateSelect = (date) => {
        onSelectDate(date);
        onClose();
    };

    const handlePrevMonth = () => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + 1);
            return newDate;
        });
    };

    const handleYesterday = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        handleDateSelect(yesterday);
    };

    const handleToday = () => {
        handleDateSelect(new Date());
    };

    const handleTomorrow = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        handleDateSelect(tomorrow);
    };

    if (!isOpen) return null;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    return (
        <div className="modal active" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{tr('Date Selection') || 'Выбор даты'}</h2>
                <div className="calendar-container">
                    <div className="calendar-header">
                        <button className="calendar-nav" onClick={handlePrevMonth}>◄</button>
                        <div className="calendar-month">
                            {monthNames[month]} {year}
                        </div>
                        <button className="calendar-nav" onClick={handleNextMonth}>►</button>
                    </div>
                    <div className="calendar-grid">
                        {renderCalendar()}
                    </div>
                    <div className="calendar-quick">
                        <button className="btn btn-outline" onClick={handleYesterday}>
                            ⏮ {tr('Yesterday') || 'Вчера'}
                        </button>
                        <button className="btn btn-primary" onClick={handleToday}>
                            📅 {tr('Today') || 'Сегодня'}
                        </button>
                        <button className="btn btn-outline" onClick={handleTomorrow}>
                            {tr('Tomorrow') || 'Завтра'} ⏭
                        </button>
                    </div>
                </div>
                <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '16px', width: '100%' }}>
                    ✕ {tr('Close') || 'Закрыть'}
                </button>
            </div>
        </div>
    );
};

export default DatePicker;


