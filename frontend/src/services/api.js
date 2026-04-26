import axios from 'axios';

const BASE_URL = '/api';

const API = axios.create({ baseURL: '/api', withCredentials: true });

export const getNotifications = (userId) => API.get(`/notifications?userId=${userId}`);
export const markNotificationRead = (id) => API.patch(`/notifications/${id}/read`);

export const fetchFromAPI = async (endpoint, options = {}) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        // Send session cookie on every request so Spring Security stays authenticated
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    // 204 No Content (e.g. DELETE) — nothing to parse
    if (response.status === 204) {
        return null;
    }

    // Parse JSON body for ALL responses (including 4xx/5xx)
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        // Throw an error that carries the real backend message (e.g. "Invalid email or password")
        const err = new Error(data?.message || `Request failed: ${response.status}`);
        err.status = response.status;
        err.data = data;
        throw err;
    }

    return data;
};

// --- Tickets (Member 3) ---
export const getTickets = () => fetchFromAPI('/tickets');
export const getTicketById = (id) => fetchFromAPI(`/tickets/${id}`);
export const createTicket = (ticket) => fetchFromAPI('/tickets', {
    method: 'POST',
    body: JSON.stringify(ticket)
});
export const updateTicket = (id, ticket) => fetchFromAPI(`/tickets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(ticket)
});
export const deleteTicket = (id) => fetchFromAPI(`/tickets/${id}`, {
    method: 'DELETE'
});

// --- Ticket Comments (Member 3) ---
export const getTicketComments = (ticketId) => fetchFromAPI(`/tickets/comments/ticket/${ticketId}`);
export const addTicketComment = (comment) => fetchFromAPI('/tickets/comments', {
    method: 'POST',
    body: JSON.stringify(comment)
});
export const deleteTicketComment = (id) => fetchFromAPI(`/tickets/comments/${id}`, {
    method: 'DELETE'
});
export const updateTicketComment = (id, content) => fetchFromAPI(`/tickets/comments/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ content })
});