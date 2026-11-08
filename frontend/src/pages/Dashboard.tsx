import { useEffect, useState, useCallback } from "react";
import { Radio, Globe, Settings2 } from "lucide-react"; // <-- Import ikon baru
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
  
  // <-- State baru untuk menyimpan mode hardware saat ini
  const [hardwareMode, setHardwareMode] = useState<"AUTO" | "LORA" | "INTERNET">("AUTO"); 
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("--.--.--");

  const fetchDashboardData = useCallback(async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const token = localStorage.getItem("token");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      // Tambahkan fetch hardware-mode ke dalam Promise.all
      const [liveRes, threshRes, guestRes, modeRes] = await Promise.all([
        fetch(`${baseUrl}/sensor/live`, { headers }),
        fetch(`${baseUrl}/thresholds`, { headers }),
        fetch(`${baseUrl}/config/guest-cards`, { headers }),
        fetch(`${baseUrl}/config/hardware-mode`, { headers }), // <-- Fetch initial mode
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

      // Membaca initial mode dari database saat load pertama
      if (modeRes.ok) {
        const modeResult = await modeRes.json();
        if (modeResult.mode) setHardwareMode(modeResult.mode);
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

 const handleModeChange = async (newMode: "AUTO" | "LORA" | "INTERNET") => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/config/hardware-mode`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ mode: newMode })
      });
      
      if (res.ok) {
        setHardwareMode(newMode); 
      }
    } catch (err) {
      console.error("Failed to change mode", err);
    }
  };

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

      {/* --- KOTAK KONTROL MODE HARDWARE --- */}
      <div className="mt-6 rounded-xl border border-[#e3ebe4] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#28402d]">
              Hardware Transmission Mode
            </h2>
            <p className="mt-1 text-xs text-[#849187]">
              Pilih jalur transmisi utama untuk pengiriman data sensor dari perangkat.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-[#f2f6f3] p-1 w-fit">
            <button
              type="button"
              onClick={() => handleModeChange("AUTO")}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-all ${
                hardwareMode === "AUTO"
                  ? "bg-[#347b49] text-white shadow-sm"
                  : "text-[#5f7064] hover:text-[#152619] hover:bg-[#e7eee9]"
              }`}
            >
              <Settings2 size={14} />
              Auto
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("LORA")}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-all ${
                hardwareMode === "LORA"
                  ? "bg-[#347b49] text-white shadow-sm"
                  : "text-[#5f7064] hover:text-[#152619] hover:bg-[#e7eee9]"
              }`}
            >
              <Radio size={14} />
              LoRa Only
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("INTERNET")}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-all ${
                hardwareMode === "INTERNET"
                  ? "bg-[#398bc7] text-white shadow-sm" 
                  : "text-[#5f7064] hover:text-[#152619] hover:bg-[#e7eee9]"
              }`}
            >
              <Globe size={14} />
              Internet Only
            </button>
          </div>
        </div>
      </div>
      {/* ------------------------------------- */}

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