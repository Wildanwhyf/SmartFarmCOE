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
  // Fallback to dataKey if no specific label is provided
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
            label={{ 
              value: "Time", 
              position: "insideBottom", 
              offset: -10, 
              fontSize: 11, 
              fontWeight: 600, 
              fill: "#617565" 
            }}
          />
          
          <YAxis 
            stroke="#849187" 
            fontSize={11} 
            width={55} // <-- Increased slightly to fit the longer "(unit)" text
            label={{ 
              value: `${displayYLabel} (${unit})`, // <-- Combined Label and Unit here!
              angle: -90, 
              position: "insideLeft", 
              offset: -5, 
              fontSize: 11, 
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