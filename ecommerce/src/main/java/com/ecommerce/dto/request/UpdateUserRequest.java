package com.ecommerce.dto.request;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UpdateUserRequest {
    @Email(message = "Please provide valid email")
    private String email;
    private String FirstName;
    private String LastName;
}
