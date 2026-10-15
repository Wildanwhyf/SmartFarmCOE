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
      <div className="fixed top-0 z-40 flex h-[53px] w-full items-center justify-between bg-[#2d703b] px-4 text-white lg:hidden">
        
        {/* Left Side: Menu & Title */}
        <div className="flex items-center">
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

        {/* Right Side: University Logo with White Circle Background */}
        <div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white p-1 shadow-sm">
          <img 
            src="/LogoUniv.png" 
            alt="University Logo" 
            className="h-full w-full object-contain" 
          />
        </div>

      </div>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      {/* Desktop TopBar */}
      <div className="hidden lg:block">
        <TopBar />
      </div>

      {/* Main Content Area */}
      <main className="ml-0 min-h-screen pt-[53px] lg:ml-[226px]">
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;