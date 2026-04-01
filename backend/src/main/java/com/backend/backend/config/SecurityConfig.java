package com.backend.backend.config;

import java.util.HashSet;
import java.util.Set;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.oauth2.core.oidc.user.OidcUserAuthority;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.core.user.OAuth2UserAuthority;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .cors(org.springframework.security.config.Customizer.withDefaults())
        .csrf(csrf -> csrf.disable())
        .authorizeHttpRequests(auth -> auth
            // CHANGE: Permit all just lets the request through. 
            // 'permitAll' on the auth check sometimes fails to populate the Principal.
            .requestMatchers("/api/auth/user").permitAll() 
            .requestMatchers(HttpMethod.GET, "/api/resources/**").authenticated()
            .requestMatchers("/api/resources/**").hasRole("ADMIN")
            .anyRequest().authenticated()
        )
       .oauth2Login(oauth2 -> oauth2
            // --- NEW: Tell OAuth2 to use our custom role mapper! ---
            .userInfoEndpoint(userInfo -> userInfo
                .userAuthoritiesMapper(userAuthoritiesMapper())
            )
            .defaultSuccessUrl("http://localhost:5173/dashboard", true)
        );
    return http.build();
}

// Helper to assign the ADMIN role to your specific email
@Bean
public GrantedAuthoritiesMapper userAuthoritiesMapper() {
    return (authorities) -> {
        Set<GrantedAuthority> mappedAuthorities = new HashSet<>();
        authorities.forEach(authority -> {
            mappedAuthorities.add(authority); // Keep all the original Google roles

            // Check if it's an OIDC user
            if (authority instanceof OidcUserAuthority oidcAuth) {
                if ("janiduvirunkadev@gmail.com".equals(oidcAuth.getIdToken().getEmail())) {
                    mappedAuthorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                }
            } 
            // Check if it's a standard OAuth2 user
            else if (authority instanceof OAuth2UserAuthority oauth2Auth) {
                if ("janiduvirunkadev@gmail.com".equals(oauth2Auth.getAttributes().get("email"))) {
                    mappedAuthorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                }
            }
        });
        
        mappedAuthorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        return mappedAuthorities;
    };
}
}