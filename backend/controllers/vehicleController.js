const pool = require('../config/database');

// Alle Fahrzeuge abrufen
const getAllVehicles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        v.*,
        vp.lieferdatum,
        vp.termin_tuev_gutachten,
        vp.datum_uebergabe_werkstatt,
        vp.datum_zurueck_werkstatt,
        vp.zeit_werkstatt_tage,
        vp.datum_uebergabe_fremdfirma,
        vp.datum_zurueck_fremdfirma,
        vp.zeit_fremdfirma_tage,
        vp.datum_uebergabe_aufbereitung,
        vp.datum_zurueck_aufbereitung,
        vp.zeit_aufbereitung_tage
      FROM vehicles v
      LEFT JOIN vehicle_phases vp ON v.id = vp.vehicle_id
      ORDER BY v.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Fahrzeuge:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Einzelnes Fahrzeug abrufen
const getVehicleById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        v.*,
        vp.lieferdatum,
        vp.termin_tuev_gutachten,
        vp.datum_uebergabe_werkstatt,
        vp.datum_zurueck_werkstatt,
        vp.zeit_werkstatt_tage,
        vp.datum_uebergabe_fremdfirma,
        vp.datum_zurueck_fremdfirma,
        vp.zeit_fremdfirma_tage,
        vp.datum_uebergabe_aufbereitung,
        vp.datum_zurueck_aufbereitung,
        vp.zeit_aufbereitung_tage
      FROM vehicles v
      LEFT JOIN vehicle_phases vp ON v.id = vp.vehicle_id
      WHERE v.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fahrzeug nicht gefunden' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Abrufen des Fahrzeugs:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Neues Fahrzeug erstellen
const createVehicle = async (req, res) => {
  const {
    gw_nr,
    fahrgestellnummer,
    wa_nr,
    hersteller,
    modell,
    herkunft,
    einkaufsdatum,
    zweiter_radsatz_vorhanden,
    radsatz_art,
    montage_erforderlich,
    auftrags_beschreibung
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Prüfen ob GW-Nr. bereits existiert
    const existing = await client.query('SELECT id FROM vehicles WHERE gw_nr = $1', [gw_nr]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'GW-Nr. existiert bereits' });
    }

    // Fahrzeug erstellen
    const vehicleResult = await client.query(`
      INSERT INTO vehicles (
        gw_nr, fahrgestellnummer, wa_nr, hersteller, modell, herkunft, einkaufsdatum,
        zweiter_radsatz_vorhanden, radsatz_art, montage_erforderlich, auftrags_beschreibung,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      gw_nr,
      fahrgestellnummer,
      wa_nr || null,
      hersteller,
      modell,
      herkunft || null,
      einkaufsdatum || null,
      zweiter_radsatz_vorhanden || false,
      radsatz_art || null,
      montage_erforderlich || false,
      auftrags_beschreibung || null,
      req.user?.id || null
    ]);

    // Phasen-Eintrag erstellen
    await client.query(`
      INSERT INTO vehicle_phases (vehicle_id)
      VALUES ($1)
    `, [vehicleResult.rows[0].id]);

    await client.query('COMMIT');

    res.status(201).json(vehicleResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Fehler beim Erstellen des Fahrzeugs:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  } finally {
    client.release();
  }
};

// Fahrzeug aktualisieren
const updateVehicle = async (req, res) => {
  const { id } = req.params;
  const {
    gw_nr,
    fahrgestellnummer,
    wa_nr,
    hersteller,
    modell,
    herkunft,
    einkaufsdatum,
    zweiter_radsatz_vorhanden,
    radsatz_art,
    montage_erforderlich,
    auftrags_beschreibung,
    status
  } = req.body;

  try {
    // Prüfen ob GW-Nr. bereits bei anderem Fahrzeug existiert
    const existing = await pool.query(
      'SELECT id FROM vehicles WHERE gw_nr = $1 AND id != $2',
      [gw_nr, id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'GW-Nr. existiert bereits bei einem anderen Fahrzeug' });
    }

    const result = await pool.query(`
      UPDATE vehicles SET
        gw_nr = $1,
        fahrgestellnummer = $2,
        wa_nr = $3,
        hersteller = $4,
        modell = $5,
        herkunft = $6,
        einkaufsdatum = $7,
        zweiter_radsatz_vorhanden = $8,
        radsatz_art = $9,
        montage_erforderlich = $10,
        auftrags_beschreibung = $11,
        status = $12,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $13
      WHERE id = $14
      RETURNING *
    `, [
      gw_nr,
      fahrgestellnummer,
      wa_nr || null,
      hersteller,
      modell,
      herkunft || null,
      einkaufsdatum || null,
      zweiter_radsatz_vorhanden || false,
      radsatz_art || null,
      montage_erforderlich || false,
      auftrags_beschreibung || null,
      status || 'aktiv',
      req.user?.id || null,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fahrzeug nicht gefunden' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Fahrzeugs:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Fahrzeug löschen
const deleteVehicle = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fahrzeug nicht gefunden' });
    }

    res.json({ message: 'Fahrzeug erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Fahrzeugs:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Fahrzeuge suchen
const searchVehicles = async (req, res) => {
  const { query } = req.query;

  try {
    const result = await pool.query(`
      SELECT
        v.*,
        vp.lieferdatum,
        vp.termin_tuev_gutachten,
        vp.datum_uebergabe_werkstatt,
        vp.datum_zurueck_werkstatt,
        vp.zeit_werkstatt_tage,
        vp.datum_uebergabe_fremdfirma,
        vp.datum_zurueck_fremdfirma,
        vp.zeit_fremdfirma_tage,
        vp.datum_uebergabe_aufbereitung,
        vp.datum_zurueck_aufbereitung,
        vp.zeit_aufbereitung_tage
      FROM vehicles v
      LEFT JOIN vehicle_phases vp ON v.id = vp.vehicle_id
      WHERE
        v.gw_nr ILIKE $1 OR
        v.fahrgestellnummer ILIKE $1 OR
        v.hersteller ILIKE $1 OR
        v.modell ILIKE $1 OR
        v.wa_nr ILIKE $1
      ORDER BY v.created_at DESC
    `, [`%${query}%`]);

    res.json(result.rows);
  } catch (error) {
    console.error('Fehler bei der Suche:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  searchVehicles
};
