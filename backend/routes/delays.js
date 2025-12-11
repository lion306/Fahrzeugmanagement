const express = require('express');
const router = express.Router();
const delayController = require('../controllers/delayController');
const { authenticateToken } = require('../middleware/auth');

// Alle Routen erfordern Authentifizierung
router.use(authenticateToken);

// Dashboard-Statistiken
router.get('/stats', delayController.getDashboardStats);

// Aktive Verzugsmeldungen
router.get('/active', delayController.getActiveAlerts);

// Alle Verzugsmeldungen
router.get('/', delayController.getAllAlerts);

// Verzugsmeldungen für ein Fahrzeug
router.get('/vehicle/:vehicleId', delayController.getAlertsByVehicle);

// Verzugsmeldung auflösen
router.put('/:id/resolve', delayController.resolveAlert);

module.exports = router;
