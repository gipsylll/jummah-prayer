import React, { useState } from 'react';
import { articlesData } from '../data/articlesData';
import { tr } from '../utils/translations';
import CardAnimation from '../components/CardAnimation';

const ArticlesPage = () => {
    const [selectedArticle, setSelectedArticle] = useState(null);

    const handleArticleClick = (article) => {
        setSelectedArticle(article);
    };

    const closeArticle = () => {
        setSelectedArticle(null);
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>{tr('Educational Articles')}</h1>
            </div>
            <div className="articles-container">
                <div className="articles-list">
                    {articlesData.map((article, index) => (
                        <CardAnimation key={article.id} delay={index * 50}>
                            <div
                                className="article-item"
                                onClick={() => handleArticleClick(article)}
                            >
                                <div className="article-icon">{article.icon}</div>
                                <div className="article-title">{article.title}</div>
                                <div className="article-arrow">→</div>
                            </div>
                        </CardAnimation>
                    ))}
                </div>
            </div>

            {selectedArticle && (
                <div className="modal active" onClick={closeArticle}>
                    <div className="modal-content article-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="btn btn-secondary"
                            style={{ position: 'absolute', top: '16px', right: '16px' }}
                            onClick={closeArticle}
                        >
                            ✕
                        </button>
                        <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArticlesPage;
