import { useEffect, useState, useCallback } from "react";
import { Users, UserPlus, Shield, UserCheck, UserX, CheckCircle2 } from "lucide-react";
import Card from "../components/common/Card";
import AddFarmerModal from "../components/users/AddFarmerModal";

interface UserRecord {
  id: number;
  username: string;
  email: string;
  is_active: number;
  role: string;
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load users list.");
      }

      const result = await res.json();
      setUsers(result.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Unable to retrieve user management data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user: UserRecord) => {
    setUpdatingId(user.id);
    const newStatus = user.is_active === 1 ? 0 : 1;

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/auth/users/${user.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update user account status.");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: newStatus } : u))
      );

      setSuccessMsg(`User '${user.username}' status updated!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="px-8 py-7">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#152619]">
              User Management
            </h1>
            <p className="mt-1 text-sm text-[#617565]">
              Manage administrative accounts, farmer access, and active statuses
            </p>
          </div>

          <div className="flex items-center gap-3">
            {successMsg && (
              <div className="flex items-center gap-1.5 rounded-full bg-[#e8f6eb] px-3.5 py-1.5 text-xs font-medium text-[#28733d]">
                <CheckCircle2 size={15} />
                {successMsg}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#347b49] px-4 py-2.5 text-xs font-medium text-white shadow-xs transition hover:bg-[#286139]"
            >
              <UserPlus size={16} />
              Add Farmer
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-[#fde8e8] p-3 text-xs text-[#e02424]">
            {error}
          </div>
        )}

        {/* User Table Card */}
        <Card className="mt-6 p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f6eb] text-[#28733d]">
              <Users size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#28402d]">
                Account Directory
              </h2>
              <p className="text-[11px] text-[#849187]">
                Total accounts registered on Smart Farm platform
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center text-xs text-[#617565]">
              Loading account directory...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#edf1ed] text-[11px] font-semibold uppercase tracking-wider text-[#849187]">
                  <tr>
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Joined Date (WIB)</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f6f3]">
                  {users.map((item) => {
                    const dateObj = new Date(item.created_at);
                    const formattedDate = dateObj.toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      timeZone: "Asia/Jakarta",
                    });

                    return (
                      <tr key={item.id} className="hover:bg-[#f7faf7]">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#398049] text-xs font-semibold text-white uppercase">
                              {item.username.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-[#25352a]">
                                {item.username}
                              </p>
                              <p className="text-[11px] text-[#849187]">
                                {item.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1 text-[#28402d] capitalize font-medium">
                            {item.role === "admin" && (
                              <Shield size={14} className="text-[#347b49]" />
                            )}
                            {item.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              item.is_active === 1
                                ? "bg-[#e8f6eb] text-[#28733d]"
                                : "bg-[#fde8e8] text-[#e02424]"
                            }`}
                          >
                            {item.is_active === 1 ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-[#5f7064]">
                          {formattedDate}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            disabled={updatingId === item.id || item.role === "admin"}
                            onClick={() => handleToggleStatus(item)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
                              item.is_active === 1
                                ? "bg-[#fde8e8] text-[#e02424] hover:bg-[#fbd5d5]"
                                : "bg-[#e8f6eb] text-[#28733d] hover:bg-[#d5ebd9]"
                            }`}
                          >
                            {item.is_active === 1 ? (
                              <>
                                <UserX size={14} /> Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck size={14} /> Activate
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <AddFarmerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
}