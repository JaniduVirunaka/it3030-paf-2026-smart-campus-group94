import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getTickets, updateTicket, deleteTicket } from '../services/api';
import TicketComments from '../components/TicketComments';

const TicketsListPage = () => {
    const { user } = useOutletContext();
    const navigate = useNavigate();
    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    // For editing status/resolution (Technician view)
    const [editingTicket, setEditingTicket] = useState(null);
    const [editData, setEditData] = useState({
        status: '',
        resolutionNotes: '',
        adminReason: ''
    });

    const loadTickets = async () => {
        try {
            const data = await getTickets();
            setTickets(data || []);
        } catch (err) {
            setError('Failed to load tickets.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTickets();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this ticket?")) return;
        try {
            await deleteTicket(id);
            setTickets(tickets.filter(t => t.id !== id));
        } catch (err) {
            setError('Failed to delete ticket.');
        }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            await updateTicket(editingTicket.id, editData);
            setTickets(tickets.map(t => t.id === editingTicket.id ? { ...t, ...editData } : t));
            setEditingTicket(null);
        } catch (err) {
            setError('Failed to update ticket status.');
        }
    };

    const filteredTickets = tickets.filter(t => 
        filterStatus === 'ALL' ? true : t.status === filterStatus
    );

    const getStatusColor = (status) => {
        switch(status) {
            case 'OPEN': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400';
            case 'IN_PROGRESS': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400';
            case 'RESOLVED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400';
            case 'CLOSED': return 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-400';
            case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-b-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Incident Tickets 🎫</h1>
                        <p className="text-slate-500 dark:text-slate-400">Track and manage campus maintenance requests.</p>
                    </div>
                    <div className="flex gap-4">
                        <select 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                        <button 
                            onClick={() => navigate('/tickets/new')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        >
                            + New Ticket
                        </button>
                    </div>
                </div>

                {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-xl font-bold">{error}</div>}

                <div className="grid grid-cols-1 gap-6">
                    {filteredTickets.map(ticket => (
                        <div key={ticket.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-3 flex-grow">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${getStatusColor(ticket.status)}`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300`}>
                                            {ticket.priority}
                                        </span>
                                        <span className="text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{ticket.category} - {ticket.resourceName}</h3>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{ticket.description}</p>
                                    
                                    {ticket.attachments && ticket.attachments.length > 0 && (
                                        <div className="flex gap-2 py-2">
                                            {ticket.attachments.map((img, idx) => (
                                                <img key={idx} src={img} className="h-12 w-12 object-cover rounded-md border border-slate-200 dark:border-slate-600" />
                                            ))}
                                        </div>
                                    )}

                                    {ticket.resolutionNotes && (
                                        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl">
                                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase mb-1">Resolution Notes</p>
                                            <p className="text-sm text-emerald-700 dark:text-emerald-300">{ticket.resolutionNotes}</p>
                                        </div>
                                    )}

                                    {ticket.adminReason && (
                                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
                                            <p className="text-xs font-bold text-red-800 dark:text-red-400 uppercase mb-1">Rejection Reason</p>
                                            <p className="text-sm text-red-700 dark:text-red-300">{ticket.adminReason}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 min-w-[150px]">
                                    {isAdmin && (
                                        <button 
                                            onClick={() => {
                                                setEditingTicket(ticket);
                                                setEditData({ 
                                                    status: ticket.status, 
                                                    resolutionNotes: ticket.resolutionNotes || '', 
                                                    adminReason: ticket.adminReason || '',
                                                    technicianId: ticket.technicianId || ''
                                                });
                                            }}
                                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors"
                                        >
                                            Process Ticket
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleDelete(ticket.id)}
                                        className="w-full py-2 bg-slate-100 hover:bg-red-50 dark:bg-slate-700 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg text-sm font-bold transition-all"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <TicketComments ticketId={ticket.id} currentUser={user} />
                        </div>
                    ))}

                    {filteredTickets.length === 0 && (
                        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <span className="text-6xl mb-4 block">🎫</span>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">No tickets found</h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">Everything seems to be running smoothly!</p>
                        </div>
                    )}
                </div>

                {/* Technician Update Modal */}
                {editingTicket && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
                                <h2 className="text-xl font-bold">Update Ticket</h2>
                                <button onClick={() => setEditingTicket(null)} className="text-2xl leading-none">×</button>
                            </div>
                            <form onSubmit={handleUpdateStatus} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Current Status</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'].map(s => (
                                            <button 
                                                key={s}
                                                type="button"
                                                onClick={() => setEditData({...editData, status: s})}
                                                className={`py-2 px-3 rounded-lg text-[10px] font-bold transition-all border ${
                                                    editData.status === s 
                                                    ? 'bg-emerald-600 border-emerald-600 text-white' 
                                                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500'
                                                }`}
                                            >
                                                {s.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Assigned Technician ID / Email</label>
                                    <input 
                                        type="text"
                                        value={editData.technicianId || ''} 
                                        onChange={(e) => setEditData({...editData, technicianId: e.target.value})}
                                        placeholder="e.g. tech-01@campus.com"
                                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                                    />
                                </div>

                                {editData.status === 'REJECTED' ? (
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase">Reason for Rejection</label>
                                        <textarea 
                                            value={editData.adminReason} 
                                            onChange={(e) => setEditData({...editData, adminReason: e.target.value})}
                                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                                            rows="3"
                                        ></textarea>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase">Resolution / Maintenance Notes</label>
                                        <textarea 
                                            value={editData.resolutionNotes} 
                                            onChange={(e) => setEditData({...editData, resolutionNotes: e.target.value})}
                                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
                                            rows="3"
                                        ></textarea>
                                    </div>
                                )}

                                <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all">
                                    Save Updates
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketsListPage;
