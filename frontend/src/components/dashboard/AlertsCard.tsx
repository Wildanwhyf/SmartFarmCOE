import { useEffect, useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import Card from "../common/Card";
import type { WarningsApiResponse } from "../../types/sensor";

export default function AlertsCard() {
  const [warningCount, setWarningCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
        const token = localStorage.getItem("token");

        const res = await fetch(`${baseUrl}/sensor/warnings?is_acknowledged=false`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const result: WarningsApiResponse = await res.json();
          setWarningCount(result.meta?.unacknowledgedCount ?? (result.data?.length || 0));
        }
      } catch (err) {
        console.error("AlertsCard error:", err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="min-h-[230px] p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff7df] text-[#d49719]">
          <Bell size={17} />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-[#28402d]">
            Alerts & Warnings
          </h2>
          <p className="text-[11px] text-[#849187]">
            Active threshold notifications
          </p>
        </div>
      </div>

      <div className="mt-7 flex items-end justify-between">
        <div>
          <p className="text-xs text-[#7b887e]">Active Warnings</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-[#252d27]">
            {warningCount}
          </p>
        </div>

        {warningCount > 0 ? (
          <span className="rounded-full bg-[#fde8e8] px-2.5 py-1 text-xs font-semibold text-[#e02424]">
            Requires Action
          </span>
        ) : (
          <span className="rounded-full bg-[#e8f6eb] px-2.5 py-1 text-xs font-semibold text-[#28733d]">
            All Clear
          </span>
        )}
      </div>

      <div className="mt-7 flex items-center gap-2 border-t border-[#edf1ed] pt-4 text-xs text-[#6c7d70]">
        <CheckCircle2 size={15} className="text-[#347b49]" />
        <span>{warningCount === 0 ? "System fully operational" : `${warningCount} warnings pending review`}</span>
      </div>
    </Card>
  );
}