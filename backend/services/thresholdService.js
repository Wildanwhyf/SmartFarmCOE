const db = require('../config/db');

class ThresholdService {
  /**
   * Fetch all threshold configurations (Admin)
   */
  async getAllThresholds() {
    const query = `
      SELECT t.id, t.parameter_name, t.min_value, t.max_value, t.is_enabled, 
             t.updated_at, u.username AS updated_by_user
      FROM threshold_settings t
      LEFT JOIN users u ON t.updated_by = u.id
      ORDER BY t.id ASC
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  /**
   * Update min/max bounds or enabled state for a specific parameter (Admin)
   */
  async updateThreshold(parameterName, { min_value, max_value, is_enabled }, adminUserId) {
    // 1. Check if parameter exists
    const [existing] = await db.execute(
      'SELECT id FROM threshold_settings WHERE parameter_name = ?',
      [parameterName]
    );

    if (existing.length === 0) {
      throw { statusCode: 404, message: `Threshold parameter '${parameterName}' not found` };
    }

    // 2. Build dynamic update values
    const minVal = min_value !== undefined && min_value !== null ? parseFloat(min_value) : null;
    const maxVal = max_value !== undefined && max_value !== null ? parseFloat(max_value) : null;
    const enabled = is_enabled !== undefined ? (is_enabled ? 1 : 0) : 1;

    const updateQuery = `
      UPDATE threshold_settings
      SET min_value = ?, max_value = ?, is_enabled = ?, updated_by = ?
      WHERE parameter_name = ?
    `;

    await db.execute(updateQuery, [minVal, maxVal, enabled, adminUserId, parameterName]);

    // 3. Return updated threshold record
    const [updated] = await db.execute(
      `SELECT t.id, t.parameter_name, t.min_value, t.max_value, t.is_enabled, t.updated_at, u.username as updated_by
       FROM threshold_settings t
       LEFT JOIN users u ON t.updated_by = u.id
       WHERE t.parameter_name = ?`,
      [parameterName]
    );

    return updated[0];
  }
}

module.exports = new ThresholdService();