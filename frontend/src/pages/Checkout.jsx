import React, { useState, useRef, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import api from "../utils/api";
import useCartStore from "../store/cartStore";

const STRIPE_PK =
  "pk_test_51TBTpcQh7abcYctgyS1nB1bFQ5R5wlUvri1OHSH9r2Z825Eg1L1LskCiWGuhdKna1JKGWT6M0WKOy9Max8P6upmQ00H2UxhNdY";
const stripePromise = loadStripe(STRIPE_PK);

//Payment Form 
const PaymentForm = ({ orderId, amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message);
      setProcessing(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/orders",
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message);
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      // Confirm on backend
      try {
        await api.post("/payments/confirm", {
          paymentIntentId: paymentIntent.id,
          orderId,
        });
        onSuccess();
      } catch {
        setError("Payment succeeded but confirmation failed. Contact support.");
      }
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement className="mb-4" />
      {error && (
        <div className="p-3 mb-3 border-round bg-red-50 text-red-700 text-sm">
          <i className="pi pi-exclamation-circle mr-2" />
          {error}
        </div>
      )}
      <Button
        type="submit"
        label={
          processing ? "Processing..." : `Pay $${Number(amount).toFixed(2)}`
        }
        icon={processing ? "pi pi-spin pi-spinner" : "pi pi-lock"}
        className="w-full p-button-rounded font-semibold py-3 text-lg"
        disabled={!stripe || processing}
        loading={processing}
      />
    </form>
  );
};

// Checkout Page 
const Checkout = () => {
  const { cartItems, totalAmount, fetchCart, clearCart } = useCartStore();
  const [shippingAddress, setShippingAddress] = useState("");
  const [step, setStep] = useState("address"); // address | payment | success
  const [clientSecret, setClientSecret] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const handleCreateOrder = async () => {
    if (!shippingAddress.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Required",
        detail: "Please enter a shipping address",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      // Create order from cart
      const orderRes = await api.post("/orders", {
        shippingAddress: shippingAddress.trim(),
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: Number(item.quantity),
          price: Number(Number(item.product.price).toFixed(2)),
        })),
      });
      const order = orderRes.data?.data || orderRes.data;
      const oId = order.id;
      setOrderId(oId);

      // Create payment intent
      const paymentRes = await api.post("/payments/create-intent", {
        orderId: oId,
        amount: totalAmount,
        currency: "usd",
      });
      setClientSecret(paymentRes.data?.data?.clientSecret);
      setStep("payment");
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "Failed to create order",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setStep("success");
  };

  if (step === "success") {
    return (
      <div className="flex flex-column align-items-center justify-content-center py-8">
        <div className="w-6rem h-6rem flex align-items-center justify-content-center bg-green-100 border-circle mb-4">
          <i className="pi pi-check text-5xl text-green-600" />
        </div>
        <h1 className="text-900 font-bold text-3xl mb-2">
          Payment Successful!
        </h1>
        <p className="text-600 text-lg mb-5">
          Thank you for your purchase. Your order is being processed.
        </p>
        <div className="flex gap-3">
          <Button
            label="View Orders"
            icon="pi pi-box"
            className="p-button-rounded"
            onClick={() => navigate("/orders")}
          />
          <Button
            label="Continue Shopping"
            icon="pi pi-shopping-bag"
            className="p-button-rounded p-button-outlined"
            onClick={() => navigate("/products")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 py-4 md:px-4">
      <Toast ref={toast} />

      <h1 className="text-900 font-bold text-3xl mb-5">
        <i className="pi pi-credit-card mr-3 text-primary" />
        Checkout
      </h1>

      <div className="grid">
        {/* Left: Form */}
        <div className="col-12 lg:col-8 p-2">
          <div className="surface-card shadow-2 border-round-xl p-5">
            {step === "address" && (
              <>
                <h2 className="text-900 font-bold text-xl mb-4">
                  <i className="pi pi-map-marker mr-2 text-primary" />
                  Shipping Address
                </h2>
                <InputTextarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  rows={3}
                  className="w-full mb-4"
                  placeholder="Enter your full shipping address..."
                  autoResize
                />
                <Button
                  label={loading ? "Creating Order..." : "Continue to Payment"}
                  icon={loading ? "pi pi-spin pi-spinner" : "pi pi-arrow-right"}
                  iconPos="right"
                  className="w-full p-button-rounded font-semibold py-3"
                  onClick={handleCreateOrder}
                  loading={loading}
                  disabled={loading || cartItems.length === 0}
                />
              </>
            )}

            {step === "payment" && clientSecret && (
              <>
                <h2 className="text-900 font-bold text-xl mb-4">
                  <i className="pi pi-credit-card mr-2 text-primary" />
                  Payment Details
                </h2>
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret, appearance: { theme: "stripe" } }}
                >
                  <PaymentForm
                    orderId={orderId}
                    amount={totalAmount}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              </>
            )}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="col-12 lg:col-4 p-2">
          <div
            className="surface-card shadow-2 border-round-xl p-4 sticky"
            style={{ top: "100px" }}
          >
            <h3 className="text-900 font-bold mb-4">Order Summary</h3>
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex align-items-center gap-3 mb-3 pb-3 border-bottom-1 surface-border"
              >
                <img
                  src={item.product?.imageUrl}
                  alt={item.product?.name}
                  className="border-round"
                  style={{ width: "48px", height: "48px", objectFit: "cover" }}
                />
                <div className="flex-grow-1">
                  <div className="text-sm font-semibold text-900">
                    {item.product?.name}
                  </div>
                  <div className="text-xs text-500">Qty: {item.quantity}</div>
                </div>
                <span className="text-sm font-semibold">
                  ${(Number(item.product?.price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <hr className="my-3 border-none border-top-1 surface-border" />
            <div className="flex justify-content-between mb-2">
              <span className="text-600">Subtotal</span>
              <span className="font-semibold">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-content-between mb-2">
              <span className="text-600">Shipping</span>
              <span className="text-green-500 font-semibold">Free</span>
            </div>
            <hr className="my-3 border-none border-top-1 surface-border" />
            <div className="flex justify-content-between">
              <span className="text-900 font-bold text-xl">Total</span>
              <span className="text-primary font-bold text-xl">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
