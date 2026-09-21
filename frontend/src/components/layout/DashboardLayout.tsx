import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <Sidebar />
      <TopBar />

      <main className="ml-[226px] min-h-screen pt-[53px]">
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;