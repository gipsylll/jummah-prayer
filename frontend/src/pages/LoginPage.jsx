import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tr } from '../utils/translations';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        const result = await login(email, password);
        
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
                <h1>{tr('Login')}</h1>
            </div>
            <div className="auth-container">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="login-email">Email</label>
                        <input
                            type="email"
                            id="login-email"
                            className="input-text"
                            required
                            placeholder="email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="login-password">Пароль</label>
                        <input
                            type="password"
                            id="login-password"
                            className="input-text"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Загрузка...' : tr('Login')}
                    </button>
                    <p style={{ textAlign: 'center', marginTop: '16px' }}>
                        Нет аккаунта? <Link to="/register" style={{ color: 'var(--primary-color)' }}>Зарегистрироваться</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;


