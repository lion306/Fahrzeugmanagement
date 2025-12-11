const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Öffentliche Routen
router.post('/register', authController.register);
router.post('/login', authController.login);

// Geschützte Routen
router.get('/me', authenticateToken, authController.getCurrentUser);
router.put('/dashboard-settings', authenticateToken, authController.updateDashboardSettings);
router.put('/change-password', authenticateToken, authController.changePassword);

// Admin-only Routen
router.get('/users', authenticateToken, requireAdmin, authController.getAllUsers);
router.put('/users/:id/role', authenticateToken, requireAdmin, authController.updateUserRole);

module.exports = router;
