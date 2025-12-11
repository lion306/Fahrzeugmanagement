const pool = require('../config/database');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

// Multer-Konfiguration für PDF-Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'template-' + uniqueSuffix + '.pdf');
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Nur PDF-Dateien sind erlaubt'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Alle Templates abrufen
const getAllTemplates = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM pdf_templates
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Templates:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Aktives Template abrufen
const getActiveTemplate = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM pdf_templates
      WHERE is_active = true
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kein aktives Template gefunden' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Abrufen des aktiven Templates:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Template hochladen
const uploadTemplate = async (req, res) => {
  try {
    const { name, description, placeholders } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'PDF-Datei ist erforderlich' });
    }

    // Vorherige aktive Templates deaktivieren
    await pool.query('UPDATE pdf_templates SET is_active = false WHERE is_active = true');

    const result = await pool.query(`
      INSERT INTO pdf_templates (name, description, file_path, placeholders, uploaded_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      name || 'Werkstattauftrag',
      description || '',
      file.path,
      placeholders ? JSON.stringify(placeholders) : '[]',
      req.user?.id
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Hochladen des Templates:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Template aktivieren
const activateTemplate = async (req, res) => {
  const { id } = req.params;

  try {
    // Alle deaktivieren
    await pool.query('UPDATE pdf_templates SET is_active = false');

    // Ausgewähltes aktivieren
    const result = await pool.query(`
      UPDATE pdf_templates
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template nicht gefunden' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Aktivieren des Templates:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Template löschen
const deleteTemplate = async (req, res) => {
  const { id } = req.params;

  try {
    const template = await pool.query('SELECT file_path FROM pdf_templates WHERE id = $1', [id]);

    if (template.rows.length === 0) {
      return res.status(404).json({ error: 'Template nicht gefunden' });
    }

    // Datei löschen
    try {
      await fs.unlink(template.rows[0].file_path);
    } catch (err) {
      console.log('Datei konnte nicht gelöscht werden:', err.message);
    }

    await pool.query('DELETE FROM pdf_templates WHERE id = $1', [id]);

    res.json({ message: 'Template erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Templates:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Werkstattauftrag-PDF generieren
const generateWorkshopOrder = async (req, res) => {
  const { vehicleId } = req.params;

  try {
    // Fahrzeugdaten abrufen
    const vehicleResult = await pool.query(`
      SELECT
        v.*,
        vp.lieferdatum,
        vp.termin_tuev_gutachten,
        vp.datum_uebergabe_werkstatt,
        vp.datum_zurueck_werkstatt
      FROM vehicles v
      LEFT JOIN vehicle_phases vp ON v.id = vp.vehicle_id
      WHERE v.id = $1
    `, [vehicleId]);

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fahrzeug nicht gefunden' });
    }

    const vehicle = vehicleResult.rows[0];

    // Aktives Template abrufen
    const templateResult = await pool.query(`
      SELECT * FROM pdf_templates WHERE is_active = true LIMIT 1
    `);

    let pdfBytes;

    if (templateResult.rows.length > 0) {
      // Mit Template generieren
      const template = templateResult.rows[0];
      pdfBytes = await generateFromTemplate(template, vehicle);
    } else {
      // Standard-PDF generieren
      pdfBytes = await generateStandardPdf(vehicle);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Werkstattauftrag-${vehicle.gw_nr}.pdf"`);
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Fehler bei der PDF-Generierung:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// PDF aus Template generieren
const generateFromTemplate = async (template, vehicle) => {
  try {
    const templateBytes = await fs.readFile(template.file_path);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();

    // Platzhalter-Mapping
    const placeholders = {
      '[[GW_NR]]': vehicle.gw_nr || '',
      '[[FAHRGESTELLNUMMER]]': vehicle.fahrgestellnummer || '',
      '[[WA_NR]]': vehicle.wa_nr || '',
      '[[HERSTELLER]]': vehicle.hersteller || '',
      '[[MODELL]]': vehicle.modell || '',
      '[[HERKUNFT]]': vehicle.herkunft || '',
      '[[EINKAUFSDATUM]]': vehicle.einkaufsdatum ? new Date(vehicle.einkaufsdatum).toLocaleDateString('de-DE') : '',
      '[[AUFTRAGS_TEXT]]': vehicle.auftrags_beschreibung || '',
      '[[DATUM]]': new Date().toLocaleDateString('de-DE'),
      '[[RADSATZ_VORHANDEN]]': vehicle.zweiter_radsatz_vorhanden ? 'Ja' : 'Nein',
      '[[RADSATZ_ART]]': vehicle.radsatz_art || '',
      '[[MONTAGE_ERFORDERLICH]]': vehicle.montage_erforderlich ? 'Ja' : 'Nein'
    };

    // Versuche Formularfelder zu füllen
    try {
      const fields = form.getFields();
      for (const field of fields) {
        const fieldName = field.getName();
        for (const [placeholder, value] of Object.entries(placeholders)) {
          if (fieldName.includes(placeholder.replace(/\[\[|\]\]/g, ''))) {
            try {
              if (field.constructor.name === 'PDFTextField') {
                field.setText(value);
              }
            } catch (e) {
              console.log(`Feld ${fieldName} konnte nicht befüllt werden`);
            }
          }
        }
      }
      form.flatten();
    } catch (e) {
      console.log('Keine Formularfelder gefunden, verwende Text-Overlay');
    }

    return await pdfDoc.save();
  } catch (error) {
    console.error('Fehler beim Laden des Templates, generiere Standard-PDF:', error);
    return await generateStandardPdf(vehicle);
  }
};

// Standard-PDF generieren (ohne Template)
const generateStandardPdf = async (vehicle) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let y = height - 50;

  // Titel
  page.drawText('WERKSTATTAUFTRAG', {
    x: 50,
    y,
    size: 24,
    font: fontBold,
    color: rgb(0.1, 0.3, 0.6)
  });

  y -= 40;

  // Datum
  page.drawText(`Datum: ${new Date().toLocaleDateString('de-DE')}`, {
    x: 50,
    y,
    size: 12,
    font
  });

  y -= 40;

  // Fahrzeugdaten
  const drawField = (label, value) => {
    page.drawText(label, { x: 50, y, size: 10, font: fontBold });
    page.drawText(value || '-', { x: 200, y, size: 10, font });
    y -= 20;
  };

  page.drawText('FAHRZEUGDATEN', { x: 50, y, size: 14, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  y -= 25;

  drawField('GW-Nr.:', vehicle.gw_nr);
  drawField('Fahrgestellnummer:', vehicle.fahrgestellnummer);
  drawField('WA-Nr.:', vehicle.wa_nr);
  drawField('Hersteller:', vehicle.hersteller);
  drawField('Modell:', vehicle.modell);
  drawField('Herkunft:', vehicle.herkunft);
  drawField('Einkaufsdatum:', vehicle.einkaufsdatum ? new Date(vehicle.einkaufsdatum).toLocaleDateString('de-DE') : '-');

  y -= 20;

  // Radsatz-Info
  page.drawText('RADSATZ-INFORMATION', { x: 50, y, size: 14, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  y -= 25;

  drawField('Zweiter Radsatz:', vehicle.zweiter_radsatz_vorhanden ? 'Ja' : 'Nein');
  if (vehicle.zweiter_radsatz_vorhanden) {
    drawField('Art des Radsatzes:', vehicle.radsatz_art);
    drawField('Montage erforderlich:', vehicle.montage_erforderlich ? 'Ja' : 'Nein');
  }

  y -= 20;

  // Auftragsbeschreibung
  page.drawText('AUFTRAGSBESCHREIBUNG', { x: 50, y, size: 14, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  y -= 25;

  // Text umbrechen
  const auftragsText = vehicle.auftrags_beschreibung || 'Keine Beschreibung vorhanden';
  const maxWidth = width - 100;
  const lines = wrapText(auftragsText, font, 10, maxWidth);

  for (const line of lines) {
    if (y < 100) {
      // Neue Seite
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      y = height - 50;
    }
    page.drawText(line, { x: 50, y, size: 10, font });
    y -= 15;
  }

  // Unterschriftenfelder
  y = 150;
  page.drawLine({
    start: { x: 50, y },
    end: { x: 200, y },
    thickness: 1,
    color: rgb(0, 0, 0)
  });
  page.drawText('Auftraggeber', { x: 75, y: y - 15, size: 10, font });

  page.drawLine({
    start: { x: 350, y },
    end: { x: 500, y },
    thickness: 1,
    color: rgb(0, 0, 0)
  });
  page.drawText('Werkstatt', { x: 400, y: y - 15, size: 10, font });

  return await pdfDoc.save();
};

// Hilfsfunktion: Text umbrechen
const wrapText = (text, font, fontSize, maxWidth) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

module.exports = {
  upload,
  getAllTemplates,
  getActiveTemplate,
  uploadTemplate,
  activateTemplate,
  deleteTemplate,
  generateWorkshopOrder
};
