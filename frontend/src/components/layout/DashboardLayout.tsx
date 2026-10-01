import { useState, type ReactNode } from "react";
import { Menu, Sprout } from "lucide-react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      {/* Mobile Header (Hidden on Desktop) */}
      <div className="fixed top-0 z-40 flex h-[53px] w-full items-center bg-[#2d703b] px-4 text-white lg:hidden">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="rounded-lg p-1 hover:bg-white/10"
        >
          <Menu size={24} />
        </button>
        <div className="ml-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4caf50]">
            <Sprout size={14} strokeWidth={2} />
          </div>
          <span className="font-serif text-[16px] font-bold">SmartFarm</span>
        </div>
      </div>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      {/* Assuming TopBar has its own desktop positioning, usually hidden or adjusted for mobile */}
      <div className="hidden lg:block">
        <TopBar />
      </div>

      {/* Main Content Area */}
      {/* ml-0 on mobile, ml-[226px] on large screens (desktop) */}
      <main className="ml-0 min-h-screen pt-[53px] lg:ml-[226px]">
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;