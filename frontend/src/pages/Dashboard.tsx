import { useEffect, useState, useCallback } from "react";
import SoilMoistureCard from "../components/dashboard/SoilMoistureCard";
import TemperatureHumidityCard from "../components/dashboard/TemperatureHumidityCard";
import NpkCard from "../components/dashboard/NpkCard";
import LoraSignalCard from "../components/dashboard/LoraSignalCard";
import LoraConfigCard from "../components/dashboard/LoraConfigCard";
import AlertsCard from "../components/dashboard/AlertsCard";
import type { LiveSensorApiResponse, ThresholdItem, GuestCardConfig } from "../types/sensor";
import WeatherCard from "../components/dashboard/WeatherCard";

export default function Dashboard() {
  const [liveData, setLiveData] = useState<LiveSensorApiResponse["data"] | null>(null);
  const [thresholds, setThresholds] = useState<Record<string, ThresholdItem>>({});
  const [guestConfig, setGuestConfig] = useState<GuestCardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("--.--.--");

  const fetchDashboardData = useCallback(async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const token = localStorage.getItem("token");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const [liveRes, threshRes, guestRes] = await Promise.all([
        fetch(`${baseUrl}/sensor/live`, { headers }),
        fetch(`${baseUrl}/thresholds`, { headers }),
        fetch(`${baseUrl}/config/guest-cards`, { headers }),
      ]);

      if (!liveRes.ok) throw new Error("Failed to fetch live sensor reading");

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

      if (guestRes.ok) {
        const guestResult = await guestRes.json();
        setGuestConfig(guestResult.data);
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
  const status = liveData?.status || "--";
  const frequency = liveData?.frequency || "--";
  const spreadingFactor = liveData?.spreading_factor || "--";
  const bandwidth = liveData?.bandwidth || "--";
  const lastActivity = liveData?.last_activity || "--";

  const isModuleActive = (params: string[]) => {
    return params.some((param) => {
      const isThreshOn = thresholds[param] ? thresholds[param].is_enabled !== 0 : true;
      let isViewOn = true;
      if (guestConfig) {
        const configKey = param === "kelembapan" ? "kelembapan_tanah" : param;
        isViewOn = guestConfig[configKey as keyof GuestCardConfig] !== false;
      }
      return isThreshOn && isViewOn;
    });
  };

  const showSoilCard = isModuleActive(["kelembapan_tanah"]);
  const showClimateCard = isModuleActive(["suhu", "humidity", "tekanan"]);
  const showNpkCard = isModuleActive(["nitrogen", "phosphorus", "potassium"]);
  const showLoraSignalCard = isModuleActive(["rssi", "snr"]);
  const showLoraConfigCard = isModuleActive(["status", "frequency", "spreading_factor", "bandwidth", "last_activity"]);

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-7">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#152619]">Live Monitoring</h1>
          <p className="mt-1 text-sm text-[#617565]">
            Last update: <span className="font-mono text-[#23753d]">{lastUpdatedTime}</span>
          </p>
        </div>
        {error && (
          <span className="rounded-full bg-[#fde8e8] px-3 py-1 text-xs font-semibold text-[#e02424]">
            {error}
          </span>
        )}
      </div>

      {loading && !liveData ? (
        <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border border-[#e3ebe4] bg-white">
          <p className="text-sm font-medium text-[#617565]">Fetching latest sensor metrics...</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <WeatherCard />

          {showSoilCard && (
            <SoilMoistureCard moisture={soilMoisture} threshold={thresholds.kelembapan_tanah} />
          )}

          {showClimateCard && (
            <TemperatureHumidityCard
              temperature={temperature}
              humidity={humidity}
              pressure={pressure}
              tempThreshold={thresholds.suhu}
              humThreshold={thresholds.humidity}
              pressThreshold={thresholds.tekanan}
            />
          )}

          {showNpkCard && (
            <NpkCard
              nitrogen={nitrogen}
              phosphorus={phosphorus}
              potassium={potassium}
              nThreshold={thresholds.nitrogen}
              pThreshold={thresholds.phosphorus}
              kThreshold={thresholds.potassium}
            />
          )}

          {showLoraSignalCard && (
            <LoraSignalCard rssi={rssi} snr={snr} viewConfig={guestConfig} />
          )}

          {showLoraConfigCard && (
            <LoraConfigCard 
              status={status}
              frequency={frequency}
              spreadingFactor={spreadingFactor}
              bandwidth={bandwidth}
              lastActivity={lastActivity}
              viewConfig={guestConfig}
            />
          )}

          <AlertsCard />
        </div>
      )}
    </div>
  );
}