import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tr } from '../utils/translations';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }
        
        setLoading(true);
        const result = await register(email, password, name);
        
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
        
        setLoading(false);
    };

    return (
        <div className="page">
            <div className="page-header">
                <button className="btn-back" onClick={() => navigate('/settings')}>←</button>
                <h1>Регистрация</h1>
            </div>
            <div className="auth-container">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="register-name">Имя</label>
                        <input
                            type="text"
                            id="register-name"
                            className="input-text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="register-email">Email</label>
                        <input
                            type="email"
                            id="register-email"
                            className="input-text"
                            required
                            placeholder="email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="register-password">Пароль</label>
                        <input
                            type="password"
                            id="register-password"
                            className="input-text"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="register-confirm-password">Подтвердите пароль</label>
                        <input
                            type="password"
                            id="register-confirm-password"
                            className="input-text"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Загрузка...' : 'Зарегистрироваться'}
                    </button>
                    <p style={{ textAlign: 'center', marginTop: '16px' }}>
                        Уже есть аккаунт? <Link to="/login" style={{ color: 'var(--primary-color)' }}>Войти</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
