const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Alle Routen erfordern Authentifizierung
router.use(authenticateToken);

// PDF für Fahrzeug generieren
router.get('/generate/:vehicleId', pdfController.generateWorkshopOrder);

// Template-Verwaltung (Admin-only)
router.get('/templates', pdfController.getAllTemplates);
router.get('/templates/active', pdfController.getActiveTemplate);
router.post('/templates', requireAdmin, pdfController.upload.single('template'), pdfController.uploadTemplate);
router.put('/templates/:id/activate', requireAdmin, pdfController.activateTemplate);
router.delete('/templates/:id', requireAdmin, pdfController.deleteTemplate);

module.exports = router;
