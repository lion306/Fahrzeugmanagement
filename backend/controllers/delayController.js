const pool = require('../config/database');

// Alle aktiven Verzugsmeldungen abrufen
const getActiveAlerts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        da.*,
        v.gw_nr,
        v.hersteller,
        v.modell
      FROM delay_alerts da
      JOIN vehicles v ON da.vehicle_id = v.id
      WHERE da.status = 'aktiv'
      ORDER BY da.delay_days DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Verzugsmeldungen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Alle Verzugsmeldungen abrufen (inkl. aufgelöste)
const getAllAlerts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        da.*,
        v.gw_nr,
        v.hersteller,
        v.modell
      FROM delay_alerts da
      JOIN vehicles v ON da.vehicle_id = v.id
      ORDER BY da.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Verzugsmeldungen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Verzugsmeldungen für ein Fahrzeug abrufen
const getAlertsByVehicle = async (req, res) => {
  const { vehicleId } = req.params;

  try {
    const result = await pool.query(`
      SELECT * FROM delay_alerts
      WHERE vehicle_id = $1
      ORDER BY created_at DESC
    `, [vehicleId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Verzugsmeldungen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Verzugsmeldung manuell auflösen
const resolveAlert = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      UPDATE delay_alerts
      SET status = 'manuell_aufgelöst', resolved_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Verzugsmeldung nicht gefunden' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Auflösen der Verzugsmeldung:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Dashboard-Statistiken
const getDashboardStats = async (req, res) => {
  try {
    const stats = {};

    // Gesamtzahl Fahrzeuge
    const totalVehicles = await pool.query(
      "SELECT COUNT(*) as count FROM vehicles WHERE status = 'aktiv'"
    );
    stats.totalVehicles = parseInt(totalVehicles.rows[0].count);

    // Aktive Verzugsmeldungen
    const activeAlerts = await pool.query(
      "SELECT COUNT(*) as count FROM delay_alerts WHERE status = 'aktiv'"
    );
    stats.activeAlerts = parseInt(activeAlerts.rows[0].count);

    // Fahrzeuge in Werkstatt
    const inWorkshop = await pool.query(`
      SELECT COUNT(*) as count FROM vehicle_phases
      WHERE datum_uebergabe_werkstatt IS NOT NULL
      AND datum_zurueck_werkstatt IS NULL
    `);
    stats.inWorkshop = parseInt(inWorkshop.rows[0].count);

    // Fahrzeuge bei Fremdfirma
    const atThirdParty = await pool.query(`
      SELECT COUNT(*) as count FROM vehicle_phases
      WHERE datum_uebergabe_fremdfirma IS NOT NULL
      AND datum_zurueck_fremdfirma IS NULL
    `);
    stats.atThirdParty = parseInt(atThirdParty.rows[0].count);

    // Fahrzeuge in Aufbereitung
    const inPreparation = await pool.query(`
      SELECT COUNT(*) as count FROM vehicle_phases
      WHERE datum_uebergabe_aufbereitung IS NOT NULL
      AND datum_zurueck_aufbereitung IS NULL
    `);
    stats.inPreparation = parseInt(inPreparation.rows[0].count);

    // Verzugsmeldungen nach Phase
    const alertsByPhase = await pool.query(`
      SELECT phase, COUNT(*) as count
      FROM delay_alerts
      WHERE status = 'aktiv'
      GROUP BY phase
    `);
    stats.alertsByPhase = alertsByPhase.rows.reduce((acc, row) => {
      acc[row.phase] = parseInt(row.count);
      return acc;
    }, {});

    res.json(stats);
  } catch (error) {
    console.error('Fehler beim Abrufen der Dashboard-Statistiken:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

module.exports = {
  getActiveAlerts,
  getAllAlerts,
  getAlertsByVehicle,
  resolveAlert,
  getDashboardStats
};
