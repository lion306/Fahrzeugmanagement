import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { delayApi, vehicleApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import ColumnSelector from '../components/ColumnSelector'

const ALL_COLUMNS = [
  { key: 'gw_nr', label: 'GW-Nr.' },
  { key: 'fahrgestellnummer', label: 'Fahrgestellnummer' },
  { key: 'wa_nr', label: 'WA-Nr.' },
  { key: 'hersteller', label: 'Hersteller' },
  { key: 'modell', label: 'Modell' },
  { key: 'herkunft', label: 'Herkunft' },
  { key: 'einkaufsdatum', label: 'Einkaufsdatum' },
  { key: 'lieferdatum', label: 'Lieferdatum' },
  { key: 'zeit_werkstatt_tage', label: 'Tage Werkstatt' },
  { key: 'zeit_fremdfirma_tage', label: 'Tage Fremdfirma' },
  { key: 'zeit_aufbereitung_tage', label: 'Tage Aufbereitung' },
  { key: 'status', label: 'Status' }
]

const DEFAULT_COLUMNS = ['gw_nr', 'hersteller', 'modell', 'status', 'zeit_werkstatt_tage']

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedColumns, setSelectedColumns] = useState(DEFAULT_COLUMNS)
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const { user, updateDashboardSettings } = useAuth()

  useEffect(() => {
    if (user?.dashboard_settings?.columns) {
      setSelectedColumns(user.dashboard_settings.columns)
    }
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      const [statsRes, alertsRes, vehiclesRes] = await Promise.all([
        delayApi.getStats(),
        delayApi.getActive(),
        vehicleApi.getAll()
      ])
      setStats(statsRes.data)
      setAlerts(alertsRes.data)
      setVehicles(vehiclesRes.data)
    } catch (error) {
      toast.error('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const handleResolveAlert = async (alertId) => {
    try {
      await delayApi.resolve(alertId)
      toast.success('Verzugsmeldung aufgelöst')
      loadData()
    } catch (error) {
      toast.error('Fehler beim Auflösen der Verzugsmeldung')
    }
  }

  const handleColumnChange = async (columns) => {
    setSelectedColumns(columns)
    try {
      await updateDashboardSettings({ ...user.dashboard_settings, columns })
    } catch (error) {
      console.error('Fehler beim Speichern der Spalten-Einstellungen')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('de-DE')
  }

  const formatValue = (vehicle, key) => {
    const value = vehicle[key]
    if (key.includes('datum')) return formatDate(value)
    if (key.includes('tage')) return value != null ? `${value} Tage` : '-'
    return value || '-'
  }

  const getPhaseLabel = (phase) => {
    const labels = {
      werkstatt: 'Werkstatt',
      fremdfirma: 'Fremdfirma',
      aufbereitung: 'Aufbereitung'
    }
    return labels[phase] || phase
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="section-header">
        <h1>Dashboard</h1>
        <Link to="/vehicles/new" className="btn btn-primary">
          + Neues Fahrzeug
        </Link>
      </div>

      {/* Statistiken */}
      <div className="stats-grid">
        <div className="stat-card info">
          <div className="stat-value">{stats?.totalVehicles || 0}</div>
          <div className="stat-label">Aktive Fahrzeuge</div>
        </div>
        <div className={`stat-card ${stats?.activeAlerts > 0 ? 'danger' : 'success'}`}>
          <div className="stat-value">{stats?.activeAlerts || 0}</div>
          <div className="stat-label">Verzugsmeldungen</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{stats?.inWorkshop || 0}</div>
          <div className="stat-label">In Werkstatt</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.atThirdParty || 0}</div>
          <div className="stat-label">Bei Fremdfirma</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.inPreparation || 0}</div>
          <div className="stat-label">In Aufbereitung</div>
        </div>
      </div>

      {/* Verzugsmeldungen */}
      {alerts.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Verzugsmeldungen</h2>
          </div>
          <div className="delay-alerts">
            {alerts.map((alert) => (
              <div key={alert.id} className="delay-alert-item">
                <div className="delay-alert-content">
                  <span className="delay-alert-vehicle">
                    {alert.gw_nr} - {alert.hersteller} {alert.modell}
                  </span>
                  <span className="delay-alert-details">
                    {getPhaseLabel(alert.phase)}-Verzug seit {alert.delay_days} Tagen
                    (Schwelle: {alert.threshold_days} Tage)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/vehicles/${alert.vehicle_id}`} className="btn btn-outline btn-sm">
                    Details
                  </Link>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleResolveAlert(alert.id)}
                  >
                    Auflösen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fahrzeugübersicht */}
      <div className="dashboard-section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Fahrzeugübersicht</h2>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowColumnSelector(!showColumnSelector)}
            >
              Spalten anpassen
            </button>
          </div>

          {showColumnSelector && (
            <ColumnSelector
              allColumns={ALL_COLUMNS}
              selectedColumns={selectedColumns}
              onChange={handleColumnChange}
            />
          )}

          {vehicles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚗</div>
              <p>Noch keine Fahrzeuge vorhanden</p>
              <Link to="/vehicles/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Erstes Fahrzeug anlegen
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    {selectedColumns.map((key) => {
                      const col = ALL_COLUMNS.find(c => c.key === key)
                      return <th key={key}>{col?.label || key}</th>
                    })}
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.slice(0, 10).map((vehicle) => (
                    <tr key={vehicle.id}>
                      {selectedColumns.map((key) => (
                        <td key={key}>
                          {key === 'status' ? (
                            <span className={`badge badge-${vehicle.status === 'aktiv' ? 'success' : 'secondary'}`}>
                              {vehicle.status}
                            </span>
                          ) : (
                            formatValue(vehicle, key)
                          )}
                        </td>
                      ))}
                      <td>
                        <div className="table-actions">
                          <Link to={`/vehicles/${vehicle.id}`} className="btn btn-outline btn-sm">
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {vehicles.length > 10 && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/vehicles" className="btn btn-outline">
                Alle {vehicles.length} Fahrzeuge anzeigen
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
