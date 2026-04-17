package com.backend.backend;

import com.backend.backend.models.Booking;
import com.backend.backend.models.BookingStatus;
import com.backend.backend.models.Resource;
import com.backend.backend.repositories.BookingRepository;
import com.backend.backend.repositories.ResourceRepository;
import com.backend.backend.services.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @InjectMocks
    private BookingService bookingService;

    private Resource resource;

    @BeforeEach
    void setUp() {
        resource = new Resource("Media Room", "MEETING_ROOM", 20, "Building B", "08:00-18:00", "ACTIVE");
        resource.setId("room-1");
    }

    @Test
    void createBookingShouldRejectWhenTimeConflictsWithApprovedBooking() {
        Booking existing = new Booking();
        existing.setResourceId("room-1");
        existing.setDate("2026-05-01");
        existing.setStartTime("10:00");
        existing.setEndTime("11:00");
        existing.setStatus(BookingStatus.APPROVED);

        when(resourceRepository.findById("room-1")).thenReturn(Optional.of(resource));
        when(bookingRepository.findByResourceIdAndDateAndStatusIn("room-1", "2026-05-01", List.of(BookingStatus.APPROVED))).thenReturn(List.of(existing));

        Booking request = new Booking();
        request.setResourceId("room-1");
        request.setDate("2026-05-01");
        request.setStartTime("10:30");
        request.setEndTime("11:30");
        request.setPurpose("Club meeting");
        request.setAttendees(5);

        assertThrows(ResponseStatusException.class, () -> bookingService.createBooking(request, "student@campus.edu", "Student"));
    }

    @Test
    void createBookingShouldSucceedWhenNoOverlapExists() {
        Booking request = new Booking();
        request.setResourceId("room-1");
        request.setDate("2026-05-01");
        request.setStartTime("07:00");
        request.setEndTime("08:00");
        request.setPurpose("Study group");
        request.setAttendees(4);

        when(resourceRepository.findById("room-1")).thenReturn(Optional.of(resource));
        when(bookingRepository.findByResourceIdAndDateAndStatusIn("room-1", "2026-05-01", List.of(BookingStatus.APPROVED))).thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking result = bookingService.createBooking(request, "student@campus.edu", "Student");

        assertNotNull(result);
        assertEquals(BookingStatus.PENDING, result.getStatus());
        assertEquals("student@campus.edu", result.getRequestedByEmail());
    }
}
