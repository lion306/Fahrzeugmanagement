const pool = require('../config/database');

// Alle Einstellungen abrufen
const getAllSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings ORDER BY key');
    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Einstellungen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Einzelne Einstellung abrufen
const getSetting = async (req, res) => {
  const { key } = req.params;

  try {
    const result = await pool.query('SELECT * FROM settings WHERE key = $1', [key]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Einstellung nicht gefunden' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Abrufen der Einstellung:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Einstellung aktualisieren
const updateSetting = async (req, res) => {
  const { key } = req.params;
  const { value, description } = req.body;

  try {
    const result = await pool.query(`
      UPDATE settings
      SET value = $1, description = COALESCE($2, description), updated_at = CURRENT_TIMESTAMP, updated_by = $3
      WHERE key = $4
      RETURNING *
    `, [JSON.stringify(value), description, req.user?.id, key]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Einstellung nicht gefunden' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Einstellung:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Verzugsschwellen abrufen
const getDelayThresholds = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'delay_thresholds'"
    );

    if (result.rows.length === 0) {
      return res.json({ werkstatt: 5, fremdfirma: 5, aufbereitung: 3 });
    }

    res.json(result.rows[0].value);
  } catch (error) {
    console.error('Fehler beim Abrufen der Verzugsschwellen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Verzugsschwellen aktualisieren
const updateDelayThresholds = async (req, res) => {
  const { werkstatt, fremdfirma, aufbereitung } = req.body;

  try {
    const thresholds = { werkstatt, fremdfirma, aufbereitung };

    const result = await pool.query(`
      UPDATE settings
      SET value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
      WHERE key = 'delay_thresholds'
      RETURNING *
    `, [JSON.stringify(thresholds), req.user?.id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Verzugsschwellen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Berechnungsmodus abrufen
const getCalculationMode = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'time_calculation_mode'"
    );

    if (result.rows.length === 0) {
      return res.json('arbeitstage');
    }

    res.json(result.rows[0].value);
  } catch (error) {
    console.error('Fehler beim Abrufen des Berechnungsmodus:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Berechnungsmodus aktualisieren
const updateCalculationMode = async (req, res) => {
  const { mode } = req.body;

  if (!['arbeitstage', 'kalendertage'].includes(mode)) {
    return res.status(400).json({ error: 'Ungültiger Berechnungsmodus' });
  }

  try {
    const result = await pool.query(`
      UPDATE settings
      SET value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
      WHERE key = 'time_calculation_mode'
      RETURNING *
    `, [JSON.stringify(mode), req.user?.id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Berechnungsmodus:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

module.exports = {
  getAllSettings,
  getSetting,
  updateSetting,
  getDelayThresholds,
  updateDelayThresholds,
  getCalculationMode,
  updateCalculationMode
};
