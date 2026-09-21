import { useEffect, useState, useCallback } from "react";
import SoilMoistureCard from "../components/dashboard/SoilMoistureCard";
import TemperatureHumidityCard from "../components/dashboard/TemperatureHumidityCard";
import NpkCard from "../components/dashboard/NpkCard";
import LoraSignalCard from "../components/dashboard/LoraSignalCard";
import AlertsCard from "../components/dashboard/AlertsCard";
import type { LiveSensorApiResponse, ThresholdItem } from "../types/sensor";

export default function Dashboard() {
  const [liveData, setLiveData] = useState<LiveSensorApiResponse["data"] | null>(null);
  const [thresholds, setThresholds] = useState<Record<string, ThresholdItem>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("--.--.--");

  const fetchDashboardData = useCallback(async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const token = localStorage.getItem("token");

      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch live sensor data and thresholds in parallel
      const [liveRes, threshRes] = await Promise.all([
        fetch(`${baseUrl}/sensor/live`, { headers }),
        fetch(`${baseUrl}/thresholds`, { headers }),
      ]);

      if (!liveRes.ok) {
        throw new Error("Failed to fetch live sensor reading");
      }

      const liveResult: LiveSensorApiResponse = await liveRes.json();
      if (liveResult.data) {
        setLiveData(liveResult.data);
        const dateObj = new Date(liveResult.data.reading_time || liveResult.data.created_at);
        const formatted = dateObj.toTimeString().split(" ")[0].replace(/:/g, ".");
        setLastUpdatedTime(formatted);
      }

      if (threshRes.ok) {
        const threshResult = await threshRes.json();
        const threshMap: Record<string, ThresholdItem> = {};
        (threshResult.data || []).forEach((item: ThresholdItem) => {
          threshMap[item.parameter_name] = item;
        });
        setThresholds(threshMap);
      }

      setError(null);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Unable to connect to live sensor stream.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const soilMoisture = liveData ? parseFloat(liveData.kelembapan_tanah) : 0;
  const temperature = liveData ? parseFloat(liveData.suhu) : 0;
  const pressure = liveData ? parseFloat(liveData.tekanan) : 0;
  const humidity = liveData ? parseFloat(liveData.humidity) : 0;
  const nitrogen = liveData ? parseFloat(liveData.nitrogen) : 0;
  const phosphorus = liveData ? parseFloat(liveData.phosphorus) : 0;
  const potassium = liveData ? parseFloat(liveData.potassium) : 0;
  const rssi = liveData ? liveData.rssi : 0;
  const snr = liveData ? parseFloat(liveData.snr) : 0;
  const isEnabled = (paramName: string) => thresholds[paramName]?.is_enabled !== 0;

  return (
    <div className="px-8 py-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#152619]">
            Live Monitoring
          </h1>
          <p className="mt-1 text-sm text-[#617565]">
            Last update:{" "}
            <span className="font-mono text-[#23753d]">
              {lastUpdatedTime}
            </span>
          </p>
        </div>

        {error && (
          <span className="rounded-full bg-[#fde8e8] px-3 py-1 text-xs font-semibold text-[#e02424]">
            {error}
          </span>
        )}
      </div>

      {/* Sensor cards */}
      {loading && !liveData ? (
        <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border border-[#e3ebe4] bg-white">
          <p className="text-sm font-medium text-[#617565]">Fetching latest sensor metrics...</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Soil Moisture (checks kelembapan_tanah directly) */}
          {isEnabled("kelembapan_tanah") && (
            <SoilMoistureCard
              moisture={soilMoisture}
              threshold={thresholds.kelembapan_tanah}
            />
          )}

          {/* Temperature & Humidity */}
          {(isEnabled("suhu") || isEnabled("humidity") || isEnabled("tekanan")) && (
            <TemperatureHumidityCard
              temperature={temperature}
              humidity={humidity}
              pressure={pressure}
              tempThreshold={thresholds.suhu}
              humThreshold={thresholds.humidity}
              pressThreshold={thresholds.tekanan}
            />
          )}

          {/* NPK Card (renders if at least 1 nutrient is enabled) */}
          {(isEnabled("nitrogen") || isEnabled("phosphorus") || isEnabled("potassium")) && (
            <NpkCard
              nitrogen={nitrogen}
              phosphorus={phosphorus}
              potassium={potassium}
              nThreshold={thresholds.nitrogen}
              pThreshold={thresholds.phosphorus}
              kThreshold={thresholds.potassium}
            />
          )}

          <LoraSignalCard rssi={rssi} snr={snr} />

          <AlertsCard />
        </div>
      )}
    </div>
  );
}