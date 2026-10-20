import { useState, useEffect } from "react";
import {
  Bell,
  ChartNoAxesCombined,
  LayoutDashboard,
  LogIn,
  LogOut,
  Sprout,
  Users,
  Sliders,
  X,
  ServerCog
} from "lucide-react";
import LoginModal from "../common/LoginModal";
import { useAuth } from "../../context/AuthContext";
import { Link, useLocation } from "react-router-dom";

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
    name: "System Status",
    path: "/system-status",
    icon: ServerCog,
    roles: ["admin"],
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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, loading, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const location = useLocation();

  const currentRole = user?.role || "guest";
  const isLoggedIn = !!user;

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(currentRole)
  );

  // Close sidebar on mobile when route changes
  useEffect(() => {
    onClose();
  }, [window.location.pathname]);

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#152619]/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] w-[226px] flex-col bg-[#2d703b] text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Logo & Mobile Close Button */}
        <div className="flex h-[53px] lg:h-[69px] items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4caf50]">
              <Sprout size={18} strokeWidth={2} />
            </div>
            <span className="ml-3 font-serif text-[18px] font-bold">
              SmartFarm
            </span>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#398049] text-sm font-semibold uppercase">
              {loading ? "..." : isLoggedIn ? user.username.charAt(0) : "G"}
            </div>

            <div className="ml-3 overflow-hidden">
              <p className="truncate text-sm font-semibold">
                {loading ? "Loading..." : isLoggedIn ? user.username : "Guest"}
              </p>
              <p className="truncate text-xs text-white/60">
                {loading ? "Please wait" : isLoggedIn ? user.email : "Public Access"}
              </p>
            </div>
          </div>

          {!loading && (
            <span
              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${isLoggedIn
                ? "bg-[#4caf50] text-white"
                : "bg-[#e5b91d] text-[#604e00]"
                }`}
            >
              {currentRole}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={`mb-1 flex h-[38px] items-center rounded-xl px-3 text-sm transition ${isActive
                    ? "bg-[#4caf50] font-semibold text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span className="ml-3 truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-white/10 px-3 pt-4 pb-10 lg:pb-4">
          {isLoggedIn ? (
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={17} strokeWidth={1.8} />
              <span className="ml-3">Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setIsLoginModalOpen(true);
                onClose();
              }}
              className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
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