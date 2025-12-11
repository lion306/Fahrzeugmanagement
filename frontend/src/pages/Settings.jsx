import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { settingsApi, pdfApi, authApi } from '../services/api'

function Settings() {
  const [activeTab, setActiveTab] = useState('thresholds')
  const [loading, setLoading] = useState(true)

  // Verzugsschwellen
  const [thresholds, setThresholds] = useState({ werkstatt: 5, fremdfirma: 5, aufbereitung: 3 })

  // Berechnungsmodus
  const [calculationMode, setCalculationMode] = useState('arbeitstage')

  // PDF-Templates
  const [templates, setTemplates] = useState([])
  const [uploadFile, setUploadFile] = useState(null)
  const [templateName, setTemplateName] = useState('')

  // Benutzer
  const [users, setUsers] = useState([])

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const [thresholdsRes, modeRes, templatesRes, usersRes] = await Promise.all([
        settingsApi.getDelayThresholds(),
        settingsApi.getCalculationMode(),
        pdfApi.getTemplates(),
        authApi.getUsers()
      ])
      setThresholds(thresholdsRes.data)
      setCalculationMode(thresholdsRes.data)
      setTemplates(templatesRes.data)
      setUsers(usersRes.data)
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveThresholds = async () => {
    try {
      await settingsApi.updateDelayThresholds(thresholds)
      toast.success('Verzugsschwellen gespeichert')
    } catch (error) {
      toast.error('Fehler beim Speichern')
    }
  }

  const handleSaveCalculationMode = async () => {
    try {
      await settingsApi.updateCalculationMode(calculationMode)
      toast.success('Berechnungsmodus gespeichert')
    } catch (error) {
      toast.error('Fehler beim Speichern')
    }
  }

  const handleUploadTemplate = async (e) => {
    e.preventDefault()
    if (!uploadFile) {
      toast.error('Bitte eine PDF-Datei auswählen')
      return
    }

    const formData = new FormData()
    formData.append('template', uploadFile)
    formData.append('name', templateName || 'Werkstattauftrag')

    try {
      await pdfApi.uploadTemplate(formData)
      toast.success('Template hochgeladen')
      setUploadFile(null)
      setTemplateName('')
      loadSettings()
    } catch (error) {
      toast.error('Fehler beim Hochladen')
    }
  }

  const handleActivateTemplate = async (id) => {
    try {
      await pdfApi.activateTemplate(id)
      toast.success('Template aktiviert')
      loadSettings()
    } catch (error) {
      toast.error('Fehler beim Aktivieren')
    }
  }

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Template wirklich löschen?')) return
    try {
      await pdfApi.deleteTemplate(id)
      toast.success('Template gelöscht')
      loadSettings()
    } catch (error) {
      toast.error('Fehler beim Löschen')
    }
  }

  const handleUpdateUserRole = async (userId, role) => {
    try {
      await authApi.updateUserRole(userId, role)
      toast.success('Benutzerrolle aktualisiert')
      loadSettings()
    } catch (error) {
      toast.error('Fehler beim Aktualisieren')
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <h1>Einstellungen</h1>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'thresholds' ? 'active' : ''}`}
          onClick={() => setActiveTab('thresholds')}
        >
          Verzugsschwellen
        </button>
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          PDF-Templates
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Benutzerverwaltung
        </button>
      </div>

      {activeTab === 'thresholds' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Verzugsschwellen</h2>
          </div>
          <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
            Legen Sie fest, nach wie vielen Tagen eine Verzugsmeldung ausgelöst wird.
          </p>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Werkstatt (Tage)</label>
              <input
                type="number"
                className="form-input"
                min="1"
                value={thresholds.werkstatt}
                onChange={(e) => setThresholds({...thresholds, werkstatt: parseInt(e.target.value)})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fremdfirma (Tage)</label>
              <input
                type="number"
                className="form-input"
                min="1"
                value={thresholds.fremdfirma}
                onChange={(e) => setThresholds({...thresholds, fremdfirma: parseInt(e.target.value)})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Aufbereitung (Tage)</label>
              <input
                type="number"
                className="form-input"
                min="1"
                value={thresholds.aufbereitung}
                onChange={(e) => setThresholds({...thresholds, aufbereitung: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Berechnungsmodus</h3>
            <div className="form-group">
              <select
                className="form-select"
                value={calculationMode}
                onChange={(e) => setCalculationMode(e.target.value)}
                style={{ maxWidth: '300px' }}
              >
                <option value="arbeitstage">Arbeitstage (Mo-Fr)</option>
                <option value="kalendertage">Kalendertage</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleSaveThresholds}>
              Einstellungen speichern
            </button>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h2 className="card-title">PDF-Template hochladen</h2>
            </div>
            <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
              Laden Sie ein PDF-Template hoch. Verwenden Sie folgende Platzhalter:
            </p>
            <div style={{
              background: 'var(--background)',
              padding: '1rem',
              borderRadius: 'var(--radius)',
              marginBottom: '1.5rem',
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }}>
              [[GW_NR]] [[FAHRGESTELLNUMMER]] [[WA_NR]] [[HERSTELLER]] [[MODELL]] [[HERKUNFT]]
              [[EINKAUFSDATUM]] [[AUFTRAGS_TEXT]] [[DATUM]] [[RADSATZ_VORHANDEN]] [[RADSATZ_ART]]
              [[MONTAGE_ERFORDERLICH]]
            </div>

            <form onSubmit={handleUploadTemplate}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Template-Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="z.B. Werkstattauftrag Standard"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PDF-Datei</label>
                  <input
                    type="file"
                    className="form-input"
                    accept=".pdf"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                Template hochladen
              </button>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Vorhandene Templates</h2>
            </div>

            {templates.length === 0 ? (
              <p style={{ color: 'var(--text-light)' }}>
                Noch keine Templates vorhanden. Es wird ein Standard-PDF generiert.
              </p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Hochgeladen am</th>
                      <th>Status</th>
                      <th>Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template) => (
                      <tr key={template.id}>
                        <td>{template.name}</td>
                        <td>{new Date(template.created_at).toLocaleDateString('de-DE')}</td>
                        <td>
                          <span className={`badge ${template.is_active ? 'badge-success' : 'badge-secondary'}`}>
                            {template.is_active ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            {!template.is_active && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleActivateTemplate(template.id)}
                              >
                                Aktivieren
                              </button>
                            )}
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              Löschen
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Benutzerverwaltung</h2>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Benutzername</th>
                  <th>E-Mail</th>
                  <th>Rolle</th>
                  <th>Registriert am</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'badge-info' : 'badge-secondary'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString('de-DE')}</td>
                    <td>
                      <div className="table-actions">
                        {user.role === 'user' ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleUpdateUserRole(user.id, 'admin')}
                          >
                            Zum Admin machen
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleUpdateUserRole(user.id, 'user')}
                          >
                            Admin-Rechte entziehen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
