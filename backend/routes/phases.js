const express = require('express');
const router = express.Router();
const phaseController = require('../controllers/phaseController');
const { authenticateToken } = require('../middleware/auth');

// Alle Routen erfordern Authentifizierung
router.use(authenticateToken);

// Phasen für ein Fahrzeug abrufen
router.get('/:vehicleId', phaseController.getPhases);

// Phasen aktualisieren
router.put('/:vehicleId', phaseController.updatePhases);

module.exports = router;
