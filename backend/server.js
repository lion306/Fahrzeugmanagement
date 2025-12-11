const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload-Verzeichnis erstellen
const fs = require('fs');
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Static files für Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/phases', require('./routes/phases'));
app.use('/api/delays', require('./routes/delays'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/pdf', require('./routes/pdf'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Fehler:', err);

  if (err.name === 'MulterError') {
    return res.status(400).json({ error: 'Datei-Upload-Fehler: ' + err.message });
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Interner Serverfehler'
      : err.message
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpunkt nicht gefunden' });
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Periodische Verzugsprüfung (alle 15 Minuten)
const pool = require('./config/database');
const { checkAndCreateDelayAlerts } = require('./controllers/phaseController');

const checkAllDelays = async () => {
  try {
    const result = await pool.query('SELECT id FROM vehicles WHERE status = $1', ['aktiv']);
    for (const vehicle of result.rows) {
      await checkAndCreateDelayAlerts(vehicle.id);
    }
    console.log(`Verzugsprüfung abgeschlossen: ${result.rows.length} Fahrzeuge geprüft`);
  } catch (error) {
    console.error('Fehler bei der periodischen Verzugsprüfung:', error);
  }
};

// Erste Prüfung nach 5 Sekunden, dann alle 15 Minuten
setTimeout(checkAllDelays, 5000);
setInterval(checkAllDelays, 15 * 60 * 1000);

module.exports = app;
