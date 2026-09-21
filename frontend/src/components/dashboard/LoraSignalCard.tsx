import { Radio, Signal, Activity } from "lucide-react";
import Card from "../common/Card";

interface LoraSignalCardProps {
  rssi: number;
  snr: number;
}

function LoraSignalCard({ rssi, snr }: LoraSignalCardProps) {
  return (
    <Card className="min-h-[230px] p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0ebfa] text-[#7352a8]">
          <Radio size={17} />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-[#28402d]">
            LoRa Connectivity
          </h2>
          <p className="text-[11px] text-[#849187]">
            Network signal strength
          </p>
        </div>
      </div>

      {/* Side-by-side metric cards */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* RSSI Card */}
        <div className="rounded-xl bg-[#f0ebfa] p-4">
          <div className="flex items-center gap-2">
            <Signal size={18} className="text-[#7352a8]" />
            <span className="text-xs font-medium text-[#563c80]">
              RSSI
            </span>
          </div>

          <p className="mt-5 text-3xl font-semibold tracking-tight text-[#2b1f40]">
            {rssi}
            <span className="ml-1 text-base font-medium text-[#7352a8]">
              dBm
            </span>
          </p>
        </div>

        {/* SNR Card */}
        <div className="rounded-xl bg-[#f6f9f5] p-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-[#39834d]" />
            <span className="text-xs font-medium text-[#2d5236]">
              SNR
            </span>
          </div>

          <p className="mt-5 text-3xl font-semibold tracking-tight text-[#17251a]">
            {snr}
            <span className="ml-1 text-base font-medium text-[#607266]">
              dB
            </span>
          </p>
        </div>
      </div>
    </Card>
  );
}

export default LoraSignalCard;