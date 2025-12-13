// Управление темой

// Инициализация темы
function initTheme() {
    if (appState.darkTheme) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    const darkThemeToggle = document.getElementById('dark-theme');
    if (darkThemeToggle) {
        darkThemeToggle.checked = appState.darkTheme;
        darkThemeToggle.addEventListener('change', (e) => {
            appState.darkTheme = e.target.checked;
            localStorage.setItem('darkTheme', e.target.checked);
            document.documentElement.setAttribute('data-theme', e.target.checked ? 'dark' : 'light');
        });
    }
}

