const express = require('express');
const router = express.Router();
const db = require('../config/db');
const sensorService = require('../services/sensorService');
const { authenticate, requireFarmerOrAdmin } = require('../middleware/auth');
// const { authenticate, requireAdmin } = require('../middleware/auth');

// Error handling helper
const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    console.error('Error:', error);

    // Handle specific error codes
    if (error.statusCode === 409) {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

// POST /api/sensor/data - Post new sensor data from hardware
router.post('/data/', asyncHandler(async (req, res) => {
  const result = await sensorService.saveReading(req.body);

  res.status(201).json({
    message: 'Sensor data recorded successfully',
    data: result
  });
}));

// GET /api/sensor/live - View live (latest) sensor reading
router.get('/live/', asyncHandler(async (req, res) => {
  const liveData = await sensorService.getLiveReading();

  res.status(200).json({
    message: 'Live sensor data retrieved successfully',
    data: liveData
  });
}));

// GET /api/sensor/history - View paginated sensor history
router.get('/history/', authenticate, requireFarmerOrAdmin, asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const historyData = await sensorService.getHistory({ page, limit });

  res.status(200).json(historyData);
}));

// GET /api/sensor/warnings (Farmer & Admin - View all/filtered warnings)
router.get('/warnings/', authenticate, requireFarmerOrAdmin, asyncHandler(async (req, res) => {
  const { page, limit, is_acknowledged } = req.query;

  // Convert optional filter parameter ('true'/'false' to boolean)
  let acknowledgedFilter = null;
  if (is_acknowledged === 'true') acknowledgedFilter = true;
  if (is_acknowledged === 'false') acknowledgedFilter = false;

  const warningData = await sensorService.getWarnings({ page, limit }, acknowledgedFilter);

  res.status(200).json(warningData);
}));

// PATCH /api/sensor/warnings/:id/acknowledge (Farmer & Admin - Mark warning as handled)
router.patch('/warnings/:id/acknowledge', authenticate, requireFarmerOrAdmin, asyncHandler(async (req, res) => {
  const warningId = req.params.id;
  const userId = req.user.id;

  const result = await sensorService.acknowledgeWarning(warningId, userId);

  res.status(200).json(result);
}));

// GET /api/sensor/averages?window=24h (Guest, Farmer, Admin)
router.get('/averages/', asyncHandler(async (req, res) => {
  const { window: timeWindow } = req.query; // Accepts '1h', '24h', '7d', '30d'

  const averages = await sensorService.getAveragedReadings(timeWindow);

  res.status(200).json({
    message: `Averaged sensor readings retrieved successfully for window '${averages.window}'`,
    data: averages
  });
}));

module.exports = router;

