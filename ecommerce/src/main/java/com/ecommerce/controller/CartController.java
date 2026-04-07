package com.ecommerce.controller;

import com.ecommerce.dto.request.AddToCartRequest;
import com.ecommerce.dto.request.MergeCartRequest;
import com.ecommerce.dto.request.UpdateCartItemRequest;
import com.ecommerce.dto.response.CartResponse;
import com.ecommerce.entity.User;
import com.ecommerce.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

public class CartController {

}
