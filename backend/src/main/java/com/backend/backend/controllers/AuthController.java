package com.backend.backend.controllers;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/user")
    public Map<String, Object> getUser(@AuthenticationPrincipal OidcUser principal) {
        if (principal == null) return Map.of("authenticated", false);
        
        // Extract roles to tell the frontend if this user is an ADMIN or USER
        return Map.of(
            "authenticated", true,
            "name", principal.getFullName(),
            "email", principal.getEmail(),
            "roles", principal.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .collect(Collectors.toList())
        );
    }
}