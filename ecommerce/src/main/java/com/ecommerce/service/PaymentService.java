package com.ecommerce.service;

import com.ecommerce.dto.request.ConfirmPaymentRequest;
import com.ecommerce.dto.request.CreatePaymentIntentRequest;
import com.ecommerce.dto.response.PaymentResponse;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.Payment;
import com.ecommerce.entity.User;
import com.ecommerce.entity.enums.OrderStatus;
import com.ecommerce.entity.enums.PaymentStatus;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.GlobalExceptionHandler;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.PaymentRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    @Transactional
    public Map<String, Object> createPaymentIntent(User user, CreatePaymentIntentRequest request){
        UUID orderid = UUID.fromString(request.getOrderId());

        Order order = orderRepository.findByIdAndUserId(orderid, user.getId())
                .orElseThrow(() -> new GlobalExceptionHandler.ResourceNotFounException("Order not found or does not belong to you"));

        Optional<Payment> existingPaymentOpt = paymentRepository.findByOrderId(orderid);

        if(existingPaymentOpt.isPresent() && existingPaymentOpt.get().getStatus() == PaymentStatus.COMPLETED){
            throw new BadRequestException("Payment already exists");
        }

        String mockClientSecret = "pi_mock" + UUID.randomUUID().toString() + "_secret_" + UUID.randomUUID().toString();
        String mockTransactionId = "pi_mock" + UUID.randomUUID().toString();

        Payment payment;
        if(existingPaymentOpt.isPresent()){
            payment = existingPaymentOpt.get();
        }else{
            payment = Payment.builder()
                    .order(order)
                    .user(user)
                    .amount(BigDecimal.valueOf(request.getAmount()))
                    .currency(request.getCurrency())
                    .status(PaymentStatus.PENDING)
                    .paymentMethod("STRIPE")
                    .transactionId(mockTransactionId)
                    .build();
        }
        payment.setTransactionId(mockTransactionId);
        payment.setAmount(BigDecimal.valueOf(request.getAmount()));
        payment.setCurrency(request.getCurrency());

        payment = paymentRepository.save(payment);

        order.setPayment(payment);
        orderRepository.save(order);

        log.debug("Simulated payment intent creatd for order {} with transation id {}", orderid, mockTransactionId);

        return Map.of(
                "success", true,
                "data",Map.of("clientSecret", mockClientSecret,
                        "paymentId", payment.getId()
                ),
                "message", "Payment Intent created successfully (Simulated)"
        );
    }
    @Transactional
    public Map<String, Object> confirmPayment(User user, ConfirmPaymentRequest request){
        UUID orderId = UUID.fromString(request.getOrderId());
        String paymentIntentId = request.getPaymentIntentId();

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new GlobalExceptionHandler.ResourceNotFounException("Payment not found"));

        if(!payment.getUser().getId().equals(user.getId())){
            throw  new BadRequestException("Payment does not belong to you");
        }
        if(payment.getStatus() == PaymentStatus.COMPLETED){
            throw new GlobalExceptionHandler.ResourceNotFounException("Payment already completed");
        }
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setTransactionId(paymentIntentId);
        paymentRepository.save(payment);

        Order order = payment.getOrder();
        order.setStatus(OrderStatus.PROCESSING);
        orderRepository.save(order);

        log.debug("Payment confirmed for order {} with transation id {}", orderId, paymentIntentId);

        return Map.of(
                "success", true,
                "data", formatPayment(payment),
                "message", "Payment Successful"
        );
    }
    private PaymentResponse formatPayment(Payment payment){
        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrder().getId())
                .userId(payment.getUser().getId())
                .amount(payment.getAmount().doubleValue())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .paymentMethod(payment.getPaymentMethod())
                .transactionId(payment.getTransactionId())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
