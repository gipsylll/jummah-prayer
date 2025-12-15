import React from 'react';
import { tr } from '../utils/translations';

const PrayerTimeCard = ({ prayer, time, isCurrent, isNext }) => {
    let classes = 'prayer-time-item';
    if (isCurrent) classes += ' current';
    if (isNext) classes += ' next';

    return (
        <div className={classes}>
            <div className="prayer-time-header">
                <div className="prayer-time-name">
                    <span>{prayer.icon}</span>
                    <span>{tr(prayer.name)}</span>
                </div>
                <div className="prayer-time-value">{time || '00:00'}</div>
            </div>
            {isCurrent && (
                <div className="prayer-time-progress">
                    <div className="prayer-time-progress-bar" style={{ width: '50%' }}></div>
                </div>
            )}
        </div>
    );
};

export default PrayerTimeCard;


