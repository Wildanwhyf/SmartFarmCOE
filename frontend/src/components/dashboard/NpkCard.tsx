import { Sprout } from "lucide-react";
import Card from "../common/Card";
import type { ThresholdItem } from "../../types/sensor";

interface NpkCardProps {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  nThreshold?: ThresholdItem;
  pThreshold?: ThresholdItem;
  kThreshold?: ThresholdItem;
}

function NpkCard({
  nitrogen,
  phosphorus,
  potassium,
  nThreshold,
  pThreshold,
  kThreshold,
}: NpkCardProps) {
  // Check individual activation status
  const isNEnabled = nThreshold?.is_enabled !== 0;
  const isPEnabled = pThreshold?.is_enabled !== 0;
  const isKEnabled = kThreshold?.is_enabled !== 0;

  // Count active nutrients to determine dynamic grid layout
  const activeCount = [isNEnabled, isPEnabled, isKEnabled].filter(Boolean).length;

  const checkInRange = (val: number, thresh?: ThresholdItem) => {
    if (!thresh || thresh.is_enabled === 0) return true;
    return val >= parseFloat(thresh.min_value) && val <= parseFloat(thresh.max_value);
  };

  const isGood =
    (!isNEnabled || checkInRange(nitrogen, nThreshold)) &&
    (!isPEnabled || checkInRange(phosphorus, pThreshold)) &&
    (!isKEnabled || checkInRange(potassium, kThreshold));

  if (activeCount === 0) return null;

  return (
    <Card className="min-h-[230px] p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef7e8] text-[#56873d]">
          <Sprout size={17} />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-[#28402d]">
            NPK Levels
          </h2>
          <p className="text-[11px] text-[#849187]">Soil nutrients</p>
        </div>
      </div>

      {/* Dynamic Grid Layout based on active nutrient count */}
      <div
        className={`mt-8 grid gap-3 ${
          activeCount === 3
            ? "grid-cols-3"
            : activeCount === 2
            ? "grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {isNEnabled && (
          <div className="text-center">
            <p className="text-xs font-semibold text-[#62826a]">Nitrogen</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#25352a]">
              {nitrogen}
            </p>
            <p className="text-[10px] text-[#87948a]">mg/kg</p>
          </div>
        )}

        {isPEnabled && (
          <div
            className={`text-center ${
              activeCount === 3 ? "border-x border-[#edf1ed]" : ""
            }`}
          >
            <p className="text-xs font-semibold text-[#62826a]">Phosphorus</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#25352a]">
              {phosphorus}
            </p>
            <p className="text-[10px] text-[#87948a]">mg/kg</p>
          </div>
        )}

        {isKEnabled && (
          <div className="text-center">
            <p className="text-xs font-semibold text-[#62826a]">Potassium</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#25352a]">
              {potassium}
            </p>
            <p className="text-[10px] text-[#87948a]">mg/kg</p>
          </div>
        )}
      </div>

      <div className="mt-7 flex items-center justify-between rounded-lg bg-[#f6f9f5] px-3 py-2">
        <span className="text-xs text-[#6c7d70]">Overall status</span>
        <span
          className={`text-xs font-semibold ${
            isGood ? "text-[#39834d]" : "text-[#e02424]"
          }`}
        >
          ● {isGood ? "Good" : "Attention Needed"}
        </span>
      </div>
    </Card>
  );
}

export default NpkCard;