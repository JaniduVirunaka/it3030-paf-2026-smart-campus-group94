package com.backend.backend.controllers;

import com.backend.backend.models.Ticket;
import com.backend.backend.models.TicketComment;
import com.backend.backend.repositories.TicketCommentRepository;
import com.backend.backend.services.NotificationService;
import com.backend.backend.services.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tickets/comments")
public class TicketCommentController {

    @Autowired
    private TicketCommentRepository commentRepository;

    @Autowired
    private TicketService ticketService;

    @Autowired
    private NotificationService notificationService;

    // 1. ADD COMMENT (POST)
    @PostMapping
    public ResponseEntity<?> addComment(@RequestBody TicketComment comment, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        
        comment.setUserId(authentication.getName());
        comment.setCreatedAt(Instant.now());
        comment.setUpdatedAt(Instant.now());
        
        TicketComment saved = commentRepository.save(comment);

        // Notify the ticket owner if the commenter is NOT the owner
        Optional<Ticket> ticketOpt = ticketService.getTicketById(comment.getTicketId());
        if (ticketOpt.isPresent()) {
            Ticket ticket = ticketOpt.get();
            if (!ticket.getUserId().equals(comment.getUserId())) {
                notificationService.create(ticket.getUserId(), "TICKET_COMMENT", 
                    "New comment on your ticket: " + ticket.getCategory() + " from " + comment.getUserName());
            }
        }
        
        return ResponseEntity.ok(saved);
    }

    // 2. GET COMMENTS FOR TICKET (GET)
    @GetMapping("/ticket/{ticketId}")
    public List<TicketComment> getComments(@PathVariable String ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    // 3. UPDATE COMMENT (PUT) - With Ownership Check
    @PutMapping("/{id}")
    public ResponseEntity<?> updateComment(@PathVariable String id, @RequestBody Map<String, String> body, Authentication authentication) {
        Optional<TicketComment> commentOpt = commentRepository.findById(id);
        if (commentOpt.isEmpty()) return ResponseEntity.notFound().build();

        TicketComment comment = commentOpt.get();
        if (!comment.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(403).body("You can only edit your own comments.");
        }

        comment.setContent(body.get("content"));
        comment.setUpdatedAt(Instant.now());
        return ResponseEntity.ok(commentRepository.save(comment));
    }

    // 4. DELETE COMMENT (DELETE) - With Ownership Check
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComment(@PathVariable String id, Authentication authentication) {
        Optional<TicketComment> commentOpt = commentRepository.findById(id);
        if (commentOpt.isEmpty()) return ResponseEntity.notFound().build();

        TicketComment comment = commentOpt.get();
        
        // Admins can delete any comment, Users only their own
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!comment.getUserId().equals(authentication.getName()) && !isAdmin) {
            return ResponseEntity.status(403).body("You can only delete your own comments.");
        }

        commentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Comment deleted"));
    }
}
