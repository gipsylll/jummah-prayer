import React, { useState, useEffect, useRef } from 'react';
import { citySearchService } from '../services/citySearchService';

const CitySearchModal = ({ isOpen, onClose, onSelectCity }) => {
    const [query, setQuery] = useState('');
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setCities([]);
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!query || query.length < 2) {
            setCities([]);
            setError('');
            return;
        }

        setLoading(true);
        setError('');

        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const results = await citySearchService.searchCities(query);
                setCities(results);
                setError('');
            } catch (err) {
                setError(`Ошибка при поиске городов: ${err.message}`);
                setCities([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [query]);

    const handleCityClick = (city) => {
        onSelectCity(city);
        onClose();
    };

    const handleSearch = () => {
        if (query && query.length >= 2) {
            setLoading(true);
            citySearchService.searchCities(query)
                .then(results => {
                    setCities(results);
                    setError('');
                })
                .catch(err => {
                    setError(`Ошибка при поиске городов: ${err.message}`);
                    setCities([]);
                })
                .finally(() => setLoading(false));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal active" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Выбор города</h2>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input
                        type="text"
                        className="input-text"
                        placeholder="Поиск города..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch();
                            }
                        }}
                        style={{ flex: 1 }}
                        autoFocus
                    />
                    <button className="btn btn-primary" onClick={handleSearch}>
                        🔍 Поиск
                    </button>
                </div>
                
                <div className="city-results">
                    {loading && <div className="city-result-item">Поиск...</div>}
                    {error && <div className="city-result-item" style={{ color: 'var(--errorColor)' }}>{error}</div>}
                    {!loading && !error && cities.length === 0 && query.length >= 2 && (
                        <div className="city-result-item">Города не найдены. Попробуйте другой запрос.</div>
                    )}
                    {!loading && !error && query.length < 2 && (
                        <div className="city-result-item">Введите хотя бы 2 символа для поиска</div>
                    )}
                    {cities.map((city, index) => (
                        <div
                            key={index}
                            className="city-result-item"
                            onClick={() => handleCityClick(city)}
                        >
                            <strong>{city.name}</strong>
                            {city.region && city.region !== city.name && `, ${city.region}`}
                            {city.country && `, ${city.country}`}
                        </div>
                    ))}
                </div>
                
                <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '16px' }}>
                    Отмена
                </button>
            </div>
        </div>
    );
};

export default CitySearchModal;


