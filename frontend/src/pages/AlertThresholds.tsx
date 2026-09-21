import { useEffect, useState, useCallback } from "react";
import { Sliders, Save, CheckCircle2 } from "lucide-react";
import Card from "../components/common/Card";
import type { ThresholdItem, ThresholdsApiResponse } from "../types/sensor";

const PARAMETER_LABELS: Record<string, { label: string; unit: string }> = {
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
  const [loading, setLoading] = useState(true);
  const [savingParam, setSavingParam] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchThresholds = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/thresholds`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load thresholds data.");
      }

      const result: ThresholdsApiResponse = await res.json();
      setThresholds(result.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load threshold settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThresholds();
  }, [fetchThresholds]);

  const handleInputChange = (
    index: number,
    field: "min_value" | "max_value",
    val: string
  ) => {
    const updated = [...thresholds];
    updated[index][field] = val;
    setThresholds(updated);
  };

  const handleToggleEnable = (index: number) => {
    const updated = [...thresholds];
    updated[index].is_enabled = updated[index].is_enabled === 1 ? 0 : 1;
    setThresholds(updated);
  };

  const handleSave = async (item: ThresholdItem) => {
    setSavingParam(item.parameter_name);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem("token");
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/thresholds/${item.parameter_name}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          min_value: item.min_value,
          max_value: item.max_value,
          is_enabled: item.is_enabled,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to update threshold.");
      }

      setSuccessMsg(`Threshold for '${PARAMETER_LABELS[item.parameter_name]?.label || item.parameter_name}' updated!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setSavingParam(null);
    }
  };

  return (
      <div className="px-8 py-7">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#152619]">
              Alert Thresholds
            </h1>
            <p className="mt-1 text-sm text-[#617565]">
              Configure trigger boundaries for sensor warnings and critical alerts
            </p>
          </div>

          {successMsg && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#eef7e8] px-3.5 py-1.5 text-xs font-medium text-[#28733d]">
              <CheckCircle2 size={15} />
              {successMsg}
            </div>
          )}

          {error && (
            <div className="rounded-full bg-[#fde8e8] px-3.5 py-1.5 text-xs font-semibold text-[#e02424]">
              {error}
            </div>
          )}
        </div>

        {/* Content Card */}
        <Card className="mt-6 p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f6eb] text-[#28733d]">
              <Sliders size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#28402d]">
                Sensor Boundaries
              </h2>
              <p className="text-[11px] text-[#849187]">
                Sensors triggering outside these min/max ranges will generate live warnings
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center text-xs text-[#617565]">
              Loading threshold configurations...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#edf1ed] text-[11px] font-semibold uppercase tracking-wider text-[#849187]">
                  <tr>
                    <th className="py-3 px-3">Parameter</th>
                    <th className="py-3 px-3">Min Value</th>
                    <th className="py-3 px-3">Max Value</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Last Updated By</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f6f3]">
                  {thresholds.map((item, idx) => {
                    const info = PARAMETER_LABELS[item.parameter_name] || {
                      label: item.parameter_name,
                      unit: "",
                    };

                    return (
                      <tr key={item.id} className="hover:bg-[#f7faf7]">
                        <td className="py-3.5 px-3 font-semibold text-[#25352a]">
                          <div>
                            {info.label}
                            <span className="ml-1 text-[11px] font-normal text-[#849187]">
                              ({info.unit})
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={item.min_value}
                              onChange={(e) =>
                                handleInputChange(idx, "min_value", e.target.value)
                              }
                              className="w-24 rounded-lg border border-[#e3ebe4] bg-[#fafcfb] px-2.5 py-1.5 text-xs text-[#1f3022] outline-none transition focus:border-[#347b49] focus:bg-white"
                            />
                            <span className="text-[#849187]">{info.unit}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={item.max_value}
                              onChange={(e) =>
                                handleInputChange(idx, "max_value", e.target.value)
                              }
                              className="w-24 rounded-lg border border-[#e3ebe4] bg-[#fafcfb] px-2.5 py-1.5 text-xs text-[#1f3022] outline-none transition focus:border-[#347b49] focus:bg-white"
                            />
                            <span className="text-[#849187]">{info.unit}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleEnable(idx)}
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                              item.is_enabled === 1
                                ? "bg-[#e8f6eb] text-[#28733d]"
                                : "bg-[#f3f4f6] text-[#6b7280]"
                            }`}
                          >
                            {item.is_enabled === 1 ? "Active" : "Disabled"}
                          </button>
                        </td>

                        <td className="py-3.5 px-3 text-[#5f7064]">
                          {item.updated_by_user ? (
                            <span className="font-medium text-[#28402d]">
                              {item.updated_by_user}
                            </span>
                          ) : (
                            <span className="text-[#849187] italic">System Default</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            disabled={savingParam === item.parameter_name}
                            onClick={() => handleSave(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#347b49] px-3 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-[#286139] disabled:opacity-50"
                          >
                            <Save size={14} />
                            {savingParam === item.parameter_name ? "Saving..." : "Save"}
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
      </div>
  );
}