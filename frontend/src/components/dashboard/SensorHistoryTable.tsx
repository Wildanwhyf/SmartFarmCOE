import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FormattedReading } from "../../pages/SensorHistory";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SensorHistoryTableProps {
  data: FormattedReading[];
  pagination: PaginationMeta;
  page: number;
  onPageChange: (newPage: number) => void;
  loading: boolean;
}

export default function SensorHistoryTable({
  data,
  pagination,
  page,
  onPageChange,
  loading,
}: SensorHistoryTableProps) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#edf1ed] text-[11px] font-semibold uppercase tracking-wider text-[#849187]">
            <tr>
              <th className="py-3 px-3">Reading Time (WIB)</th>
              <th className="py-3 px-3">Soil Moisture</th>
              <th className="py-3 px-3 font-medium">Temp</th>
              <th className="py-3 px-3">Humidity</th>
              <th className="py-3 px-3">Pressure</th>
              <th className="py-3 px-3">NPK (N / P / K)</th>
              <th className="py-3 px-3">LoRa (RSSI / SNR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f6f3]">
            {loading && data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#849187]">
                  Loading sensor readings...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#849187]">
                  No historical telemetry records available.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-[#f7faf7]">
                  <td className="py-3.5 px-3 font-mono text-[#25352a]">
                    <p className="font-semibold">{item.time}</p>
                    <p className="text-[10px] text-[#849187]">{item.date}</p>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-[#17251a]">
                    {item.kelembapan_tanah}%
                  </td>
                  <td className="py-3.5 px-3 text-[#332d1b]">
                    {item.suhu}°C
                  </td>
                  <td className="py-3.5 px-3 text-[#21394b]">
                    {item.humidity}%
                  </td>
                  <td className="py-3.5 px-3 text-[#5f7064]">
                    {item.tekanan} hPa
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[#25352a]">
                    {item.nitrogen} / {item.phosphorus} / {item.potassium}
                    <span className="ml-1 text-[10px] text-[#849187]">mg/kg</span>
                  </td>
                  <td className="py-3.5 px-3 text-[#7352a8] font-mono">
                    {item.rssi} dBm / {item.snr} dB
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Controls */}
      <div className="mt-4 flex items-center justify-between border-t border-[#edf1ed] pt-4 text-xs">
        <span className="text-[#617565]">
          Showing page <span className="font-semibold text-[#152619]">{pagination.page}</span> of{" "}
          <span className="font-semibold text-[#152619]">{pagination.totalPages}</span>
        </span>

        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            className="flex items-center gap-1 rounded-lg border border-[#e3ebe4] bg-[#fafcfb] px-3 py-1.5 text-xs text-[#28402d] transition hover:bg-white disabled:opacity-40"
          >
            <ChevronLeft size={15} />
            Previous
          </button>

          <button
            disabled={page >= pagination.totalPages}
            onClick={() => onPageChange(page + 1)}
            className="flex items-center gap-1 rounded-lg border border-[#e3ebe4] bg-[#fafcfb] px-3 py-1.5 text-xs text-[#28402d] transition hover:bg-white disabled:opacity-40"
          >
            Next
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}