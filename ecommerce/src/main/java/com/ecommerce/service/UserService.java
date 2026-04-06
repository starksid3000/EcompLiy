package com.ecommerce.service;

import com.ecommerce.dto.request.ChagePasswordRequest;
import com.ecommerce.dto.request.UpdateUserRequest;
import com.ecommerce.dto.response.UserResponse;
import com.ecommerce.entity.User;
import com.ecommerce.exception.EmailAlreadyExistsException;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.GlobalExceptionHandler;
import com.ecommerce.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;


    //Get users/me - finds by loggedin user's id
    public UserResponse findOne(UUID userId){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalExceptionHandler.ResourceNotFounException("user not found"));

        return mapToResponse(user);
    }

    //Get users - admin
    public List<UserResponse> findAll(){
        return userRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    //User update Profile
    @Transactional
    public UserResponse update(UUID userId, UpdateUserRequest request){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalExceptionHandler.ResourceNotFounException("User not found"));

        if(request.getEmail() != null && !request.getEmail().equals(user.getEmail())){
            if(userRepository.existsByEmail(request.getEmail())){
                throw new EmailAlreadyExistsException("Email already exists");
            }
            user.setEmail(request.getEmail());
        }
        if(request.getFirstName() != null){
            user.setFirstName(request.getFirstName());
        }
        if(request.getLastName() != null){
            user.setLastName(request.getLastName());
        }
        userRepository.save(user);
        log.debug("Updated profile for user: {}", user.getEmail());
        return mapToResponse(user);
    }

    @Transactional
    public void changePassword(UUID id, ChagePasswordRequest request){
        User user = userRepository.findById(id)
                .orElseThrow( () -> new GlobalExceptionHandler.ResourceNotFounException("User not found"));
        if(!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())){
            throw new BadRequestException("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.debug("Password changed for user: {}", user.getEmail());
    }

    //Delete user-profile
    @Transactional
    public void remove(UUID userId){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalExceptionHandler.ResourceNotFounException("User not found"));

        userRepository.delete(user);
        log.debug("Removed user: {}", user.getEmail());
    }
    @Transactional
    public UserResponse updateRole(UUID id, com.ecommerce.entity.enums.Role newRole){
        User user = userRepository.findById(id)
                .orElseThrow(() -> new GlobalExceptionHandler.ResourceNotFounException("User not found"));

        user.setRole(newRole);
        userRepository.save(user);
        log.debug("Updated role for user {} to {}", user.getEmail(), newRole);
        return mapToResponse(user);
    }
    //Helper
    public UserResponse mapToResponse(User user){
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
