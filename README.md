# Fahrzeugmanagement-System (FMS)

Ein vollständiges Web-basiertes Fahrzeugmanagement-System für Gebrauchtwagen-Verwaltung mit Phasen-Tracking, Verzugswarnsystem und PDF-Generierung.

## Features

### Fahrzeug-Stammdaten
- GW-Nr. (Gebrauchtwagen-Nummer) mit Eindeutigkeitsprüfung
- Fahrgestellnummer (VIN)
- WA-Nr. (Werkstatt-Auftrags-Nummer)
- Hersteller & Modell
- Herkunft & Einkaufsdatum
- Radsatz-Information (Sommerräder/Winterräder, Montage erforderlich)

### Phasen-Tracking
- **Logistik**: Lieferdatum
- **Begutachtung**: TÜV Gutachten-Termin
- **Werkstatt**: Übergabe/Rückgabe mit automatischer Zeitdifferenzberechnung
- **Fremdfirma**: Übergabe/Rückgabe mit automatischer Zeitdifferenzberechnung
- **Aufbereitung**: Übergabe/Rückgabe mit automatischer Zeitdifferenzberechnung

### Verzugs-Warnsystem
- Konfigurierbare Schwellenwerte pro Phase
- Automatische Verzugsmeldungen im Dashboard
- Wahlweise Arbeitstage oder Kalendertage
- Manuelles Auflösen von Meldungen

### Dashboard
- Übersicht aller aktiven Fahrzeuge
- Statistiken (Fahrzeuge gesamt, in Werkstatt, bei Fremdfirma, etc.)
- Individuelle Spaltenauswahl (per Drag & Drop)
- Benutzer-spezifische Einstellungen

### Werkstattaufträge
- Auftragsbeschreibung pro Fahrzeug
- PDF-Generierung mit anpassbaren Templates
- Platzhalter: `[[GW_NR]]`, `[[FAHRGESTELLNUMMER]]`, `[[AUFTRAGS_TEXT]]`, etc.

### Admin-Bereich
- Verzugsschwellen-Konfiguration
- PDF-Template-Verwaltung
- Benutzerverwaltung mit Rollen (Admin/User)

## Technologie-Stack

### Backend
- **Node.js** mit **Express.js**
- **PostgreSQL** Datenbank
- **JWT** Authentifizierung
- **pdf-lib** für PDF-Generierung

### Frontend
- **React** 18 mit Vite
- **React Router** für Navigation
- **@hello-pangea/dnd** für Drag & Drop
- **React Toastify** für Benachrichtigungen
- **Axios** für API-Kommunikation

## Installation

### Voraussetzungen
- Node.js 18+
- PostgreSQL 14+

### Backend einrichten

```bash
cd backend

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# .env Datei bearbeiten mit Datenbankverbindung

# Datenbank initialisieren
npm run db:init

# Server starten
npm run dev
```

### Frontend einrichten

```bash
cd frontend

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev
```

### Umgebungsvariablen (Backend)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/fahrzeugmanagement
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fahrzeugmanagement
DB_USER=user
DB_PASSWORD=password

PORT=3001
NODE_ENV=development

JWT_SECRET=your-secret-key

UPLOAD_DIR=./uploads
```

## API-Endpunkte

### Authentifizierung
- `POST /api/auth/register` - Registrierung
- `POST /api/auth/login` - Anmeldung
- `GET /api/auth/me` - Aktueller Benutzer
- `PUT /api/auth/dashboard-settings` - Dashboard-Einstellungen speichern

### Fahrzeuge
- `GET /api/vehicles` - Alle Fahrzeuge
- `GET /api/vehicles/:id` - Einzelnes Fahrzeug
- `POST /api/vehicles` - Fahrzeug erstellen
- `PUT /api/vehicles/:id` - Fahrzeug aktualisieren
- `DELETE /api/vehicles/:id` - Fahrzeug löschen

### Phasen
- `GET /api/phases/:vehicleId` - Phasen abrufen
- `PUT /api/phases/:vehicleId` - Phasen aktualisieren

### Verzugsmeldungen
- `GET /api/delays/stats` - Dashboard-Statistiken
- `GET /api/delays/active` - Aktive Verzugsmeldungen
- `PUT /api/delays/:id/resolve` - Verzugsmeldung auflösen

### Einstellungen (Admin)
- `GET /api/settings/delay-thresholds` - Verzugsschwellen
- `PUT /api/settings/delay-thresholds/update` - Verzugsschwellen aktualisieren

### PDF
- `GET /api/pdf/generate/:vehicleId` - PDF generieren
- `POST /api/pdf/templates` - Template hochladen (Admin)

## Datenbank-Schema

### Haupttabellen
- `users` - Benutzer mit Rollen und Dashboard-Einstellungen
- `vehicles` - Fahrzeug-Stammdaten
- `vehicle_phases` - Phasen-Tracking mit Zeitdifferenzen
- `delay_alerts` - Verzugsmeldungen
- `settings` - System-Einstellungen
- `pdf_templates` - PDF-Templates

## Workflow

1. **Fahrzeug anlegen**: Stammdaten erfassen (GW-Nr., VIN, Hersteller, etc.)
2. **Phasen tracken**: Lieferdatum, Werkstatt-Übergabe, etc. eintragen
3. **Verzug überwachen**: Automatische Warnungen bei Überschreitung
4. **Werkstattauftrag erstellen**: Beschreibung eingeben, PDF generieren

## Lizenz

MIT
