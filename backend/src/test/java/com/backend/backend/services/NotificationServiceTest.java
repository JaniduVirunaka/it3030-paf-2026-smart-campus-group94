package com.backend.backend.services;

import com.backend.backend.models.Notification;
import com.backend.backend.repositories.NotificationRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @Mock
    private NotificationRepository repo;

    @InjectMocks
    private NotificationService service;

    @Test
    public void testGetForUser_ReturnsSortedList() {
        Notification n1 = buildNotification("notif-1", "owner@test.com", false, Instant.parse("2026-04-18T12:00:00Z"));
        Notification n2 = buildNotification("notif-2", "owner@test.com", false, Instant.parse("2026-04-18T09:00:00Z"));

        when(repo.findByUserIdOrderByCreatedAtDesc("owner@test.com")).thenReturn(List.of(n1, n2));

        List<Notification> result = service.getForUser("owner@test.com");

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo("notif-1");
        assertThat(result.get(1).getId()).isEqualTo("notif-2");

        verify(repo).findByUserIdOrderByCreatedAtDesc("owner@test.com");
    }

    @Test
    public void testMarkRead_Success() {
        Notification notification = buildNotification("notif-1", "user@test.com", false, Instant.now());
        when(repo.findById("notif-1")).thenReturn(Optional.of(notification));

        Notification saved = buildNotification("notif-1", "user@test.com", true, notification.getCreatedAt());
        when(repo.save(notification)).thenReturn(saved);

        Notification result = service.markRead("notif-1", "user@test.com");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(repo).save(captor.capture());
        assertThat(captor.getValue().isRead()).isTrue();
        assertThat(result.isRead()).isTrue();
        assertThat(result.getId()).isEqualTo("notif-1");
    }

    @Test
    public void testMarkRead_NotFound() {
        when(repo.findById("bad-id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.markRead("bad-id", "user@test.com"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(rse.getReason()).contains("bad-id");
                });

        verify(repo, never()).save(any());
    }

    @Test
    public void testMarkRead_WrongUser() {
        Notification notification = buildNotification("notif-1", "owner@test.com", false, Instant.now());
        when(repo.findById("notif-1")).thenReturn(Optional.of(notification));

        assertThatThrownBy(() -> service.markRead("notif-1", "other@test.com"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                });

        verify(repo, never()).save(any());
    }

    private Notification buildNotification(String id, String userId, boolean read, Instant createdAt) {
        Notification n = new Notification();
        n.setId(id);
        n.setUserId(userId);
        n.setType("BOOKING");
        n.setMessage("Test notification");
        n.setRead(read);
        n.setCreatedAt(createdAt);
        return n;
    }
}
