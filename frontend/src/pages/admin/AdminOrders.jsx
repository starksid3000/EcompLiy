import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Calendar } from "primereact/calendar";
import api from "../../utils/api";

const statusOptions = [
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const statusSeverity = {
  PENDING: "warning",
  PROCESSING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({ first: 0, rows: 10, page: 1 });
  const [filterStatus, setFilterStatus] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updateDialogVisible, setUpdateDialogVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const toast = useRef(null);
  //   const params = { page: lazyParams.page, limit: lazyParams.rows };

  //   if (filterStatus !== null) {
  //     params.status = filterStatus;
  //   }
  useEffect(() => {
    fetchOrders();
  }, [lazyParams, filterStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = { page: lazyParams.page, limit: lazyParams.rows };
      //   if (filterStatus) params.status = filterStatus;
      if (filterStatus && filterStatus !== "All") {
        params.status = filterStatus;
      }
      if (dateRange && dateRange[0]) {
        params.startDate = dateRange[0].toISOString();
      }

      if (dateRange && dateRange[1]) {
        params.endDate = dateRange[1].toISOString();
      }

      const res = await api.get("/orders/admin/all", {
        params,
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      setOrders(res.data?.data || []);
      setTotalRecords(res.data?.meta?.total || res.data?.total || 0);
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

  const onPage = (e) => {
    setLazyParams({
      first: e.first,
      rows: e.rows,
      page: Math.floor(e.first / e.rows) + 1,
    });
  };

  const openUpdateDialog = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setUpdateDialogVisible(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      await api.patch(`/orders/admin/${selectedOrder.id}`, {
        status: newStatus,
      });
      toast.current?.show({
        severity: "success",
        summary: "Updated",
        detail: "Order status updated",
        life: 2000,
      });
      setUpdateDialogVisible(false);
      fetchOrders();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "Failed to update order",
        life: 3000,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = (order) => {
    confirmDialog({
      message: `Cancel order #${order.id.slice(0, 8)}...?`,
      header: "Confirm Cancellation",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.delete(`/orders/admin/${order.id}`);
          toast.current?.show({
            severity: "success",
            summary: "Cancelled",
            detail: "Order cancelled",
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

  const statusBody = (order) => (
    <Tag
      value={order.status}
      severity={statusSeverity[order.status] || "info"}
    />
  );

  const amountBody = (order) => (
    <span className="font-bold">${Number(order.total).toFixed(2)}</span>
  );

  const dateBody = (order) =>
    new Date(order.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const actionBody = (order) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-sm"
        onClick={() => openUpdateDialog(order)}
        tooltip="Update Status"
      />
      {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
        <Button
          icon="pi pi-times"
          className="p-button-rounded p-button-danger p-button-text p-button-sm"
          onClick={() => handleCancelOrder(order)}
          tooltip="Cancel"
        />
      )}
    </div>
  );
  const filterDropdown = [{ label: "All", value: "All" }, ...statusOptions];

  return (
    <div className="px-2 py-4 md:px-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <h1 className="text-900 font-bold text-3xl mb-5">
        <i className="pi pi-list mr-3 text-primary" />
        Manage Orders
      </h1>
      <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-start gap-3 mb-4 flex-wrap">
        <span className="text-600 font-medium w-full md:w-auto">Filter :</span>

        <Dropdown
          value={filterStatus}
          options={filterDropdown}
          optionValue="value"
          onChange={(e) => {
            setFilterStatus(e.value);
            setLazyParams((prev) => ({ ...prev, first: 0, page: 1 }));
          }}
          placeholder="All"
          className="w-full md:w-12rem"
        />

        {/* DATE FILTER */}
        <Calendar
          value={dateRange}
          onChange={(e) => {
            setDateRange(e.value);
            setLazyParams((prev) => ({ ...prev, first: 0, page: 1 }));
          }}
          selectionMode="range"
          readOnlyInput
          placeholder="Select date range"
          className="w-full md:w-15rem"
        />

        <Button
          label="Clear"
          className="p-button-warning w-full md:w-auto"
          onClick={() => {
            setDateRange(null);
            setFilterStatus(null);
            setLazyParams((prev) => ({ ...prev, first: 0, page: 1 }));
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-content-center py-8">
          <ProgressSpinner />
        </div>
      ) : (
        <DataTable
          value={orders}
          responsiveLayout="scroll"
          className="shadow-2 border-round-xl"
          stripedRows
          paginator
          first={lazyParams.first}
          rows={lazyParams.rows}
          totalRecords={totalRecords}
          onPage={onPage}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No orders found"
        >
          <Column
            header="Order #"
            sortable
            sortField="id"
            className="font-mono"
            body={(order) => order.id.slice(0, 8) + "..."}
          />
          <Column
            body={statusBody}
            header="Status"
            sortable
            sortField="status"
          />
          <Column body={amountBody} header="Total" sortable sortField="total" />
          <Column
            field="shippingAddress"
            header="Shipping"
            style={{ maxWidth: "200px" }}
          />
          <Column
            body={dateBody}
            header="Date"
            sortable
            sortField="createdAt"
          />
          <Column
            body={actionBody}
            header="Actions"
            style={{ width: "120px" }}
          />
        </DataTable>
      )}

      {/* Update Status Dialog */}
      <Dialog
        visible={updateDialogVisible}
        onHide={() => setUpdateDialogVisible(false)}
        header={`Update Order #${selectedOrder?.id?.slice(0, 8)}...`}
        style={{ width: "400px" }}
        modal
      >
        <div className="flex flex-column gap-4 pt-3">
          <div>
            <label className="font-semibold mb-2 block">New Status</label>
            <Dropdown
              value={newStatus}
              options={statusOptions}
              onChange={(e) => setNewStatus(e.value)}
              className="w-full"
            />
          </div>
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setUpdateDialogVisible(false)}
            />
            <Button
              label={updating ? "Updating..." : "Update"}
              icon="pi pi-check"
              onClick={handleUpdateStatus}
              loading={updating}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
