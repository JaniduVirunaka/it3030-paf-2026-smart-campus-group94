package com.backend.backend.repositories;

import com.backend.backend.models.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByResourceIdAndDate(String resourceId, LocalDate date);
    List<Booking> findByUserId(String userId);
}
