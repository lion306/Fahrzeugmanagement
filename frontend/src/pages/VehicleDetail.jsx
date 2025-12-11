import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { vehicleApi, phaseApi, pdfApi, delayApi } from '../services/api'

function VehicleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState(null)
  const [phases, setPhases] = useState({})
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [editingPhases, setEditingPhases] = useState(false)
  const [phaseForm, setPhaseForm] = useState({})

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [vehicleRes, phasesRes, alertsRes] = await Promise.all([
        vehicleApi.getById(id),
        phaseApi.get(id),
        delayApi.getByVehicle(id)
      ])
      setVehicle(vehicleRes.data)
      setPhases(phasesRes.data)
      setPhaseForm(phasesRes.data)
      setAlerts(alertsRes.data.filter(a => a.status === 'aktiv'))
    } catch (error) {
      toast.error('Fehler beim Laden der Fahrzeugdaten')
      navigate('/vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handlePhaseUpdate = async (e) => {
    e.preventDefault()
    try {
      await phaseApi.update(id, phaseForm)
      toast.success('Phasen aktualisiert')
      setEditingPhases(false)
      loadData()
    } catch (error) {
      toast.error('Fehler beim Aktualisieren der Phasen')
    }
  }

  const handleGeneratePdf = async () => {
    setPdfLoading(true)
    try {
      const response = await pdfApi.generate(id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Werkstattauftrag-${vehicle.gw_nr}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF erfolgreich generiert')
    } catch (error) {
      toast.error('Fehler bei der PDF-Generierung')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Fahrzeug ${vehicle.gw_nr} wirklich löschen?`)) return
    try {
      await vehicleApi.delete(id)
      toast.success('Fahrzeug gelöscht')
      navigate('/vehicles')
    } catch (error) {
      toast.error('Fehler beim Löschen')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('de-DE')
  }

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toISOString().split('T')[0]
  }

  const getPhaseStatus = (startDate, endDate) => {
    if (endDate) return 'completed'
    if (startDate) return 'active'
    return 'pending'
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  if (!vehicle) {
    return null
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <Link to="/vehicles" style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            ← Zurück zur Übersicht
          </Link>
          <h1 style={{ marginTop: '0.5rem' }}>{vehicle.gw_nr} - {vehicle.hersteller} {vehicle.modell}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-primary"
            onClick={handleGeneratePdf}
            disabled={pdfLoading}
          >
            {pdfLoading ? 'Wird generiert...' : 'PDF Auftrag generieren'}
          </button>
          <Link to={`/vehicles/${id}/edit`} className="btn btn-secondary">
            Bearbeiten
          </Link>
          <button className="btn btn-danger" onClick={handleDelete}>
            Löschen
          </button>
        </div>
      </div>

      {/* Verzugsmeldungen */}
      {alerts.length > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <strong>Verzugsmeldungen:</strong>
          <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
            {alerts.map(alert => (
              <li key={alert.id}>
                {alert.phase.charAt(0).toUpperCase() + alert.phase.slice(1)}: Verzug seit {alert.delay_days} Tagen
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Stammdaten */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Stammdaten</h2>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-light)' }}>GW-Nr.</span>
              <span style={{ fontWeight: 600 }}>{vehicle.gw_nr}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-light)' }}>Fahrgestellnummer</span>
              <span style={{ fontFamily: 'monospace' }}>{vehicle.fahrgestellnummer}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-light)' }}>WA-Nr.</span>
              <span>{vehicle.wa_nr || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-light)' }}>Hersteller</span>
              <span>{vehicle.hersteller}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-light)' }}>Modell</span>
              <span>{vehicle.modell}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-light)' }}>Herkunft</span>
              <span>{vehicle.herkunft || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-light)' }}>Einkaufsdatum</span>
              <span>{formatDate(vehicle.einkaufsdatum)}</span>
            </div>
          </div>
        </div>

        {/* Radsatz-Info */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Radsatz-Information</h2>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-light)' }}>Zweiter Radsatz vorhanden</span>
              <span className={`badge ${vehicle.zweiter_radsatz_vorhanden ? 'badge-success' : 'badge-secondary'}`}>
                {vehicle.zweiter_radsatz_vorhanden ? 'Ja' : 'Nein'}
              </span>
            </div>
            {vehicle.zweiter_radsatz_vorhanden && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-light)' }}>Art des Radsatzes</span>
                  <span>{vehicle.radsatz_art || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-light)' }}>Montage erforderlich</span>
                  <span className={`badge ${vehicle.montage_erforderlich ? 'badge-warning' : 'badge-success'}`}>
                    {vehicle.montage_erforderlich ? 'Ja' : 'Nein'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Phasen-Tracking */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">Phasen-Tracking</h2>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setEditingPhases(!editingPhases)}
          >
            {editingPhases ? 'Abbrechen' : 'Bearbeiten'}
          </button>
        </div>

        {editingPhases ? (
          <form onSubmit={handlePhaseUpdate}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Lieferdatum</label>
                <input
                  type="date"
                  className="form-input"
                  value={formatDateForInput(phaseForm.lieferdatum)}
                  onChange={(e) => setPhaseForm({...phaseForm, lieferdatum: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Termin TÜV Gutachten</label>
                <input
                  type="date"
                  className="form-input"
                  value={formatDateForInput(phaseForm.termin_tuev_gutachten)}
                  onChange={(e) => setPhaseForm({...phaseForm, termin_tuev_gutachten: e.target.value})}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', marginTop: '1rem', marginBottom: '0.75rem' }}>Werkstatt</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Übergabe Werkstatt</label>
                <input
                  type="date"
                  className="form-input"
                  value={formatDateForInput(phaseForm.datum_uebergabe_werkstatt)}
                  onChange={(e) => setPhaseForm({...phaseForm, datum_uebergabe_werkstatt: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Zurück Werkstatt</label>
                <input
                  type="date"
                  className="form-input"
                  value={formatDateForInput(phaseForm.datum_zurueck_werkstatt)}
                  onChange={(e) => setPhaseForm({...phaseForm, datum_zurueck_werkstatt: e.target.value})}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', marginTop: '1rem', marginBottom: '0.75rem' }}>Fremdfirma</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Übergabe Fremdfirma</label>
                <input
                  type="date"
                  className="form-input"
                  value={formatDateForInput(phaseForm.datum_uebergabe_fremdfirma)}
                  onChange={(e) => setPhaseForm({...phaseForm, datum_uebergabe_fremdfirma: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Zurück Fremdfirma</label>
                <input
                  type="date"
                  className="form-input"
                  value={formatDateForInput(phaseForm.datum_zurueck_fremdfirma)}
                  onChange={(e) => setPhaseForm({...phaseForm, datum_zurueck_fremdfirma: e.target.value})}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', marginTop: '1rem', marginBottom: '0.75rem' }}>Aufbereitung</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Übergabe Aufbereitung</label>
                <input
                  type="date"
                  className="form-input"
                  value={formatDateForInput(phaseForm.datum_uebergabe_aufbereitung)}
                  onChange={(e) => setPhaseForm({...phaseForm, datum_uebergabe_aufbereitung: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Zurück Aufbereitung</label>
                <input
                  type="date"
                  className="form-input"
                  value={formatDateForInput(phaseForm.datum_zurueck_aufbereitung)}
                  onChange={(e) => setPhaseForm({...phaseForm, datum_zurueck_aufbereitung: e.target.value})}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Speichern</button>
              <button type="button" className="btn btn-outline" onClick={() => setEditingPhases(false)}>Abbrechen</button>
            </div>
          </form>
        ) : (
          <div className="phase-timeline">
            <div className="phase-item">
              <div className={`phase-indicator ${phases.lieferdatum ? 'completed' : ''}`}></div>
              <div className="phase-content">
                <div className="phase-name">Logistik - Lieferung</div>
                <div className="phase-dates">
                  Lieferdatum: {formatDate(phases.lieferdatum)}
                </div>
              </div>
            </div>

            <div className="phase-item">
              <div className={`phase-indicator ${phases.termin_tuev_gutachten ? 'completed' : ''}`}></div>
              <div className="phase-content">
                <div className="phase-name">Begutachtung - TÜV</div>
                <div className="phase-dates">
                  Termin: {formatDate(phases.termin_tuev_gutachten)}
                </div>
              </div>
            </div>

            <div className="phase-item">
              <div className={`phase-indicator ${getPhaseStatus(phases.datum_uebergabe_werkstatt, phases.datum_zurueck_werkstatt)}`}></div>
              <div className="phase-content">
                <div className="phase-name">
                  Werkstatt
                  {phases.zeit_werkstatt_tage != null && (
                    <span className="phase-duration">{phases.zeit_werkstatt_tage} Tage</span>
                  )}
                </div>
                <div className="phase-dates">
                  Übergabe: {formatDate(phases.datum_uebergabe_werkstatt)} |
                  Zurück: {formatDate(phases.datum_zurueck_werkstatt)}
                </div>
              </div>
            </div>

            <div className="phase-item">
              <div className={`phase-indicator ${getPhaseStatus(phases.datum_uebergabe_fremdfirma, phases.datum_zurueck_fremdfirma)}`}></div>
              <div className="phase-content">
                <div className="phase-name">
                  Fremdfirma
                  {phases.zeit_fremdfirma_tage != null && (
                    <span className="phase-duration">{phases.zeit_fremdfirma_tage} Tage</span>
                  )}
                </div>
                <div className="phase-dates">
                  Übergabe: {formatDate(phases.datum_uebergabe_fremdfirma)} |
                  Zurück: {formatDate(phases.datum_zurueck_fremdfirma)}
                </div>
              </div>
            </div>

            <div className="phase-item">
              <div className={`phase-indicator ${getPhaseStatus(phases.datum_uebergabe_aufbereitung, phases.datum_zurueck_aufbereitung)}`}></div>
              <div className="phase-content">
                <div className="phase-name">
                  Aufbereitung
                  {phases.zeit_aufbereitung_tage != null && (
                    <span className="phase-duration">{phases.zeit_aufbereitung_tage} Tage</span>
                  )}
                </div>
                <div className="phase-dates">
                  Übergabe: {formatDate(phases.datum_uebergabe_aufbereitung)} |
                  Zurück: {formatDate(phases.datum_zurueck_aufbereitung)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auftragsbeschreibung */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">Auftragsbeschreibung (Werkstatt)</h2>
        </div>
        {vehicle.auftrags_beschreibung ? (
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
            {vehicle.auftrags_beschreibung}
          </div>
        ) : (
          <p style={{ color: 'var(--text-light)' }}>
            Keine Auftragsbeschreibung vorhanden.
            <Link to={`/vehicles/${id}/edit`} style={{ marginLeft: '0.5rem' }}>
              Jetzt hinzufügen
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

export default VehicleDetail
