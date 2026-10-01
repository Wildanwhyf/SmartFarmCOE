const express = require('express');
const router = express.Router();
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

module.exports = router;