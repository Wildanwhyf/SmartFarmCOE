export interface LiveSensorApiResponse {
  message: string;
  data: {
    id: number;
    reading_time: string;
    kelembapan_tanah: string;
    suhu: string;
    tekanan: string;
    humidity: string;
    nitrogen: string;
    phosphorus: string;
    potassium: string;
    rssi: number;
    snr: string;
    created_at: string;
  };
}

export interface ThresholdItem {
  id: number;
  parameter_name: string;
  min_value: string;
  max_value: string;
  is_enabled: number;
  updated_at: string;
  updated_by_user: string | null;
}

export interface ThresholdsApiResponse {
  message: string;
  data: ThresholdItem[];
}

export interface WarningItem {
  id: number;
  sensor_reading_id: number;
  parameter_name: string;
  triggered_value: string;
  threshold_min: string;
  threshold_max: string;
  message: string;
  is_resolved: number;
  created_at: string;
  is_acknowledged: number;
  acknowledged_by: number | null;
  reading_time: string;
  acknowledged_by_username: string | null;
}

export interface WarningsApiResponse {
  data: WarningItem[];
  meta: {
    unacknowledgedCount: number;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}