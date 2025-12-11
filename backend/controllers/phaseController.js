const pool = require('../config/database');

// Hilfsfunktion: Arbeitstage berechnen (Mo-Fr)
const calculateWorkDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workDays = 0;

  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workDays;
};

// Hilfsfunktion: Kalendertage berechnen
const calculateCalendarDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Hilfsfunktion: Tage seit Datum (für Verzug)
const daysSince = (date, useWorkDays = true) => {
  const start = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (useWorkDays) {
    return calculateWorkDays(start, today);
  }
  return calculateCalendarDays(start, today);
};

// Berechnungsmodus aus Einstellungen abrufen
const getCalculationMode = async () => {
  const result = await pool.query(
    "SELECT value FROM settings WHERE key = 'time_calculation_mode'"
  );
  return result.rows[0]?.value || 'arbeitstage';
};

// Phasen für ein Fahrzeug abrufen
const getPhases = async (req, res) => {
  const { vehicleId } = req.params;

  try {
    const result = await pool.query(`
      SELECT * FROM vehicle_phases WHERE vehicle_id = $1
    `, [vehicleId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Phasen nicht gefunden' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Abrufen der Phasen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Phasen aktualisieren
const updatePhases = async (req, res) => {
  const { vehicleId } = req.params;
  const {
    lieferdatum,
    termin_tuev_gutachten,
    datum_uebergabe_werkstatt,
    datum_zurueck_werkstatt,
    datum_uebergabe_fremdfirma,
    datum_zurueck_fremdfirma,
    datum_uebergabe_aufbereitung,
    datum_zurueck_aufbereitung
  } = req.body;

  try {
    const calculationMode = await getCalculationMode();
    const useWorkDays = calculationMode === 'arbeitstage';

    // Zeitdifferenzen berechnen
    let zeit_werkstatt_tage = null;
    let zeit_fremdfirma_tage = null;
    let zeit_aufbereitung_tage = null;

    if (datum_uebergabe_werkstatt && datum_zurueck_werkstatt) {
      zeit_werkstatt_tage = useWorkDays
        ? calculateWorkDays(datum_uebergabe_werkstatt, datum_zurueck_werkstatt)
        : calculateCalendarDays(datum_uebergabe_werkstatt, datum_zurueck_werkstatt);
    }

    if (datum_uebergabe_fremdfirma && datum_zurueck_fremdfirma) {
      zeit_fremdfirma_tage = useWorkDays
        ? calculateWorkDays(datum_uebergabe_fremdfirma, datum_zurueck_fremdfirma)
        : calculateCalendarDays(datum_uebergabe_fremdfirma, datum_zurueck_fremdfirma);
    }

    if (datum_uebergabe_aufbereitung && datum_zurueck_aufbereitung) {
      zeit_aufbereitung_tage = useWorkDays
        ? calculateWorkDays(datum_uebergabe_aufbereitung, datum_zurueck_aufbereitung)
        : calculateCalendarDays(datum_uebergabe_aufbereitung, datum_zurueck_aufbereitung);
    }

    const result = await pool.query(`
      UPDATE vehicle_phases SET
        lieferdatum = $1,
        termin_tuev_gutachten = $2,
        datum_uebergabe_werkstatt = $3,
        datum_zurueck_werkstatt = $4,
        zeit_werkstatt_tage = $5,
        datum_uebergabe_fremdfirma = $6,
        datum_zurueck_fremdfirma = $7,
        zeit_fremdfirma_tage = $8,
        datum_uebergabe_aufbereitung = $9,
        datum_zurueck_aufbereitung = $10,
        zeit_aufbereitung_tage = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE vehicle_id = $12
      RETURNING *
    `, [
      lieferdatum || null,
      termin_tuev_gutachten || null,
      datum_uebergabe_werkstatt || null,
      datum_zurueck_werkstatt || null,
      zeit_werkstatt_tage,
      datum_uebergabe_fremdfirma || null,
      datum_zurueck_fremdfirma || null,
      zeit_fremdfirma_tage,
      datum_uebergabe_aufbereitung || null,
      datum_zurueck_aufbereitung || null,
      zeit_aufbereitung_tage,
      vehicleId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Phasen nicht gefunden' });
    }

    // Verzugsprüfung nach Update
    await checkAndCreateDelayAlerts(vehicleId);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Phasen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Verzugsprüfung und Alert-Erstellung
const checkAndCreateDelayAlerts = async (vehicleId) => {
  const client = await pool.connect();

  try {
    // Verzugsschwellen abrufen
    const thresholdsResult = await client.query(
      "SELECT value FROM settings WHERE key = 'delay_thresholds'"
    );
    const thresholds = thresholdsResult.rows[0]?.value || { werkstatt: 5, fremdfirma: 5, aufbereitung: 3 };

    // Berechnungsmodus abrufen
    const calculationMode = await getCalculationMode();
    const useWorkDays = calculationMode === 'arbeitstage';

    // Phasen abrufen
    const phasesResult = await client.query(
      'SELECT * FROM vehicle_phases WHERE vehicle_id = $1',
      [vehicleId]
    );

    if (phasesResult.rows.length === 0) return;
    const phases = phasesResult.rows[0];

    // Prüfe Werkstatt-Verzug
    if (phases.datum_uebergabe_werkstatt && !phases.datum_zurueck_werkstatt) {
      const days = daysSince(phases.datum_uebergabe_werkstatt, useWorkDays);
      if (days > thresholds.werkstatt) {
        await createOrUpdateAlert(client, vehicleId, 'werkstatt', phases.datum_uebergabe_werkstatt, thresholds.werkstatt, days - thresholds.werkstatt);
      }
    } else {
      // Phase abgeschlossen - Alert auflösen
      await resolveAlert(client, vehicleId, 'werkstatt');
    }

    // Prüfe Fremdfirma-Verzug
    if (phases.datum_uebergabe_fremdfirma && !phases.datum_zurueck_fremdfirma) {
      const days = daysSince(phases.datum_uebergabe_fremdfirma, useWorkDays);
      if (days > thresholds.fremdfirma) {
        await createOrUpdateAlert(client, vehicleId, 'fremdfirma', phases.datum_uebergabe_fremdfirma, thresholds.fremdfirma, days - thresholds.fremdfirma);
      }
    } else {
      await resolveAlert(client, vehicleId, 'fremdfirma');
    }

    // Prüfe Aufbereitung-Verzug
    if (phases.datum_uebergabe_aufbereitung && !phases.datum_zurueck_aufbereitung) {
      const days = daysSince(phases.datum_uebergabe_aufbereitung, useWorkDays);
      if (days > thresholds.aufbereitung) {
        await createOrUpdateAlert(client, vehicleId, 'aufbereitung', phases.datum_uebergabe_aufbereitung, thresholds.aufbereitung, days - thresholds.aufbereitung);
      }
    } else {
      await resolveAlert(client, vehicleId, 'aufbereitung');
    }

  } catch (error) {
    console.error('Fehler bei der Verzugsprüfung:', error);
  } finally {
    client.release();
  }
};

// Alert erstellen oder aktualisieren
const createOrUpdateAlert = async (client, vehicleId, phase, startDate, thresholdDays, delayDays) => {
  const existing = await client.query(
    'SELECT id FROM delay_alerts WHERE vehicle_id = $1 AND phase = $2 AND status = $3',
    [vehicleId, phase, 'aktiv']
  );

  if (existing.rows.length > 0) {
    await client.query(
      'UPDATE delay_alerts SET delay_days = $1 WHERE id = $2',
      [delayDays, existing.rows[0].id]
    );
  } else {
    await client.query(`
      INSERT INTO delay_alerts (vehicle_id, phase, start_date, threshold_days, delay_days)
      VALUES ($1, $2, $3, $4, $5)
    `, [vehicleId, phase, startDate, thresholdDays, delayDays]);
  }
};

// Alert auflösen
const resolveAlert = async (client, vehicleId, phase) => {
  await client.query(`
    UPDATE delay_alerts
    SET status = 'aufgelöst', resolved_at = CURRENT_TIMESTAMP
    WHERE vehicle_id = $1 AND phase = $2 AND status = 'aktiv'
  `, [vehicleId, phase]);
};

module.exports = {
  getPhases,
  updatePhases,
  checkAndCreateDelayAlerts,
  calculateWorkDays,
  calculateCalendarDays
};
