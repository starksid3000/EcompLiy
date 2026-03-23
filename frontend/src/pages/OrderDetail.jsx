import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Timeline } from "primereact/timeline";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import api from "../utils/api";

const statusSeverity = {
  PENDING: "warning",
  PROCESSING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
};

const statusSteps = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useRef(null);

  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/orders/${id}`);
      const data = res.data?.data || res.data;
      setOrder(data);

      // Try to fetch payment info
      try {
        const payRes = await api.get(`/payments/order/${id}`);
        setPayment(payRes.data?.data || payRes.data);
      } catch {
        // Payment info may not exist (e.g., pending orders)
      }
    } catch {
      setError("Order not found or failed to load.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    confirmDialog({
      message: "Are you sure you want to cancel this order?",
      header: "Confirm Cancellation",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.delete(`/orders/${id}`);
          toast.current?.show({
            severity: "success",
            summary: "Cancelled",
            detail: "Order cancelled successfully",
            life: 2000,
          });
          fetchOrder();
        } catch {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Could not cancel order",
            life: 3000,
          });
        }
      },
    });
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="px-2 py-4 md:px-4 lg:px-6">
        <Skeleton width="40%" height="2rem" className="mb-4" />
        <div className="grid">
          <div className="col-12 md:col-8">
            <Skeleton height="300px" borderRadius="16px" />
          </div>
          <div className="col-12 md:col-4">
            <Skeleton height="300px" borderRadius="16px" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-column align-items-center justify-content-center py-8">
        <i className="pi pi-exclamation-triangle text-6xl text-orange-500 mb-4" />
        <h2 className="text-700 font-medium mb-3">
          {error || "Order not found"}
        </h2>
        <Button
          label="Back to Orders"
          icon="pi pi-arrow-left"
          className="p-button-rounded"
          onClick={() => navigate("/orders")}
        />
      </div>
    );
  }
  const isCancelled = order.status === "CANCELLED";
  const currentStepIndex = statusSteps.indexOf(order.status);

  const timelineEvents = statusSteps.map((step, i) => ({
    status: step,
    icon:
      isCancelled && step === order.status
        ? "pi pi-times"
        : i <= currentStepIndex
          ? "pi pi-check"
          : "pi pi-circle",
    color: isCancelled
      ? i === 0
        ? "var(--red-500)"
        : "var(--surface-400)"
      : i <= currentStepIndex
        ? "var(--primary-color)"
        : "var(--surface-400)",
  }));

  const displayEvents = isCancelled
    ? [
        { status: "PENDING", icon: "pi pi-check", color: "var(--surface-400)" },
        { status: "CANCELLED", icon: "pi pi-check", color: "var(--red-500)" },
      ]
    : timelineEvents;
  return (
    <div className="px-2 py-4 md:px-4 lg:px-6">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Breadcrumb */}
      <div className="flex align-items-center gap-2 mb-4 text-500">
        <span
          className="cursor-pointer hover:text-primary"
          onClick={() => navigate("/")}
        >
          Home
        </span>
        <i className="pi pi-chevron-right text-xs" />
        <span
          className="cursor-pointer hover:text-primary"
          onClick={() => navigate("/orders")}
        >
          Orders
        </span>
        <i className="pi pi-chevron-right text-xs" />
        <span className="text-900 font-medium">#{order.id.slice(0, 8)}...</span>
      </div>

      {/* Header */}
      <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-5 gap-3">
        <div>
          <h1 className="text-900 font-bold text-3xl m-0 mb-2">
            <i className="pi pi-box mr-3 text-primary" />
            Order #{order.id.slice(0, 8)}...
          </h1>
          <span className="text-500">
            Placed on {formatDate(order.createdAt)}
          </span>
        </div>
        <div className="flex align-items-center gap-2">
          <Tag
            value={order.status}
            severity={statusSeverity[order.status] || "info"}
            className="text-base px-3 py-2"
          />
          {order.status === "PENDING" && (
            <Button
              label="Cancel Order"
              icon="pi pi-times"
              className="p-button-danger p-button-outlined p-button-sm"
              onClick={handleCancel}
            />
          )}
        </div>
      </div>

      {/* Order Status Timeline */}
      <div className="surface-card shadow-2 border-round-2xl p-4 mb-4">
        <h3 className="text-900 font-bold mb-4">
          <i className="pi pi-map-marker mr-2 text-primary" />
          Order Progress
        </h3>
        <Timeline
          value={displayEvents}
          layout="horizontal"
          align="bottom"
          marker={(item) => (
            <span
              className="flex align-items-center justify-content-center border-circle shadow-1"
              style={{
                width: "2.5rem",
                height: "2.5rem",
                backgroundColor: item.color,
                color: "#fff",
              }}
            >
              <i className={item.icon} />
            </span>
          )}
          content={(item) => (
            <span className="text-sm font-semibold text-700">
              {item.status}
            </span>
          )}
          className="w-full"
        />
      </div>

      <div className="grid">
        {/* Items */}
        <div className="col-12 lg:col-8 p-2">
          <div className="surface-card shadow-2 border-round-2xl p-4">
            <h3 className="text-900 font-bold mb-4">
              <i className="pi pi-list mr-2 text-primary" />
              Order Items ({order.items?.length || 0})
            </h3>
            <DataTable
              value={order.items || []}
              responsiveLayout="scroll"
              className="border-round-xl"
              stripedRows
              emptyMessage="No items"
            >
              <Column
                header="Product"
                body={(item) => (
                  <div className="flex align-items-center gap-3">
                    <span
                      className="text-primary font-semibold cursor-pointer hover:underline"
                      onClick={() => navigate(`/products/${item.productId}`)}
                    >
                      {item.productName}
                    </span>
                  </div>
                )}
              />
              <Column
                header="Price"
                body={(item) => (
                  <span className="font-medium">
                    ${Number(item.price).toFixed(2)}
                  </span>
                )}
              />
              <Column
                header="Qty"
                body={(item) => (
                  <span className="font-bold">{item.quantity}</span>
                )}
                style={{ width: "80px" }}
              />
              <Column
                header="Subtotal"
                body={(item) => (
                  <span className="font-bold text-primary">
                    ${Number(item.subtotal).toFixed(2)}
                  </span>
                )}
              />
            </DataTable>
          </div>
        </div>

        {/* Order Summary + Payment + Shipping */}
        <div className="col-12 lg:col-4 p-2">
          {/* Order Summary */}
          <div className="surface-card shadow-2 border-round-2xl p-4 mb-3">
            <h3 className="text-900 font-bold mb-3">
              <i className="pi pi-calculator mr-2 text-primary" />
              Order Summary
            </h3>
            <div className="flex flex-column gap-3">
              <div className="flex justify-content-between">
                <span className="text-600">Subtotal</span>
                <span className="font-semibold">
                  ${Number(order.total).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-content-between">
                <span className="text-600">Shipping</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>
              <Divider className="my-1" />
              <div className="flex justify-content-between">
                <span className="text-900 font-bold text-lg">Total</span>
                <span className="text-primary font-bold text-xl">
                  ${Number(order.total).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="surface-card shadow-2 border-round-2xl p-4 mb-3">
            <h3 className="text-900 font-bold mb-3">
              <i className="pi pi-truck mr-2 text-primary" />
              Shipping Address
            </h3>
            <p className="text-700 line-height-3 m-0">
              {order.shippingAddress || "N/A"}
            </p>
          </div>

          {/* Payment Info */}
          <div className="surface-card shadow-2 border-round-2xl p-4">
            <h3 className="text-900 font-bold mb-3">
              <i className="pi pi-credit-card mr-2 text-primary" />
              Payment
            </h3>
            {payment ? (
              <div className="flex flex-column gap-2">
                <div className="flex justify-content-between">
                  <span className="text-600">Status</span>
                  <Tag
                    value={payment.status || "N/A"}
                    severity={
                      payment.status === "COMPLETED"
                        ? "success"
                        : payment.status === "FAILED"
                          ? "danger"
                          : "warning"
                    }
                  />
                </div>
                <div className="flex justify-content-between">
                  <span className="text-600">Amount</span>
                  <span className="font-semibold">
                    ${Number(payment.amount || order.total).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-content-between">
                  <span className="text-600">Method</span>
                  <span className="font-semibold">
                    {payment.provider || "Stripe"}
                  </span>
                </div>
                {payment.createdAt && (
                  <div className="flex justify-content-between">
                    <span className="text-600">Date</span>
                    <span className="font-semibold text-sm">
                      {formatDate(payment.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex align-items-center gap-2 text-500">
                <i className="pi pi-info-circle" />
                <span>
                  {order.status === "PENDING"
                    ? "Payment pending"
                    : "No payment info available"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
