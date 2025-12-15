import { useEffect } from 'react';

export const useAccessibility = () => {
    useEffect(() => {
        // Добавляем aria-live регион для screen readers
        let liveRegion = document.getElementById('aria-live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'aria-live-region';
            liveRegion.className = 'sr-only';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            document.body.appendChild(liveRegion);
        }

        // Добавляем ARIA атрибуты к навигационным кнопкам
        const updateNavButtons = () => {
            const navButtons = document.querySelectorAll('.nav-btn');
            navButtons.forEach(btn => {
                if (!btn.getAttribute('aria-label')) {
                    const label = btn.querySelector('.nav-label')?.textContent || 'Навигация';
                    btn.setAttribute('aria-label', label);
                    btn.setAttribute('role', 'button');
                    btn.setAttribute('tabindex', '0');
                }
            });
        };

        // Обновляем при изменении DOM
        const observer = new MutationObserver(updateNavButtons);
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Первоначальное обновление
        updateNavButtons();

        return () => {
            observer.disconnect();
        };
    }, []);
};


