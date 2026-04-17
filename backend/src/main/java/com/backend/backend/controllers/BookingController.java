package com.backend.backend.controllers;

import com.backend.backend.models.Booking;
import com.backend.backend.models.BookingStatus;
import com.backend.backend.services.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:5173")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @GetMapping
    public ResponseEntity<List<Booking>> getBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String requesterEmail,
            Authentication authentication) {
        if (isAdmin(authentication)) {
            return ResponseEntity.ok(bookingService.getAllBookings(status, resourceId, requesterEmail));
        }
        return ResponseEntity.ok(bookingService.getBookingsForUser(getEmail(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable String id, Authentication authentication) {
        Booking booking = bookingService.getBookingById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found."));

        if (!isAdmin(authentication) && !booking.getRequestedByEmail().equalsIgnoreCase(getEmail(authentication))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(booking);
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(@RequestBody Booking booking, Authentication authentication) {
        Booking created = bookingService.createBooking(booking, getEmail(authentication), getName(authentication));
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Booking> approveBooking(@PathVariable String id) {
        return ResponseEntity.ok(bookingService.approveBooking(id));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Booking> rejectBooking(@PathVariable String id, @RequestBody Map<String, String> request) {
        String reason = request.get("reason");
        return ResponseEntity.ok(bookingService.rejectBooking(id, reason));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable String id, Authentication authentication) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, getEmail(authentication), isAdmin(authentication)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable String id, Authentication authentication) {
        bookingService.deleteBooking(id, getEmail(authentication), isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }

    private String getEmail(Authentication authentication) {
        if (authentication == null) {
            return "";
        }
        if (authentication.getPrincipal() instanceof OidcUser oidcUser) {
            return oidcUser.getEmail();
        }
        return authentication.getName();
    }

    private String getName(Authentication authentication) {
        if (authentication == null) {
            return "";
        }
        if (authentication.getPrincipal() instanceof OidcUser oidcUser) {
            return oidcUser.getFullName();
        }
        return authentication.getName();
    }

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null) {
            return false;
        }
        Set<String> authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
        return authorities.contains("ROLE_ADMIN");
    }
}
