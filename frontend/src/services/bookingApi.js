// Booking API service functions
import { fetchFromAPI } from './api';

/**
 * Create a new booking request (POST /api/bookings)
 */
export const createBooking = (bookingData) => {
    return fetchFromAPI('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
    });
};

/**
 * Get all bookings with optional filters - Admin (GET /api/bookings)
 */
export const getAllBookings = ({ resourceId = '', status = 'ALL', page = 0, size = 10 } = {}) => {
    const params = new URLSearchParams({ resourceId, status, page, size });
    return fetchFromAPI(`/bookings?${params.toString()}`);
};

/**
 * Get bookings for a specific user (GET /api/bookings/user/:userId)
 */
export const getUserBookings = (userId) => {
    return fetchFromAPI(`/bookings/user/${userId}`);
};

/**
 * Get a single booking by ID (GET /api/bookings/:id)
 */
export const getBookingById = (id) => {
    return fetchFromAPI(`/bookings/${id}`);
};

/**
 * Update booking status (PUT /api/bookings/:id/status)
 * status: 'APPROVED' | 'REJECTED' | 'CANCELLED'
 */
export const updateBookingStatus = (id, status, rejectionReason = '') => {
    return fetchFromAPI(`/bookings/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, rejectionReason }),
    });
};
