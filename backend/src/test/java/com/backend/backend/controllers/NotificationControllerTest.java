package com.backend.backend.controllers;

import com.backend.backend.models.Notification;
import com.backend.backend.services.CustomUserDetailsService;
import com.backend.backend.services.NotificationService;
import com.backend.backend.repositories.UserRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientAutoConfiguration;
import org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        value = NotificationController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                OAuth2ClientAutoConfiguration.class,
                OAuth2ResourceServerAutoConfiguration.class
        }
)
@AutoConfigureMockMvc(addFilters = false)
public class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private UserRepository userRepository;

    /**
     * Build a UsernamePasswordAuthenticationToken for use with MockMvc's .principal().
     *
     * Spring MVC resolves a controller parameter of type Authentication directly from
     * the HttpServletRequest's Principal when that Principal implements Authentication.
     * UsernamePasswordAuthenticationToken implements both Principal and Authentication,
     * so setting it via .principal() on the MockMvc request builder is sufficient.
     *
     * This works without spring-security-test and without a running filter chain.
     */
    private UsernamePasswordAuthenticationToken authToken(String principalName) {
        return new UsernamePasswordAuthenticationToken(
                principalName,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    // -------------------------------------------------------------------------
    // GET /api/notifications?userId={userId}
    // -------------------------------------------------------------------------

    @Test
    public void testGetNotifications_Success() throws Exception {
        // Arrange
        String userId = "user@test.com";

        Notification notification = new Notification();
        notification.setId("notif-1");
        notification.setUserId(userId);
        notification.setType("BOOKING");
        notification.setMessage("Your booking is confirmed.");
        notification.setRead(false);
        notification.setCreatedAt(Instant.parse("2026-04-18T10:00:00Z"));

        when(notificationService.getForUser(userId)).thenReturn(List.of(notification));

        // Act & Assert
        mockMvc.perform(get("/api/notifications")
                        .param("userId", userId)
                        .principal(authToken(userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("notif-1"))
                .andExpect(jsonPath("$[0].userId").value(userId))
                .andExpect(jsonPath("$[0].type").value("BOOKING"))
                .andExpect(jsonPath("$[0].message").value("Your booking is confirmed."))
                .andExpect(jsonPath("$[0].read").value(false));
    }

    @Test
    public void testGetNotifications_Forbidden() throws Exception {
        mockMvc.perform(get("/api/notifications")
                        .param("userId", "user@test.com")
                        .principal(authToken("other@test.com")))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testGetNotifications_BlankUserId() throws Exception {
        mockMvc.perform(get("/api/notifications")
                        .param("userId", "")
                        .principal(authToken("user@test.com")))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // PATCH /api/notifications/{id}/read
    // -------------------------------------------------------------------------

    @Test
    public void testMarkRead_Success() throws Exception {
        // Arrange
        String userId = "user@test.com";

        Notification updated = new Notification();
        updated.setId("notif-1");
        updated.setUserId(userId);
        updated.setType("BOOKING");
        updated.setMessage("Your booking is confirmed.");
        updated.setRead(true);
        updated.setCreatedAt(Instant.parse("2026-04-18T10:00:00Z"));

        when(notificationService.markRead("notif-1", userId)).thenReturn(updated);

        // Act & Assert
        mockMvc.perform(patch("/api/notifications/notif-1/read")
                        .principal(authToken(userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("notif-1"))
                .andExpect(jsonPath("$.read").value(true));
    }

    @Test
    public void testMarkRead_NotFound() throws Exception {
        String userId = "user@test.com";

        when(notificationService.markRead("notif-1", userId))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found: notif-1"));

        mockMvc.perform(patch("/api/notifications/notif-1/read")
                        .principal(authToken(userId)))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testMarkRead_Forbidden() throws Exception {
        String userId = "user@test.com";

        when(notificationService.markRead("notif-1", userId))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

        mockMvc.perform(patch("/api/notifications/notif-1/read")
                        .principal(authToken(userId)))
                .andExpect(status().isForbidden());
    }
}
