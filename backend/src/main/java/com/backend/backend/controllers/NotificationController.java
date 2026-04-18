package com.backend.backend.controllers;

import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import com.backend.backend.models.Notification;
import com.backend.backend.services.NotificationService;

@Validated
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService service;
    public NotificationController(NotificationService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<List<Notification>> getUserNotifications(
            @NotBlank @RequestParam String userId,
            Authentication authentication) {
        if (!authentication.getName().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return ResponseEntity.ok(service.getForUser(userId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markRead(
            @PathVariable String id,
            Authentication authentication) {
        return ResponseEntity.ok(service.markRead(id, authentication.getName()));
    }
}
