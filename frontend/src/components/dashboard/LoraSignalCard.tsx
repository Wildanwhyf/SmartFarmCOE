import { Radio } from "lucide-react";
import Card from "../common/Card";
import type { GuestCardConfig } from "../../types/sensor";

interface LoraSignalCardProps {
  rssi: number;
  snr: number;
  viewConfig: GuestCardConfig | null;
}

export default function LoraSignalCard({ rssi, snr, viewConfig }: LoraSignalCardProps) {
  const isVisible = (key: keyof GuestCardConfig) => {
    if (!viewConfig) return true;
    return viewConfig[key] !== false;
  };

  // Prevent empty card rendering
  if (!isVisible("rssi") && !isVisible("snr")) return null;

  return (
    <Card className="min-h-[230px] p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eaf5ff] text-[#398bc7]">
          <Radio size={17} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#28402d]">Signal Strength</h2>
          <p className="text-[11px] text-[#849187]">LoRa RSSI & SNR</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-8">
        {isVisible("rssi") && (
          <div className="rounded-xl border border-[#edf1ed] bg-[#fcfdfc] p-4 text-center">
            <p className="text-xs font-medium text-[#849187]">Signal (RSSI)</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#25352a]">
              {rssi} <span className="text-xs text-[#849187]">dBm</span>
            </p>
          </div>
        )}
        
        {isVisible("snr") && (
          <div className="rounded-xl border border-[#edf1ed] bg-[#fcfdfc] p-4 text-center">
            <p className="text-xs font-medium text-[#849187]">Noise (SNR)</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#25352a]">
              {snr} <span className="text-xs text-[#849187]">dB</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}