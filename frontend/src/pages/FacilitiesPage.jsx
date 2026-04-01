import { useState, useEffect } from 'react';
import { fetchFromAPI } from '../services/api'; 

const FacilitiesPage = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: '', type: 'LECTURE_HALL', capacity: '', location: '', availabilityWindows: '', status: 'ACTIVE'
    });
    
    // NEW: A state to track if we are editing an existing room, or creating a new one
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const loadResources = async () => {
            try {
                const data = await fetchFromAPI('/resources');
                setResources(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load resources. Make sure your backend is running!');
                setLoading(false);
            }
        };
        loadResources();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        try {
            if (editingId) {
                // --- NEW: The PUT Request (Update) ---
                const updatedResource = await fetchFromAPI(`/resources/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                
                // Find the old resource in our table and replace it with the newly updated one
                setResources(resources.map(r => r.id === editingId ? updatedResource : r));
                setEditingId(null); // Turn off edit mode
            } else {
                // --- The POST Request (Create) ---
                const addedResource = await fetchFromAPI('/resources', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                setResources([...resources, addedResource]);
            }
            
            // Clear the form
            setFormData({
                name: '', type: 'LECTURE_HALL', capacity: '', location: '', availabilityWindows: '', status: 'ACTIVE'
            });
        } catch (err) {
            alert("Failed to save to database. Check if the server is running.");
        }
    };

    // --- NEW: The Edit Button Click Handler ---
    const handleEditClick = (resource) => {
        setFormData(resource); // Fill the form with the resource's current data
        setEditingId(resource.id); // Tell the app we are in edit mode
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll back to the top so they see the form
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this resource?")) return;
        try {
            await fetchFromAPI(`/resources/${id}`, { method: 'DELETE' });
            setResources(resources.filter(resource => resource.id !== id));
        } catch (err) {
            alert("Failed to delete. Check if the server is running.");
        }
    };

    // --- NEW: A helper to cancel editing ---
    const cancelEdit = () => {
        setEditingId(null);
        setFormData({ name: '', type: 'LECTURE_HALL', capacity: '', location: '', availabilityWindows: '', status: 'ACTIVE' });
    };

    if (loading) return <p style={{ padding: '20px' }}>Loading facilities...</p>;
    if (error) return <p style={{ color: 'red', padding: '20px' }}>{error}</p>;

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
            <h2>Facilities & Assets Catalogue</h2>
            <p>Manage all bookable rooms, labs, and equipment.</p>

            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
                {/* Dynamically change the title based on if we are editing or not */}
                <h3 style={{ marginTop: 0 }}>{editingId ? "Edit Resource" : "Add New Resource"}</h3>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input type="text" name="name" placeholder="Name (e.g., Mini Lab)" value={formData.name} onChange={handleInputChange} required style={{ padding: '8px', flex: '1 1 200px' }} />
                    <select name="type" value={formData.type} onChange={handleInputChange} style={{ padding: '8px', flex: '1 1 150px' }}>
                        <option value="LECTURE_HALL">Lecture Hall</option>
                        <option value="LAB">Laboratory</option>
                        <option value="EQUIPMENT">Equipment</option>
                        <option value="MEETING_ROOM">Meeting Room</option>
                    </select>
                    <input type="number" name="capacity" placeholder="Capacity (0 for items)" value={formData.capacity} onChange={handleInputChange} required style={{ padding: '8px', flex: '1 1 100px' }} />
                    <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleInputChange} required style={{ padding: '8px', flex: '1 1 150px' }} />
                    <input type="text" name="availabilityWindows" placeholder="Hours (e.g., 08:00-17:00)" value={formData.availabilityWindows} onChange={handleInputChange} required style={{ padding: '8px', flex: '1 1 150px' }} />
                    <select name="status" value={formData.status} onChange={handleInputChange} style={{ padding: '8px', flex: '1 1 120px' }}>
                        <option value="ACTIVE">Active</option>
                        <option value="OUT_OF_SERVICE">Out of Service</option>
                    </select>
                    
                    <button type="submit" style={{ padding: '8px 16px', backgroundColor: editingId ? '#28a745' : '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: editingId ? '1 1 45%' : '1 1 100%' }}>
                        {editingId ? "Update Resource" : "Save Resource"}
                    </button>
                    
                    {/* NEW: Cancel button that only shows up when editing */}
                    {editingId && (
                        <button type="button" onClick={cancelEdit} style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: '1 1 45%' }}>
                            Cancel
                        </button>
                    )}
                </form>
            </div>

            <table border="1" cellPadding="10" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Capacity</th>
                        <th>Location</th>
                        <th>Availability</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {resources.map((resource) => (
                        <tr key={resource.id}>
                            <td>{resource.name}</td>
                            <td>{resource.type}</td>
                            <td>{resource.capacity}</td>
                            <td>{resource.location}</td>
                            <td>{resource.availabilityWindows}</td>
                            <td>
                                <span style={{ color: resource.status === 'ACTIVE' ? 'green' : 'red', fontWeight: 'bold' }}>
                                    {resource.status}
                                </span>
                            </td>
                            <td>
                                {/* NEW: Edit Button */}
                                <button 
                                    onClick={() => handleEditClick(resource)} 
                                    style={{ padding: '4px 8px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(resource.id)} 
                                    style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FacilitiesPage;