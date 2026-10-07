import { useEffect, useState, useCallback } from "react";
import { Sliders, Save, CheckCircle2, Eye, EyeOff, Thermometer, Sprout, Droplets, Radio, Server } from "lucide-react";
import Card from "../components/common/Card";
import type { ThresholdItem, ThresholdsApiResponse, GuestCardConfig } from "../types/sensor";

const PARAMETER_LABELS: Record<string, { label: string; unit: string }> = {
  kelembapan: { label: "Soil Moisture", unit: "%" },
  kelembapan_tanah: { label: "Soil Moisture", unit: "%" },
  suhu: { label: "Temperature", unit: "°C" },
  tekanan: { label: "Pressure", unit: "hPa" },
  humidity: { label: "Air Humidity", unit: "%" },
  nitrogen: { label: "Nitrogen (N)", unit: "mg/kg" },
  phosphorus: { label: "Phosphorus (P)", unit: "mg/kg" },
  potassium: { label: "Potassium (K)", unit: "mg/kg" },
};

export default function AlertThresholds() {
  const [thresholds, setThresholds] = useState<ThresholdItem[]>([]);
  const [viewConfig, setViewConfig] = useState<GuestCardConfig | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [savingView, setSavingView] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const headers = { Authorization: `Bearer ${token}` };

      const [threshRes, viewRes] = await Promise.all([
        fetch(`${baseUrl}/thresholds`, { headers }),
        fetch(`${baseUrl}/config/guest-cards`, { headers })
      ]);

      if (threshRes.ok) {
        const result: ThresholdsApiResponse = await threshRes.json();
        setThresholds(result.data || []);
      }

      if (viewRes.ok) {
        const result = await viewRes.json();
        setViewConfig(result.data);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 1. Global Sensor Boundaries Handlers ---
  const handleInputChange = (index: number, field: "min_value" | "max_value", val: string) => {
    const updated = [...thresholds];
    updated[index][field] = val;
    setThresholds(updated);
  };

  const handleToggleEnable = (index: number) => {
    const updated = [...thresholds];
    updated[index].is_enabled = updated[index].is_enabled === 1 ? 0 : 1;
    setThresholds(updated);
  };

  const handleSaveThresholds = async () => {
    setSavingAll(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem("token");
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const requests = thresholds.map((item) =>
        fetch(`${baseUrl}/thresholds/${item.parameter_name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            min_value: item.min_value,
            max_value: item.max_value,
            is_enabled: item.is_enabled,
          }),
        })
      );

      const responses = await Promise.all(requests);
      if (responses.some((res) => !res.ok)) throw new Error("Failed to save some thresholds.");

      setSuccessMsg("Global threshold configurations saved successfully!");
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSavingAll(false);
    }
  };

  // --- 2. Dynamic 5-Module Toggle Handlers ---
  const handleToggleModule = (module: "soil" | "climate" | "npk" | "lora_signal" | "lora_config") => {
    if (!viewConfig) return;

    if (module === "soil") {
      setViewConfig({ ...viewConfig, kelembapan_tanah: !viewConfig.kelembapan_tanah });
    } else if (module === "climate") {
      const targetState = !(viewConfig.suhu || viewConfig.humidity || viewConfig.tekanan);
      setViewConfig({ ...viewConfig, suhu: targetState, humidity: targetState, tekanan: targetState });
    } else if (module === "npk") {
      const targetState = !(viewConfig.nitrogen || viewConfig.phosphorus || viewConfig.potassium);
      setViewConfig({ ...viewConfig, nitrogen: targetState, phosphorus: targetState, potassium: targetState });
    } else if (module === "lora_signal") {
      const targetState = !(viewConfig.rssi || viewConfig.snr);
      setViewConfig({ ...viewConfig, rssi: targetState, snr: targetState });
    } else if (module === "lora_config") {
      const targetState = !(viewConfig.status || viewConfig.frequency || viewConfig.spreading_factor || viewConfig.bandwidth || viewConfig.last_activity);
      setViewConfig({
        ...viewConfig,
        status: targetState,
        frequency: targetState,
        spreading_factor: targetState,
        bandwidth: targetState,
        last_activity: targetState
      });
    }
  };

  const handleSaveViewConfig = async () => {
    if (!viewConfig) return;
    setSavingView(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem("token");
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/config/guest-cards`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(viewConfig),
      });

      if (!res.ok) throw new Error("Failed to save view settings.");

      setSuccessMsg("Global view settings updated!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred saving global view config.");
    } finally {
      setSavingView(false);
    }
  };

  // Group status helpers
  const isSoilActive = !!viewConfig?.kelembapan_tanah;
  const isClimateActive = !!(viewConfig?.suhu || viewConfig?.humidity || viewConfig?.tekanan);
  const isNpkActive = !!(viewConfig?.nitrogen || viewConfig?.phosphorus || viewConfig?.potassium);
  const isLoraSignalActive = !!(viewConfig?.rssi || viewConfig?.snr);
  const isLoraConfigActive = !!(viewConfig?.status || viewConfig?.frequency || viewConfig?.spreading_factor || viewConfig?.bandwidth || viewConfig?.last_activity);

  return (
      <div className="px-4 py-5 lg:px-8 lg:py-7">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#152619]">Settings & Configuration</h1>
            <p className="mt-1 text-sm text-[#617565]">Manage sensor boundaries and global dashboard visibility</p>
          </div>
          {successMsg && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#eef7e8] px-3.5 py-1.5 text-xs font-medium text-[#28733d]">
              <CheckCircle2 size={15} /> {successMsg}
            </div>
          )}
          {error && (
            <div className="rounded-full bg-[#fde8e8] px-3.5 py-1.5 text-xs font-semibold text-[#e02424]">
              {error}
            </div>
          )}
        </div>

        {/* 1. Global Alert Thresholds Card */}
        <Card className="p-5 mb-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f6eb] text-[#28733d]">
                <Sliders size={17} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#28402d]">Global Sensor Boundaries</h2>
                <p className="text-[11px] text-[#849187]">Disabling a sensor here disables alerts for EVERYONE.</p>
              </div>
            </div>
            <button
              onClick={handleSaveThresholds}
              disabled={loading || savingAll}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#347b49] px-4 py-2.5 text-xs font-medium text-white shadow-xs transition hover:bg-[#286139] disabled:opacity-50"
            >
              <Save size={15} />
              {savingAll ? "Saving..." : "Save Boundaries"}
            </button>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center text-xs text-[#617565]">Loading thresholds...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#edf1ed] text-[11px] font-semibold uppercase tracking-wider text-[#849187]">
                  <tr>
                    <th className="py-3 px-3">Parameter</th>
                    <th className="py-3 px-3">Min Value</th>
                    <th className="py-3 px-3">Max Value</th>
                    <th className="py-3 px-3">Alert Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f6f3]">
                  {thresholds.map((item, idx) => {
                    const info = PARAMETER_LABELS[item.parameter_name] || { label: item.parameter_name, unit: "" };
                    return (
                      <tr key={item.id} className="hover:bg-[#f7faf7]">
                        <td className="py-3.5 px-3 font-semibold text-[#25352a]">
                          {info.label} <span className="font-normal text-[#849187]">({info.unit})</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <input type="number" step="0.01" value={item.min_value} onChange={(e) => handleInputChange(idx, "min_value", e.target.value)} className="w-24 rounded-lg border border-[#e3ebe4] px-2.5 py-1.5 text-xs outline-none focus:border-[#347b49]" />
                        </td>
                        <td className="py-3.5 px-3">
                          <input type="number" step="0.01" value={item.max_value} onChange={(e) => handleInputChange(idx, "max_value", e.target.value)} className="w-24 rounded-lg border border-[#e3ebe4] px-2.5 py-1.5 text-xs outline-none focus:border-[#347b49]" />
                        </td>
                        <td className="py-3.5 px-3">
                          <button onClick={() => handleToggleEnable(idx)} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${item.is_enabled === 1 ? "bg-[#e8f6eb] text-[#28733d]" : "bg-[#f3f4f6] text-[#6b7280]"}`}>
                            {item.is_enabled === 1 ? "Active" : "Disabled"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* 2. Global View Settings Card */}
        <Card className="p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0ebfa] text-[#7352a8]">
                <Eye size={17} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#28402d]">Global View Settings</h2>
                <p className="text-[11px] text-[#849187]">Enable or disable sensor modules on the dashboard and history pages for all users.</p>
              </div>
            </div>
            <button
              onClick={handleSaveViewConfig}
              disabled={loading || savingView || !viewConfig}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7352a8] px-4 py-2.5 text-xs font-medium text-white shadow-xs transition hover:bg-[#563c80] disabled:opacity-50"
            >
              <Save size={15} />
              {savingView ? "Saving..." : "Save View Settings"}
            </button>
          </div>

          {loading || !viewConfig ? (
            <div className="flex h-20 items-center justify-center text-xs text-[#617565]">Loading settings...</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mt-5">
              {/* Option 1: Soil Moisture */}
              <button
                type="button"
                onClick={() => handleToggleModule("soil")}
                className={`flex items-center justify-between p-4 rounded-xl border text-xs font-medium transition-all ${isSoilActive
                  ? "border-[#7352a8] bg-[#fdfcff] text-[#2b1f40]"
                  : "border-[#e3ebe4] bg-[#fafcfb] text-[#849187]"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Droplets size={18} className={isSoilActive ? "text-[#7352a8]" : "text-[#849187]"} />
                  <div className="text-left">
                    <p className="font-semibold text-xs">Soil Moisture</p>
                  </div>
                </div>
                {isSoilActive ? <Eye size={16} className="text-[#7352a8]" /> : <EyeOff size={16} />}
              </button>

              {/* Option 2: Climate Sensor Group */}
              <button
                type="button"
                onClick={() => handleToggleModule("climate")}
                className={`flex items-center justify-between p-4 rounded-xl border text-xs font-medium transition-all ${isClimateActive
                  ? "border-[#7352a8] bg-[#fdfcff] text-[#2b1f40]"
                  : "border-[#e3ebe4] bg-[#fafcfb] text-[#849187]"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Thermometer size={18} className={isClimateActive ? "text-[#7352a8]" : "text-[#849187]"} />
                  <div className="text-left">
                    <p className="font-semibold text-xs">Climate</p>
                  </div>
                </div>
                {isClimateActive ? <Eye size={16} className="text-[#7352a8]" /> : <EyeOff size={16} />}
              </button>

              {/* Option 3: NPK Probe Group */}
              <button
                type="button"
                onClick={() => handleToggleModule("npk")}
                className={`flex items-center justify-between p-4 rounded-xl border text-xs font-medium transition-all ${isNpkActive
                  ? "border-[#7352a8] bg-[#fdfcff] text-[#2b1f40]"
                  : "border-[#e3ebe4] bg-[#fafcfb] text-[#849187]"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sprout size={18} className={isNpkActive ? "text-[#7352a8]" : "text-[#849187]"} />
                  <div className="text-left">
                    <p className="font-semibold text-xs">NPK Probe</p>
                  </div>
                </div>
                {isNpkActive ? <Eye size={16} className="text-[#7352a8]" /> : <EyeOff size={16} />}
              </button>

              {/* Option 4: LoRa Signal */}
              <button
                type="button"
                onClick={() => handleToggleModule("lora_signal")}
                className={`flex items-center justify-between p-4 rounded-xl border text-xs font-medium transition-all ${isLoraSignalActive
                  ? "border-[#7352a8] bg-[#fdfcff] text-[#2b1f40]"
                  : "border-[#e3ebe4] bg-[#fafcfb] text-[#849187]"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Radio size={18} className={isLoraSignalActive ? "text-[#7352a8]" : "text-[#849187]"} />
                  <div className="text-left">
                    <p className="font-semibold text-xs">Signal</p>
                  </div>
                </div>
                {isLoraSignalActive ? <Eye size={16} className="text-[#7352a8]" /> : <EyeOff size={16} />}
              </button>
              
              {/* Option 5: LoRa Config */}
              <button
                type="button"
                onClick={() => handleToggleModule("lora_config")}
                className={`flex items-center justify-between p-4 rounded-xl border text-xs font-medium transition-all ${isLoraConfigActive
                  ? "border-[#7352a8] bg-[#fdfcff] text-[#2b1f40]"
                  : "border-[#e3ebe4] bg-[#fafcfb] text-[#849187]"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Server size={18} className={isLoraConfigActive ? "text-[#7352a8]" : "text-[#849187]"} />
                  <div className="text-left">
                    <p className="font-semibold text-xs">Node Config</p>
                  </div>
                </div>
                {isLoraConfigActive ? <Eye size={16} className="text-[#7352a8]" /> : <EyeOff size={16} />}
              </button>

            </div>
          )}
        </Card>
      </div>
  );
}