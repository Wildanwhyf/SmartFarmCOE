const cron = require('node-cron');
const { exec } = require('child_process');
const db = require('../config/db'); 
const sensorService = require('./sensorService');

class InternetMonitorService {
  constructor() {
    cron.schedule('*/30 * * * *', () => {
      this.checkInternetFirst();
    });
    console.log('Internet Monitor Cron Job diinisialisasi (Prioritas Internet, 30 Menit).');
  }

  async checkInternetFirst() {
    console.log('🌐 Mengecek koneksi Internet (Utama)...');

    // 1. Eksekusi Ookla Speedtest sebagai prioritas utama
    exec('speedtest.exe --accept-license --accept-gdpr -f json', async (error, stdout, stderr) => {
      
      // JIKA INTERNET MATI / GAGAL
      if (error) {
        console.error('❌ Tes gagal. Alasan sistem:', error.message); // <-- Tambahkan error.message
        await this.checkLoraFallback();
        return;
      }

      // JIKA INTERNET HIDUP
      try {
        const result = JSON.parse(stdout);
        
        const ping = result.ping.latency; 
        const jitter = result.ping.jitter; 
        const packetLoss = result.packetLoss || 0; 
        const downloadMbps = (result.download.bandwidth / 125000).toFixed(2);

        console.log(`📊 Internet AKTIF: Ping ${ping}ms | Jitter ${jitter}ms | DL ${downloadMbps} Mbps`);

        // 2. Simpan ke Database
        const insertQuery = `
          INSERT INTO internetmonitor 
          (reading_time, status, delay, jitter, packet_loss, throughput, last_activity)
          VALUES (NOW(), ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          'INTERNET_PRIMARY', // Status penanda bahwa internet sedang digunakan
          ping,
          jitter,
          packetLoss,
          parseFloat(downloadMbps),
          'OOKLA_SPEEDTEST'
        ];

        await db.execute(insertQuery, values);
        console.log('✅ Data Internet (Prioritas Utama) berhasil disimpan.');

      } catch (parseError) {
        console.error('❌ Gagal memproses JSON Ookla, mengasumsikan internet bermasalah.');
        await this.checkLoraFallback();
      }
    });
  }

  /**
   * Fungsi untuk mengecek status LoRa hanya saat Internet mati
   */
  async checkLoraFallback() {
    console.log('🔄 Melakukan Fallback: Mengecek status LoRa...');
    
    try {
      const latestData = await sensorService.getLiveReading();
      
      if (latestData && latestData.reading_time) {
        const now = new Date();
        const lastUpdate = new Date(latestData.reading_time);
        
        // Hitung selisih waktu dalam menit
        const diffInMinutes = (now - lastUpdate) / (1000 * 60);

        if (diffInMinutes <= 2) {
          console.log('✅ Fallback Sukses: Internet mati, tetapi LoRa AKTIF dan sedang mengambil alih pengiriman data.');
        } else {
          console.log('⚠️ PERINGATAN KRITIS: Internet MATI dan LoRa juga MATI/Terputus!');
        }
      }
    } catch (err) {
      console.log('⚠️ Gagal membaca status LoRa di database:', err.message);
    }
  }

  async getLiveReading() {
    const query = `
      SELECT * FROM internetmonitor 
      ORDER BY reading_time DESC 
      LIMIT 1
    `;
    const [rows] = await db.execute(query);
    return rows[0] || null;
  }

  // 2. Dapatkan data historis untuk grafik
  async getHistory(pagination = {}, filters = {}) {
    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 100;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const queryParams = [];

    // Filter berdasarkan window (24h, 7d, 30d)
    if (filters.window && filters.window !== 'all') {
      const intervalMap = {
        '24h': 'INTERVAL 24 HOUR',
        '7d': 'INTERVAL 7 DAY',
        '30d': 'INTERVAL 30 DAY'
      };
      const intervalSQL = intervalMap[filters.window];
      if (intervalSQL) {
        whereClause = `WHERE reading_time >= NOW() - ${intervalSQL}`;
      }
    } 
    // Filter berdasarkan Custom Date
    else if (filters.startDate && filters.endDate) {
      whereClause = 'WHERE reading_time BETWEEN ? AND ?';
      queryParams.push(new Date(filters.startDate), new Date(filters.endDate));
    }

    const dataQuery = `SELECT * FROM internetmonitor ${whereClause} ORDER BY reading_time DESC LIMIT ? OFFSET ?`;
    const [rows] = await db.query(dataQuery, [...queryParams, limit, offset]);

    return { data: rows };
  }

  // 3. Dapatkan nilai rata-rata (Averages) untuk tampilan kartu bawah
  async getAveragedReadings(filters = {}) {
    let whereClause = '';
    const queryParams = [];

    if (filters.startDate && filters.endDate) {
      whereClause = 'WHERE reading_time BETWEEN ? AND ?';
      queryParams.push(new Date(filters.startDate), new Date(filters.endDate));
    } else if (filters.window && filters.window !== 'all') {
      const intervalMap = {
        '24h': 'INTERVAL 24 HOUR',
        '7d': 'INTERVAL 7 DAY',
        '30d': 'INTERVAL 30 DAY'
      };
      const intervalSQL = intervalMap[filters.window];
      if (intervalSQL) {
        whereClause = `WHERE reading_time >= NOW() - ${intervalSQL}`;
      }
    }

    const query = `
      SELECT 
        COUNT(id) AS total_readings,
        ROUND(AVG(throughput), 2) AS avg_throughput,
        ROUND(AVG(delay), 0) AS avg_delay,
        ROUND(AVG(packet_loss), 2) AS avg_packet_loss,
        ROUND(AVG(jitter), 2) AS avg_jitter
      FROM internetmonitor
      ${whereClause}
    `;

    const [rows] = await db.query(query, queryParams);
    return { summary: rows[0] };
  }

}

module.exports = new InternetMonitorService();