import React from 'react';
import { tr } from '../utils/translations';

const CountdownHeader = ({ countdown, city, onDateSelect }) => {
    return (
        <div className="header-gradient">
            <div className="countdown-container">
                <div className="countdown-label">{tr('Time Until')}</div>
                <div className="countdown-time">{countdown}</div>
            </div>
            <div className="location-info">
                <span className="location-icon">📍</span>
                <span id="current-city">{city || 'Загрузка...'}</span>
                {onDateSelect && (
                    <button className="calendar-btn" onClick={onDateSelect}>
                        <span>{tr('Select') || 'Выбрать'}</span>
                        <span>{tr('Date') || 'дату'}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default CountdownHeader;


