import { useState, type FormEvent } from "react";
import { X, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      if (data.token) {
        await login(data.token);
      }

      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#e3ebe4]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-[#6b8270] hover:bg-[#f2f6f3] hover:text-[#1f3022]"
        >
          <X size={18} />
        </button>

        <div className="mb-6">
          <h2 className="font-serif text-2xl font-bold text-[#1f3022]">
            Welcome Back
          </h2>
          <p className="mt-1 text-xs text-[#5d7362]">
            Sign in to access sensor history and administration controls.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-[#fde8e8] p-3 text-xs text-[#e02424]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#2d4030]">
              Email Address
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#849187]"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@farmco.id"
                className="w-full rounded-xl border border-[#e3ebe4] bg-[#fafcfb] py-2.5 pl-9 pr-3 text-xs text-[#1f3022] outline-none transition focus:border-[#2d703b] focus:bg-white focus:ring-1 focus:ring-[#2d703b]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#2d4030]">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#849187]"
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#e3ebe4] bg-[#fafcfb] py-2.5 pl-9 pr-9 text-xs text-[#1f3022] outline-none transition focus:border-[#2d703b] focus:bg-white focus:ring-1 focus:ring-[#2d703b]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#849187] hover:text-[#2d4030]"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[#2d703b] py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#23582e] disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}