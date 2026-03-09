package com.ecommerce.service;

import com.ecommerce.dto.request.LoginRequest;
import com.ecommerce.dto.request.RegisterRequest;
import com.ecommerce.dto.response.AuthResponse;
import com.ecommerce.entity.User;
import com.ecommerce.entity.enums.Role;
import com.ecommerce.exception.EmailAlreadyExistsException;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.security.jwt.JwtService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Mirrors NestJS AuthService exactly:
 *  - register()       → hash password (bcrypt, 12 rounds), generate tokens, hash+store refresh token
 *  - login()          → bcrypt.compare password, generate tokens, hash+store refresh token
 *  - refreshTokens()  → called after RefreshTokenFilter has already validated via bcrypt.compare
 *  - logout()         → set refreshToken = null in DB
 *
 * Refresh token rotation: every login/register/refresh generates a NEW refresh token
 * and overwrites the stored bcrypt hash — old refresh tokens are immediately invalidated.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    // ── Register ──────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("User with this email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword())) // bcrypt, 12 rounds
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.USER)
                .build();

        userRepository.save(user);
        log.debug("Registered new user: {}", user.getEmail());

        return issueTokens(user);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // AuthenticationManager calls bcrypt.compare internally via DaoAuthenticationProvider
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = (User) auth.getPrincipal();
        log.debug("User logged in: {}", user.getEmail());

        return issueTokens(user);
    }

    // ── Refresh tokens ────────────────────────────────────────────────────────

    /**
     * Called after RefreshTokenFilter has already:
     *  1. Parsed the token with JWT_REFRESH_SECRET
     *  2. Done bcrypt.compare(rawToken, storedHash)
     * So here we just rotate — generate new pair and hash+store the new refresh token.
     */
    @Transactional
    public AuthResponse refreshTokens(User user) {
        log.debug("Rotating tokens for user: {}", user.getEmail());
        return issueTokens(user);
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    @Transactional
    public void logout(User user) {
        // Set refreshToken = null, matching: prisma.user.update({ data: { refreshToken: null } })
        userRepository.clearRefreshToken(user.getId());
        log.debug("Cleared refresh token for user: {}", user.getEmail());
    }

    // ── Token issuance & rotation ─────────────────────────────────────────────

    /**
     * Generates access + refresh tokens, then bcrypt-hashes and stores the refresh token.
     * Mirrors NestJS:
     *   const tokens = await this.generateTokens(...)
     *   await this.updateRefreshToken(userId, tokens.refreshToken)  // hashed inside updateRefreshToken
     */
    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = jwtService.generateRefreshToken(user);

        // Hash the raw refresh token before persisting — mirrors bcrypt.hash in NestJS
        String hashedRefreshToken = passwordEncoder.encode(rawRefreshToken);
        userRepository.updateRefreshToken(user.getId(), hashedRefreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)   // raw token returned to client
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .build();
    }
}
