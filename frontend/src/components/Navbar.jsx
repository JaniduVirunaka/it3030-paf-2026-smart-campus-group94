import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchFromAPI } from '../services/api';

const Navbar = () => {
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const dark = localStorage.theme === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', dark);
        setIsDark(dark);
    }, []);

    const toggleTheme = () => {
        const next = !isDark;
        document.documentElement.classList.toggle('dark', next);
        localStorage.theme = next ? 'dark' : 'light';
        setIsDark(next);
    };

    useEffect(() => {
        fetchFromAPI('/auth/user')
            .then(data => setUser(data?.authenticated ? data : null))
            .catch(() => setUser(null));
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/logout', { method: 'POST', credentials: 'include' });
        } catch (_) {}
        setUser(null);
        navigate('/login');
    };

    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    return (
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-2 font-extrabold text-lg text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <span className="text-2xl">🏫</span>
                        <span className="hidden sm:block">Smart Campus Hub</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {user ? (
                            <>
                                <Link to="/dashboard" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    Dashboard
                                </Link>
                                <Link to="/facilities" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    Facilities
                                </Link>
                            </>
                        ) : null}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        {/* Desktop: user info + auth button */}
                        <div className="hidden md:flex items-center gap-2">
                            {user ? (
                                <>
                                    {isAdmin && (
                                        <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-md uppercase tracking-wide">
                                            Admin
                                        </span>
                                    )}
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                                        {user.name || user.email}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="px-3 py-1.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <Link
                                    to="/login"
                                    className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>

                        {/* Theme toggle — compact, always visible */}
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 rounded-lg text-base text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Toggle theme"
                            aria-label="Toggle theme"
                        >
                            {isDark ? '☀️' : '🌙'}
                        </button>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMenuOpen(o => !o)}
                            className="md:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            aria-label="Toggle menu"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {menuOpen
                                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                }
                            </svg>
                        </button>
                    </div>


                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
                    {user ? (
                        <>
                            <div className="flex items-center gap-2 px-3 py-2 mb-2">
                                {isAdmin && (
                                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold rounded uppercase">Admin</span>
                                )}
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{user.name || user.email}</span>
                            </div>
                            <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                Dashboard
                            </Link>
                            <Link to="/facilities" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                Facilities
                            </Link>
                            <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            Sign In
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
