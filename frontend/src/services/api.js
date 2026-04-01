// Base configuration for all backend requests
const BASE_URL = 'http://localhost:8080/api';

export const fetchFromAPI = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            // --- THIS IS THE CRITICAL FIX ---
            // This tells the browser to send your Google Login session cookie!
            credentials: 'include', 
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        // If the server returns 204 No Content (like our DELETE method does), 
        // just return null instead of trying to parse empty data into JSON.
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to fetch data:", error);
        throw error;
    }
};