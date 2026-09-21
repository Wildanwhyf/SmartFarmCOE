import { Droplets } from "lucide-react";
import Card from "../common/Card";
import type { ThresholdItem } from "../../types/sensor";

interface SoilMoistureCardProps {
  moisture: number;
  threshold?: ThresholdItem;
}

function SoilMoistureCard({ moisture, threshold }: SoilMoistureCardProps) {
  const min = threshold ? parseFloat(threshold.min_value) : 40;
  const max = threshold ? parseFloat(threshold.max_value) : 70;

  const isOptimal = moisture >= min && moisture <= max;

  return (
    <Card className="min-h-[230px] p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f6eb] text-[#28733d]">
          <Droplets size={17} />
        </div>

        <h2 className="text-sm font-semibold text-[#28402d]">
          Soil Moisture
        </h2>
      </div>

      <div className="mt-8 text-center">
        <p className="text-5xl font-semibold tracking-tight text-[#17251a]">
          {moisture}
          <span className="ml-1 text-2xl font-medium text-[#607266]">
            %
          </span>
        </p>

        <div className="mt-2 flex items-center justify-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              isOptimal ? "bg-[#43c878]" : "bg-[#e02424]"
            }`}
          />

          <span
            className={`text-xs font-semibold ${
              isOptimal ? "text-[#36834e]" : "text-[#e02424]"
            }`}
          >
            {isOptimal ? "Optimal" : moisture < min ? "Too Low" : "Too High"}
          </span>
        </div>
      </div>

      <div className="mt-8 border-t border-[#edf1ed] pt-4">
        <p className="text-xs text-[#6c7d70]">
          Optimal range:{" "}
          <span className="font-semibold text-[#3f6047]">
            {min}–{max}%
          </span>
        </p>
      </div>
    </Card>
  );
}

export default SoilMoistureCard;