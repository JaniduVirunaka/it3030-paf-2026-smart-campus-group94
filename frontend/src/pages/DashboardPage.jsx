import { useOutletContext, useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const { user } = useOutletContext();
    const navigate = useNavigate();
    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300 font-sans">
            <div className="max-w-6xl mx-auto">
                
                {/* Hero Section */}
                <div className="bg-blue-600 dark:bg-blue-700 text-white p-8 md:p-10 rounded-2xl shadow-lg mb-10 transition-colors duration-300">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Welcome back, {user?.name || 'User'}! 👋</h1>
                    <p className="text-blue-100 text-lg mb-4">Smart Campus Operations Hub</p>
                    {isAdmin && (
                        <span className="inline-block bg-amber-400 text-amber-900 px-3 py-1 rounded-md font-bold text-xs tracking-wider uppercase">
                            Administrator
                        </span>
                    )}
                </div>

                {/* Quick Actions Grid */}
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Quick Actions</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Module A */}
                    <div
                        onClick={() => navigate('/facilities')}
                        className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer flex flex-col items-center"
                    >
                        <div className="text-5xl mb-4">🏢</div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Facilities Catalogue</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-grow">Browse and manage campus lecture halls, labs, and equipment.</p>
                        <button className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${isAdmin ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500'}`}>
                            {isAdmin ? 'Manage Resources' : 'View Catalogue'}
                        </button>
                    </div>

                    {/* Module B */}
                    <div 
                        onClick={() => navigate('/bookings')} 
                        className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer flex flex-col items-center"
                    >
                        <div className="text-5xl mb-4">📅</div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">My Bookings</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-grow">Request a new room booking or check the status of your requests.</p>
                        <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 text-white rounded-xl font-bold transition-colors">
                            Manage Bookings
                        </button>
                    </div>

                    {/* Module C */}
                    <div 
                        onClick={() => navigate('/tickets')} 
                        className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer flex flex-col items-center"
                    >
                        <div className="text-5xl mb-4">🛠️</div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Incident Reports</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-grow">Report a broken projector, AC issue, or facility maintenance request.</p>
                        <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 text-white rounded-xl font-bold transition-colors">
                            Submit Ticket
                        </button>
                    </div>

                </div>


            </div>
        </div>
    );
};

export default DashboardPage;