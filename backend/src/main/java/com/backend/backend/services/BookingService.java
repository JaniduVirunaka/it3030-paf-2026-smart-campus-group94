package com.backend.backend.services;

import com.backend.backend.models.Booking;
import com.backend.backend.repositories.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BookingService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BookingService.class);

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private MongoOperations mongoTemplate;

    public Booking createBooking(Booking booking) throws Exception {
        if (booking.getEndTime() != null && booking.getStartTime() != null &&
                !booking.getEndTime().isAfter(booking.getStartTime())) {
            throw new Exception("End time must be after start time.");
        }
        if (hasConflict(booking)) {
            throw new Exception("Scheduling conflict: The resource is already booked for the selected time range.");
        }
        booking.setStatus("PENDING");
        return bookingRepository.save(booking);
    }

    private boolean hasConflict(Booking newBooking) {
        List<Booking> existingBookings = bookingRepository.findByResourceIdAndDate(
                newBooking.getResourceId(), newBooking.getDate());

        for (Booking existing : existingBookings) {
            // Ignore cancelled or rejected bookings
            if ("CANCELLED".equals(existing.getStatus()) || "REJECTED".equals(existing.getStatus())) {
                continue;
            }

            // Check for time overlap
            // Overlap occurs if (StartA < EndB) and (EndA > StartB)
            boolean isOverlapping = existing.getStartTime().isBefore(newBooking.getEndTime()) &&
                                    existing.getEndTime().isAfter(newBooking.getStartTime());
            
            if (isOverlapping) {
                // Ignore if it's the same booking being updated
                if (newBooking.getId() == null || !newBooking.getId().equals(existing.getId())) {
                    return true;
                }
            }
        }
        return false;
    }

    public Booking updateBookingStatus(String id, String status, String rejectionReason) throws Exception {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (!bookingOpt.isPresent()) {
            throw new Exception("Booking not found");
        }

        Booking booking = bookingOpt.get();
        
        // If approving, re-check conflict just in case
        if ("APPROVED".equals(status) && hasConflict(booking)) {
             throw new Exception("Cannot approve due to scheduling conflict.");
        }

        booking.setStatus(status);
        if ("REJECTED".equals(status)) {
            booking.setRejectionReason(rejectionReason);
        } else {
            booking.setRejectionReason(null);
        }

        return bookingRepository.save(booking);
    }

    public List<Booking> getUserBookings(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    public Page<Booking> searchAndFilterBookings(String resourceId, String status, Pageable pageable) {
        Query query = new Query();

        if (resourceId != null && !resourceId.trim().isEmpty()) {
            query.addCriteria(Criteria.where("resourceId").is(resourceId));
        }

        if (status != null && !status.equals("ALL")) {
            query.addCriteria(Criteria.where("status").is(status));
        }

        long totalCount = mongoTemplate.count(query, Booking.class);
        query.with(pageable);
        List<Booking> paginatedBookings = mongoTemplate.find(query, Booking.class);

        return new PageImpl<>(paginatedBookings, pageable, totalCount);
    }
    
    public Optional<Booking> getBookingById(String id) {
        return bookingRepository.findById(id);
    }
    
    public void deleteBooking(String id) {
        bookingRepository.deleteById(id);
    }
}
