import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { Avatar } from "primereact/avatar";
import { OverlayPanel } from "primereact/overlaypanel";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
// Helper: get initials for avatar fallback
const getInitials = (firstName = "", lastName = "") =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";

// Sub-component: User Menu (memoized to prevent re-renders)
const UserMenu = ({ user, onLogout }) => {
  const op = useRef(null);
  const navigate = useNavigate();

  const label = user?.firstName || "User";
  const hasAvatar = Boolean(user?.avatarUrl);

  return (
    <div className="flex align-items-center gap-2">
      <span className="hidden md:inline surface-100 px-2 py-1 border-round-full text-sm font-medium">
        👋 {label}
      </span>

      {/* Clickable avatar opens profile overlay */}
      <Avatar
        image={hasAvatar ? user.avatarUrl : undefined}
        label={
          !hasAvatar ? getInitials(user?.firstName, user?.lastName) : undefined
        }
        shape="circle"
        size="normal"
        className="cursor-pointer"
        style={{ userSelect: "none" }}
        onClick={(e) => op.current?.toggle(e)}
      />

      {/* Profile overlay panel */}
      <OverlayPanel ref={op} className="p-2">
        <div className="flex flex-column gap-2 min-w-max">
          <div className="text-sm font-semibold px-2">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="text-xs text-500 px-2 mb-1">{user?.email}</div>
          <Button
            label="My Profile"
            icon="pi pi-user"
            text
            size="small"
            className="w-full text-left justify-content-start"
            onClick={() => {
              op.current?.hide();
              navigate("/profile");
            }}
          />
          <Button
            label="My Orders"
            icon="pi pi-box"
            text
            size="small"
            className="w-full text-left justify-content-start"
            onClick={() => {
              op.current?.hide();
              navigate("/orders");
            }}
          />
          <hr className="my-1 border-none border-top-1 surface-border" />
          <Button
            label="Logout"
            icon="pi pi-sign-out"
            severity="danger"
            text
            size="small"
            className="w-full text-left justify-content-start"
            onClick={() => {
              op.current?.hide();
              onLogout();
            }}
          />
        </div>
      </OverlayPanel>
    </div>
  );
};
export default UserMenu;
