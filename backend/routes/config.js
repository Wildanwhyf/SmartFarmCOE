const express = require('express');
const router = express.Router();
const db = require('../config/db'); 
const configService = require('../services/configService');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Error handling helper
const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// GET /api/config/guest-cards (Public - Guest, Farmer, Admin)
// Frontend uses this on load to know which cards to render
router.get('/guest-cards', asyncHandler(async (req, res) => {
  const visibility = await configService.getGuestCardVisibility();
  
  res.status(200).json({
    message: 'Guest card visibility settings retrieved successfully',
    data: visibility
  });
}));

// PUT /api/config/guest-cards (Admin Only)
// Frontend Admin dashboard uses this to toggle cards on/off globally
router.put('/guest-cards', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const visibility = req.body; 
  
  const updatedVisibility = await configService.updateGuestCardVisibility(visibility);
  
  res.status(200).json({
    message: 'Guest card visibility updated globally',
    data: updatedVisibility
  });
}));

// GET /api/config/hardware-mode (Public - Frontend & Hardware fetches this)
router.get('/hardware-mode', asyncHandler(async (req, res) => {
  const [rows] = await db.execute("SELECT setting_value FROM system_settings WHERE setting_key = 'hardware_mode'");
  const mode = rows.length > 0 ? JSON.parse(rows[0].setting_value) : "AUTO";
  res.json({ mode });
}));

// PUT /api/config/hardware-mode (Admin Only)
router.put('/hardware-mode', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { mode } = req.body; // "AUTO", "LORA", or "INTERNET"
  await db.execute(
    "UPDATE system_settings SET setting_value = ? WHERE setting_key = 'hardware_mode'",
    [JSON.stringify(mode)]
  );
  res.json({ message: `Hardware mode set to ${mode}` });
}));

module.exports = router;