const express = require('express');
const router = express.Router();
const internetMonitorService = require('../services/internetMonitorService');

// Helper untuk menangkap error async agar server tidak crash
const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    console.error("Internet API Error:", error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// 1. Endpoint LIVE
router.get('/live', asyncHandler(async (req, res) => {
  const data = await internetMonitorService.getLiveReading();
  res.status(200).json({ data });
}));

// 2. Endpoint HISTORY (Ini yang 404 sebelumnya)
router.get('/history', asyncHandler(async (req, res) => {
  const { page, limit, window, startDate, endDate } = req.query;
  const historyData = await internetMonitorService.getHistory(
    { page, limit },
    { window, startDate, endDate }
  );
  res.status(200).json(historyData);
}));

// 3. Endpoint AVERAGES (Ini juga yang 404 sebelumnya)
router.get('/averages', asyncHandler(async (req, res) => {
  const { window, startDate, endDate } = req.query;
  const averages = await internetMonitorService.getAveragedReadings({ window, startDate, endDate });
  res.status(200).json({ data: averages });
}));

// WAJIB: Pastikan baris ini ada di paling bawah
module.exports = router;