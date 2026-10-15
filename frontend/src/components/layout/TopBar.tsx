import { useAuth } from "../../context/AuthContext";

function TopBar() {
  const { user, loading } = useAuth();

  const isLoggedIn = !!user;
  const usernameDisplay = loading
    ? "Loading..."
    : isLoggedIn
    ? user.username
    : "Guest";
  const roleDisplay = loading
    ? "Connecting..."
    : isLoggedIn
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Public Access";

  return (
    <header className="fixed left-[226px] right-0 top-0 z-10 flex h-[53px] items-center justify-between border-b border-[#e3ebe4] bg-white px-8">
      <p className="text-[12px] text-[#58705d]">
        Signed in as{" "}
        <span className="font-medium text-[#3d6044] capitalize">
          {usernameDisplay}
        </span>
        {" · "}
        <span className="text-[#6d8372]">{roleDisplay}</span>
      </p>

      {/* Right side: Logo & Live Indicator */}
      <div className="flex items-center gap-8">
        
        {/* University Logo (Increased size to h-10) */}
        <img 
          src="/LogoUniv.png" 
          alt="University Logo" 
          className="h-8 w-auto object-contain" 
        />

        {/* Live Indicator */}
        <div className="flex items-center gap-2 text-[12px] text-[#3d7650]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3fcf7b]" />
          Live
        </div>
        
      </div>
    </header>
  );
}

export default TopBar;