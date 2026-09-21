const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticate, requireAdmin } = require('../middleware/auth');

const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.statusCode === 409 ? 'Conflict' : 'Error',
      message: error.message
    });
  }
};

// POST /api/auth/login (Public)
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.login(email, password);
  res.status(200).json(data);
}));

// POST /api/auth/farmers (Admin Only)
router.post('/farmers', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const farmer = await authService.createFarmer(req.body);
  res.status(201).json({ message: 'Farmer account created', data: farmer });
}));

// PATCH /api/auth/users/:id/status (Admin Only - Deactivate/Activate)
router.patch('/users/:id/status', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { is_active } = req.body;
  const result = await authService.toggleUserStatus(req.params.id, is_active);
  res.status(200).json(result);
}));

// GET /api/auth/users (Admin Only)
router.get('/users', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const users = await authService.listUsers();
  res.status(200).json({ data: users });
}));

// GET /api/auth/me (Protected - Any logged in user)
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.user.id);
  
  res.status(200).json({
    message: 'Profile retrieved successfully',
    data: profile
  });
}));

module.exports = router;