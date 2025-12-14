import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ lines = 2, className = '' }) => {
    return (
        <div className={`skeleton-container ${className}`}>
            {Array.from({ length: lines }).map((_, index) => (
                <div key={index} className="skeleton-line"></div>
            ))}
        </div>
    );
};

export default SkeletonLoader;
