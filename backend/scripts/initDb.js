const pool = require('../config/database');

const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Benutzer-Tabelle
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        dashboard_settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Einstellungen-Tabelle (System-weite Einstellungen)
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER REFERENCES users(id)
      )
    `);

    // Fahrzeuge-Tabelle (Stammdaten)
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        gw_nr VARCHAR(50) UNIQUE NOT NULL,
        fahrgestellnummer VARCHAR(50) NOT NULL,
        wa_nr VARCHAR(50),
        hersteller VARCHAR(100) NOT NULL,
        modell VARCHAR(100) NOT NULL,
        herkunft VARCHAR(100),
        einkaufsdatum DATE,
        zweiter_radsatz_vorhanden BOOLEAN DEFAULT FALSE,
        radsatz_art VARCHAR(50),
        montage_erforderlich BOOLEAN DEFAULT FALSE,
        auftrags_beschreibung TEXT,
        status VARCHAR(50) DEFAULT 'aktiv',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id)
      )
    `);

    // Phasen-Tracking-Tabelle
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle_phases (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
        lieferdatum DATE,
        termin_tuev_gutachten DATE,
        datum_uebergabe_werkstatt DATE,
        datum_zurueck_werkstatt DATE,
        zeit_werkstatt_tage INTEGER,
        datum_uebergabe_fremdfirma DATE,
        datum_zurueck_fremdfirma DATE,
        zeit_fremdfirma_tage INTEGER,
        datum_uebergabe_aufbereitung DATE,
        datum_zurueck_aufbereitung DATE,
        zeit_aufbereitung_tage INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Verzugsmeldungen-Tabelle
    await client.query(`
      CREATE TABLE IF NOT EXISTS delay_alerts (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
        phase VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        threshold_days INTEGER NOT NULL,
        delay_days INTEGER,
        status VARCHAR(50) DEFAULT 'aktiv',
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // PDF-Templates-Tabelle
    await client.query(`
      CREATE TABLE IF NOT EXISTS pdf_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        file_path VARCHAR(255) NOT NULL,
        placeholders JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by INTEGER REFERENCES users(id)
      )
    `);

    // Standard-Einstellungen einfügen
    await client.query(`
      INSERT INTO settings (key, value, description) VALUES
        ('delay_thresholds', '{"werkstatt": 5, "fremdfirma": 5, "aufbereitung": 3}', 'Verzugsschwellen in Tagen für jede Phase'),
        ('time_calculation_mode', '"arbeitstage"', 'Berechnungsmodus: arbeitstage oder kalendertage'),
        ('default_dashboard_columns', '["gw_nr", "hersteller", "modell", "status", "zeit_werkstatt_tage", "verzug"]', 'Standard-Spalten für Dashboard')
      ON CONFLICT (key) DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('Datenbank-Tabellen erfolgreich erstellt!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Fehler beim Erstellen der Tabellen:', error);
    throw error;
  } finally {
    client.release();
  }
};

const createIndexes = async () => {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicles_gw_nr ON vehicles(gw_nr);
      CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
      CREATE INDEX IF NOT EXISTS idx_vehicle_phases_vehicle_id ON vehicle_phases(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_delay_alerts_vehicle_id ON delay_alerts(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_delay_alerts_status ON delay_alerts(status);
    `);
    console.log('Indizes erfolgreich erstellt!');
  } catch (error) {
    console.error('Fehler beim Erstellen der Indizes:', error);
  } finally {
    client.release();
  }
};

const initDatabase = async () => {
  try {
    await createTables();
    await createIndexes();
    console.log('Datenbank-Initialisierung abgeschlossen!');
    process.exit(0);
  } catch (error) {
    console.error('Datenbank-Initialisierung fehlgeschlagen:', error);
    process.exit(1);
  }
};

initDatabase();
