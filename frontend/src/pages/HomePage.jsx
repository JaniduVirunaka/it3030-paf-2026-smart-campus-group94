import { Link } from 'react-router-dom';

const features = [
    {
        icon: '🏢',
        title: 'Facilities Catalogue',
        description: 'Browse and manage lecture halls, labs, meeting rooms, and equipment across campus.',
        color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    },
    {
        icon: '📅',
        title: 'Room Bookings',
        description: 'Request and track room bookings with a clear approval workflow — pending, approved, or rejected.',
        color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    },
    {
        icon: '🛠️',
        title: 'Incident Tickets',
        description: 'Report facility faults and maintenance issues. Track resolution progress in real time.',
        color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    },
    {
        icon: '🔐',
        title: 'Secure Access',
        description: 'Role-based access control with Google OAuth. Admins manage resources; users browse and book.',
        color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    },
];

const HomePage = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 font-sans">

            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-800 dark:via-blue-900 dark:to-indigo-950 text-white">
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                <div className="relative max-w-5xl mx-auto px-6 py-24 sm:py-32 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-8">
                        <span>🎓</span> SLIIT · IT3030 PAF Assignment 2026
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                        Smart Campus<br />
                        <span className="text-blue-200">Operations Hub</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
                        A unified platform to manage campus facilities, bookings, and maintenance — built for students, staff, and administrators.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/login"
                            className="px-8 py-3.5 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg text-base"
                        >
                            Sign In to Get Started
                        </Link>
                        <Link
                            to="/facilities"
                            className="px-8 py-3.5 bg-white/10 border border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-colors text-base"
                        >
                            View Facilities Catalogue
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="max-w-5xl mx-auto px-6 py-20">
                <div className="text-center mb-14">
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">Everything in one place</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl mx-auto">
                        Manage campus operations with a clear, role-based workflow from a single web platform.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {features.map((f) => (
                        <div key={f.title} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl mb-4 ${f.color}`}>
                                {f.icon}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Banner */}
            <section className="bg-slate-100 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Ready to get started?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sign in with your Google account to access the platform.</p>
                    </div>
                    <Link
                        to="/login"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm whitespace-nowrap"
                    >
                        Sign In Now
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-400 dark:text-slate-500">
                    <span>🏫 Smart Campus Operations Hub</span>
                    <span>IT3030 · Programming Applications & Frameworks · SLIIT 2026</span>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
