package com.backend.backend.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.backend.backend.repositories.NotificationRepository;
import com.backend.backend.models.Notification;
import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository repo;

    public NotificationService(NotificationRepository repo) { this.repo = repo; }

    public List<Notification> getForUser(String userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Notification markRead(String id, String requestingUserId) {
        Notification n = repo.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found: " + id));
        if (!n.getUserId().equals(requestingUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        n.setRead(true);
        return repo.save(n);
    }
}
