import { useState, useEffect, useCallback } from 'react';
import { fetchFromAPI } from '../services/api';
import { createBooking, getAllBookings, getUserBookings, updateBookingStatus } from '../services/bookingApi';

const BOOKING_STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
};

/* ─── Status badge colours ─── */
const STATUS_STYLES = {
    PENDING:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    APPROVED:  'bg-green-100  text-green-800  dark:bg-green-900/40  dark:text-green-300',
    REJECTED:  'bg-red-100    text-red-800    dark:bg-red-900/40    dark:text-red-300',
    CANCELLED: 'bg-slate-100  text-slate-600  dark:bg-slate-700     dark:text-slate-300',
};

const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}>
        {status}
    </span>
);

/* ─── Booking card (user view) ─── */
const BookingCard = ({ booking, onCancel, isAdmin, onApprove, onReject }) => {
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        onReject(booking.id, rejectionReason);
        setShowRejectForm(false);
        setRejectionReason('');
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            {/* Card header */}
            <div className="flex items-start justify-between p-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-1 font-mono">#{booking.id?.slice(-8)}</p>
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">{booking.purpose}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Resource ID: <span className="font-mono text-xs">{booking.resourceId}</span></p>
                </div>
                <StatusBadge status={booking.status} />
            </div>

            {/* Card body */}
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wide font-medium">Date</p>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{booking.date}</p>
                </div>
                <div>
                    <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wide font-medium">Time</p>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{booking.startTime} – {booking.endTime}</p>
                </div>
                <div>
                    <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wide font-medium">Attendees</p>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{booking.expectedAttendees}</p>
                </div>
                <div>
                    <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wide font-medium">Reg No</p>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{booking.studentRegNumber}</p>
                </div>
                <div>
                    <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wide font-medium">Phone</p>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{booking.studentPhone}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wide font-medium">Email</p>
                    <p className="text-slate-800 dark:text-slate-200 font-medium truncate" title={booking.studentEmail}>{booking.studentEmail}</p>
                </div>
                {booking.rejectionReason && (
                    <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-700 mt-1">
                        <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wide font-medium">Rejection Reason</p>
                        <p className="text-red-600 dark:text-red-400 text-sm">{booking.rejectionReason}</p>
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="px-4 pb-4 flex flex-wrap gap-2">
                {isAdmin && booking.status === BOOKING_STATUS.PENDING && (
                    <>
                        <button
                            onClick={() => onApprove(booking.id)}
                            aria-label={`Approve booking for ${booking.resourceName ?? booking.resourceId}`}
                            className="flex-1 py-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                        >
                            ✓ Approve
                        </button>
                        <button
                            onClick={() => setShowRejectForm(v => !v)}
                            aria-label={`Reject booking for ${booking.resourceName ?? booking.resourceId}`}
                            className="flex-1 py-1.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                        >
                            ✕ Reject
                        </button>
                    </>
                )}
                {!isAdmin && (booking.status === BOOKING_STATUS.APPROVED || booking.status === BOOKING_STATUS.PENDING) && (
                    <button
                        onClick={() => onCancel(booking.id)}
                        aria-label={`Cancel booking for ${booking.resourceName ?? booking.resourceId}`}
                        className="flex-1 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    >
                        Cancel Booking
                    </button>
                )}
            </div>

            {/* Inline rejection form */}
            {showRejectForm && (
                <form onSubmit={handleRejectSubmit} className="mx-4 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">Rejection reason *</label>
                    <textarea
                        required
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        rows={2}
                        className="w-full text-sm rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                        placeholder="Provide a clear reason..."
                    />
                    <div className="flex gap-2 mt-2">
                        <button type="submit" className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Confirm Reject</button>
                        <button type="button" onClick={() => setShowRejectForm(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                    </div>
                </form>
            )}
        </div>
    );
};

/* ─── New Booking Modal ─── */
const NewBookingModal = ({ resources, currentUser, onClose, onCreated }) => {
    const [form, setForm] = useState({
        resourceId: '',
        date: '',
        startTime: '',
        endTime: '',
        purpose: '',
        expectedAttendees: 1,
        studentRegNumber: '',
        studentPhone: '',
        studentEmail: '',
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.resourceId) { setError('Please select a resource.'); return; }
        if (form.startTime >= form.endTime) { setError('End time must be after start time.'); return; }
        if (parseInt(form.expectedAttendees, 10) < 1) { setError('Expected attendees must be at least 1.'); return; }
        
        const today = new Date().toISOString().split('T')[0];
        if (form.date < today) { setError('Booking date cannot be in the past.'); return; }

        if (!/^\d{10}$/.test(form.studentPhone)) { setError('Phone number must be exactly 10 digits.'); return; }

        setError('');
        setSubmitting(true);
        try {
            const payload = {
                ...form,
                userId: currentUser?.email ?? currentUser?.name ?? 'unknown',
                expectedAttendees: parseInt(form.expectedAttendees, 10),
            };
            await createBooking(payload);
            onCreated();
        } catch (err) {
            const message = err?.data?.message ?? err?.message ?? 'Could not create booking.';
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div role="dialog" aria-modal="true" aria-labelledby="booking-modal-title" className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 id="booking-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">📅 New Booking Request</h2>
                    <button onClick={onClose} aria-label="Close booking modal" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold leading-none">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-300">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Resource */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resource *</label>
                        <select name="resourceId" required value={form.resourceId} onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Select a resource…</option>
                            {resources.map(r => (
                                <option key={r.id} value={r.id}>{r.name} ({r.type}) – {r.location}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                        <input type="date" name="date" required value={form.date} onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    {/* Time range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time *</label>
                            <input type="time" name="startTime" required value={form.startTime} onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Time *</label>
                            <input type="time" name="endTime" required value={form.endTime} onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>

                    {/* Purpose */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Purpose *</label>
                        <textarea name="purpose" required value={form.purpose} onChange={handleChange} rows={2}
                            placeholder="e.g., Team meeting, Lecture, Lab session…"
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    {/* Student Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student Reg No *</label>
                            <input type="text" name="studentRegNumber" required value={form.studentRegNumber} onChange={handleChange}
                                placeholder="e.g., IT12345678"
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
                            <input type="tel" name="studentPhone" required value={form.studentPhone} onChange={handleChange}
                                placeholder="e.g., 0712345678" pattern="\d{10}" title="10 digit phone number"
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student Email *</label>
                            <input type="email" name="studentEmail" required value={form.studentEmail} onChange={handleChange}
                                placeholder="e.g., it12345678@my.sliit.lk"
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>

                    {/* Expected attendees */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expected Attendees *</label>
                        <input type="number" name="expectedAttendees" min={1} required value={form.expectedAttendees} onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={submitting}
                            className="flex-1 py-2.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors">
                            {submitting ? 'Submitting…' : 'Submit Booking'}
                        </button>
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─── Main BookingsPage ─── */
export default function BookingsPage() {
    const [user, setUser]           = useState(null);
    const [bookings, setBookings]   = useState([]);
    const [resources, setResources] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [toast, setToast]         = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('ALL');

    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    const showToast = (message, type = 'success') => setToast({ type, message });

    /* Auto-dismiss toast */
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(t);
    }, [toast]);

    /* Load current user */
    useEffect(() => {
        fetchFromAPI('/auth/user')
            .then(data => setUser(data?.authenticated ? data : null))
            .catch(() => setUser(null));
    }, []);

    /* Load resources (for the booking form dropdown) */
    useEffect(() => {
        const fallbackResources = [
            { id: 'lecture-hall-1', name: 'Main Lecture Hall', type: 'Lecture Hall', location: 'Block A' },
            { id: 'laboratory-1', name: 'Computer Laboratory', type: 'Laboratory', location: 'Block B' },
            { id: 'equipment-1', name: '4K Projector', type: 'Equipment', location: 'IT Store' },
            { id: 'meeting-room-1', name: 'Conference Meeting Room', type: 'Meeting Room', location: 'Admin Block' }
        ];

        fetchFromAPI('/resources?status=ACTIVE&size=200')
            .then(data => {
                if (data?.content && data.content.length > 0) {
                    setResources(data.content);
                } else {
                    setResources(fallbackResources);
                }
            })
            .catch(() => setResources(fallbackResources));
    }, []);

    /* Load bookings */
    const loadBookings = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            if (isAdmin) {
                // Fetch ALL bookings so counts work properly
                const data = await getAllBookings({ status: 'ALL', size: 1000 });
                setBookings(data?.content ?? []);
            } else {
                const userId = user.email ?? user.name;
                const data = await getUserBookings(userId);
                setBookings(data ?? []);
            }
        } catch {
            setToast({ type: 'error', message: 'Failed to load bookings.' });
        } finally {
            setLoading(false);
        }
    }, [user, isAdmin]);

    useEffect(() => { loadBookings(); }, [loadBookings]);

    /* Handlers */
    const handleApprove = async (id) => {
        try {
            await updateBookingStatus(id, BOOKING_STATUS.APPROVED);
            setToast({ type: 'success', message: 'Booking approved.' });
            loadBookings();
        } catch (err) {
            showToast(err?.message ?? 'Action failed. Please try again.', 'error');
        }
    };

    const handleReject = async (id, reason) => {
        try {
            await updateBookingStatus(id, BOOKING_STATUS.REJECTED, reason);
            setToast({ type: 'info', message: 'Booking rejected.' });
            loadBookings();
        } catch (err) {
            showToast(err?.message ?? 'Action failed. Please try again.', 'error');
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await updateBookingStatus(id, BOOKING_STATUS.CANCELLED);
            setToast({ type: 'success', message: 'Booking cancelled.' });
            loadBookings();
        } catch {
            setToast({ type: 'error', message: 'Failed to cancel booking.' });
        }
    };

    const pendingCount = bookings.filter(b => b.status === BOOKING_STATUS.PENDING).length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Toast notification */}
            {toast && (
                <div className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all animate-fade-in-down
                    ${toast.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300'
                        : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300'}`}>
                    <span>{toast.type === 'success' ? '✅' : '❌'}</span>
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <NewBookingModal
                    resources={resources}
                    currentUser={user}
                    onClose={() => setShowModal(false)}
                    onCreated={() => { setShowModal(false); setToast({ type: 'success', message: 'Booking request submitted!' }); loadBookings(); }}
                />
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {isAdmin ? '📋 All Bookings' : '📅 My Bookings'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                            {isAdmin
                                ? 'Review, approve, or reject booking requests from all users.'
                                : 'Manage your facility and resource booking requests.'}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all"
                    >
                        <span className="text-base">+</span> New Booking
                    </button>
                </div>

                {/* Stats strip (admin) */}
                {isAdmin && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        {['ALL', BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED, BOOKING_STATUS.REJECTED].map(s => {
                            const count = s === 'ALL' ? bookings.length : bookings.filter(b => b.status === s).length;
                            return (
                                <button key={s} onClick={() => setFilterStatus(s)}
                                    aria-pressed={filterStatus === s}
                                    className={`p-4 rounded-xl border text-left transition-all ${filterStatus === s
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300'}`}>
                                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{count}</p>
                                    <p className={`text-xs font-semibold uppercase tracking-wide mt-0.5
                                        ${s === BOOKING_STATUS.PENDING ? 'text-yellow-600 dark:text-yellow-400'
                                        : s === BOOKING_STATUS.APPROVED ? 'text-green-600 dark:text-green-400'
                                        : s === BOOKING_STATUS.REJECTED ? 'text-red-600 dark:text-red-400'
                                        : 'text-slate-500 dark:text-slate-400'}`}>
                                        {s === 'ALL' ? 'Total' : s}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Filter bar (user view) */}
                {!isAdmin && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {['ALL', BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED, BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED].map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)}
                                aria-pressed={filterStatus === s}
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all
                                    ${filterStatus === s
                                        ? 'bg-blue-600 text-white border-blue-600 shadow'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                                {s === 'ALL' ? 'All' : s}
                            </button>
                        ))}
                    </div>
                )}

                {/* Admin pending alert */}
                {isAdmin && pendingCount > 0 && filterStatus !== BOOKING_STATUS.PENDING && (
                    <div className="mb-6 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-center gap-3">
                        <span className="text-yellow-500 text-xl">⚠️</span>
                        <div>
                            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                                {pendingCount} booking{pendingCount > 1 ? 's' : ''} awaiting your review.
                            </p>
                            <button onClick={() => setFilterStatus(BOOKING_STATUS.PENDING)} className="text-xs text-yellow-700 dark:text-yellow-400 underline mt-0.5">
                                Show pending →
                            </button>
                        </div>
                    </div>
                )}

                {/* Bookings grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-10 h-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                        <p className="text-slate-400 text-sm">Loading bookings…</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-24">
                        <p className="text-5xl mb-4">📭</p>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No bookings found</h3>
                        <p className="text-slate-400 text-sm mt-1">
                            Start by clicking "New Booking".
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {bookings
                            .filter(booking => filterStatus === 'ALL' || booking.status === filterStatus)
                            .map(booking => (
                                <BookingCard
                                    key={booking.id}
                                    booking={booking}
                                    isAdmin={isAdmin}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                    onCancel={handleCancel}
                                />
                        ))}
                        {bookings.filter(booking => filterStatus === 'ALL' || booking.status === filterStatus).length === 0 && (
                            <div className="col-span-full text-center py-12 text-slate-500">
                                No {filterStatus.toLowerCase()} bookings found.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
