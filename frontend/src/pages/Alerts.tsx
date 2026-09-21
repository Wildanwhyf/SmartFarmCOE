import { useEffect, useState, useCallback } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Check } from "lucide-react";
import Card from "../components/common/Card";
import type { WarningItem, WarningsApiResponse } from "../types/sensor";

const PARAMETER_CONFIG: Record<string, { label: string; sensor: string; unit: string }> = {
  kelembapan_tanah: { label: "Soil Moisture", sensor: "YL68", unit: "%" },
  suhu: { label: "Temperature", sensor: "BME280", unit: "°C" },
  tekanan: { label: "Pressure", sensor: "BME280", unit: "hPa" },
  humidity: { label: "Humidity", sensor: "BME280", unit: "%" },
  nitrogen: { label: "Nitrogen", sensor: "NPK RS485", unit: "mg/kg" },
  phosphorus: { label: "Phosphorus", sensor: "NPK RS485", unit: "mg/kg" },
  potassium: { label: "Potassium", sensor: "NPK RS485", unit: "mg/kg" },
};

export default function Alerts() {
  const [activeWarnings, setActiveWarnings] = useState<WarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null);

  const fetchWarnings = useCallback(async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/sensor/warnings?is_acknowledged=false`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch sensor warnings.");
      }

      const result: WarningsApiResponse = await res.json();
      setActiveWarnings(result.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Unable to load active alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarnings();
    const interval = setInterval(fetchWarnings, 10000);
    return () => clearInterval(interval);
  }, [fetchWarnings]);

  const handleAcknowledge = async (id: number) => {
    setAcknowledgingId(id);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const token = localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/sensor/warnings/${id}/acknowledge`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to acknowledge warning.");
      }

      // Optimistically remove from list
      setActiveWarnings((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to mark warning as handled.");
    } finally {
      setAcknowledgingId(null);
    }
  };

  const unacknowledgedCount = activeWarnings.length;

  return (
    <div className="px-8 py-7">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#152619]">
            Alerts & Warnings
          </h1>
          <p className="mt-1 text-sm text-[#617565]">
            Live sensor threshold violations and unacknowledged alerts
          </p>
        </div>

        {unacknowledgedCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#fde8e8] px-3.5 py-1.5 text-xs font-semibold text-[#e02424]">
            <AlertCircle size={15} />
            <span>{unacknowledgedCount} Unhandled</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-[#fde8e8] p-3 text-xs text-[#e02424]">
          {error}
        </div>
      )}

      {/* Active Warnings Section */}
      <div className="mt-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#28402d]">
          <span className="h-2 w-2 rounded-full bg-[#e02424]" />
          Active Warnings
        </div>

        {loading ? (
          <div className="mt-4 flex h-32 items-center justify-center text-xs text-[#617565]">
            Fetching active warnings...
          </div>
        ) : activeWarnings.length === 0 ? (
          <Card className="mt-4 flex items-center gap-3 p-5 text-[#28733d]">
            <CheckCircle2 size={18} />
            <span className="text-xs font-semibold">
              All sensor parameters operating within normal boundaries. No active warnings.
            </span>
          </Card>
        ) : (
          <div className="mt-4 space-y-3">
            {activeWarnings.map((warning) => {
              const config = PARAMETER_CONFIG[warning.parameter_name] || {
                label: warning.parameter_name,
                sensor: "Sensor Node",
                unit: "",
              };

              const formattedTime = new Date(warning.reading_time || warning.created_at)
                .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

              return (
                <Card
                  key={warning.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-[#fbd5d5] bg-[#fff5f5]"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fde8e8] text-[#e02424]">
                      <AlertTriangle size={18} />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-[#152619]">
                        {config.label} Violation
                      </h3>
                      <p className="mt-1 font-mono text-xs text-[#5f7064]">
                        {warning.message}
                      </p>
                      <p className="mt-2 text-[11px] text-[#849187]">
                        Sensor: <span className="font-medium text-[#28402d]">{config.sensor}</span>
                        <span className="mx-2">•</span>
                        Triggered at {formattedTime}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={acknowledgingId === warning.id}
                    onClick={() => handleAcknowledge(warning.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#347b49] px-3.5 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-[#286139] disabled:opacity-50"
                  >
                    <Check size={15} />
                    {acknowledgingId === warning.id ? "Acknowledging..." : "Acknowledge"}
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}