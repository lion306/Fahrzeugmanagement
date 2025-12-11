const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Alle Routen erfordern Authentifizierung
router.use(authenticateToken);

// Verzugsschwellen (für alle Benutzer lesbar)
router.get('/delay-thresholds', settingsController.getDelayThresholds);

// Berechnungsmodus (für alle Benutzer lesbar)
router.get('/calculation-mode', settingsController.getCalculationMode);

// Admin-only Routen
router.get('/', requireAdmin, settingsController.getAllSettings);
router.get('/:key', requireAdmin, settingsController.getSetting);
router.put('/:key', requireAdmin, settingsController.updateSetting);
router.put('/delay-thresholds/update', requireAdmin, settingsController.updateDelayThresholds);
router.put('/calculation-mode/update', requireAdmin, settingsController.updateCalculationMode);

module.exports = router;
