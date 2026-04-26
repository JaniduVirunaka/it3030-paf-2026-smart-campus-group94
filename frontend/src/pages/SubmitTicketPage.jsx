import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { createTicket, fetchFromAPI } from '../services/api';

const SubmitTicketPage = () => {
    const { user } = useOutletContext();
    const navigate = useNavigate();

    const [resources, setResources] = useState([]);
    const [loadingResources, setLoadingResources] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        resourceId: '',
        category: 'HARDWARE',
        priority: 'MEDIUM',
        description: '',
        contactDetails: user?.phone || '',
        attachments: []
    });

    useEffect(() => {
        const loadResources = async () => {
            try {
                const data = await fetchFromAPI('/resources?size=100');
                setResources(data.content || []);
            } catch (err) {
                console.error("Failed to load resources", err);
            } finally {
                setLoadingResources(false);
            }
        };
        loadResources();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + formData.attachments.length > 3) {
            alert("Maximum 3 attachments allowed.");
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, reader.result]
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const removeAttachment = (index) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        // Simple Frontend Validation
        const clientErrors = {};
        if (!formData.resourceId) clientErrors.resourceId = "Please select a resource";
        if (!formData.description || formData.description.length < 10) clientErrors.description = "Description must be at least 10 characters";
        if (!formData.contactDetails) clientErrors.contactDetails = "Contact details are required";

        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors);
            setError("Please fix the validation errors below.");
            return;
        }

        setSubmitting(true);

        try {
            const selectedResource = resources.find(r => r.id === formData.resourceId);
            const ticketToSave = {
                ...formData,
                resourceName: selectedResource ? selectedResource.name : 'Unknown Location',
                userName: user?.name || user?.email
            };

            await createTicket(ticketToSave);
            setSuccess(true);
            setTimeout(() => navigate('/tickets'), 2000);
        } catch (err) {
            if (err.status === 400 && err.data?.errors) {
                setFieldErrors(err.data.errors);
                setError(err.data.message || 'Validation failed');
            } else {
                setError(err.message || 'Failed to submit ticket');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Ticket Submitted!</h2>
                    <p className="text-slate-500 dark:text-slate-400">Our technicians will look into it shortly. Redirecting you to your tickets...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
            <div className="max-w-3xl mx-auto">
                
                <button 
                    onClick={() => navigate(-1)} 
                    className="mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                    ⬅️ Back to Dashboard
                </button>

                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="bg-blue-600 p-8 md:p-10 text-white">
                        <h1 className="text-3xl font-extrabold mb-2">Report an Incident 🛠️</h1>
                        <p className="text-blue-100 italic">Something not working? Let us know and we'll fix it.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300 text-sm font-semibold flex items-center gap-2">
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Resource Selection */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Affected Resource/Location</label>
                                <select 
                                    name="resourceId" 
                                    value={formData.resourceId} 
                                    onChange={handleInputChange}
                                    required
                                    className={`w-full bg-slate-50 dark:bg-slate-700 border rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white ${fieldErrors.resourceId ? 'border-red-500 bg-red-50' : 'border-slate-200 dark:border-slate-600'}`}
                                >
                                    <option value="">Select a facility...</option>
                                    {resources.map(r => (
                                        <option key={r.id} value={r.id}>{r.name} ({r.location})</option>
                                    ))}
                                </select>
                                {fieldErrors.resourceId && <p className="text-red-500 text-xs font-bold">{fieldErrors.resourceId}</p>}
                                {loadingResources && <p className="text-xs text-blue-500 animate-pulse">Loading facilities...</p>}
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Category</label>
                                <select 
                                    name="category" 
                                    value={formData.category} 
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                                >
                                    <option value="HARDWARE">Hardware (Projector, PC, etc.)</option>
                                    <option value="SOFTWARE">Software / Network</option>
                                    <option value="FACILITY">Facility (AC, Lights, Furniture)</option>
                                    <option value="CLEANING">Janitorial / Cleaning</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            {/* Priority */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Priority Level</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setFormData({...formData, priority: p})}
                                            className={`py-2 px-4 rounded-lg text-xs font-bold transition-all border ${
                                                formData.priority === p 
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Preferred Contact</label>
                                <input 
                                    type="text" 
                                    name="contactDetails"
                                    value={formData.contactDetails}
                                    onChange={handleInputChange}
                                    placeholder="Phone or Email"
                                    className={`w-full bg-slate-50 dark:bg-slate-700 border rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white ${fieldErrors.contactDetails ? 'border-red-500 bg-red-50' : 'border-slate-200 dark:border-slate-600'}`}
                                />
                                {fieldErrors.contactDetails && <p className="text-red-500 text-xs font-bold">{fieldErrors.contactDetails}</p>}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Description of Incident</label>
                            <textarea 
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                                rows="4"
                                placeholder="Describe exactly what's wrong..."
                                className={`w-full bg-slate-50 dark:bg-slate-700 border rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white ${fieldErrors.description ? 'border-red-500 bg-red-50' : 'border-slate-200 dark:border-slate-600'}`}
                            ></textarea>
                            {fieldErrors.description && <p className="text-red-500 text-xs font-bold">{fieldErrors.description}</p>}
                        </div>

                        {/* Attachments */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Attachments (Max 3)</label>
                            <div className="flex flex-wrap gap-4">
                                {formData.attachments.map((img, idx) => (
                                    <div key={idx} className="relative group h-24 w-24">
                                        <img src={img} className="h-full w-full object-cover rounded-xl border-2 border-slate-200 dark:border-slate-600" />
                                        <button 
                                            type="button" 
                                            onClick={() => removeAttachment(idx)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {formData.attachments.length < 3 && (
                                    <label className="h-24 w-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                                        <span className="text-2xl text-slate-400">📸</span>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">Add Photo</span>
                                        <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className={`w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-lg shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3`}
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin h-5 w-5 border-2 border-white border-b-transparent rounded-full"></div>
                                    Submitting...
                                </>
                            ) : (
                                "Create Incident Ticket"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SubmitTicketPage;
