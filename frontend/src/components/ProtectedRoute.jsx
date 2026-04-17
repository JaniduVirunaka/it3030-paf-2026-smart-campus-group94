import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { fetchFromAPI } from '../services/api';

const ProtectedRoute = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFromAPI('/auth/user')
            .then(data => setUser(data?.authenticated ? data : null))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return user ? <Outlet context={{ user }} /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
