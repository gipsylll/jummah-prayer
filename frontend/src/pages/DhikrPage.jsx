import React, { useState, useEffect } from 'react';
import { dhikrData } from '../data/dhikrData';
import { tr } from '../utils/translations';
import CardAnimation from '../components/CardAnimation';

// Формат истории: { [index]: [{ date: "2024-12-14", count: 33, completed: true }] }
const getDhikrHistoryKey = () => 'dhikrHistory';

const DhikrPage = () => {
    const [dhikrCounts, setDhikrCounts] = useState(() => {
        const saved = localStorage.getItem('dhikrCounts');
        return saved ? JSON.parse(saved) : {};
    });
    const [dhikrHistory, setDhikrHistory] = useState(() => {
        const saved = localStorage.getItem(getDhikrHistoryKey());
        return saved ? JSON.parse(saved) : {};
    });
    const [selectedDhikr, setSelectedDhikr] = useState(null);
    const [currentCount, setCurrentCount] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showStats, setShowStats] = useState(false);

    useEffect(() => {
        localStorage.setItem('dhikrCounts', JSON.stringify(dhikrCounts));
    }, [dhikrCounts]);

    useEffect(() => {
        localStorage.setItem(getDhikrHistoryKey(), JSON.stringify(dhikrHistory));
    }, [dhikrHistory]);

    const handleDhikrClick = (index) => {
        const dhikr = dhikrData[index];
        setSelectedDhikr({ ...dhikr, index });
        setCurrentCount(dhikrCounts[index] || 0);
    };

    const getTodayKey = () => {
        return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    };

    const handleIncrement = () => {
        setIsAnimating(true);
        const newCount = currentCount + 1;
        setCurrentCount(newCount);
        
        const today = getTodayKey();
        const index = selectedDhikr.index;
        
        // Обновляем историю
        setDhikrHistory(prev => {
            const history = prev[index] || [];
            const todayEntry = history.find(e => e.date === today);
            
            if (todayEntry) {
                // Обновляем существующую запись за сегодня
                const updated = history.map(e => 
                    e.date === today ? { ...e, count: newCount, completed: newCount >= selectedDhikr.goal } : e
                );
                return { ...prev, [index]: updated };
            } else {
                // Создаем новую запись
                return {
                    ...prev,
                    [index]: [...history, { date: today, count: newCount, completed: newCount >= selectedDhikr.goal }]
                };
            }
        });
        
        setTimeout(() => setIsAnimating(false), 300);
        
        if (newCount >= selectedDhikr.goal) {
            setTimeout(() => {
                alert('Машаллах! Вы достигли цели!');
                setCurrentCount(0);
                setDhikrCounts(prev => ({ ...prev, [index]: 0 }));
            }, 300);
        } else {
            setDhikrCounts(prev => ({ ...prev, [index]: newCount }));
        }
    };

    const getDhikrStats = (index) => {
        const history = dhikrHistory[index] || [];
        const totalCompleted = history.filter(e => e.completed).length;
        const totalDays = history.length;
        const last30Days = history.filter(e => {
            const entryDate = new Date(e.date);
            const daysDiff = (new Date() - entryDate) / (1000 * 60 * 60 * 24);
            return daysDiff <= 30;
        });
        
        return {
            totalCompleted,
            totalDays,
            last30Days: last30Days.length,
            completionRate: totalDays > 0 ? Math.round((totalCompleted / totalDays) * 100) : 0
        };
    };

    const handleReset = () => {
        setCurrentCount(0);
        setDhikrCounts(prev => ({ ...prev, [selectedDhikr.index]: 0 }));
    };

    const closeDialog = () => {
        if (selectedDhikr !== null) {
            setDhikrCounts(prev => ({ ...prev, [selectedDhikr.index]: currentCount }));
        }
        setSelectedDhikr(null);
        setCurrentCount(0);
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>{tr('Dhikr and Duas')}</h1>
            </div>
            <div className="dhikr-list">
                {dhikrData.map((dhikr, index) => {
                    const count = dhikrCounts[index] || 0;
                    const progress = dhikr.goal > 0 ? Math.min((count / dhikr.goal) * 100, 100) : 0;

                    const stats = getDhikrStats(index);
                    
                    return (
                        <CardAnimation key={index} delay={index * 50}>
                            <div
                                className="dhikr-item"
                                onClick={() => handleDhikrClick(index)}
                            >
                            <div className="dhikr-item-content">
                                <div className="dhikr-item-header">
                                    <h3 className="dhikr-item-title">{dhikr.title}</h3>
                                    <div className="dhikr-item-count">{count} / {dhikr.goal}</div>
                                </div>
                                <div className="dhikr-item-arabic">{dhikr.arabic}</div>
                                <div className="dhikr-item-transliteration">{dhikr.transliteration}</div>
                                <div className="dhikr-item-translation">{dhikr.translation}</div>
                                {dhikr.goal > 1 && (
                                    <div className="dhikr-progress">
                                        <div className="dhikr-progress-bar" style={{ width: `${progress}%` }}></div>
                                    </div>
                                )}
                                {stats.totalDays > 0 && (
                                    <div className="dhikr-stats-mini">
                                        <span>✓ Выполнено: {stats.totalCompleted} раз</span>
                                        {stats.completionRate > 0 && (
                                            <span> ({stats.completionRate}%)</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        </CardAnimation>
                    );
                })}
            </div>

            {selectedDhikr && (
                <div className="modal active" onClick={closeDialog}>
                    <div className="modal-content dhikr-counter-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{selectedDhikr.title}</h2>
                        <div className="dhikr-arabic">{selectedDhikr.arabic}</div>
                        <div className="dhikr-transliteration">{selectedDhikr.transliteration}</div>
                        <div className="dhikr-translation">{selectedDhikr.translation}</div>
                        
                        <div className="dhikr-counter">
                            <div className={`counter-display dhikr-count ${isAnimating ? 'animate' : ''}`}>
                                {currentCount}
                            </div>
                            <div className="counter-goal">Цель: <span>{selectedDhikr.goal}</span></div>
                            <button className="btn btn-large btn-primary" onClick={handleIncrement}>
                                Нажать
                            </button>
                            <button className="btn btn-secondary" onClick={handleReset}>
                                🔄 Сбросить
                            </button>
                        </div>
                        
                        <div className="dhikr-instruction">
                            Нажимайте кнопку "Нажать" для подсчёта. Счётчик обнулится при достижении цели.
                        </div>

                        <div className="dhikr-stats-section">
                            <button 
                                className="btn btn-outline" 
                                onClick={() => setShowStats(!showStats)}
                                style={{ width: '100%', marginTop: '16px' }}
                            >
                                {showStats ? '▼' : '▶'} {tr('Statistics') || 'Статистика'}
                            </button>
                            
                            {showStats && selectedDhikr && (() => {
                                const stats = getDhikrStats(selectedDhikr.index);
                                const history = (dhikrHistory[selectedDhikr.index] || []).slice(-10).reverse();
                                
                                return (
                                    <div className="dhikr-stats-detail">
                                        <div className="stats-grid" style={{ marginTop: '16px' }}>
                                            <div className="stat-item">
                                                <div className="stat-label">Всего выполнено</div>
                                                <div className="stat-value stat-completed">{stats.totalCompleted}</div>
                                            </div>
                                            <div className="stat-item">
                                                <div className="stat-label">Активных дней</div>
                                                <div className="stat-value">{stats.totalDays}</div>
                                            </div>
                                            <div className="stat-item">
                                                <div className="stat-label">За последние 30 дней</div>
                                                <div className="stat-value">{stats.last30Days}</div>
                                            </div>
                                        </div>
                                        
                                        {history.length > 0 && (
                                            <div className="dhikr-history" style={{ marginTop: '16px' }}>
                                                <h4>Последние записи:</h4>
                                                <div className="dhikr-history-list">
                                                    {history.map((entry, idx) => (
                                                        <div key={idx} className="dhikr-history-item">
                                                            <span>{new Date(entry.date).toLocaleDateString('ru-RU')}</span>
                                                            <span>{entry.count} / {selectedDhikr.goal}</span>
                                                            {entry.completed && <span className="completed-badge">✓</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                        
                        <button className="btn btn-secondary" onClick={closeDialog}>
                            ✕ Закрыть
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DhikrPage;


