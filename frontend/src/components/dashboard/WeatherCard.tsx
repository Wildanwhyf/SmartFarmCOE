import { useEffect, useState, useCallback } from "react";
import { CloudSun, Droplets, Wind, Sun, CloudRain, Cloud } from "lucide-react";
import Card from "../common/Card";

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
}

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read location from env or fallback to Jakarta coordinates
  const lat = import.meta.env.VITE_FARM_LAT || "-7.311146780772645";
  const lon = import.meta.env.VITE_FARM_LON || "112.7289397717429";
  const locationName = import.meta.env.VITE_FARM_LOCATION_NAME || "Ketintang Surabaya, WIB";

  const fetchWeather = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
      );

      if (!res.ok) throw new Error("Failed to load local weather data");

      const data = await res.json();
      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        weatherCode: data.current.weather_code,
      });
      setError(null);
    } catch (err) {
      console.error("Weather fetch error:", err);
      setError("Weather data unavailable");
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    fetchWeather();
    // Refresh weather every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Helper to map WMO weather codes to text and icons
  const getWeatherDetails = (code: number) => {
    if (code === 0) return { label: "Clear Sky", icon: <Sun size={18} className="text-[#d49719]" /> };
    if (code >= 1 && code <= 3) return { label: "Partly Cloudy", icon: <CloudSun size={18} className="text-[#347b49]" /> };
    if (code >= 51 && code <= 67) return { label: "Rainy", icon: <CloudRain size={18} className="text-[#398bc7]" /> };
    return { label: "Cloudy", icon: <Cloud size={18} className="text-[#607266]" /> };
  };

  const weatherDetails = weather ? getWeatherDetails(weather.weatherCode) : null;

  return (
    <Card className="min-h-[230px] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f6eb] text-[#28733d]">
            <CloudSun size={17} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-[#28402d]">
              Outdoor Weather
            </h2>
            <p className="text-[11px] text-[#849187]">
              {locationName}
            </p>
          </div>
        </div>

        {weatherDetails && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#f6f9f5] px-2.5 py-1 text-xs font-semibold text-[#28402d]">
            {weatherDetails.icon}
            <span>{weatherDetails.label}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-10 flex items-center justify-center text-xs text-[#617565]">
          Fetching ambient weather...
        </div>
      ) : error ? (
        <div className="mt-10 text-center text-xs text-[#e02424]">{error}</div>
      ) : (
        weather && (
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-[#fff7df] p-3">
              <p className="text-[11px] font-medium text-[#79652f]">Temp</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[#332d1b]">
                {weather.temperature}
                <span className="ml-0.5 text-xs font-medium text-[#796f50]">°C</span>
              </p>
            </div>

            <div className="rounded-xl bg-[#eaf5ff] p-3">
              <div className="flex items-center justify-center gap-1 text-[#398bc7]">
                <Droplets size={12} />
                <span className="text-[11px] font-medium text-[#496a82]">Humidity</span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[#21394b]">
                {weather.humidity}
                <span className="ml-0.5 text-xs font-medium text-[#637789]">%</span>
              </p>
            </div>

            <div className="rounded-xl bg-[#f0fdf4] p-3">
              <div className="flex items-center justify-center gap-1 text-[#28733d]">
                <Wind size={12} />
                <span className="text-[11px] font-medium text-[#2d5236]">Wind</span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[#17251a]">
                {weather.windSpeed}
                <span className="ml-0.5 text-[10px] font-normal text-[#607266]">km/h</span>
              </p>
            </div>
          </div>
        )
      )}
    </Card>
  );
}