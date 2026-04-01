import { useState, useEffect } from 'react';
import { fetchFromAPI } from '../services/api'; 

const FacilitiesPage = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: '', type: 'LECTURE_HALL', capacity: '', location: '', availabilityWindows: '', status: 'ACTIVE'
    });

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
            const addedResource = await fetchFromAPI('/resources', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            setResources([...resources, addedResource]);
            setFormData({
                name: '', type: 'LECTURE_HALL', capacity: '', location: '', availabilityWindows: '', status: 'ACTIVE'
            });
        } catch (err) {
            alert("Failed to save to database. Check if the server is running.");
        }
    };

    // --- NEW: The Delete Function ---
    const handleDelete = async (id) => {
        // A built-in browser popup to make sure they didn't misclick!
        if (!window.confirm("Are you sure you want to delete this resource?")) return;

        try {
            // Send the DELETE request to the Spring Boot URL: /api/resources/{id}
            await fetchFromAPI(`/resources/${id}`, {
                method: 'DELETE'
            });
            
            // Instantly remove it from the table without refreshing the page
            setResources(resources.filter(resource => resource.id !== id));
        } catch (err) {
            alert("Failed to delete. Check if the server is running.");
        }
    };

    if (loading) return <p style={{ padding: '20px' }}>Loading facilities...</p>;
    if (error) return <p style={{ color: 'red', padding: '20px' }}>{error}</p>;

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
            <h2>Facilities & Assets Catalogue</h2>
            <p>Manage all bookable rooms, labs, and equipment.</p>

            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
                <h3 style={{ marginTop: 0 }}>Add New Resource</h3>
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
                    <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: '1 1 100%' }}>
                        Save Resource
                    </button>
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
                        <th>Actions</th> {/* NEW: Added an Actions column header */}
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
                            {/* NEW: The Delete Button mapped to the ID of this specific row */}
                            <td>
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