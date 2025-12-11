const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { authenticateToken } = require('../middleware/auth');

// Alle Routen erfordern Authentifizierung
router.use(authenticateToken);

// Fahrzeuge abrufen
router.get('/', vehicleController.getAllVehicles);
router.get('/search', vehicleController.searchVehicles);
router.get('/:id', vehicleController.getVehicleById);

// Fahrzeug erstellen
router.post('/', vehicleController.createVehicle);

// Fahrzeug aktualisieren
router.put('/:id', vehicleController.updateVehicle);

// Fahrzeug löschen
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
