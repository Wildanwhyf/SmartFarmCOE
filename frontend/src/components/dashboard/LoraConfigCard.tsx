import { Activity, Wifi, Clock, Settings2, Server } from "lucide-react";
import Card from "../common/Card";
import type { GuestCardConfig } from "../../types/sensor";

interface LoraConfigCardProps {
  status: string;
  frequency: string;
  spreadingFactor: string;
  bandwidth: string;
  lastActivity: string;
  viewConfig: GuestCardConfig | null;
}

export default function LoraConfigCard({
  status,
  frequency,
  spreadingFactor,
  bandwidth,
  lastActivity,
  viewConfig,
}: LoraConfigCardProps) {
  const isVisible = (key: keyof GuestCardConfig) => {
    if (!viewConfig) return true;
    return viewConfig[key] !== false;
  };

  return (
    <Card className="min-h-[230px] p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0ebfa] text-[#7352a8]">
            <Server size={17} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#28402d]">Node Configuration</h2>
            <p className="text-[11px] text-[#849187]">LoRa hardware status</p>
          </div>
        </div>

        {isVisible("status") && (
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${
            status === "READY" ? "bg-[#e8f6eb] text-[#28733d]" : "bg-[#fde8e8] text-[#e02424]"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status === "READY" ? "bg-[#43c878] animate-pulse" : "bg-[#e02424]"}`} />
            {status}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3.5">
        {isVisible("frequency") && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#617565]">
              <Activity size={14} />
              <span>Frequency</span>
            </div>
            <span className="font-medium text-[#1f3022]">{frequency}</span>
          </div>
        )}

        {isVisible("spreading_factor") && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#617565]">
              <Settings2 size={14} />
              <span>Spreading Factor</span>
            </div>
            <span className="font-medium text-[#1f3022]">{spreadingFactor}</span>
          </div>
        )}

        {isVisible("bandwidth") && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#617565]">
              <Wifi size={14} />
              <span>Bandwidth</span>
            </div>
            <span className="font-medium text-[#1f3022]">{bandwidth}</span>
          </div>
        )}

        {isVisible("last_activity") && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#617565]">
              <Clock size={14} />
              <span>Last Activity</span>
            </div>
            <span className="font-mono text-[#28733d]">{lastActivity}</span>
          </div>
        )}
      </div>
    </Card>
  );
}