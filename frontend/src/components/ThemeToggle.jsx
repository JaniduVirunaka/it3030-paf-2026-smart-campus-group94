import { useEffect, useState } from 'react';

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check local storage or system preference on load
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
            setIsDark(true);
        }
    };

    return (
        <button 
            onClick={toggleTheme}
            className="fixed bottom-6 right-6 p-3 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform z-50 flex items-center justify-center"
            title="Toggle Dark Mode"
        >
            {isDark ? '☀️' : '🌙'}
        </button>
    );
};

export default ThemeToggle;