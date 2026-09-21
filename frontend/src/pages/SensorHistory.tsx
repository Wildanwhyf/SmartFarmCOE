import { useEffect, useState, useCallback, useMemo } from "react";
import Card from "../components/common/Card";
import SensorHistoryChart from "../components/dashboard/SensorHistoryChart";
import SensorHistoryTable from "../components/dashboard/SensorHistoryTable";
import type { ThresholdItem } from "../types/sensor";

export interface SensorOption {
  label: string;
  value: keyof FormattedReading;
  unit: string;
}

export const sensorOptions: SensorOption[] = [
  { label: "Soil Moisture", value: "kelembapan_tanah", unit: "%" },
  { label: "Temperature", value: "suhu", unit: "°C" },
  { label: "Humidity", value: "humidity", unit: "%" },
  { label: "Pressure", value: "tekanan", unit: "hPa" },
  { label: "Nitrogen", value: "nitrogen", unit: "mg/kg" },
  { label: "Phosphorus", value: "phosphorus", unit: "mg/kg" },
  { label: "Potassium", value: "potassium", unit: "mg/kg" },
  { label: "LoRa RSSI", value: "rssi", unit: "dBm" },
  { label: "LoRa SNR", value: "snr", unit: "dB" },
];

export interface FormattedReading {
  id: number;
  time: string;
  date: string;
  kelembapan_tanah: number;
  suhu: number;
  tekanan: number;
  humidity: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  rssi: number;
  snr: number;
  rawTime: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface WindowSummary {
  total_readings: number;
  avg_suhu?: string;
  avg_tekanan?: string;
  avg_humidity?: string;
  avg_kelembapan_tanah?: string;
  avg_nitrogen?: string;
  avg_phosphorus?: string;
  avg_potassium?: string;
  window_start?: string;
  window_end?: string;
}

export default function SensorHistory() {
  const [selectedSensor, setSelectedSensor] = useState<SensorOption>(
    sensorOptions[0]
  );
  const [selectedWindow, setSelectedWindow] = useState<"24h" | "7d" | "30d">("7d");
  const [readings, setReadings] = useState<FormattedReading[]>([]);
  const [thresholds, setThresholds] = useState<Record<string, ThresholdItem>>({});
  const [windowSummary, setWindowSummary] = useState<WindowSummary | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoryData = useCallback(async (currentPage: number, windowParam: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const token = localStorage.getItem("token");
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      // Fetch telemetry history, threshold rules, and time-window averages in parallel
      const [historyRes, threshRes, avgRes] = await Promise.all([
        fetch(`${baseUrl}/sensor/history?page=${currentPage}&limit=10`, { headers }),
        fetch(`${baseUrl}/thresholds`, { headers }),
        fetch(`${baseUrl}/sensor/averages?window=${windowParam}`, { headers }),
      ]);

      if (!historyRes.ok) {
        throw new Error("Failed to fetch sensor history.");
      }

      const result = await historyRes.json();
      const rawData = result.data || [];

      // Format numeric API telemetry
      const formatted: FormattedReading[] = rawData.map((item: any) => {
        const dateObj = new Date(item.reading_time || item.created_at);
        return {
          id: item.id,
          time: dateObj.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "Asia/Jakarta",
          }),
          date: dateObj.toLocaleDateString("id-ID", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "Asia/Jakarta",
          }),
          kelembapan_tanah: parseFloat(item.kelembapan_tanah || item.kelembapan_tanah || "0"),
          suhu: parseFloat(item.suhu || "0"),
          tekanan: parseFloat(item.tekanan || "0"),
          humidity: parseFloat(item.humidity || "0"),
          nitrogen: parseFloat(item.nitrogen || "0"),
          phosphorus: parseFloat(item.phosphorus || "0"),
          potassium: parseFloat(item.potassium || "0"),
          rssi: item.rssi || 0,
          snr: parseFloat(item.snr || "0"),
          rawTime: item.reading_time || item.created_at,
        };
      });

      setReadings(formatted);
      if (result.pagination) {
        setPagination(result.pagination);
      }

      // Map thresholds
      if (threshRes.ok) {
        const threshResult = await threshRes.json();
        const threshMap: Record<string, ThresholdItem> = {};
        (threshResult.data || []).forEach((item: ThresholdItem) => {
          threshMap[item.parameter_name] = item;
        });
        setThresholds(threshMap);
      }

      // Map window averages
      if (avgRes.ok) {
        const avgResult = await avgRes.json();
        setWindowSummary(avgResult.data?.summary || null);
      }

