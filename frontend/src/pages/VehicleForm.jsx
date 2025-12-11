import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { vehicleApi } from '../services/api'

function VehicleForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    gw_nr: '',
    fahrgestellnummer: '',
    wa_nr: '',
    hersteller: '',
    modell: '',
    herkunft: '',
    einkaufsdatum: '',
    zweiter_radsatz_vorhanden: false,
    radsatz_art: '',
    montage_erforderlich: false,
    auftrags_beschreibung: '',
    status: 'aktiv'
  })

  useEffect(() => {
    if (isEditing) {
      loadVehicle()
    }
  }, [id])

  const loadVehicle = async () => {
    try {
      const response = await vehicleApi.getById(id)
      const vehicle = response.data
      setForm({
        gw_nr: vehicle.gw_nr || '',
        fahrgestellnummer: vehicle.fahrgestellnummer || '',
        wa_nr: vehicle.wa_nr || '',
        hersteller: vehicle.hersteller || '',
        modell: vehicle.modell || '',
        herkunft: vehicle.herkunft || '',
        einkaufsdatum: vehicle.einkaufsdatum ? vehicle.einkaufsdatum.split('T')[0] : '',
        zweiter_radsatz_vorhanden: vehicle.zweiter_radsatz_vorhanden || false,
        radsatz_art: vehicle.radsatz_art || '',
        montage_erforderlich: vehicle.montage_erforderlich || false,
        auftrags_beschreibung: vehicle.auftrags_beschreibung || '',
        status: vehicle.status || 'aktiv'
      })
    } catch (error) {
      toast.error('Fehler beim Laden des Fahrzeugs')
      navigate('/vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validierung
    if (!form.gw_nr || !form.fahrgestellnummer || !form.hersteller || !form.modell) {
      toast.error('Bitte alle Pflichtfelder ausfüllen')
      return
    }

    setSubmitting(true)
    try {
      if (isEditing) {
        await vehicleApi.update(id, form)
        toast.success('Fahrzeug aktualisiert')
      } else {
        const response = await vehicleApi.create(form)
        toast.success('Fahrzeug erstellt')
        navigate(`/vehicles/${response.data.id}`)
        return
      }
      navigate(`/vehicles/${id}`)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Fehler beim Speichern')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <Link to={isEditing ? `/vehicles/${id}` : '/vehicles'} style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            ← Zurück
          </Link>
          <h1 style={{ marginTop: '0.5rem' }}>
            {isEditing ? 'Fahrzeug bearbeiten' : 'Neues Fahrzeug anlegen'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Stammdaten</h2>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="gw_nr">GW-Nr. *</label>
              <input
                type="text"
                id="gw_nr"
                name="gw_nr"
                className="form-input"
                value={form.gw_nr}
                onChange={handleChange}
                placeholder="z.B. GW-2024-001"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fahrgestellnummer">Fahrgestellnummer (VIN) *</label>
              <input
                type="text"
                id="fahrgestellnummer"
                name="fahrgestellnummer"
                className="form-input"
                value={form.fahrgestellnummer}
                onChange={handleChange}
                placeholder="z.B. WVWZZZ3CZWE123456"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="wa_nr">WA-Nr.</label>
              <input
                type="text"
                id="wa_nr"
                name="wa_nr"
                className="form-input"
                value={form.wa_nr}
                onChange={handleChange}
                placeholder="Werkstatt-Auftrags-Nummer"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="hersteller">Hersteller *</label>
              <input
                type="text"
                id="hersteller"
                name="hersteller"
                className="form-input"
                value={form.hersteller}
                onChange={handleChange}
                placeholder="z.B. Volkswagen"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="modell">Modell *</label>
              <input
                type="text"
                id="modell"
                name="modell"
                className="form-input"
                value={form.modell}
                onChange={handleChange}
                placeholder="z.B. Golf 8"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="herkunft">Herkunft</label>
              <input
                type="text"
                id="herkunft"
                name="herkunft"
                className="form-input"
                value={form.herkunft}
                onChange={handleChange}
                placeholder="z.B. Deutschland"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="einkaufsdatum">Einkaufsdatum</label>
              <input
                type="date"
                id="einkaufsdatum"
                name="einkaufsdatum"
                className="form-input"
                value={form.einkaufsdatum}
                onChange={handleChange}
              />
            </div>

            {isEditing && (
              <div className="form-group">
                <label className="form-label" htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  className="form-select"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="aktiv">Aktiv</option>
                  <option value="verkauft">Verkauft</option>
                  <option value="archiviert">Archiviert</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h2 className="card-title">Radsatz-Information</h2>
          </div>

          <div className="form-group">
            <label className="form-checkbox">
              <input
                type="checkbox"
                name="zweiter_radsatz_vorhanden"
                checked={form.zweiter_radsatz_vorhanden}
                onChange={handleChange}
              />
              Zweiter Radsatz vorhanden
            </label>
          </div>

          {form.zweiter_radsatz_vorhanden && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="radsatz_art">Art des Radsatzes</label>
                <select
                  id="radsatz_art"
                  name="radsatz_art"
                  className="form-select"
                  value={form.radsatz_art}
                  onChange={handleChange}
                >
                  <option value="">Bitte wählen...</option>
                  <option value="Sommerräder">Sommerräder</option>
                  <option value="Winterräder">Winterräder</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.75rem' }}>
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    name="montage_erforderlich"
                    checked={form.montage_erforderlich}
                    onChange={handleChange}
                  />
                  Montage erforderlich
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h2 className="card-title">Auftragsbeschreibung (Werkstatt)</h2>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auftrags_beschreibung">
              Beschreibung der durchzuführenden Arbeiten
            </label>
            <textarea
              id="auftrags_beschreibung"
              name="auftrags_beschreibung"
              className="form-textarea"
              value={form.auftrags_beschreibung}
              onChange={handleChange}
              placeholder="z.B. Stoßstange vorne rechts lackieren, Ölwechsel durchführen, Reifen wechseln..."
              rows={6}
            />
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '1.5rem' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? 'Wird gespeichert...' : (isEditing ? 'Speichern' : 'Fahrzeug anlegen')}
          </button>
          <Link
            to={isEditing ? `/vehicles/${id}` : '/vehicles'}
            className="btn btn-outline btn-lg"
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}

export default VehicleForm
