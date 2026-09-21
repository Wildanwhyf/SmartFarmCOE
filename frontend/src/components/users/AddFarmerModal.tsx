import { useState, type FormEvent } from "react";
import { X, Mail, User, Lock } from "lucide-react";

interface AddFarmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddFarmerModal({ isOpen, onClose, onSuccess }: AddFarmerModalProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/auth/farmers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create farmer account.");
      }

      setEmail("");
      setUsername("");
      setPassword("");
      onSuccess();
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
          <h2 className="text-xl font-semibold text-[#152619]">
            Add New Farmer
          </h2>
          <p className="mt-1 text-xs text-[#617565]">
            Create credentials for farm operators to monitor live sensors
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-[#fde8e8] p-3 text-xs text-[#e02424]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#28402d]">
              Username
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#849187]"
              />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="farmer_budi"
                className="w-full rounded-xl border border-[#e3ebe4] bg-[#fafcfb] py-2.5 pl-9 pr-3 text-xs text-[#1f3022] outline-none transition focus:border-[#347b49] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#28402d]">
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
                placeholder="budi@farmco.id"
                className="w-full rounded-xl border border-[#e3ebe4] bg-[#fafcfb] py-2.5 pl-9 pr-3 text-xs text-[#1f3022] outline-none transition focus:border-[#347b49] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#28402d]">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#849187]"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#e3ebe4] bg-[#fafcfb] py-2.5 pl-9 pr-3 text-xs text-[#1f3022] outline-none transition focus:border-[#347b49] focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[#347b49] py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#286139] disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Farmer Account"}
          </button>
        </form>
      </div>
    </div>
  );
}