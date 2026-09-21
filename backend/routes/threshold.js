const express = require('express');
const router = express.Router();
const thresholdService = require('../services/thresholdService');
const { authenticate, requireAdmin } = require('../middleware/auth');

const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.statusCode === 404 ? 'Not Found' : 'Internal Server Error',
      message: error.message
    });
  }
};

// GET /api/thresholds (Admin Only - View all threshold settings)
router.get('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const thresholds = await thresholdService.getAllThresholds();
  
  res.status(200).json({
    message: 'Threshold settings retrieved successfully',
    data: thresholds
  });
}));

// PUT /api/thresholds/:parameterName (Admin Only - Update threshold settings)
router.put('/:parameterName', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { parameterName } = req.params;
  const adminUserId = req.user.id;

  const updatedThreshold = await thresholdService.updateThreshold(
    parameterName,
    req.body,
    adminUserId
  );

  res.status(200).json({
    message: `Threshold for '${parameterName}' updated successfully`,
    data: updatedThreshold
  });
}));

module.exports = router;