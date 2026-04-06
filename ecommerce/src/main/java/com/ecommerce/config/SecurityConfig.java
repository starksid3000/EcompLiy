package com.ecommerce.config;

import com.ecommerce.security.jwt.JwtAuthenticationFilter;
import com.ecommerce.security.jwt.RefreshTokenFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity                   // enables @PreAuthorize("hasRole('ADMIN')") etc.
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final RefreshTokenFilter refreshTokenFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF (stateless JWT API)
                .csrf(AbstractHttpConfigurer::disable)

                // Stateless session — no HttpSession
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Route-level authorization rules
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/auth/register",
                                "/auth/login",
                                "/auth/refresh",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/swagger-ui/index.html",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()
                        // Public GET routes — matches NestJS (no @UseGuards on GET endpoints)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/products/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/category/**").permitAll()
                        .anyRequest().authenticated()
                )

                // Wire in the custom AuthenticationProvider (uses our UserDetailsService + BCrypt)
                .authenticationProvider(authenticationProvider)

                // Refresh token filter runs BEFORE the standard JWT filter
                .addFilterBefore(refreshTokenFilter, UsernamePasswordAuthenticationFilter.class)

                // Access token filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
