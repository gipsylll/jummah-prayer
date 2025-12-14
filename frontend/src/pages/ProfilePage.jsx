import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { tr } from '../utils/translations';

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user, token, updateUser, logout } = useAuth();
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserInfo = async () => {
            if (token) {
                const info = await authService.getUserInfo(token);
                setUserInfo(info);
            }
            setLoading(false);
        };
        loadUserInfo();
    }, [token]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (loading) {
        return <div className="page">Загрузка...</div>;
    }

    if (!user && !userInfo) {
        navigate('/login');
        return null;
    }

    const displayUser = userInfo || user;

    return (
        <div className="page">
            <div className="page-header">
                <button className="btn-back" onClick={() => navigate('/settings')}>←</button>
                <h1>{tr('Profile')}</h1>
            </div>
            <div className="profile-container">
                <div className="profile-card">
                    <div className="profile-avatar">👤</div>
                    <h2>{displayUser?.name || '---'}</h2>
                    <p style={{ color: 'var(--textColorSecondary)' }}>{displayUser?.email || '---'}</p>
                </div>
                
                <div className="profile-section">
                    <h3>Информация об аккаунте</h3>
                    <div className="info-item">
                        <span>Дата регистрации:</span>
                        <span>{displayUser?.createdAt ? new Date(displayUser.createdAt).toLocaleDateString('ru-RU') : '---'}</span>
                    </div>
                    <div className="info-item">
                        <span>Последний вход:</span>
                        <span>{displayUser?.lastLogin ? new Date(displayUser.lastLogin).toLocaleDateString('ru-RU') : '---'}</span>
                    </div>
                </div>

                <div className="profile-section">
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleLogout}>
                        {tr('Logout')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
