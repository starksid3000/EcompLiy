package com.ecommerce.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Date;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

/**
 * Mirrors NestJS AuthService.generateTokens():
 *  - Access token  → signed with JWT_SECRET         (15 min)
 *  - Refresh token → signed with JWT_REFRESH_SECRET (7 days) + refreshId claim for extra entropy
 *
 * Two separate signing keys match your NestJS JwtModule / RefreshTokenStrategy config.
 */
@Service
@Slf4j
public class JwtService {

    @Value("${jwt.secret}")
    private String accessSecret;

    @Value("${jwt.refresh-secret}")
    private String refreshSecret;

    @Value("${jwt.access-token.expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token.expiration}")
    private long refreshTokenExpiration;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ── Signing keys ─────────────────────────────────────────────────────────

    private SecretKey getAccessSigningKey() {
        return Keys.hmacShaKeyFor(accessSecret.getBytes(StandardCharsets.UTF_8));
    }

    private SecretKey getRefreshSigningKey() {
        return Keys.hmacShaKeyFor(refreshSecret.getBytes(StandardCharsets.UTF_8));
    }

    // ── Token generation ─────────────────────────────────────────────────────

    /**
     * Signed with JWT_SECRET. Payload: { sub, email, type:"access" }
     */
    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "access");
        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .id(UUID.randomUUID().toString())
                .signWith(getAccessSigningKey())
                .compact();
    }

    /**
     * Signed with JWT_REFRESH_SECRET.
     * Payload: { sub, email, refreshId, type:"refresh" }
     * refreshId mirrors the NestJS randomBytes(16).toString('hex') for extra entropy.
     */
    public String generateRefreshToken(UserDetails userDetails) {
        // 16 random bytes → hex string, same as NestJS randomBytes(16).toString('hex')
        byte[] bytes = new byte[16];
        SECURE_RANDOM.nextBytes(bytes);
        String refreshId = HexFormat.of().formatHex(bytes);

        Map<String, Object> claims = new HashMap<>();
        claims.put("refreshId", refreshId);
        claims.put("type", "refresh");

        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiration))
                .id(UUID.randomUUID().toString())
                .signWith(getRefreshSigningKey())
                .compact();
    }

    // ── Token validation ─────────────────────────────────────────────────────

    /**
     * Validates an access token against the access secret.
     */
    public boolean isAccessTokenValid(String token, UserDetails userDetails) {
        try {
            String username = extractUsernameFromAccessToken(token);
            return username.equals(userDetails.getUsername())
                    && !isAccessTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid access token: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validates a refresh token against the refresh secret.
     */
    public boolean isRefreshTokenValid(String token, UserDetails userDetails) {
        try {
            String username = extractUsernameFromRefreshToken(token);
            return username.equals(userDetails.getUsername())
                    && !isRefreshTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid refresh token: {}", e.getMessage());
            return false;
        }
    }

    // ── Username extraction ───────────────────────────────────────────────────

    public String extractUsernameFromAccessToken(String token) {
        return extractAccessClaim(token, Claims::getSubject);
    }

    public String extractUsernameFromRefreshToken(String token) {
        return extractRefreshClaim(token, Claims::getSubject);
    }

    // ── Expiry helpers ────────────────────────────────────────────────────────

    private boolean isAccessTokenExpired(String token) {
        return extractAccessClaim(token, Claims::getExpiration).before(new Date());
    }

    private boolean isRefreshTokenExpired(String token) {
        return extractRefreshClaim(token, Claims::getExpiration).before(new Date());
    }

    // ── Claims extraction ─────────────────────────────────────────────────────

    public <T> T extractAccessClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(parseToken(token, getAccessSigningKey()));
    }

    public <T> T extractRefreshClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(parseToken(token, getRefreshSigningKey()));
    }

    private Claims parseToken(String token, SecretKey key) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
