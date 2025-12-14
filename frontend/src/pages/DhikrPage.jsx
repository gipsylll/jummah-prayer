import React, { useState, useEffect } from 'react';
import { dhikrData } from '../data/dhikrData';
import { tr } from '../utils/translations';
import CardAnimation from '../components/CardAnimation';

const DhikrPage = () => {
    const [dhikrCounts, setDhikrCounts] = useState(() => {
        const saved = localStorage.getItem('dhikrCounts');
        return saved ? JSON.parse(saved) : {};
    });
    const [selectedDhikr, setSelectedDhikr] = useState(null);
    const [currentCount, setCurrentCount] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        localStorage.setItem('dhikrCounts', JSON.stringify(dhikrCounts));
    }, [dhikrCounts]);

    const handleDhikrClick = (index) => {
        const dhikr = dhikrData[index];
        setSelectedDhikr({ ...dhikr, index });
        setCurrentCount(dhikrCounts[index] || 0);
    };

    const handleIncrement = () => {
        setIsAnimating(true);
        const newCount = currentCount + 1;
        setCurrentCount(newCount);
        
        setTimeout(() => setIsAnimating(false), 300);
        
        if (newCount >= selectedDhikr.goal) {
            setTimeout(() => {
                alert('Машаллах! Вы достигли цели!');
                setCurrentCount(0);
                setDhikrCounts(prev => ({ ...prev, [selectedDhikr.index]: 0 }));
            }, 300);
        } else {
            setDhikrCounts(prev => ({ ...prev, [selectedDhikr.index]: newCount }));
        }
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
