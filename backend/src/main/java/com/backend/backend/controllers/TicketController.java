package com.backend.backend.controllers;

import com.backend.backend.models.Ticket;
import com.backend.backend.services.NotificationService;
import com.backend.backend.services.TicketService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @Autowired
    private NotificationService notificationService;

    // 1. CREATE TICKET (POST)
    @PostMapping
    public ResponseEntity<?> createTicket(@Valid @RequestBody Ticket ticket, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        ticket.setUserId(authentication.getName());
        Ticket saved = ticketService.createTicket(ticket);
        
        // Notify Admins about new ticket (Optional but good)
        // notificationService.create("admin-email@example.com", "TICKET_NEW", "New incident reported: " + saved.getCategory());
        
        return ResponseEntity.ok(saved);
    }

    // 2. GET TICKETS (GET)
    @GetMapping
    public List<Ticket> getTickets(Authentication authentication) {
        if (authentication == null) return List.of();
        
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (isAdmin) {
            return ticketService.getAllTickets();
        } else {
            return ticketService.getTicketsByUserId(authentication.getName());
        }
    }

    // 3. GET SINGLE TICKET (GET)
    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable String id, Authentication authentication) {
        Optional<Ticket> ticket = ticketService.getTicketById(id);
        if (ticket.isEmpty()) return ResponseEntity.notFound().build();
        
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isAdmin && !ticket.get().getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(403).build();
        }
        
        return ResponseEntity.ok(ticket.get());
    }

    // 4. UPDATE TICKET (PUT)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTicket(@PathVariable String id, @RequestBody Ticket ticketDetails, Authentication authentication) {
        Optional<Ticket> ticketOpt = ticketService.getTicketById(id);
        if (ticketOpt.isEmpty()) return ResponseEntity.notFound().build();

        Ticket ticket = ticketOpt.get();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        // Only owner or admin can update details
        // Note: Technician logic can be added here as well if needed
        if (!ticket.getUserId().equals(authentication.getName()) && !isAdmin) {
            return ResponseEntity.status(403).build();
        }

        if (ticketDetails.getCategory() != null) ticket.setCategory(ticketDetails.getCategory());
        if (ticketDetails.getDescription() != null) ticket.setDescription(ticketDetails.getDescription());
        if (ticketDetails.getPriority() != null) ticket.setPriority(ticketDetails.getPriority());
        
        // Trigger notification if status changes
        if (ticketDetails.getStatus() != null && !ticketDetails.getStatus().equals(ticket.getStatus())) {
            ticket.setStatus(ticketDetails.getStatus());
            notificationService.create(ticket.getUserId(), "TICKET_STATUS", 
                "Your ticket status for " + ticket.getResourceName() + " has been updated to " + ticket.getStatus());
        }

        if (ticketDetails.getResolutionNotes() != null) ticket.setResolutionNotes(ticketDetails.getResolutionNotes());
        if (ticketDetails.getTechnicianId() != null) ticket.setTechnicianId(ticketDetails.getTechnicianId());
        if (ticketDetails.getAdminReason() != null) ticket.setAdminReason(ticketDetails.getAdminReason());
        if (ticketDetails.getAttachments() != null) ticket.setAttachments(ticketDetails.getAttachments());

        return ResponseEntity.ok(ticketService.updateTicket(ticket));
    }

    // 5. DELETE TICKET (DELETE)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTicket(@PathVariable String id, Authentication authentication) {
        Optional<Ticket> ticketOpt = ticketService.getTicketById(id);
        if (ticketOpt.isEmpty()) return ResponseEntity.notFound().build();

        Ticket ticket = ticketOpt.get();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        // Only owner can delete their own openness or admin
        if (!ticket.getUserId().equals(authentication.getName()) && !isAdmin) {
            return ResponseEntity.status(403).build();
        }

        ticketService.deleteTicket(id);
        return ResponseEntity.ok(Map.of("message", "Ticket deleted successfully"));
    }
}
