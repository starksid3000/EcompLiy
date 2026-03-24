import React, { useRef, useState, useEffect } from "react";
import { Avatar } from "primereact/avatar";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Divider } from "primereact/divider";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import useAuthStore from "../store/authStore";
import api from "../utils/api";
const getInitials = (firstName = "", lastName = "") =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";

const Profile = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const toast = useRef(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch fresh profile data on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data);
        setForm({
          email: res.data.email || "",
          firstName: res.data.firstName || "",
          lastName: res.data.lastName || "",
        });
      } catch {
        // Use cached data if fetch fails
      }
    };
    fetchProfile();
  }, []);

  const updateProfile = async () => {
    try {
      const res = await api.patch("/users/me", form);
      setUser(res.data);
      toast.current.show({
        severity: "success",
        summary: "Updated",
        detail: "Profile updated successfully",
      });
      setEdit(false);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.message || "Update failed",
      });
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "New passwords do not match",
      });
      return;
    }
    setChangingPassword(true);
    try {
      await api.patch("/users/me/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: "Password changed successfully",
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.message || "Password change failed",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    confirmDialog({
      message: "Are you sure you want to delete your account? This action cannot be undone.",
      header: "Delete Account",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.delete("/users/me");
          logout();
          navigate("/login");
        } catch (err) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err?.response?.data?.message || "Could not delete account",
          });
        }
      },
    });
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  return (
    <div className="px-2 py-4 md:px-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <h1 className="text-900 font-bold text-3xl mb-5">
        <i className="pi pi-user mr-3 text-primary" />
        My Profile
      </h1>

      <div className="grid">
        {/* Profile Card */}
        <div className="col-12 lg:col-6 p-2">
          <div className="surface-card shadow-2 border-round-xl p-5">
            <div className="flex flex-column align-items-center mb-5">
              <Avatar
                label={getInitials(user?.firstName, user?.lastName)}
                shape="circle"
                size="xlarge"
                className="mb-3"
                style={{
                  width: "80px",
                  height: "80px",
                  fontSize: "1.8rem",
                  backgroundColor: "var(--primary-color)",
                  color: "#fff",
                }}
              />
              <h2 className="text-900 font-bold text-2xl m-0">
                {user?.firstName} {user?.lastName}
              </h2>
              <Tag
                value={user?.role || "USER"}
                severity={user?.role === "ADMIN" ? "warning" : "info"}
                className="mt-2"
              />
            </div>
            <div className="flex flex-column gap-4">
              <div className="flex gap-2 mt-3">
                {!edit ? (
                  <Button
                    label="Edit"
                    icon="pi pi-pencil"
                    onClick={() => setEdit(true)}
                  />
                ) : (
                  <>
                    <Button
                      label="Save"
                      icon="pi pi-check"
                      onClick={updateProfile}
                      severity="success"
                    />
                    <Button
                      label="Cancel"
                      icon="pi pi-times"
                      onClick={() => setEdit(false)}
                      severity="secondary"
                    />
                  </>
                )}
              </div>
              <div className="flex align-items-center gap-3 p-3 surface-100 border-round-lg">
                <i className="pi pi-envelope text-xl text-primary" />
                <div className="w-full">
                  <span className="text-500 text-sm block">Email</span>
                  {edit ? (
                    <InputText
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="w-full mt-1"
                    />
                  ) : (
                    <span className="text-900 font-semibold">{user?.email}</span>
                  )}
                </div>
              </div>

              <div className="flex align-items-center gap-3 p-3 surface-100 border-round-lg">
                <i className="pi pi-user text-xl text-primary" />
                <div className="w-full">
                  <span className="text-500 text-sm block">First Name</span>
                  {edit ? (
                    <InputText
                      value={form.firstName}
                      onChange={(e) => handleChange("firstName", e.target.value)}
                      className="w-full mt-1"
                    />
                  ) : (
                    <span className="text-900 font-semibold">{user?.firstName}</span>
                  )}
                </div>
              </div>

              <div className="flex align-items-center gap-3 p-3 surface-100 border-round-lg">
                <i className="pi pi-user text-xl text-primary" />
                <div className="w-full">
                  <span className="text-500 text-sm block">Last Name</span>
                  {edit ? (
                    <InputText
                      value={form.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                      className="w-full mt-1"
                    />
                  ) : (
                    <span className="text-900 font-semibold">{user?.lastName}</span>
                  )}
                </div>
              </div>

              <div className="flex align-items-center gap-3 p-3 surface-100 border-round-lg">
                <i className="pi pi-shield text-xl text-primary" />
                <div>
                  <span className="text-500 text-sm block">Role</span>
                  <span className="text-900 font-semibold">{user?.role}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Password + Quick Links */}
        <div className="col-12 lg:col-6 p-2">
          <div className="flex flex-column gap-3">
            {/* Change Password Card */}
            <div className="surface-card shadow-2 border-round-xl p-4">
              <h3 className="text-900 font-bold mb-4">
                <i className="pi pi-lock mr-2 text-primary" />
                Change Password
              </h3>
              <div className="flex flex-column gap-3">
                <div>
                  <label className="text-500 text-sm block mb-1">Current Password</label>
                  <Password
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    toggleMask
                    feedback={false}
                    className="w-full"
                    inputClassName="w-full"
                  />
                </div>
                <div>
                  <label className="text-500 text-sm block mb-1">New Password</label>
                  <Password
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    toggleMask
                    className="w-full"
                    inputClassName="w-full"
                    promptLabel="Enter new password"
                    weakLabel="Weak"
                    mediumLabel="Medium"
                    strongLabel="Strong"
                  />
                </div>
                <div>
                  <label className="text-500 text-sm block mb-1">Confirm New Password</label>
                  <Password
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    toggleMask
                    feedback={false}
                    className="w-full"
                    inputClassName="w-full"
                  />
                </div>
                <Button
                  label={changingPassword ? "Changing..." : "Change Password"}
                  icon="pi pi-lock"
                  className="w-full mt-2"
                  onClick={handleChangePassword}
                  loading={changingPassword}
                  disabled={!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword}
                />
              </div>
            </div>

            {/* Quick Links */}
            <Card
              className="shadow-2 border-round-xl cursor-pointer hover:shadow-6 transition-duration-300"
              onClick={() => navigate("/orders")}
            >
              <div className="flex align-items-center gap-3">
                <i className="pi pi-box text-3xl text-primary" />
                <div>
                  <h3 className="m-0 text-900 font-bold">My Orders</h3>
                  <p className="m-0 text-500 text-sm mt-1">View your order history</p>
                </div>
              </div>
            </Card>

            <Card
              className="shadow-2 border-round-xl cursor-pointer hover:shadow-6 transition-duration-300"
              onClick={() => navigate("/cart")}
            >
              <div className="flex align-items-center gap-3">
                <i className="pi pi-shopping-cart text-3xl text-orange-500" />
                <div>
                  <h3 className="m-0 text-900 font-bold">My Cart</h3>
                  <p className="m-0 text-500 text-sm mt-1">View items in your cart</p>
                </div>
              </div>
            </Card>

            <Card
              className="shadow-2 border-round-xl cursor-pointer hover:shadow-6 transition-duration-300"
              onClick={() => navigate("/products")}
            >
              <div className="flex align-items-center gap-3">
                <i className="pi pi-shopping-bag text-3xl text-green-500" />
                <div>
                  <h3 className="m-0 text-900 font-bold">Browse Products</h3>
                  <p className="m-0 text-500 text-sm mt-1">Discover our collection</p>
                </div>
              </div>
            </Card>

            {/* Danger Zone */}
            <Divider />
            <div className="surface-card shadow-2 border-round-xl p-4 border-1 border-red-200">
              <h3 className="text-red-500 font-bold mb-3">
                <i className="pi pi-exclamation-triangle mr-2" />
                Danger Zone
              </h3>
              <p className="text-600 text-sm mb-3">Once you delete your account, there is no going back.</p>
              <Button
                label="Delete Account"
                icon="pi pi-trash"
                className="p-button-danger p-button-outlined"
                onClick={handleDeleteAccount}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
