import axios from 'axios';

const API = axios.create({
    baseURL: '/api',
    withCredentials: true,
});

export const getNotifications = (userId) => API.get(`/notifications?userId=${userId}`);
export const markNotificationRead = (id) => API.patch(`/notifications/${id}/read`);

export const fetchFromAPI = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`/api${endpoint}`, {
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

        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to fetch data:", error);
        throw error;
    }
};
