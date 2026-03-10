package com.ecommerce.dto.response;

import com.ecommerce.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;

    // Basic user info — avoids returning the full entity
    private UUID userId;
    private String email;
    private String firstName;
    private String lastName;
    private Role role;

    public static class UserResponse {
    }
}
