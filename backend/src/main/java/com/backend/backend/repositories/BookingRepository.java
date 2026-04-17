package com.backend.backend.repositories;

import com.backend.backend.models.Booking;
import com.backend.backend.models.BookingStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByRequestedByEmail(String requestedByEmail);
    List<Booking> findByResourceIdAndDateAndStatusIn(String resourceId, String date, List<BookingStatus> statuses);
}
