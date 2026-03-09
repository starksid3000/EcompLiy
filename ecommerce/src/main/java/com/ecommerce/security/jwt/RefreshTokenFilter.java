package com.ecommerce.security.jwt;

import com.ecommerce.entity.User;
import com.ecommerce.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Mirrors NestJS RefreshTokenStrategy (passport-jwt, secretOrKey: JWT_REFRESH_SECRET).
 *
 * Key behaviours matched from your NestJS code:
 *  1. Token is parsed with JWT_REFRESH_SECRET (separate from access secret)
 *  2. Stored refreshToken is bcrypt-hashed — validated with bcrypt.compare()
 *  3. Raw token is passed as credentials so AuthService can re-hash on rotation
 *  4. Only applies to POST /api/auth/refresh
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenFilter extends OncePerRequestFilter {

    private static final String REFRESH_PATH = "/api/auth/refresh";

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getServletPath().equals(REFRESH_PATH);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Refresh endpoint called without Authorization header");
            filterChain.doFilter(request, response);
            return;
        }

        // Raw token from header — mirrors: req.headers.authorization.replace('Bearer', '').trim()
        final String rawRefreshToken = authHeader.substring(7).trim();

        try {
            // Parse with REFRESH secret — throws if signed with access secret or expired
            final String userEmail = jwtService.extractUsernameFromRefreshToken(rawRefreshToken);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                User user = userRepository.findByEmail(userEmail).orElse(null);

                if (user == null || user.getRefreshToken() == null) {
                    log.warn("No refresh token found in DB for user: {}", userEmail);
                    filterChain.doFilter(request, response);
                    return;
                }

                // bcrypt.compare(rawToken, hashedStoredToken) — matches NestJS RefreshTokenStrategy
                boolean tokenMatches = passwordEncoder.matches(rawRefreshToken, user.getRefreshToken());

                if (tokenMatches && jwtService.isRefreshTokenValid(rawRefreshToken, user)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    user,
                                    rawRefreshToken, // passed as credentials so AuthService can rotate
                                    user.getAuthorities()
                            );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    log.warn("Refresh token bcrypt mismatch for user: {}", userEmail);
                }
            }
        } catch (Exception e) {
            log.warn("Refresh token validation failed: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
