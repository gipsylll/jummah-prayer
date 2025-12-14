import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tr } from '../utils/translations';

const BottomNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/', icon: '🏠', label: 'Time' },
        { path: '/dhikr', icon: '📿', label: 'Dhikr' },
        { path: '/events', icon: '🌙', label: 'Islamic Events' },
        { path: '/articles', icon: '📚', label: 'Educational Articles' },
        { path: '/settings', icon: '⚙️', label: 'Settings' }
    ];

    return (
        <div className="bottom-nav">
            {navItems.map(item => (
                <button
                    key={item.path}
                    className={`nav-btn ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                    aria-label={tr(item.label)}
                    role="button"
                    tabIndex={0}
                >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{tr(item.label)}</span>
                </button>
            ))}
        </div>
    );
};

export default BottomNavigation;
