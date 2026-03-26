import { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toolbar } from "primereact/toolbar";
import { ProgressSpinner } from "primereact/progressspinner";
import { InputText } from "primereact/inputtext";
import api from "../../utils/api";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!globalFilter.trim()) {
      setFilteredUsers(users);
    } else {
      const q = globalFilter.toLowerCase();

      setFilteredUsers(
        users.filter(
          (u) =>
            u.firstName?.toLowerCase().includes(q) ||
            u.lastName?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.role?.toLowerCase().includes(q),
        ),
      );
    }
  }, [globalFilter, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data || []);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to fetch users",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (user) => {
    confirmDialog({
      message: `Delete user "${user.firstName} ${user.lastName}" (${user.email})? This cannot be undone.`,
      header: "Delete User",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.delete(`/users/${user.id}`);
          toast.current?.show({
            severity: "success",
            summary: "Deleted",
            detail: "User deleted successfully",
            life: 2000,
          });
          fetchUsers();
        } catch (err) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: err?.response?.data?.message || "Could not delete user",
            life: 3000,
          });
        }
      },
    });
  };

  // Column templates
  const nameBody = (u) => (
    <div className="flex align-items-center gap-2">
      <div
        className="flex align-items-center justify-content-center border-circle font-bold text-white text-sm"
        style={{
          width: "36px",
          height: "36px",
          backgroundColor: "var(--primary-color)",
          flexShrink: 0,
        }}
      >
        {(u.firstName?.[0] || "").toUpperCase()}
        {(u.lastName?.[0] || "").toUpperCase()}
      </div>
      <div>
        <div className="font-semibold text-900">
          {u.firstName} {u.lastName}
        </div>
        <div className="text-500 text-sm">{u.email}</div>
      </div>
    </div>
  );

  const roleBody = (u) => (
    <Tag
      value={u.role}
      severity={u.role === "ADMIN" ? "warning" : "info"}
      className="font-semibold"
    />
  );

  const dateBody = (u) =>
    new Date(u.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const actionBody = (u) => (
    <Button
      icon="pi pi-trash"
      className="p-button-rounded p-button-danger p-button-text p-button-sm"
      tooltip="Delete User"
      tooltipOptions={{ position: "top" }}
      onClick={() => confirmDelete(u)}
      disabled={u.role === "ADMIN"}
    />
  );

  const toolbarLeft = () => (
    <h2 className="text-900 font-bold text-2xl m-0">
      <i className="pi pi-users mr-2 text-primary" />
      Manage Users
    </h2>
  );

  const toolbarRight = () => (
    <div className="flex align-items-center gap-2">
      <span className="p-input-icon-left">
        <i className="pi pi-search mr-2" />
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search users..."
          className="p-inputtext-sm"
        />
      </span>
      <Tag
        value={`${users.length} total`}
        severity="secondary"
        className="font-semibold"
      />
    </div>
  );

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

      <Toolbar
        left={toolbarLeft}
        right={toolbarRight}
        className="mb-4 surface-card shadow-2 border-round-xl border-none"
      />
      <div className="text-500 text-sm">
        <i className="pi pi-info-circle mb-1" />
        Admin accounts cannot be deleted.
      </div>
      <DataTable
        value={filteredUsers}
        responsiveLayout="scroll"
        breakpoint="768px"
        className="shadow-2 border-round-xl"
        stripedRows
        paginator={false}
        rows={10}
        rowsPerPageOptions={[10, 25, 50]}
        emptyMessage="No users found"
        sortField="createdAt"
        sortOrder={-1}
      >
        <Column body={nameBody} header="User" style={{ minWidth: "220px" }} />
        <Column body={roleBody} header="Role" style={{ width: "100px" }} />
        <Column
          body={dateBody}
          header="Joined"
          sortable
          sortField="createdAt"
          style={{ width: "130px" }}
        />
        <Column body={actionBody} header="Actions" style={{ width: "80px" }} />
      </DataTable>
    </div>
  );
};

export default AdminUsers;
