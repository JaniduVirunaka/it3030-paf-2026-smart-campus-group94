package com.backend.backend.services;

import com.backend.backend.models.Booking;
import com.backend.backend.repositories.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.query.Query;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    // Mock the interface instead of the concrete MongoTemplate class
    // (avoids Byte Buddy / Java 25 compatibility issue)
    @Mock
    private MongoOperations mongoTemplate;

    @InjectMocks
    private BookingService bookingService;

    private Booking sampleBooking;

    @BeforeEach
    void setUp() {
        sampleBooking = new Booking(
                "resource-001",
                "user-001",
                LocalDate.of(2026, 8, 1),
                LocalTime.of(9, 0),
                LocalTime.of(11, 0),
                "Team Meeting",
                10,
                "PENDING"
        );
        sampleBooking.setId("booking-001");
    }

    @Test
    @DisplayName("createBooking - should save with PENDING status when no conflict exists")
    void createBooking_noConflict_shouldSaveAsPending() throws Exception {
        when(bookingRepository.findByResourceIdAndDate(anyString(), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(bookingRepository.save(any(Booking.class))).thenReturn(sampleBooking);

        Booking result = bookingService.createBooking(sampleBooking);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("PENDING");
        verify(bookingRepository, times(1)).save(sampleBooking);
    }

    @Test
    @DisplayName("createBooking - should throw exception when time slot overlaps an APPROVED booking")
    void createBooking_withConflict_shouldThrowException() {
        // An APPROVED booking already occupies 08:00–10:00 — overlaps with 09:00–11:00
        Booking existingBooking = new Booking(
                "resource-001", "user-002",
                LocalDate.of(2026, 8, 1),
                LocalTime.of(8, 0), LocalTime.of(10, 0),
                "Existing Event", 5, "APPROVED"
        );
        existingBooking.setId("booking-existing");

        when(bookingRepository.findByResourceIdAndDate(anyString(), any(LocalDate.class)))
                .thenReturn(List.of(existingBooking));

        assertThatThrownBy(() -> bookingService.createBooking(sampleBooking))
                .isInstanceOf(Exception.class)
                .hasMessageContaining("conflict");
    }

    @Test
    @DisplayName("createBooking - should NOT conflict with CANCELLED bookings in the same slot")
    void createBooking_withCancelledBooking_shouldSucceed() throws Exception {
        Booking cancelledBooking = new Booking(
                "resource-001", "user-002",
                LocalDate.of(2026, 8, 1),
                LocalTime.of(9, 0), LocalTime.of(11, 0),
                "Old Event", 5, "CANCELLED"
        );
        cancelledBooking.setId("booking-cancelled");

        when(bookingRepository.findByResourceIdAndDate(anyString(), any(LocalDate.class)))
                .thenReturn(List.of(cancelledBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(sampleBooking);

        Booking result = bookingService.createBooking(sampleBooking);
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("PENDING");
    }

    @Test
    @DisplayName("createBooking - should NOT conflict with REJECTED bookings in the same slot")
    void createBooking_withRejectedBooking_shouldSucceed() throws Exception {
        Booking rejectedBooking = new Booking(
                "resource-001", "user-002",
                LocalDate.of(2026, 8, 1),
                LocalTime.of(9, 0), LocalTime.of(11, 0),
                "Rejected Event", 5, "REJECTED"
        );
        rejectedBooking.setId("booking-rejected");

        when(bookingRepository.findByResourceIdAndDate(anyString(), any(LocalDate.class)))
                .thenReturn(List.of(rejectedBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(sampleBooking);

        Booking result = bookingService.createBooking(sampleBooking);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("updateBookingStatus - should approve booking successfully when no conflict")
    void updateBookingStatus_approve_shouldSetStatusApproved() throws Exception {
        when(bookingRepository.findById("booking-001")).thenReturn(Optional.of(sampleBooking));
        when(bookingRepository.findByResourceIdAndDate(anyString(), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        Booking result = bookingService.updateBookingStatus("booking-001", "APPROVED", null);
        assertThat(result.getStatus()).isEqualTo("APPROVED");
        assertThat(result.getRejectionReason()).isNull();
    }

    @Test
    @DisplayName("updateBookingStatus - should set rejection reason when status is REJECTED")
    void updateBookingStatus_reject_shouldSetReasonAndStatus() throws Exception {
        when(bookingRepository.findById("booking-001")).thenReturn(Optional.of(sampleBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        Booking result = bookingService.updateBookingStatus("booking-001", "REJECTED", "Room under maintenance");
        assertThat(result.getStatus()).isEqualTo("REJECTED");
        assertThat(result.getRejectionReason()).isEqualTo("Room under maintenance");
    }

    @Test
    @DisplayName("updateBookingStatus - should throw exception when booking ID does not exist")
    void updateBookingStatus_notFound_shouldThrow() {
        when(bookingRepository.findById(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.updateBookingStatus("unknown-id", "APPROVED", null))
                .isInstanceOf(Exception.class)
                .hasMessageContaining("not found");
    }

    @Test
    @DisplayName("getUserBookings - should return all bookings for the given userId")
    void getUserBookings_shouldReturnUserBookings() {
        when(bookingRepository.findByUserId("user-001")).thenReturn(List.of(sampleBooking));

        List<Booking> result = bookingService.getUserBookings("user-001");
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUserId()).isEqualTo("user-001");
    }
}
