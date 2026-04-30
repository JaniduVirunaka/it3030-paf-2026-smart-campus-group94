package com.backend.backend.controllers;

import com.backend.backend.models.Booking;
import com.backend.backend.services.BookingService;
import com.backend.backend.services.CustomUserDetailsService;
import com.backend.backend.repositories.UserRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientAutoConfiguration;
import org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
        value = BookingController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                OAuth2ClientAutoConfiguration.class,
                OAuth2ResourceServerAutoConfiguration.class
        }
)
@AutoConfigureMockMvc(addFilters = false)
public class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookingService bookingService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Booking validBooking;

    @BeforeEach
    void setUp() {
        validBooking = new Booking(
                "resource-001",
                "user@test.com",
                LocalDate.of(2027, 6, 15),
                LocalTime.of(9, 0),
                LocalTime.of(11, 0),
                "Team presentation practice",
                15,
                "PENDING"
        );
        validBooking.setId("booking-001");
        validBooking.setStudentRegNumber("IT21000001");
        validBooking.setStudentPhone("0771234567");
        validBooking.setStudentEmail("user@test.com");
    }

    // ─── POST /api/bookings ───────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/bookings - valid payload returns 201 CREATED")
    public void createBooking_validPayload_returns201() throws Exception {
        when(bookingService.createBooking(any(Booking.class))).thenReturn(validBooking);

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validBooking)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.resourceId").value("resource-001"))
                .andExpect(jsonPath("$.purpose").value("Team presentation practice"));
    }

    @Test
    @DisplayName("POST /api/bookings - missing required fields returns 400")
    public void createBooking_missingFields_returns400() throws Exception {
        // Booking with blank resourceId and null date — violates @NotBlank / @NotNull
        Booking invalid = new Booking();
        invalid.setUserId("user@test.com");
        // resourceId, date, startTime, endTime, purpose all missing

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").exists());
    }

    @Test
    @DisplayName("POST /api/bookings - invalid phone number returns 400")
    public void createBooking_invalidPhone_returns400() throws Exception {
        validBooking.setStudentPhone("123"); // must be exactly 10 digits

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validBooking)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.studentPhone").exists());
    }

    @Test
    @DisplayName("POST /api/bookings - invalid student email returns 400")
    public void createBooking_invalidEmail_returns400() throws Exception {
        validBooking.setStudentEmail("not-an-email");

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validBooking)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.studentEmail").exists());
    }

    @Test
    @DisplayName("POST /api/bookings - scheduling conflict returns 409")
    public void createBooking_conflict_returns409() throws Exception {
        when(bookingService.createBooking(any(Booking.class)))
                .thenThrow(new Exception("Scheduling conflict: The resource is already booked for the selected time range."));

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validBooking)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("conflict")));
    }

    // ─── GET /api/bookings/user/{userId} ─────────────────────────────────────

    @Test
    @DisplayName("GET /api/bookings/user/{userId} - returns list of bookings for that user")
    public void getUserBookings_returnsBookingList() throws Exception {
        when(bookingService.getUserBookings("user@test.com")).thenReturn(List.of(validBooking));

        mockMvc.perform(get("/api/bookings/user/user@test.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("booking-001"))
                .andExpect(jsonPath("$[0].userId").value("user@test.com"));
    }

    @Test
    @DisplayName("GET /api/bookings/user/{userId} - returns empty list when user has no bookings")
    public void getUserBookings_noBookings_returnsEmptyList() throws Exception {
        when(bookingService.getUserBookings("nobody@test.com")).thenReturn(List.of());

        mockMvc.perform(get("/api/bookings/user/nobody@test.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ─── GET /api/bookings/{id} ───────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/bookings/{id} - returns booking when found")
    public void getBookingById_found_returns200() throws Exception {
        when(bookingService.getBookingById("booking-001")).thenReturn(Optional.of(validBooking));

        mockMvc.perform(get("/api/bookings/booking-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("booking-001"))
                .andExpect(jsonPath("$.purpose").value("Team presentation practice"));
    }

    @Test
    @DisplayName("GET /api/bookings/{id} - returns 404 when booking does not exist")
    public void getBookingById_notFound_returns404() throws Exception {
        when(bookingService.getBookingById("unknown-id")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/bookings/unknown-id"))
                .andExpect(status().isNotFound());
    }

    // ─── GET /api/bookings/booked-slots ──────────────────────────────────────

    @Test
    @DisplayName("GET /api/bookings/booked-slots - returns booked slots for resource and date")
    public void getBookedSlots_validParams_returns200() throws Exception {
        List<Map<String, String>> slots = List.of(
                Map.of("startTime", "09:00", "endTime", "10:00", "status", "APPROVED", "purpose", "Lecture", "bookedBy", "IT21000001")
        );
        when(bookingService.getBookedSlots(anyString(), any())).thenReturn(slots);

        mockMvc.perform(get("/api/bookings/booked-slots")
                        .param("resourceId", "resource-001")
                        .param("date", "2027-06-15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].startTime").value("09:00"))
                .andExpect(jsonPath("$[0].status").value("APPROVED"));
    }

    @Test
    @DisplayName("GET /api/bookings/booked-slots - bad date format returns 400")
    public void getBookedSlots_badDate_returns400() throws Exception {
        mockMvc.perform(get("/api/bookings/booked-slots")
                        .param("resourceId", "resource-001")
                        .param("date", "not-a-date"))
                .andExpect(status().isBadRequest());
    }

    // ─── PUT /api/bookings/{id}/status ───────────────────────────────────────

    @Test
    @DisplayName("PUT /api/bookings/{id}/status - missing status field returns 400")
    public void updateBookingStatus_missingStatus_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("rejectionReason", "test"));

        mockMvc.perform(put("/api/bookings/booking-001/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Status is required."));
    }
}
