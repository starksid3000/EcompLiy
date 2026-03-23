import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import api from "../utils/api";

//setting stautsseverity accoring to status of order
const statusSeverity = {
  PENDING: "warning",
  PROCESSING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useRef(null);
//fetch orders
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders");
      setOrders(res.data?.data || []);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load orders",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };
  //handle order cancelation 
  const handleCancel = (order) => {
    confirmDialog({
      message: `Cancel order #${order.id.slice(0, 8)}...?`,
      header: "Confirm Cancellation",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.delete(`/orders/${order.id}`);
          toast.current?.show({
            severity: "success",
            summary: "Cancelled",
            detail: "Order cancelled successfully",
            life: 2000,
          });
          fetchOrders();
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
  //status of the order
  const statusBody = (order) => (
    <Tag value={order.status} severity={statusSeverity[order.status] || "info"} />
  );

  //show amount paid
  const amountBody = (order) => (
    <span className="font-bold">${Number(order.total).toFixed(2)}</span>
  );

  //date product ordered
  const dateBody = (order) => new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
//action button to delete product only visible when order status is pending
  const actionBody = (order) =>
    order.status === "PENDING" ? (
      <Button
        icon="pi pi-times"
        label="Cancel"
        className="p-button-danger p-button-text p-button-sm"
        onClick={() => handleCancel(order)}
      />
    ) : null;

  if (loading) {
    return (
      <div className="flex justify-content-center py-8">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="px-2 py-4 md:px-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <h1 className="text-900 font-bold text-3xl mb-5">
        <i className="pi pi-box mr-3 text-primary" />
        My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="flex flex-column align-items-center py-8">
          <i className="pi pi-inbox text-6xl text-400 mb-4" />
          <h2 className="text-700 font-medium mb-3">No orders yet</h2>
          <p className="text-500">Your order history will appear here.</p>
        </div>
      ) : (
        <DataTable
          value={orders}
          responsiveLayout="scroll"
          className="shadow-2 border-round-xl"
          stripedRows
          paginator
          rows={10}
          emptyMessage="No orders found"
        >
          <Column header="Order #" sortable sortField="id" className="font-mono" body={(order) => order.id.slice(0, 8) + '...'} />
          <Column body={statusBody} header="Status" sortable sortField="status" />
          <Column body={amountBody} header="Total" sortable sortField="total" />
          <Column body={dateBody} header="Date" sortable sortField="createdAt" />
          <Column field="shippingAddress" header="Shipping Address" />
          <Column body={actionBody} header="" style={{ width: "120px" }} />
        </DataTable>
      )}
    </div>
  );
};

export default Orders;
