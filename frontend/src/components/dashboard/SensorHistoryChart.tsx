import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { FormattedReading } from "../../pages/SensorHistory";

interface SensorHistoryChartProps {
  data: FormattedReading[];
  dataKey: keyof FormattedReading;
  unit: string;
}

export default function SensorHistoryChart({
  data,
  dataKey,
  unit,
}: SensorHistoryChartProps) {
  return (
    <div className="h-64 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#edf1ed" />
          <XAxis dataKey="time" stroke="#849187" fontSize={11} />
          <YAxis stroke="#849187" fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              borderColor: "#e3ebe4",
              borderRadius: "12px",
              fontSize: "12px",
            }}
            formatter={(value: any) => [
              `${value ?? 0} ${unit}`,
              String(dataKey),
            ]}
          />
          <Line
            type="monotone"
            dataKey={dataKey as string}
            stroke="#347b49"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}