import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchFromAPI } from '../services/api';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Apply saved theme on standalone page (no Navbar present)
    useEffect(() => {
        const dark = localStorage.theme === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', dark);
    }, []);

    const handleStandardAuth = async (e, action) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        if (!email || !password) {
            setError('Please enter both email and password.');
            setLoading(false);
            return;
        }

        try {
            const endpoint = action === 'login' ? '/auth/login' : '/auth/register';
            const response = await fetchFromAPI(endpoint, {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (response && response.success) {
                if (action === 'login') {
                    navigate('/dashboard');
                } else {
                    setMessage('Registration successful! You can now log in.');
                    setPassword('');
                }
            } else {
                setError(response?.message || 'Authentication failed.');
            }
        } catch (err) {
            setError('Could not connect to the server. Is Spring Boot running?');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = '/oauth2/authorization/google';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 transition-colors duration-300 font-sans">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 text-center transition-colors duration-300">

                <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6">
                    ← Back to Home
                </Link>

                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Smart Campus Hub</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Sign in to access the platform</p>

                {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-bold border border-red-200 dark:border-red-800/50">{error}</div>}
                {message && <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold border border-emerald-200 dark:border-emerald-800/50">{message}</div>}

                <form className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                        required
                    />

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            onClick={(e) => handleStandardAuth(e, 'login')}
                            disabled={loading}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-xl transition-colors disabled:opacity-70"
                        >
                            {loading ? '...' : 'Login'}
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleStandardAuth(e, 'register')}
                            disabled={loading}
                            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors disabled:opacity-70"
                        >
                            Register
                        </button>
                    </div>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white dark:bg-slate-800 text-slate-400 font-medium">OR</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-bold shadow-sm"
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google Logo" className="w-5 h-5" />
                    Continue with Google
                </button>
            </div>
        </div>
    );
};

export default LoginPage;
