import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrayerTracking } from '../contexts/PrayerTrackingContext';
import { tr } from '../utils/translations';
import CardAnimation from '../components/CardAnimation';

const StatsPage = () => {
    const navigate = useNavigate();
    const { getWeekStats, getMonthStats, getAllTracking } = usePrayerTracking();
    const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const allTracking = getAllTracking();
    const hasData = Object.keys(allTracking).length > 0;

    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const prayerNames = {
        fajr: 'Фаджр',
        dhuhr: 'Зухр',
        asr: 'Аср',
        maghrib: 'Магриб',
        isha: 'Иша'
    };

    // Получить начало недели (понедельник)
    const getWeekStart = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Понедельник
        return new Date(d.setDate(diff));
    };

    const weekStart = getWeekStart(currentDate);
    const weekStats = getWeekStats(weekStart);
    const monthStats = getMonthStats(currentDate.getFullYear(), currentDate.getMonth());

    // Подготовка данных для графика недели
    const weekChartData = weekStats.weekData.map(day => {
        const completed = prayers.filter(p => day.prayers[p] === true).length;
        return {
            date: day.date,
            completed,
            total: prayers.length
        };
    });

    // Подготовка данных для графика месяца
    const getMonthChartData = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const data = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = date.toISOString().split('T')[0];
            const dayData = getAllTracking()[dateKey] || {};
            const completed = prayers.filter(p => dayData[p] === true).length;
            data.push({
                date: dateKey,
                day,
                completed,
                total: prayers.length
            });
        }

        return data;
    };

    const monthChartData = getMonthChartData();

    // Статистика по молитвам
    const getPrayerStats = () => {
        const stats = {};
        prayers.forEach(prayer => {
            const allTracking = getAllTracking();
            let completed = 0;
            let missed = 0;

            Object.values(allTracking).forEach(dayData => {
                if (dayData[prayer] === true) completed++;
                else if (dayData[prayer] === false) missed++;
            });

            stats[prayer] = {
                completed,
                missed,
                total: completed + missed,
                percentage: completed + missed > 0 
                    ? Math.round((completed / (completed + missed)) * 100) 
                    : 0
            };
        });

        return stats;
    };

    const prayerStats = getPrayerStats();

    const renderBarChart = (data, maxValue) => {
        return (
            <div className="bar-chart">
                {data.map((item, index) => {
                    const height = maxValue > 0 ? (item.completed / maxValue) * 100 : 0;
                    const dayLabel = viewMode === 'week' 
                        ? new Date(item.date).toLocaleDateString('ru-RU', { weekday: 'short' })
                        : item.day;
                    
                    return (
                        <div key={index} className="bar-chart-item">
                            <div className="bar-chart-bar-container">
                                <div 
                                    className="bar-chart-bar"
                                    style={{ height: `${height}%` }}
                                    title={`${item.completed}/${item.total}`}
                                >
                                    <span className="bar-value">{item.completed}</span>
                                </div>
                            </div>
                            <div className="bar-chart-label">{dayLabel}</div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>{tr('Statistics') || 'Статистика'}</h1>
            </div>

            {/* Подсказка, если нет данных */}
            {!hasData && (
                <CardAnimation>
                    <div className="empty-stats-message">
                        <div className="empty-stats-icon">📊</div>
                        <h3>Нет данных для отображения</h3>
                        <p>Начните отмечать выполненные молитвы в календаре, чтобы видеть статистику здесь.</p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate('/calendar')}
                            style={{ marginTop: '16px' }}
                        >
                            📅 Перейти к календарю
                        </button>
                    </div>
                </CardAnimation>
            )}

            {/* Переключатель вида */}
            {hasData && <CardAnimation>
                <div className="stats-view-toggle">
                    <button
                        className={`btn ${viewMode === 'week' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setViewMode('week')}
                    >
                        Неделя
                    </button>
                    <button
                        className={`btn ${viewMode === 'month' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setViewMode('month')}
                    >
                        Месяц
                    </button>
                </div>
            </CardAnimation>}

            {/* Общая статистика */}
            {hasData && (
            <CardAnimation delay={50}>
                <div className="stats-summary-card">
                    <h3>{viewMode === 'week' ? 'Статистика за неделю' : 'Статистика за месяц'}</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-label">Выполнено</div>
                            <div className="stat-value stat-completed">
                                {viewMode === 'week' ? weekStats.completed : monthStats.completed}
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-label">Пропущено</div>
                            <div className="stat-value stat-missed">
                                {viewMode === 'week' ? weekStats.missed : monthStats.missed}
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-label">Процент</div>
                            <div className="stat-value stat-percentage">
                                {viewMode === 'week' ? weekStats.percentage : monthStats.percentage}%
                            </div>
                        </div>
                    </div>
                    <div className="stats-progress">
                        <div 
                            className="stats-progress-bar" 
                            style={{ 
                                width: `${viewMode === 'week' ? weekStats.percentage : monthStats.percentage}%` 
                            }}
                        ></div>
                    </div>
                </div>
            </CardAnimation>
            )}

            {/* График */}
            {hasData && (
            <CardAnimation delay={100}>
                <div className="chart-card">
                    <h3>График выполнения молитв</h3>
                    {renderBarChart(
                        viewMode === 'week' ? weekChartData : monthChartData,
                        prayers.length
                    )}
                </div>
            </CardAnimation>
            )}

            {/* Статистика по молитвам */}
            {hasData && (
            <CardAnimation delay={150}>
                <div className="prayer-stats-card">
                    <h3>Статистика по молитвам</h3>
                    <div className="prayer-stats-list">
                        {prayers.map(prayer => {
                            const stats = prayerStats[prayer];
                            return (
                                <div key={prayer} className="prayer-stat-item">
                                    <div className="prayer-stat-name">{prayerNames[prayer]}</div>
                                    <div className="prayer-stat-bar">
                                        <div 
                                            className="prayer-stat-bar-fill"
                                            style={{ width: `${stats.percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="prayer-stat-numbers">
                                        <span className="completed">{stats.completed}</span>
                                        <span className="separator">/</span>
                                        <span className="total">{stats.total}</span>
                                        <span className="percentage">({stats.percentage}%)</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardAnimation>
            )}

            {/* Навигация по датам */}
            {hasData && <CardAnimation delay={200}>
                <div className="stats-navigation">
                    <button 
                        className="btn btn-outline"
                        onClick={() => {
                            const newDate = new Date(currentDate);
                            if (viewMode === 'week') {
                                newDate.setDate(newDate.getDate() - 7);
                            } else {
                                newDate.setMonth(newDate.getMonth() - 1);
                            }
                            setCurrentDate(newDate);
                        }}
                    >
                        ◄ Предыдущий
                    </button>
                    <div className="stats-current-period">
                        {viewMode === 'week' 
                            ? `${weekStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} - ${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`
                            : currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
                        }
                    </div>
                    <button 
                        className="btn btn-outline"
                        onClick={() => {
                            const newDate = new Date(currentDate);
                            if (viewMode === 'week') {
                                newDate.setDate(newDate.getDate() + 7);
                            } else {
                                newDate.setMonth(newDate.getMonth() + 1);
                            }
                            setCurrentDate(newDate);
                        }}
                    >
                        Следующий ►
                    </button>
                </div>
            </CardAnimation>}
        </div>
    );
};

export default StatsPage;


