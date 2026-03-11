package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChagePasswordRequest {
    @NotBlank(message = "Current password must not be empty")
    private String currentPassword;

    @NotBlank(message = "New password must not be empty")
    @Size(min = 8, message = "Password length must be at least 8 characters")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
            message = "New password must contain at least one uppercase, one lowercase, one special character and one number"
    )
    private String newPassword;
}
