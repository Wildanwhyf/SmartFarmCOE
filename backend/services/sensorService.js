const db = require('../config/db'); // expects a mysql2/promise pool

class SensorService {
  /**
   * Process and store incoming sensor reading, then auto-generate warning alerts.
   */
  async saveReading(payload) {
    const {
      time,
      suhu,
      tekanan,
      humidity,
      kelembapan_tanah = null,
      nitrogen = null,
      phosphorus = null,
      potassium = null,
      rssi = null,
      snr = null,
      status = null,
      frequency = null,
      spreading_factor = null,
      bandwidth = null,
      last_activity = null,
      throughput = null,
      packet_loss = null,
      jitter = null
    } = payload;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Calculate Delay (Difference between Server Time and Sensor Payload Time)
      const serverTime = new Date();
      const sensorTime = time ? new Date(time) : serverTime;

      let delayMs = null;
      if (time) {
        delayMs = serverTime.getTime() - sensorTime.getTime();
        // Prevent negative delay if sensor clock is slightly ahead of server clock
        if (delayMs < 0) delayMs = 0;
      }

      // Updated INSERT query including new QoS parameters
      const insertQuery = `
        INSERT INTO sensor_readings 
        (reading_time, kelembapan_tanah, suhu, tekanan, humidity, nitrogen, phosphorus, potassium, rssi, snr, status, frequency, spreading_factor, bandwidth, last_activity, throughput, delay, packet_loss, jitter)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const parseNum = (val) => (val !== null && val !== undefined && val !== '' ? parseFloat(val) : null);
      const parseIntNum = (val) => (val !== null && val !== undefined && val !== '' ? parseInt(val, 10) : null);

      const values = [
        sensorTime,
        parseNum(kelembapan_tanah),
        parseNum(suhu),
        parseNum(tekanan),
        parseNum(humidity),
        parseNum(nitrogen),
        parseNum(phosphorus),
        parseNum(potassium),
        parseIntNum(rssi),
        parseNum(snr),
        status,
        frequency,
        spreading_factor,
        bandwidth,
        last_activity,
        parseNum(throughput),
        delayMs,              // Automatically calculated delay in MS
        parseNum(packet_loss),
        parseNum(jitter)
      ];

      const [result] = await connection.execute(insertQuery, values);
      const readingId = result.insertId;

      const [thresholds] = await connection.execute(
        'SELECT parameter_name, min_value, max_value FROM threshold_settings WHERE is_enabled = 1'
      );

      const parsedData = {
        kelembapan_tanah: parseNum(kelembapan_tanah),
        suhu: parseNum(suhu),
        tekanan: parseNum(tekanan),
        humidity: parseNum(humidity),
        nitrogen: parseNum(nitrogen),
        phosphorus: parseNum(phosphorus),
        potassium: parseNum(potassium)
      };

      const warningsToInsert = [];

      for (const t of thresholds) {
        const val = parsedData[t.parameter_name];

        if (val === null || val === undefined || isNaN(val)) continue;

        const min = t.min_value !== null ? parseFloat(t.min_value) : null;
        const max = t.max_value !== null ? parseFloat(t.max_value) : null;

        let message = null;
        if (min !== null && val < min) {
          message = `${t.parameter_name} is too low: ${val} (min threshold: ${min})`;
        } else if (max !== null && val > max) {
          message = `${t.parameter_name} is too high: ${val} (max threshold: ${max})`;
        }

        if (message) {
          warningsToInsert.push([readingId, t.parameter_name, val, min, max, message]);
        }
      }

      if (warningsToInsert.length > 0) {
        const warningQuery = `
          INSERT INTO warnings 
          (sensor_reading_id, parameter_name, triggered_value, threshold_min, threshold_max, message)
          VALUES ?
        `;
        await connection.query(warningQuery, [warningsToInsert]);
      }

      await connection.commit();

      return {
        readingId,
        warningsTriggered: warningsToInsert.length
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Fetch the latest sensor reading (Guest, Farmer, Admin).
   */
  async getLiveReading() {
    const query = `
      SELECT * FROM sensor_readings 
      ORDER BY reading_time DESC 
      LIMIT 1
    `;
    const [rows] = await db.execute(query);
    return rows[0] || null;
  }

  /**
     * Fetch paginated sensor history with dynamic time filtering (Farmer, Admin).
     */
  async getHistory(pagination = {}, filters = {}) {
    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 10;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const queryParams = [];

    // Handle predefined time windows (24h, 7d, 30d)
    if (filters.window) {
      const intervalMap = {
        '1h': 'INTERVAL 1 HOUR',
        '6h': 'INTERVAL 6 HOUR',
        '24h': 'INTERVAL 24 HOUR',
        '7d': 'INTERVAL 7 DAY',
        '30d': 'INTERVAL 30 DAY'
      };
      const intervalSQL = intervalMap[filters.window];
      if (intervalSQL) {
        whereClause = `WHERE reading_time >= NOW() - ${intervalSQL}`;
      }
    }
    // Handle custom date ranges (choose a date)
    else if (filters.startDate && filters.endDate) {
      whereClause = 'WHERE reading_time BETWEEN ? AND ?';
      queryParams.push(new Date(filters.startDate), new Date(filters.endDate));
    }

    // Build the final queries
    const dataQuery = `SELECT * FROM sensor_readings ${whereClause} ORDER BY reading_time DESC LIMIT ? OFFSET ?`;
    const countQuery = `SELECT COUNT(*) as total FROM sensor_readings ${whereClause}`;

    // Execute queries
    const [rows] = await db.query(dataQuery, [...queryParams, limit, offset]);
    const [[{ total }]] = await db.query(countQuery, queryParams);

    return {
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Fetch paginated warning notifications with optional status filter (Farmer, Admin).
   */
  async getWarnings(pagination = {}, isAcknowledged = null) {
    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 10;
    const offset = (page - 1) * limit;

    let query = `
      SELECT w.*, 
             sr.reading_time, 
             u.username AS acknowledged_by_username
      FROM warnings w
      JOIN sensor_readings sr ON w.sensor_reading_id = sr.id
      LEFT JOIN users u ON w.acknowledged_by = u.id
    `;

    const params = [];
    if (isAcknowledged !== null) {
      query += ` WHERE w.is_acknowledged = ?`;
      params.push(isAcknowledged ? 1 : 0);
    }

    query += ` ORDER BY w.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await db.query(query, params);

    // Count Total
    let countQuery = 'SELECT COUNT(*) as total FROM warnings';
    const countParams = [];
    if (isAcknowledged !== null) {
      countQuery += ' WHERE is_acknowledged = ?';
      countParams.push(isAcknowledged ? 1 : 0);
    }

    const [[{ total }]] = await db.query(countQuery, countParams);

    // Count Unacknowledged Badge
    const [[{ unacknowledgedCount }]] = await db.query(
      'SELECT COUNT(*) as unacknowledgedCount FROM warnings WHERE is_acknowledged = 0'
    );

    return {
      data: rows,
      meta: {
        unacknowledgedCount,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  }

  /**
   * Acknowledge/Resolve a warning alert
   */
  async acknowledgeWarning(warningId, userId) {
    const [result] = await db.execute(
      `UPDATE warnings 
       SET is_acknowledged = 1, acknowledged_by = ? 
       WHERE id = ?`,
      [userId, warningId]
    );

    if (result.affectedRows === 0) {
      throw { statusCode: 404, message: 'Warning alert not found' };
    }

    return { message: 'Warning acknowledged successfully' };
  }

  /**
   * Fetch averaged sensor readings over a specific time window (e.g., '1h', '24h', '7d', '30d')
   */
  async getAveragedReadings(timeWindow = '24h') {
    const intervalMap = {
      '1h': 'INTERVAL 1 HOUR',
      '6h': 'INTERVAL 6 HOUR',
      '24h': 'INTERVAL 24 HOUR',
      '7d': 'INTERVAL 7 DAY',
      '30d': 'INTERVAL 30 DAY'
    };

    const intervalSQL = intervalMap[timeWindow] || intervalMap['24h'];

    const query = `
      SELECT 
        COUNT(id) AS total_readings,
        ROUND(AVG(suhu), 2) AS avg_suhu,
        ROUND(AVG(tekanan), 2) AS avg_tekanan,
        ROUND(AVG(humidity), 2) AS avg_humidity,
        ROUND(AVG(kelembapan_tanah), 2) AS avg_kelembapan_tanah,
        MIN(reading_time) AS window_start,
        MAX(reading_time) AS window_end
      FROM sensor_readings
      WHERE reading_time >= NOW() - ${intervalSQL}
    `;

    const [rows] = await db.execute(query);
    return {
      window: timeWindow,
      summary: rows[0]
    };
  }
}

module.exports = new SensorService();