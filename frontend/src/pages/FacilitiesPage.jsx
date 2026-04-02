import { useState, useEffect, useRef } from 'react';
import { fetchFromAPI } from '../services/api'; 

const FacilitiesPage = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', type: 'LECTURE_HALL', capacity: '', location: '', availabilityWindows: '', status: 'ACTIVE'
    });
    const [fieldErrors, setFieldErrors] = useState({});

    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true); 
    
    // --- NEW: States and Refs for CSV Export/Import ---
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await fetchFromAPI('/auth/user');
                console.log("Auth Response from Spring Boot:", userData);
                
                if (userData && userData.authenticated) {
                    setUser(userData);
                } else {
                    window.location.href = '/'; 
                }
            } catch (err) {
                console.error("Auth check failed", err);
                window.location.href = '/';
            } finally {
                setAuthLoading(false); 
            }
        };
        checkAuth();
    }, []);

    useEffect(() => {
        const loadResources = async () => {
            try {
                // Build the query string with our current filter states
                const queryParams = new URLSearchParams({
                    searchTerm: searchTerm,
                    type: filterType,
                    status: filterStatus
                });
                
                // Fetch the explicitly filtered data from the backend
                const data = await fetchFromAPI(`/resources?${queryParams.toString()}`);
                setResources(data || []); 
                setLoading(false);
            } catch (err) {
                console.error("Failed to load resources", err);
                setResources([]); 
                setLoading(false);
            }
        };

        // Debounce: Wait 500ms after the user stops typing before calling the API
        const delayDebounceFn = setTimeout(() => {
            loadResources();
        }, 500);

        // Cleanup the timer if the user types again before 500ms is up
        return () => clearTimeout(delayDebounceFn);
        
    }, [searchTerm, filterType, filterStatus]); // <-- Re-run whenever these change

    const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.email === 'janiduvirunkadev@gmail.com';

    const styles = {
        container: { padding: '30px', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f4f7f6', minHeight: '100vh' },
        header: { color: '#2c3e50', fontSize: '28px', marginBottom: '5px', fontWeight: 'bold' },
        subHeader: { color: '#7f8c8d', fontSize: '16px', marginBottom: '30px' },
        card: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '30px', border: '1px solid #eef2f5' },
        input: { padding: '12px', borderRadius: '8px', border: '1px solid #dcdde1', fontSize: '14px', flex: '1 1 200px', outline: 'none' },
        buttonPrimary: { padding: '12px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s', flex: '1 1 100%' },
        // --- NEW: Styles for CSV buttons ---
        buttonExport: { padding: '10px 15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
        buttonImport: { padding: '10px 15px', backgroundColor: '#8e44ad', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
        buttonEdit: { padding: '6px 12px', backgroundColor: '#f1c40f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px', fontWeight: 'bold', fontSize: '12px' },
        buttonDelete: { padding: '6px 12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
        table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
        th: { backgroundColor: '#f8f9fa', color: '#2c3e50', padding: '15px', textAlign: 'left', borderBottom: '2px solid #e1e8ed', fontWeight: '600' },
        td: { padding: '15px', borderBottom: '1px solid #e1e8ed', color: '#34495e', fontSize: '14px' },
        badgeActive: { backgroundColor: '#e8f8f5', color: '#27ae60', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' },
        badgeInactive: { backgroundColor: '#fdedec', color: '#c0392b', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' },
        errorText: { color: '#e74c3c', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: 'bold' }
    };

    if (authLoading || loading) {
        return (
            <div style={{...styles.container, textAlign: 'center', paddingTop: '100px'}}>
                <h2 style={{ color: '#2c3e50' }}>Verifying Credentials & Loading Hub...</h2>
                <p style={{ color: '#e74c3c', fontWeight: 'bold', marginTop: '20px' }}>
                    If you are stuck on this screen for more than 5 seconds, your Spring Boot server is likely failing to connect!
                </p>
            </div>
        );
    }

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
        e.preventDefault(); 
        setFieldErrors({}); // Clear any previous errors on new submission

        try {
            // Determine the URL and Method based on whether we are editing or adding
            const url = editingId ? `http://localhost:8080/api/resources/${editingId}` : 'http://localhost:8080/api/resources';
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include' // Ensures OAuth context is passed
            });

            // If the backend rejects the data (e.g., Validation Failed)
            if (!response.ok) {
                if (response.status === 400) {
                    const errorData = await response.json();
                    if (errorData.errors) {
                        setFieldErrors(errorData.errors); // Save the specific field errors to state
                        return; // Stop the function here
                    }
                }
                throw new Error('Something went wrong on the server');
            }

            // If successful, parse the saved resource
            const savedResource = await response.json();

            if (editingId) {
                setResources(resources.map(r => r.id === editingId ? savedResource : r));
                setEditingId(null); 
            } else {
                setResources([...resources, savedResource]);
            }
            
            // Reset form on success
            setFormData({ name: '', type: 'LECTURE_HALL', capacity: '', location: '', availabilityWindows: '', status: 'ACTIVE' });
            
        } catch (err) {
            console.error("Save error:", err);
            alert("An unexpected error occurred while saving.");
        }
    };

    const handleEditClick = (resource) => {
        setFormData(resource);
        setEditingId(resource.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this resource?")) return;
        try {
            await fetchFromAPI(`/resources/${id}`, { method: 'DELETE' });
            setResources(resources.filter(r => r.id !== id));
        } catch (err) {
            alert("Failed to delete.");
        }
    };

    // --- NEW: Handle CSV Export ---
   const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            // Build the URL with your current filter states
            const exportUrl = new URL('http://localhost:8080/api/resources/export');
            exportUrl.searchParams.append('searchTerm', searchTerm);
            exportUrl.searchParams.append('type', filterType);
            exportUrl.searchParams.append('status', filterStatus);

            const response = await fetch(exportUrl.toString(), {
                method: 'GET',
                credentials: 'include',
            });
            
            if (!response.ok) throw new Error('Export failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'filtered_campus_resources.csv');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error(err);
            alert("Failed to export data.");
        } finally {
            setIsExporting(false);
        }
    };

    // --- NEW: Handle CSV Import ---
    const handleImportFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsImporting(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            // Standard fetch because FormData shouldn't have 'Content-Type: application/json'
            const response = await fetch('http://localhost:8080/api/resources/import', {
                method: 'POST',
                body: uploadData,
                credentials: 'include',
                // headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } // Uncomment if needed
            });
            
            if (!response.ok) throw new Error('Import failed');
            
            alert("Resources imported successfully!");
            // Refresh the table data
            const refreshedData = await fetchFromAPI('/resources');
            setResources(refreshedData || []);
        } catch (err) {
            console.error(err);
            alert("Failed to import data. Make sure your Spring Boot backend has the /import endpoint.");
        } finally {
            setIsImporting(false);
            e.target.value = null; // Reset file input
        }
    };

    // NEW: Just use the resources directly from the backend
    const displayResources = Array.isArray(resources) ? resources : [];

    return (
        <div style={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 style={{...styles.header, marginBottom: '5px'}}>Facilities & Assets Catalogue</h2>
                    <p style={{...styles.subHeader, marginBottom: '0'}}>Smart Campus Operations Hub - Manage Resources</p>
                </div>

                {/* --- NEW: Admin Only CSV Actions --- */}
                {isAdmin && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleExportCSV} disabled={isExporting} style={styles.buttonExport}>
                            {isExporting ? '⏳ Exporting...' : '📥 Export CSV'}
                        </button>
                        
                        {/* Hidden file input triggered by the Import button */}
                        <input 
                            type="file" 
                            accept=".csv" 
                            style={{ display: 'none' }} 
                            ref={fileInputRef} 
                            onChange={handleImportFileChange} 
                        />
                        <button onClick={() => fileInputRef.current.click()} disabled={isImporting} style={styles.buttonImport}>
                            {isImporting ? '⏳ Importing...' : '📤 Import CSV'}
                        </button>
                    </div>
                )}
            </div>

            {isAdmin && (
                <div style={styles.card}>
                    <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '20px' }}>{editingId ? "✏️ Edit Resource" : "➕ Add New Resource"}</h3>
                   <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        
                        {/* Name Input */}
                        <div style={{ flex: '1 1 200px' }}>
                            <input type="text" name="name" placeholder="Name (e.g., Mini Lab)" value={formData.name} onChange={handleInputChange} 
                                style={{...styles.input, width: '100%', borderColor: fieldErrors.name ? '#e74c3c' : '#dcdde1', boxSizing: 'border-box'}} />
                            {fieldErrors.name && <span style={styles.errorText}>{fieldErrors.name}</span>}
                        </div>

                        {/* Type Dropdown */}
                        <div style={{ flex: '1 1 200px' }}>
                            <select name="type" value={formData.type} onChange={handleInputChange} 
                                style={{...styles.input, width: '100%', borderColor: fieldErrors.type ? '#e74c3c' : '#dcdde1', boxSizing: 'border-box'}}>
                                <option value="LECTURE_HALL">Lecture Hall</option>
                                <option value="LAB">Laboratory</option>
                                <option value="EQUIPMENT">Equipment</option>
                                <option value="MEETING_ROOM">Meeting Room</option>
                            </select>
                            {fieldErrors.type && <span style={styles.errorText}>{fieldErrors.type}</span>}
                        </div>

                        {/* Capacity Input */}
                        <div style={{ flex: '1 1 200px' }}>
                            <input type="number" name="capacity" placeholder="Capacity (0 for items)" value={formData.capacity} onChange={handleInputChange} 
                                style={{...styles.input, width: '100%', borderColor: fieldErrors.capacity ? '#e74c3c' : '#dcdde1', boxSizing: 'border-box'}} />
                            {fieldErrors.capacity && <span style={styles.errorText}>{fieldErrors.capacity}</span>}
                        </div>

                        {/* Location Input */}
                        <div style={{ flex: '1 1 200px' }}>
                            <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleInputChange} 
                                style={{...styles.input, width: '100%', borderColor: fieldErrors.location ? '#e74c3c' : '#dcdde1', boxSizing: 'border-box'}} />
                            {fieldErrors.location && <span style={styles.errorText}>{fieldErrors.location}</span>}
                        </div>

                        {/* Availability Windows Input */}
                        <div style={{ flex: '1 1 200px' }}>
                            <input type="text" name="availabilityWindows" placeholder="Hours (e.g., 08:00-17:00)" value={formData.availabilityWindows} onChange={handleInputChange} 
                                style={{...styles.input, width: '100%', borderColor: fieldErrors.availabilityWindows ? '#e74c3c' : '#dcdde1', boxSizing: 'border-box'}} />
                            {fieldErrors.availabilityWindows && <span style={styles.errorText}>{fieldErrors.availabilityWindows}</span>}
                        </div>

                        {/* Status Dropdown */}
                        <div style={{ flex: '1 1 200px' }}>
                            <select name="status" value={formData.status} onChange={handleInputChange} 
                                style={{...styles.input, width: '100%', borderColor: fieldErrors.status ? '#e74c3c' : '#dcdde1', boxSizing: 'border-box'}}>
                                <option value="ACTIVE">Active</option>
                                <option value="OUT_OF_SERVICE">Out of Service</option>
                            </select>
                            {fieldErrors.status && <span style={styles.errorText}>{fieldErrors.status}</span>}
                        </div>

                        {/* Buttons */}
                        <button type="submit" style={{...styles.buttonPrimary, backgroundColor: editingId ? '#27ae60' : '#3498db'}}>
                            {editingId ? "Update Resource" : "Save Resource"}
                        </button>
                        
                        {editingId && 
                            <button type="button" onClick={() => {
                                setEditingId(null); 
                                setFieldErrors({}); // Clear errors on cancel
                                setFormData({name: '', type: 'LECTURE_HALL', capacity: '', location: '', availabilityWindows: '', status: 'ACTIVE'});
                            }} style={{...styles.buttonPrimary, backgroundColor: '#95a5a6', flex: '1 1 45%'}}>
                                Cancel
                            </button>
                        }
                    </form>
                </div>
            )}

            <div style={styles.card}>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <input type="text" placeholder="🔍 Search by name or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{...styles.input, flex: '2'}} />
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={styles.input}>
                        <option value="ALL">All Types</option>
                        <option value="LECTURE_HALL">Lecture Halls</option>
                        <option value="LAB">Laboratories</option>
                        <option value="EQUIPMENT">Equipment</option>
                        <option value="MEETING_ROOM">Meeting Rooms</option>
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={styles.input}>
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="OUT_OF_SERVICE">Out of Service</option>
                    </select>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Name</th>
                                <th style={styles.th}>Type</th>
                                <th style={styles.th}>Capacity</th>
                                <th style={styles.th}>Location</th>
                                <th style={styles.th}>Availability</th>
                                <th style={styles.th}>Status</th>
                                {isAdmin && <th style={styles.th}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {displayResources.map((r) => (
                                <tr key={r.id} style={{ transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <td style={{...styles.td, fontWeight: 'bold'}}>{r.name}</td>
                                    <td style={styles.td}>{r.type.replace('_', ' ')}</td>
                                    <td style={styles.td}>{r.capacity === 0 ? '-' : r.capacity}</td>
                                    <td style={styles.td}>{r.location}</td>
                                    <td style={styles.td}>{r.availabilityWindows}</td>
                                    <td style={styles.td}>
                                        <span style={r.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}>
                                            {r.status === 'ACTIVE' ? '🟢 Active' : '🔴 Maintenance'}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                    <td style={styles.td}>
                                        <button onClick={() => handleEditClick(r)} style={styles.buttonEdit}>Edit</button>
                                        <button onClick={() => handleDelete(r.id)} style={styles.buttonDelete}>Delete</button>
                                    </td>
                                    )}
                                </tr>
                            ))}
                            {displayResources.length === 0 && (
                                <tr><td colSpan={isAdmin ? "7" : "6"} style={{...styles.td, textAlign: 'center', padding: '30px', color: '#7f8c8d'}}>No resources match your search criteria.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FacilitiesPage;