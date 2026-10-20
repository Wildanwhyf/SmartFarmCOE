import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface SensorHistoryChartProps {
  data: any[];
  dataKey: string;
  unit: string;
  yAxisLabel?: string;
}

export default function SensorHistoryChart({
  data,
  dataKey,
  unit,
  yAxisLabel,
}: SensorHistoryChartProps) {
  const displayYLabel = yAxisLabel || dataKey;

  return (
    <div className="h-64 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#edf1ed" />
          
          <XAxis 
            dataKey="time" 
            stroke="#849187" 
            fontSize={11} 
            // Add X-Axis Label
            label={{ 
              value: "Time", 
              position: "insideBottom", 
              offset: -10, 
              fontSize: 13, 
              fontWeight: 600, 
              fill: "#617565" 
            }}
          />
          
          <YAxis 
            stroke="#849187" 
            fontSize={11} 
            width={45}
            // Add Y-Axis Label
            label={{ 
              value: displayYLabel, 
              angle: -90, 
              position: "insideLeft", 
              offset: -5, 
              fontSize: 13, 
              fontWeight: 600, 
              fill: "#617565",
              style: { textAnchor: 'middle' }
            }}
          />
          
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              borderColor: "#e3ebe4",
              borderRadius: "12px",
              fontSize: "12px",
            }}
            formatter={(value: any) => [
              `${value ?? 0} ${unit}`,
              displayYLabel,
            ]}
          />
          
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#347b49"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}