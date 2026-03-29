import React, { useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import useCartStore from "../store/cartStore";

const Cart = () => {
  const {
    cartItems,
    totalAmount,
    loading,
    fetchCart,
    updateItem,
    removeItem,
    clearCart,
  } = useCartStore();
  const navigate = useNavigate();
  const toast = useRef(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const handleQuantityChange = async (item, newQty) => {
    if (newQty < 1) return;
    try {
      await updateItem(item.id, newQty);
      toast.current?.show({
        severity: "success",
        summary: "Updated",
        detail: "Quantity updated",
        life: 1500,
      });
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Update Failed",
        detail: err.response?.data?.message || "Could not update quantity.",
        life: 3000,
      });
    }
  };

  const handleRemove = async (item) => {
    await removeItem(item.id);
    toast.current?.show({
      severity: "info",
      summary: "Removed",
      detail: `${item.product?.name || "Item"} removed from cart`,
      life: 2000,
    });
  };

  const handleClearCart = async () => {
    await clearCart();
    toast.current?.show({
      severity: "warn",
      summary: "Cart Cleared",
      detail: "All items removed from your cart",
      life: 2000,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center py-8">
        <ProgressSpinner />
      </div>
    );
  }

  const imageBody = (item) => (
    <img
      src={
        item.product?.imageUrl ||
        "https://primefaces.org/cdn/primereact/images/usercard.png"
      }
      alt={item.product?.name}
      className="border-round"
      style={{ width: "60px", height: "60px", objectFit: "cover" }}
    />
  );

  const nameBody = (item) => (
    <div>
      <span className="font-semibold text-900">{item.product?.name}</span>
    </div>
  );

  const priceBody = (item) => (
    <span className="font-semibold">
      ${Number(item.product?.price).toFixed(2)}
    </span>
  );

  const quantityBody = (item) => (
    <InputNumber
      value={item.quantity}
      onValueChange={(e) => handleQuantityChange(item, e.value)}
      showButtons
      buttonLayout="horizontal"
      min={1}
      max={99}
      incrementButtonIcon="pi pi-plus"
      decrementButtonIcon="pi pi-minus"
      incrementButtonClassName="p-button-text p-button-sm"
      decrementButtonClassName="p-button-text p-button-sm"
      inputClassName="w-3rem text-center"
      style={{ width: "8rem" }}
    />
  );

  const subtotalBody = (item) => (
    <span className="font-bold text-primary">
      ${(Number(item.product?.price) * item.quantity).toFixed(2)}
    </span>
  );

  const actionBody = (item) => (
    <Button
      icon="pi pi-trash"
      className="p-button-rounded p-button-danger p-button-text"
      onClick={() => handleRemove(item)}
      tooltip="Remove"
      tooltipOptions={{ position: "top" }}
    />
  );

  return (
    <div className="px-2 py-4 md:px-4">
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-5">
        <h1 className="text-900 font-bold text-3xl m-0">
          <i className="pi pi-shopping-cart mr-3 text-primary" />
          Shopping Cart
        </h1>
        {cartItems.length > 0 && (
          <Button
            label="Clear Cart"
            icon="pi pi-trash"
            className="p-button-outlined p-button-danger p-button-sm"
            onClick={handleClearCart}
          />
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="flex flex-column align-items-center py-8">
          <i className="pi pi-shopping-cart text-6xl text-400 mb-4" />
          <h2 className="text-700 font-medium mb-3">Your cart is empty</h2>
          <p className="text-500 mb-4">
            Looks like you haven't added any items yet.
          </p>
          <Button
            label="Browse Products"
            icon="pi pi-shopping-bag"
            className="p-button-rounded"
            onClick={() => navigate("/products")}
          />
        </div>
      ) : (
        <>
          <DataTable
            value={cartItems}
            responsiveLayout="scroll"
            className="shadow-2 border-round-xl"
            stripedRows
          >
            <Column body={imageBody} header="" style={{ width: "80px" }} />
            <Column body={nameBody} header="Product" />
            <Column body={priceBody} header="Price" />
            <Column body={quantityBody} header="Quantity" />
            <Column body={subtotalBody} header="Subtotal" />
            <Column body={actionBody} header="" style={{ width: "60px" }} />
          </DataTable>

          {/* Order Summary */}
          <div className="flex justify-content-end mt-5">
            <div
              className="surface-card shadow-2 border-round-xl p-4"
              style={{ minWidth: "320px" }}
            >
              <h3 className="text-900 font-bold mb-3">Order Summary</h3>
              <div className="flex justify-content-between mb-2">
                <span className="text-600">Subtotal</span>
                <span className="font-semibold">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-content-between mb-2">
                <span className="text-600">Shipping</span>
                <span className="font-semibold text-green-500">Free</span>
              </div>
              <hr className="my-3 border-none border-top-1 surface-border" />
              <div className="flex justify-content-between mb-4">
                <span className="text-900 font-bold text-xl">Total</span>
                <span className="text-primary font-bold text-xl">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
              <Button
                label="Proceed to Checkout"
                icon="pi pi-credit-card"
                className="w-full p-button-rounded font-semibold"
                onClick={() => navigate("/checkout")}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
