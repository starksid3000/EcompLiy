package com.ecommerce.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Mirrors NestJS main.ts app.enableCors():
 *
 *   origin:         process.env.ALLOWED_ORIGINS?.split(',') ?? 'http://localhost:3000'
 *   credentials:    true
 *   methods:        GET, POST, PUT, DELETE, PATCH, OPTIONS
 *   allowedHeaders: Content-Type, Authorization, Accept
 */
@Configuration
public class CorsConfig {

    // mirrors: process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000'
    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // mirrors: origin: process.env.ALLOWED_ORIGINS?.split(',')
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        config.setAllowedOrigins(origins);

        // mirrors: credentials: true
        config.setAllowCredentials(true);

        // mirrors: methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // mirrors: allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
        config.setAllowedHeaders(List.of("Content-Type", "Authorization", "Accept"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}