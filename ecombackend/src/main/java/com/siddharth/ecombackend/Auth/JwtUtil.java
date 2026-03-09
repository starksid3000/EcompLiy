package com.siddharth.ecombackend.Auth.dto;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwt;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiry:900000}")
    private long accessTokenExpiry;

    @Value("${jwt.refresh-token-expiry:604800000}")
    private long refreshTokenExpiry;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
    public String generateAccessToken(UUID userId, String email) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email",email)
                .claim("type","access")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiry))
                .signWith(getKey())
                .compact();
    }
    public String generateRefreshToken(UUID userId, String email) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("type", "refresh")
                .claim("refreshId", UUID.randomUUID().toString()) // unique per rotation
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiry))
                .signWith(getKey())
                .compact();
    }

    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    public UUID extractUserId(String token) {
        return UUID.fromString(validateToken(token).getSubject());
    }

    public String extractEmail(String token) {
        return validateToken(token).get("email", String.class);
    }

    public boolean isRefreshToken(String token) {
        return "refresh".equals(validateToken(token).get("type", String.class));
    }

    public boolean isAccessToken(String token) {
        return "access".equals(validateToken(token).get("type", String.class));
    }
}
