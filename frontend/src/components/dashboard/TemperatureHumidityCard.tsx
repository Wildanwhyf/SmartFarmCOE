import { Thermometer, Droplets, Gauge } from "lucide-react";
import Card from "../common/Card";
import type { ThresholdItem } from "../../types/sensor";

interface TemperatureHumidityCardProps {
  temperature: number;
  humidity: number;
  pressure: number;
  tempThreshold?: ThresholdItem;
  humThreshold?: ThresholdItem;
  pressThreshold?: ThresholdItem;
}

function getStatus(val: number, thresh?: ThresholdItem) {
  if (!thresh || thresh.is_enabled === 0) return { label: "Normal", color: "text-[#7d765e]" };
  const min = parseFloat(thresh.min_value);
  const max = parseFloat(thresh.max_value);
  if (val < min) return { label: "Low", color: "text-[#e02424]" };
  if (val > max) return { label: "High", color: "text-[#e02424]" };
  return { label: "Normal", color: "text-[#36834e]" };
}

function TemperatureHumidityCard({
  temperature,
  humidity,
  pressure,
  tempThreshold,
  humThreshold,
  pressThreshold,
}: TemperatureHumidityCardProps) {
  const tempStatus = getStatus(temperature, tempThreshold);
  const humStatus = getStatus(humidity, humThreshold);
  const pressStatus = getStatus(pressure, pressThreshold);

  return (
    <Card className="min-h-[230px] p-5">
      <h2 className="text-sm font-semibold text-[#28402d]">
        Temperature & Environment
      </h2>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {/* Temp */}
        <div className="rounded-xl bg-[#fff7df] p-3">
          <div className="flex items-center gap-1.5">
            <Thermometer size={16} className="text-[#d49719]" />
            <span className="text-xs font-medium text-[#79652f]">Temp</span>
          </div>

          <p className="mt-4 text-2xl font-semibold tracking-tight text-[#332d1b]">
            {temperature}
            <span className="ml-0.5 text-xs font-medium text-[#796f50]">°C</span>
          </p>

          <p className={`mt-1 text-[11px] font-medium ${tempStatus.color}`}>
            {tempStatus.label}
          </p>
        </div>

        {/* Humidity */}
        <div className="rounded-xl bg-[#eaf5ff] p-3">
          <div className="flex items-center gap-1.5">
            <Droplets size={16} className="text-[#398bc7]" />
            <span className="text-xs font-medium text-[#496a82]">Humidity</span>
          </div>

          <p className="mt-4 text-2xl font-semibold tracking-tight text-[#21394b]">
            {humidity}
            <span className="ml-0.5 text-xs font-medium text-[#637789]">%</span>
          </p>

          <p className={`mt-1 text-[11px] font-medium ${humStatus.color}`}>
            {humStatus.label}
          </p>
        </div>

        {/* Pressure */}
        <div className="rounded-xl bg-[#f0fdf4] p-3">
          <div className="flex items-center gap-1.5">
            <Gauge size={16} className="text-[#28733d]" />
            <span className="text-xs font-medium text-[#2d5236]">Pressure</span>
          </div>

          <p className="mt-4 text-xl font-semibold tracking-tight text-[#17251a]">
            {pressure}
            <span className="ml-0.5 text-[10px] font-normal text-[#607266]">hPa</span>
          </p>

          <p className={`mt-1 text-[11px] font-medium ${pressStatus.color}`}>
            {pressStatus.label}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default TemperatureHumidityCard;