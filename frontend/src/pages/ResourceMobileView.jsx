import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Assuming you use react-router
import { fetchFromAPI } from '../services/api'; 

const ResourceMobileView = () => {
    // Grabs the ID from the URL (e.g., /resource/view/123)
    const { id } = useParams(); 
    const [resource, setResource] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadResource = async () => {
            try {
                // Fetch just this specific resource from your Java backend
                const data = await fetchFromAPI(`/resources/${id}`);
                setResource(data);
            } catch (err) {
                console.error("Failed to load resource", err);
            } finally {
                setLoading(false);
            }
        };
        loadResource();
    }, [id]);

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Facility Data...</div>;
    if (!resource) return <div style={{ textAlign: 'center', padding: '50px' }}>Facility Not Found.</div>;

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                
                {/* Big, friendly mobile header */}
                <h1 style={{ color: '#2c3e50', marginBottom: '5px' }}>{resource.name}</h1>
                <p style={{ color: '#7f8c8d', fontSize: '18px', marginTop: '0' }}>{resource.type.replace('_', ' ')}</p>
                
                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

                {/* Mobile-friendly data grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', textAlign: 'left' }}>
                    <div>
                        <strong style={{ color: '#bdc3c7', fontSize: '12px', display: 'block' }}>LOCATION</strong>
                        <span style={{ fontSize: '16px', color: '#34495e', fontWeight: 'bold' }}>{resource.location}</span>
                    </div>
                    <div>
                        <strong style={{ color: '#bdc3c7', fontSize: '12px', display: 'block' }}>CAPACITY</strong>
                        <span style={{ fontSize: '16px', color: '#34495e', fontWeight: 'bold' }}>{resource.capacity > 0 ? `${resource.capacity} People` : 'N/A'}</span>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <strong style={{ color: '#bdc3c7', fontSize: '12px', display: 'block' }}>AVAILABLE HOURS</strong>
                        <span style={{ fontSize: '16px', color: '#34495e', fontWeight: 'bold' }}>{resource.availabilityWindows}</span>
                    </div>
                </div>

                <div style={{ marginTop: '30px' }}>
                    <span style={{ 
                        backgroundColor: resource.status === 'ACTIVE' ? '#27ae60' : '#c0392b', 
                        color: 'white', padding: '10px 20px', borderRadius: '25px', 
                        fontWeight: 'bold', fontSize: '16px', display: 'inline-block' 
                    }}>
                        {resource.status === 'ACTIVE' ? '🟢 Ready for Use' : '🔴 Out of Service'}
                    </span>
                </div>

                {/* A cool fake "Action" button for extra marks */}
                <button style={{
                    width: '100%', padding: '15px', backgroundColor: '#3498db', color: 'white', 
                    border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', 
                    marginTop: '25px', cursor: 'pointer'
                }}>
                    Report an Issue
                </button>
            </div>
        </div>
    );
};

export default ResourceMobileView;