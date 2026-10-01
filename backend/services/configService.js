const db = require('../config/db');

class ConfigService {
  async getGuestCardVisibility() {
    const [rows] = await db.execute(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'guest_card_visibility'"
    );
    
    if (rows.length === 0) {
      return {};
    }
    
    // MySQL JSON columns are automatically parsed by mysql2, but we ensure it's returned safely
    return typeof rows[0].setting_value === 'string' 
      ? JSON.parse(rows[0].setting_value) 
      : rows[0].setting_value;
  }

  async updateGuestCardVisibility(visibilityData) {
    await db.execute(
      "UPDATE system_settings SET setting_value = ? WHERE setting_key = 'guest_card_visibility'",
      [JSON.stringify(visibilityData)]
    );
    
    return visibilityData;
  }
}

module.exports = new ConfigService();