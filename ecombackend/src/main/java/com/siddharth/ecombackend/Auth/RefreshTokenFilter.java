package com.siddharth.ecombackend.Auth.dto;

import com.siddharth.ecombackend.Entity.User;
import com.siddharth.ecombackend.Repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Validates refresh tokens only for the /auth/refresh endpoint.
 * Verifies the token matches the one stored in the DB (rotation check).
 */
@Component
public class RefreshTokenFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public RefreshTokenFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Only runs for /auth/refresh
        return !"/auth/refresh".equals(request.getServletPath());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing refresh token");
            return;
        }

        String token = authHeader.substring(7);

        try {
            if (!jwtUtil.isRefreshToken(token)) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Not a refresh token");
                return;
            }

            UUID userId = jwtUtil.extractUserId(token);
            User user = userRepository.findById(userId).orElse(null);

            if (user == null || !token.equals(user.getRefreshToken())) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or rotated refresh token");
                return;
            }

            var auth = new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_USER"))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);

        } catch (JwtException | IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid refresh token");
            return;
        }

        filterChain.doFilter(request, response);
    }
}