      setError(null);
    } catch (err) {
      console.error("Sensor history fetch error:", err);
      setError("Unable to retrieve sensor history stream.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoryData(page, selectedWindow);
    const interval = setInterval(() => {
      fetchHistoryData(page, selectedWindow);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchHistoryData, page, selectedWindow]);

  // Filter available options based on active threshold settings from API
  const activeSensorOptions = useMemo(() => {
    return sensorOptions.filter((option) => {
      if (option.value === "rssi" || option.value === "snr") return true;
      return thresholds[option.value]?.is_enabled !== 0;
    });
  }, [thresholds]);

  // Auto-fallback if the currently selected sensor becomes disabled
  useEffect(() => {
    if (
      activeSensorOptions.length > 0 &&
      !activeSensorOptions.some((opt) => opt.value === selectedSensor.value)
    ) {
      setSelectedSensor(activeSensorOptions[0]);
    }
  }, [activeSensorOptions, selectedSensor]);

  // Dynamic calculations for current value and min/max stats
  const latestValue = useMemo(() => {
    if (readings.length === 0) return "--";
    return readings[0][selectedSensor.value];
  }, [readings, selectedSensor]);

  const minStat = useMemo(() => {
    if (readings.length === 0) return "--";
    const values = readings.map((r) => r[selectedSensor.value] as number);
    return Math.min(...values);
  }, [readings, selectedSensor]);

  const maxStat = useMemo(() => {
    if (readings.length === 0) return "--";
    const values = readings.map((r) => r[selectedSensor.value] as number);
    return Math.max(...values);
  }, [readings, selectedSensor]);

  const pageAvgStat = useMemo(() => {
    if (readings.length === 0) return "--";
    const values = readings.map((r) => r[selectedSensor.value] as number);
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    return (sum / values.length).toFixed(2);
  }, [readings, selectedSensor]);

  // Map API response window summary to currently selected sensor
  const windowAvgStat = useMemo(() => {
    if (!windowSummary) return "--";

    // Map parameter key to API response field name
    const apiKeyMap: Record<string, keyof WindowSummary> = {
      kelembapan_tanah: "avg_kelembapan_tanah",
      suhu: "avg_suhu",
      tekanan: "avg_tekanan",
      humidity: "avg_humidity",
      nitrogen: "avg_nitrogen",
      phosphorus: "avg_phosphorus",
      potassium: "avg_potassium",
    };

    const targetKey = apiKeyMap[selectedSensor.value];
    if (targetKey && windowSummary[targetKey] !== undefined) {
      return parseFloat(String(windowSummary[targetKey])).toFixed(2);
    }

    return "--";
  }, [windowSummary, selectedSensor]);

  return (
    <div className="px-8 py-7">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#152619]">
            Sensor History
          </h1>
          <p className="mt-1 text-sm text-[#617565]">
            Historical sensor measurements and telemetry logs
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#28733d] bg-[#e8f6eb] px-3 py-1.5 rounded-full font-medium">
          <span className="h-2 w-2 rounded-full bg-[#43c878] animate-pulse" />
          Live Polling Active (10s)
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-[#fde8e8] p-3 text-xs text-[#e02424]">
          {error}
        </div>
      )}

      {/* Main Container */}
      <Card className="mt-6 p-5">
        {/* Chart header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#28402d]">
              {selectedSensor.label}
            </h2>
            <p className="mt-1 text-xs text-[#849187]">
              Historical readings & trends
            </p>
          </div>

          {/* Dynamic Sensor selector */}
          <div>
            <div className="flex flex-wrap gap-2">
              {activeSensorOptions.map((sensor) => {
                const isSelected = selectedSensor.value === sensor.value;

                return (
                  <button
                    key={sensor.value}
                    type="button"
                    onClick={() => setSelectedSensor(sensor)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${isSelected
                        ? "bg-[#347b49] text-white shadow-sm"
                        : "bg-[#f2f6f3] text-[#5f7064] hover:bg-[#e7eee9]"
                      }`}
                  >
                    {sensor.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current value */}
        <div className="mt-5 flex items-end gap-2">
          <span className="text-3xl font-semibold tracking-tight text-[#25352a]">
            {latestValue}
          </span>
          <span className="mb-1 text-sm font-medium text-[#78867c]">
            {selectedSensor.unit}
          </span>
        </div>

        {/* Chart Component */}
        <div className="mt-4">
          {loading && readings.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-xs text-[#617565]">
              Loading telemetry graph...
            </div>
          ) : (
            <SensorHistoryChart
              data={[...readings].reverse()}
              dataKey={selectedSensor.value}
              unit={selectedSensor.unit}
            />
          )}
        </div>

        {/* Table Component */}
        <div className="mt-6 border-t border-[#edf1ed] pt-5">
          <SensorHistoryTable
            data={readings}
            pagination={pagination}
            page={page}
            onPageChange={(newPage: number) => setPage(newPage)}
            loading={loading}
          />
        </div>

        {/* Summary Stats Header & Time-Window Filter */}
        <div className="mt-5 border-t border-[#edf1ed] pt-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[#28402d]">
              Statistical Aggregates
            </span>

            {/* Time Window Selector Buttons */}
            <div className="flex items-center gap-1 rounded-lg bg-[#f2f6f3] p-1 text-[11px]">
              {(["24h", "7d", "30d"] as const).map((win) => (
                <button
                  key={win}
                  type="button"
                  onClick={() => setSelectedWindow(win)}
                  className={`rounded-md px-2.5 py-1 font-semibold transition ${selectedWindow === win
                      ? "bg-[#347b49] text-white shadow-2xs"
                      : "text-[#5f7064] hover:text-[#152619]"
                    }`}
                >
                  {win.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div>
              <p className="text-[11px] text-[#849187]">Min (Page)</p>
              <p className="mt-1 text-sm font-semibold text-[#3b5141]">
                {minStat} {selectedSensor.unit}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-[#849187]">Page Avg</p>
              <p className="mt-1 text-sm font-semibold text-[#347b49]">
                {pageAvgStat} {selectedSensor.unit}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-[#849187] uppercase">
                {selectedWindow} Window Avg
              </p>
              <p className="mt-1 text-sm font-semibold text-[#28733d]">
                {windowAvgStat} {selectedSensor.unit}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-[#849187]">Max (Page)</p>
              <p className="mt-1 text-sm font-semibold text-[#3b5141]">
                {maxStat} {selectedSensor.unit}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-[#849187]">Window Samples</p>
              <p className="mt-1 text-sm font-semibold text-[#3b5141]">
                {windowSummary?.total_readings ?? "--"} readings
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}