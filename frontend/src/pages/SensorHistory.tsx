import { useEffect, useState, useCallback, useMemo } from "react";
import Card from "../components/common/Card";
import SensorHistoryChart from "../components/dashboard/SensorHistoryChart";
import SensorHistoryTable from "../components/dashboard/SensorHistoryTable";
import type { ThresholdItem, GuestCardConfig } from "../types/sensor";

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

// 1. Defined available window options
type WindowFilter = "all" | "24h" | "7d" | "30d" | "custom";

export default function SensorHistory() {
  const [selectedSensor, setSelectedSensor] = useState<SensorOption>(
    sensorOptions[0]
  );
  
  // 2. Added new states for advanced filtering
  const [selectedWindow, setSelectedWindow] = useState<WindowFilter>("7d");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [readings, setReadings] = useState<FormattedReading[]>([]);
  const [thresholds, setThresholds] = useState<Record<string, ThresholdItem>>({});
  const [viewConfig, setViewConfig] = useState<GuestCardConfig | null>(null);
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

  // 3. Updated fetch function to handle custom dates and 'all'
  const fetchHistoryData = useCallback(async (currentPage: number, windowParam: WindowFilter, start: string, end: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const token = localStorage.getItem("token");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      // Dynamically build History URL and Averages URL
      let historyUrl = `${baseUrl}/sensor/history?page=${currentPage}&limit=10`;
      let avgUrl = `${baseUrl}/sensor/averages`;

      if (windowParam === "custom" && start && end) {
        historyUrl += `&start_date=${start}&end_date=${end}`;
        avgUrl += `?start_date=${start}&end_date=${end}`;
      } else if (windowParam !== "custom" && windowParam !== "all") {
        historyUrl += `&window=${windowParam}`;
        avgUrl += `?window=${windowParam}`;
      } else if (windowParam === "all") {
        historyUrl += `&window=all`;
        avgUrl += `?window=all`;
      }

      const [historyRes, threshRes, avgRes, viewRes] = await Promise.all([
        fetch(historyUrl, { headers }),
        fetch(`${baseUrl}/thresholds`, { headers }),
        fetch(avgUrl, { headers }),
        fetch(`${baseUrl}/config/guest-cards`, { headers }),
      ]);

      if (!historyRes.ok) throw new Error("Failed to fetch sensor history.");

      const result = await historyRes.json();
      const rawData = result.data || [];

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
          kelembapan_tanah: parseFloat(item.kelembapan_tanah || item.kelembapan || "0"),
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
      if (result.pagination) setPagination(result.pagination);

      if (threshRes.ok) {
        const threshResult = await threshRes.json();
        const threshMap: Record<string, ThresholdItem> = {};
        (threshResult.data || []).forEach((item: ThresholdItem) => {
          threshMap[item.parameter_name] = item;
        });
        setThresholds(threshMap);
      }

      if (viewRes.ok) {
        const viewResult = await viewRes.json();
        setViewConfig(viewResult.data);
      }

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

  // 4. Added startDate and endDate to dependency array
  useEffect(() => {
    fetchHistoryData(page, selectedWindow, startDate, endDate);
    const interval = setInterval(() => {
      fetchHistoryData(page, selectedWindow, startDate, endDate);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchHistoryData, page, selectedWindow, startDate, endDate]);

  const activeSensorOptions = useMemo(() => {
    return sensorOptions.filter((option) => {
      const thresholdKey = option.value === "kelembapan_tanah" ? "kelembapan_tanah" : option.value;
      const isThresholdEnabled = thresholds[thresholdKey] ? thresholds[thresholdKey].is_enabled !== 0 : true;

      let isViewEnabled = true;
      if (viewConfig) {
        const configKey = option.value === "kelembapan_tanah" ? "kelembapan_tanah" : option.value;
        isViewEnabled = viewConfig[configKey as keyof GuestCardConfig] !== false;
      }

      return isThresholdEnabled && isViewEnabled;
    });
  }, [thresholds, viewConfig]);

  useEffect(() => {
    if (
      activeSensorOptions.length > 0 &&
      !activeSensorOptions.some((opt) => opt.value === selectedSensor.value)
    ) {
      setSelectedSensor(activeSensorOptions[0]);
    }
  }, [activeSensorOptions, selectedSensor]);

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

  const windowAvgStat = useMemo(() => {
    if (!windowSummary) return "--";

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
    <div className="px-4 py-5 lg:px-8 lg:py-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#152619]">
            Sensor History
          </h1>
          <p className="mt-1 text-sm text-[#617565]">
            Historical sensor measurements and telemetry logs
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 text-xs text-[#28733d] bg-[#e8f6eb] px-3 py-1.5 rounded-full font-medium">
          <span className="h-2 w-2 rounded-full bg-[#43c878] animate-pulse" />
          Live Polling Active (10s)
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-[#fde8e8] p-3 text-xs text-[#e02424]">
          {error}
        </div>
      )}

      <Card className="mt-6 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#28402d]">
              {selectedSensor.label}
            </h2>
            <p className="mt-1 text-xs text-[#849187]">
              Historical readings & trends
            </p>
          </div>

          <div className="w-full lg:w-auto">
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

        <div className="mt-5 flex items-end gap-2">
          <span className="text-3xl font-semibold tracking-tight text-[#25352a]">
            {latestValue}
          </span>
          <span className="mb-1 text-sm font-medium text-[#78867c]">
            {selectedSensor.unit}
          </span>
        </div>

        <div className="mt-4 overflow-hidden">
          {loading && readings.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-xs text-[#617565]">
              Loading telemetry graph...
            </div>
          ) : (
            <SensorHistoryChart
              data={[...readings].reverse()}
              dataKey={selectedSensor.value}
              unit={selectedSensor.unit}
              yAxisLabel={selectedSensor.label}
            />
          )}
        </div>

        {/* Summary Stats Header & Time-Window Filter */}
        <div className="mt-5 border-t border-[#edf1ed] pt-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
            <span className="text-xs font-semibold text-[#28402d]">
              Statistical Aggregates
            </span>

            {/* 5. UI Controls for Time Window & Custom Dates */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-1 rounded-lg bg-[#f2f6f3] p-1 text-[11px] w-fit">
                {(["all", "24h", "7d", "30d", "custom"] as WindowFilter[]).map((win) => (
                  <button
                    key={win}
                    type="button"
                    onClick={() => setSelectedWindow(win)}
                    className={`rounded-md px-2.5 py-1 font-semibold transition ${selectedWindow === win
                      ? "bg-[#347b49] text-white shadow-xs"
                      : "text-[#5f7064] hover:text-[#152619]"
                      }`}
                  >
                    {win.toUpperCase()}
                  </button>
                ))}
              </div>

              {selectedWindow === "custom" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs border border-[#e3ebe4] rounded-md px-2.5 py-1.5 outline-none focus:border-[#347b49]"
                  />
                  <span className="text-[#849187] text-[11px] font-medium">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs border border-[#e3ebe4] rounded-md px-2.5 py-1.5 outline-none focus:border-[#347b49]"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-3 sm:grid-cols-5">
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

        <div className="mt-6 border-t border-[#edf1ed] pt-5">
          <SensorHistoryTable
            data={readings}
            pagination={pagination}
            page={page}
            onPageChange={(newPage: number) => setPage(newPage)}
            loading={loading}
          />
        </div>
      </Card>
    </div>
  );
}