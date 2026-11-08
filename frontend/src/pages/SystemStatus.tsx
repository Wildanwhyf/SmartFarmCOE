import { useEffect, useState, useCallback, useMemo } from "react";
import { ArrowDownUp, WifiOff, Zap, Timer, Globe, Radio } from "lucide-react";
import Card from "../components/common/Card";
import SensorHistoryChart from "../components/dashboard/SensorHistoryChart";

interface SystemStatusData {
    throughput?: number;
    packet_loss?: number;
    jitter?: number;
    delay?: number;
    status?: string;
    last_activity?: string;
    transmission_method?: string;
}

interface FormattedHistory {
    time: string;
    throughput: number;
    packet_loss: number;
    jitter: number;
    delay: number;
}

interface SystemWindowSummary {
    total_readings: number;
    avg_throughput?: string;
    avg_packet_loss?: string;
    avg_delay?: string;
    avg_jitter?: string;
}

export interface SystemOption {
    label: string;
    value: string;
    unit: string;
}

const systemOptions: SystemOption[] = [
    { label: "Throughput", value: "throughput", unit: "kbps/Mbps" },
    { label: "Packet Loss", value: "packet_loss", unit: "%" },
    { label: "Delay", value: "delay", unit: "ms" },
    { label: "Jitter", value: "jitter", unit: "ms" },
];

