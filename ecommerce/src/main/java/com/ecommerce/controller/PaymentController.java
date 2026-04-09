package com.ecommerce.controller;

import com.ecommerce.dto.request.ConfirmPaymentRequest;
import com.ecommerce.dto.request.CreatePaymentIntentRequest;
import com.ecommerce.dto.response.PaymentResponse;
import com.ecommerce.entity.User;
import com.ecommerce.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Tag(name="payments")
public class PaymentController {
    private final PaymentService paymentService;

    @PostMapping("/create-intent")
    @Operation(summary = "Create a payment intent for an order ")
    public ResponseEntity<Map<String, Object>> createPaymentIntent(@AuthenticationPrincipal User user, @Valid @RequestBody CreatePaymentIntentRequest request){
        return ResponseEntity.ok(paymentService.createPaymentIntent(user, request));
    }

    @PostMapping("/confirm")
    @Operation(summary = "Confirm payment (Simulated)")
    public ResponseEntity<Map<String, Object>> confirmPayment(@AuthenticationPrincipal User user, @Valid @RequestBody ConfirmPaymentRequest request){
        return ResponseEntity.ok(paymentService.confirmPayment(user, request));
    }
}
