package com.backend.backend.services;

import com.backend.backend.models.Booking;
import com.backend.backend.models.BookingStatus;
import com.backend.backend.models.Resource;
import com.backend.backend.repositories.BookingRepository;
import com.backend.backend.repositories.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.*;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    public Booking createBooking(Booking booking, String requesterEmail, String requesterName) {
        validateBookingRequest(booking);

        Resource resource = resourceRepository.findById(booking.getResourceId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Resource not found."));

        if (!"ACTIVE".equalsIgnoreCase(resource.getStatus())) {
            throw new ResponseStatusException(BAD_REQUEST, "Resource is not currently available for booking.");
        }

        booking.setResourceName(resource.getName());
        booking.setRequestedByEmail(requesterEmail);
        booking.setRequestedByName(requesterName);
        booking.setStatus(BookingStatus.PENDING);
        booking.setRejectionReason(null);
        booking.setCreatedAt(LocalDate.now().toString());

        if (hasOverlappingApprovedBooking(booking)) {
            throw new ResponseStatusException(CONFLICT, "This resource is already booked for the selected time range.");
        }

        return bookingRepository.save(booking);
    }

    public List<Booking> getBookingsForUser(String email) {
        return bookingRepository.findByRequestedByEmail(email);
    }

    public List<Booking> getAllBookings(String status, String resourceId, String requesterEmail) {
        List<Booking> bookings = bookingRepository.findAll();

        if (status != null && !status.isBlank()) {
            BookingStatus desiredStatus;
            try {
                desiredStatus = BookingStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(BAD_REQUEST, "Invalid status filter: " + status);
            }
            bookings = bookings.stream()
                    .filter(b -> b.getStatus() == desiredStatus)
                    .collect(Collectors.toList());
        }
        if (resourceId != null && !resourceId.isBlank()) {
            bookings = bookings.stream()
                    .filter(b -> resourceId.equals(b.getResourceId()))
                    .collect(Collectors.toList());
        }
        if (requesterEmail != null && !requesterEmail.isBlank()) {
            bookings = bookings.stream()
                    .filter(b -> requesterEmail.equalsIgnoreCase(b.getRequestedByEmail()))
                    .collect(Collectors.toList());
        }
        return bookings;
    }

    public Optional<Booking> getBookingById(String id) {
        return bookingRepository.findById(id);
    }

    public Booking approveBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Booking not found."));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ResponseStatusException(BAD_REQUEST, "Only pending bookings can be approved.");
        }

        if (hasOverlappingApprovedBooking(booking)) {
            throw new ResponseStatusException(CONFLICT, "Booking cannot be approved because the resource is already reserved for that time.");
        }

        booking.setStatus(BookingStatus.APPROVED);
        booking.setRejectionReason(null);
        return bookingRepository.save(booking);
    }

    public Booking rejectBooking(String bookingId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "A rejection reason is required.");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Booking not found."));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ResponseStatusException(BAD_REQUEST, "Only pending bookings can be rejected.");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        return bookingRepository.save(booking);
    }

    public Booking cancelBooking(String bookingId, String requesterEmail, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Booking not found."));

        if (!isAdmin && !booking.getRequestedByEmail().equalsIgnoreCase(requesterEmail)) {
            throw new ResponseStatusException(FORBIDDEN, "You are not allowed to cancel this booking.");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.REJECTED) {
            throw new ResponseStatusException(BAD_REQUEST, "Booking is already closed and cannot be cancelled.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        return bookingRepository.save(booking);
    }

    public void deleteBooking(String bookingId, String requesterEmail, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Booking not found."));

        if (!isAdmin && !booking.getRequestedByEmail().equalsIgnoreCase(requesterEmail)) {
            throw new ResponseStatusException(FORBIDDEN, "You are not allowed to delete this booking.");
        }
        if (booking.getStatus() == BookingStatus.APPROVED && !isAdmin) {
            throw new ResponseStatusException(BAD_REQUEST, "Only admins can delete approved bookings.");
        }

        bookingRepository.deleteById(bookingId);
    }

    private void validateBookingRequest(Booking booking) {
        if (booking.getResourceId() == null || booking.getResourceId().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Resource ID is required.");
        }
        if (booking.getDate() == null || booking.getDate().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Booking date is required.");
        }
        if (booking.getStartTime() == null || booking.getStartTime().isBlank() || booking.getEndTime() == null || booking.getEndTime().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Booking start and end times are required.");
        }
        if (booking.getPurpose() == null || booking.getPurpose().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "A purpose for the booking is required.");
        }
        if (booking.getAttendees() <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Number of attendees must be greater than zero.");
        }

        try {
            LocalDate.parse(booking.getDate());
            LocalTime start = LocalTime.parse(booking.getStartTime());
            LocalTime end = LocalTime.parse(booking.getEndTime());
            if (!start.isBefore(end)) {
                throw new ResponseStatusException(BAD_REQUEST, "Start time must be before end time.");
            }
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(BAD_REQUEST, "Date and time must use the correct format (yyyy-MM-dd and HH:mm).", ex);
        }
    }

    private boolean hasOverlappingApprovedBooking(Booking booking) {
        List<Booking> approvedBookings = bookingRepository.findByResourceIdAndDateAndStatusIn(
                booking.getResourceId(), booking.getDate(), List.of(BookingStatus.APPROVED)
        );

        LocalTime start = LocalTime.parse(booking.getStartTime());
        LocalTime end = LocalTime.parse(booking.getEndTime());

        return approvedBookings.stream().anyMatch(existing -> {
            LocalTime existingStart = LocalTime.parse(existing.getStartTime());
            LocalTime existingEnd = LocalTime.parse(existing.getEndTime());
            return start.isBefore(existingEnd) && existingStart.isBefore(end);
        });
    }
}
