// Base configuration for all backend requests
const BASE_URL = '/api';

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