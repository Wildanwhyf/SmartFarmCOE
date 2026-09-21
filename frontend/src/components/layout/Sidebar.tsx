import { useState } from "react";
import {
  Bell,
  ChartNoAxesCombined,
  LayoutDashboard,
  LogIn,
  LogOut,
  Sprout,
  Users,
} from "lucide-react";
import LoginModal from "../common/LoginModal";
import { useAuth } from "../../context/AuthContext";
import { Sliders } from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["guest", "farmer", "admin"],
  },
  {
    name: "Sensor History",
    path: "/sensor-history",
    icon: ChartNoAxesCombined,
    roles: ["farmer", "admin"],
  },
  {
    name: "Alerts",
    path: "/alerts",
    icon: Bell,
    roles: ["farmer", "admin"],
  },
  {
    name: "User Management",
    path: "/user-management",
    icon: Users,
    roles: ["admin"],
  },
  {
    name: "Alert Thresholds",
    path: "/thresholds",
    icon: Sliders,
    roles: ["admin"],
  },
];

function Sidebar() {
  const { user, loading, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const currentRole = user?.role || "guest";
  const isLoggedIn = !!user;

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(currentRole)
  );

  return (
    <>
      <aside className="fixed left-0 top-0 flex h-screen w-[226px] flex-col bg-[#2d703b] text-white">
        {/* Logo */}
        <div className="flex h-[69px] items-center border-b border-white/10 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4caf50]">
            <Sprout size={18} strokeWidth={2} />
          </div>
          <span className="ml-3 font-serif text-[18px] font-bold">
            SmartFarm
          </span>
        </div>

        {/* User Info */}
        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#398049] text-sm font-semibold uppercase">
              {loading ? "..." : isLoggedIn ? user.username.charAt(0) : "G"}
            </div>

            <div className="ml-3">
              <p className="text-sm font-semibold">
                {loading ? "Loading..." : isLoggedIn ? user.username : "Guest"}
              </p>
              <p className="text-xs text-white/60">
                {loading ? "Please wait" : isLoggedIn ? user.email : "Public Access"}
              </p>
            </div>
          </div>

          {!loading && (
            <span
              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                isLoggedIn
                  ? "bg-[#4caf50] text-white"
                  : "bg-[#e5b91d] text-[#604e00]"
              }`}
            >
              {currentRole}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = window.location.pathname === item.path;

            return (
              <a
                key={item.name}
                href={item.path}
                className={`mb-1 flex h-[38px] items-center rounded-xl px-3 text-sm transition ${
                  isActive
                    ? "bg-[#4caf50] font-semibold text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span className="ml-3">{item.name}</span>
              </a>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-white/10 px-3 py-4">
          {isLoggedIn ? (
            <button
              onClick={logout}
              className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              <LogOut size={17} strokeWidth={1.8} />
              <span className="ml-3">Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              <LogIn size={17} strokeWidth={1.8} />
              <span className="ml-3">Log In</span>
            </button>
          )}
        </div>
      </aside>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}

export default Sidebar;