export default function SystemStatus() {
    const [dataSource, setDataSource] = useState<"LORA" | "INTERNET">("LORA");
    const [liveData, setLiveData] = useState<SystemStatusData | null>(null);
    const [historyData, setHistoryData] = useState<FormattedHistory[]>([]);
    const [selectedMetric, setSelectedMetric] = useState<SystemOption>(systemOptions[0]);

    // Time Window State
    const [selectedWindow, setSelectedWindow] = useState<"all" | "24h" | "7d" | "30d" | "custom">("all");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    const [windowSummary, setWindowSummary] = useState<SystemWindowSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string>("--.--.--");

    const fetchSystemData = useCallback(async () => {
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
            const token = localStorage.getItem("token");
            const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

            // Buat endpoint history & averages dengan menyertakan parameter method (LORA / INTERNET)
            let historyUrl = `${baseUrl}/sensor/history/?page=1&limit=100&method=${dataSource}`;
            let avgUrl = `${baseUrl}/sensor/averages?method=${dataSource}`;

            if (selectedWindow === "custom" && startDate && endDate) {
                historyUrl += `&startDate=${startDate}&endDate=${endDate}`;
                avgUrl += `&startDate=${startDate}&endDate=${endDate}`;
            } else if (selectedWindow !== "all" && selectedWindow !== "custom") {
                historyUrl += `&window=${selectedWindow}`;
                avgUrl += `&window=${selectedWindow}`;
            }

            const [historyRes, avgRes] = await Promise.all([
                fetch(historyUrl, { headers }),
                fetch(avgUrl, { headers })
            ]);

            if (!historyRes.ok) {
                throw new Error("Failed to fetch system data");
            }

            const historyResult = await historyRes.json();
            const rawHistory = historyResult.data || [];

            // Ambil data paling atas (data live terbaru untuk sumber yang dipilih)
            if (rawHistory.length > 0) {
                setLiveData(rawHistory[0]);
                const dateObj = new Date(rawHistory[0].reading_time || rawHistory[0].created_at || new Date());
                setLastUpdated(dateObj.toTimeString().split(" ")[0].replace(/:/g, "."));
            } else {
                setLiveData(null);
            }

            const formattedHistory: FormattedHistory[] = rawHistory.map((item: any) => {
                const dateObj = new Date(item.reading_time || item.created_at);
                return {
                    time: dateObj.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        timeZone: "Asia/Jakarta",
                    }),
                    throughput: parseFloat(item.throughput || "0"),
                    packet_loss: parseFloat(item.packet_loss || "0"),
                    delay: parseFloat(item.delay || "0"),
                    jitter: parseFloat(item.jitter || "0"),
                };
            });

            setHistoryData(formattedHistory);

            if (avgRes.ok) {
                const avgResult = await avgRes.json();
                setWindowSummary(avgResult.data?.summary || null);
            }

            setError(null);
        } catch (err) {
            console.error(err);
            setError("Unable to connect to gateway stream.");
        } finally {
            setLoading(false);
        }
    }, [selectedWindow, startDate, endDate, dataSource]);

    useEffect(() => {
        fetchSystemData();
        const interval = setInterval(fetchSystemData, 10000); 
        return () => clearInterval(interval);
    }, [fetchSystemData]);

    const throughput = liveData?.throughput ?? 0;
    const packetLoss = liveData?.packet_loss ?? 0;
    const jitter = liveData?.jitter ?? 0;
    const delay = liveData?.delay ?? 0;
    const isOnline = liveData !== null; // Jika ada data masuk dari channel ini

    const latestGraphValue = useMemo(() => {
        if (historyData.length === 0) return "--";
        return historyData[0][selectedMetric.value as keyof FormattedHistory];
    }, [historyData, selectedMetric]);

    const getSelectedAverage = () => {
        if (!windowSummary) return "--";
        switch (selectedMetric.value) {
            case "throughput": return parseFloat(windowSummary.avg_throughput || "0").toFixed(2);
            case "packet_loss": return parseFloat(windowSummary.avg_packet_loss || "0").toFixed(2);
            case "delay": return parseFloat(windowSummary.avg_delay || "0").toFixed(2);
            case "jitter": return parseFloat(windowSummary.avg_jitter || "0").toFixed(2);
            default: return "--";
        }
    };

    return (
        <div className="px-4 py-5 lg:px-8 lg:py-7">

            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-[#152619]">
                        System Status ({dataSource === "LORA" ? "LoRa Network Only" : "Internet Monitor Only"})
                    </h1>
                    <p className="mt-1 text-sm text-[#617565]">
                        Dedicated QoS telemetry, latency, and transmission diagnostics
                    </p>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-3">
                    {/* Toggle Selector: LORA Only vs INTERNET Only */}
                    <div className="flex items-center rounded-lg bg-[#e3ebe4] p-1 w-fit">
                        <button
                            type="button"
                            onClick={() => setDataSource("LORA")}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                dataSource === "LORA" ? "bg-[#347b49] text-white shadow-sm" : "text-[#5f7064]"
                            }`}
                        >
                            <Radio size={14} /> LoRa Only
                        </button>
                        <button
                            type="button"
                            onClick={() => setDataSource("INTERNET")}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                dataSource === "INTERNET" ? "bg-[#398bc7] text-white shadow-sm" : "text-[#5f7064]"
                            }`}
                        >
                            <Globe size={14} /> Internet Only
                        </button>
                    </div>

                    <div className="sm:text-right">
                        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide ${isOnline ? "bg-[#e8f6eb] text-[#28733d]" : "bg-[#fde8e8] text-[#e02424]"}`}>
                            <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-[#43c878] animate-pulse" : "bg-[#e02424]"}`} />
                            {isOnline ? `${dataSource} CHANNEL ACTIVE` : `NO ${dataSource} SIGNAL`}
                        </div>
                        <p className="mt-1.5 text-[11px] font-mono text-[#849187]">
                            Updated: {lastUpdated}
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-xl bg-[#fde8e8] p-3 text-xs text-[#e02424]">
                    {error}
                </div>
            )}

            {/* Live Diagnostic Cards */}
            {loading && !liveData ? (
                <div className="flex h-32 items-center justify-center rounded-2xl border border-[#e3ebe4] bg-white">
                    <p className="text-sm font-medium text-[#617565]">Analyzing {dataSource} health...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-2">
                    {/* Throughput Card */}
                    <Card className="p-5 flex flex-col justify-between min-h-[130px]">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f4ff] text-[#4b7deb]">
                                <ArrowDownUp size={18} />
                            </div>
                            <h2 className="text-sm font-semibold text-[#28402d]">Throughput</h2>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-bold tracking-tight text-[#1f3022]">{throughput}</span>
                            <span className="ml-1 text-sm font-medium text-[#849187]">{dataSource === "INTERNET" ? "Mbps" : "kbps"}</span>
                        </div>
                    </Card>

                    {/* Packet Loss Card */}
                    <Card className="p-5 flex flex-col justify-between min-h-[130px]">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff0f0] text-[#e02424]">
                                <WifiOff size={18} />
                            </div>
                            <h2 className="text-sm font-semibold text-[#28402d]">Packet Loss</h2>
                        </div>
                        <div className="mt-4">
                            <span className={`text-3xl font-bold tracking-tight ${packetLoss > 5 ? 'text-[#e02424]' : 'text-[#1f3022]'}`}>
                                {packetLoss}
                            </span>
                            <span className="ml-1 text-sm font-medium text-[#849187]">%</span>
                        </div>
                    </Card>

                    {/* Delay Card */}
                    <Card className="p-5 flex flex-col justify-between min-h-[130px]">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fdf8e8] text-[#d99f24]">
                                <Timer size={18} />
                            </div>
                            <h2 className="text-sm font-semibold text-[#28402d]">Delay</h2>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-bold tracking-tight text-[#1f3022]">{delay}</span>
                            <span className="ml-1 text-sm font-medium text-[#849187]">ms</span>
                        </div>
                    </Card>

                    {/* Jitter Card */}
                    <Card className="p-5 flex flex-col justify-between min-h-[130px]">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0ebfa] text-[#7352a8]">
                                <Zap size={18} />
                            </div>
                            <h2 className="text-sm font-semibold text-[#28402d]">Jitter</h2>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-bold tracking-tight text-[#1f3022]">{jitter}</span>
                            <span className="ml-1 text-sm font-medium text-[#849187]">ms</span>
                        </div>
                    </Card>
                </div>
            )}

            {/* Interactive Historical Trend Graph */}
            <Card className="mt-6 p-4 sm:p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between border-b border-[#edf1ed] pb-5">
                    <div>
                        <h2 className="text-sm font-semibold text-[#28402d]">
                            {selectedMetric.label} Trend ({dataSource})
                        </h2>
                        <p className="mt-1 text-xs text-[#849187]">
                            Historical performance for isolated stream
                        </p>
                    </div>

                    <div className="flex flex-col items-start lg:items-end gap-3 w-full lg:w-auto">
                        <div className="flex flex-wrap gap-2">
                            {systemOptions.map((opt) => {
                                const isSelected = selectedMetric.value === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setSelectedMetric(opt)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                            isSelected ? "bg-[#347b49] text-white shadow-sm" : "bg-[#f2f6f3] text-[#5f7064] hover:bg-[#e7eee9]"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-1 rounded-lg bg-[#f2f6f3] p-1 text-[11px]">
                                {(["all", "24h", "7d", "30d", "custom"] as const).map((win) => {
                                    const labels: Record<string, string> = {
                                        all: "Show All",
                                        "24h": "24H",
                                        "7d": "7D",
                                        "30d": "30D",
                                        custom: "Custom Date",
                                    };
                                    return (
                                        <button
                                            key={win}
                                            type="button"
                                            onClick={() => setSelectedWindow(win)}
                                            className={`rounded-md px-2.5 py-1 font-semibold transition ${
                                                selectedWindow === win ? "bg-[#347b49] text-white shadow-sm" : "text-[#5f7064] hover:text-[#152619]"
                                            }`}
                                        >
                                            {labels[win]}
                                        </button>
                                    );
                                })}
                            </div>

                            {selectedWindow === "custom" && (
                                <div className="flex items-center gap-2 bg-[#fdfcfb] border border-[#e3ebe4] p-1.5 rounded-lg shadow-xs">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="text-xs bg-transparent rounded px-1.5 py-0.5 outline-none text-[#28402d]"
                                    />
                                    <span className="text-[#849187] text-[10px] font-bold uppercase">to</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="text-xs bg-transparent rounded px-1.5 py-0.5 outline-none text-[#28402d]"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-5 flex items-end gap-2">
                    <span className="text-3xl font-semibold tracking-tight text-[#25352a]">
                        {latestGraphValue}
                    </span>
                    <span className="mb-1 text-sm font-medium text-[#78867c]">
                        {selectedMetric.unit}
                    </span>
                </div>

                <div className="mt-4 overflow-hidden">
                    {loading && historyData.length === 0 ? (
                        <div className="flex h-64 items-center justify-center text-xs text-[#617565]">
                            Loading network graph...
                        </div>
                    ) : (
                        <SensorHistoryChart
                            data={[...historyData].reverse() as any[]}
                            dataKey={selectedMetric.value as any}
                            unit={selectedMetric.unit}
                            yAxisLabel={selectedMetric.label}
                        />
                    )}
                </div>

                {/* Averages Section */}
                <div className="mt-6 border-t border-[#edf1ed] pt-5">
                    <h3 className="text-xs font-semibold text-[#28402d] mb-4">
                        Statistical Aggregates ({dataSource})
                    </h3>

                    <div className="grid grid-cols-2 gap-4 sm:gap-3 sm:grid-cols-4">
                        <div>
                            <p className="text-[11px] text-[#849187] uppercase">
                                {selectedWindow === "all" ? "All-Time" : selectedWindow} {selectedMetric.label} Avg
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#347b49]">
                                {getSelectedAverage()} {selectedMetric.unit}
                            </p>
                        </div>

                        <div>
                            <p className="text-[11px] text-[#849187]">Total Samples</p>
                            <p className="mt-1 text-sm font-semibold text-[#3b5141]">
                                {windowSummary?.total_readings ?? "--"} readings
                            </p>
                        </div>

                        <div>
                            <p className="text-[11px] text-[#849187]">Avg Packet Loss</p>
                            <p className="mt-1 text-sm font-semibold text-[#e02424]">
                                {windowSummary?.avg_packet_loss ? parseFloat(windowSummary.avg_packet_loss).toFixed(2) : "--"} %
                            </p>
                        </div>

                        <div>
                            <p className="text-[11px] text-[#849187]">Avg Delay</p>
                            <p className="mt-1 text-sm font-semibold text-[#d99f24]">
                                {windowSummary?.avg_delay ? parseFloat(windowSummary.avg_delay).toFixed(2) : "--"} ms
                            </p>
                        </div>
                    </div>
                </div>

            </Card>
        </div>
    );
}