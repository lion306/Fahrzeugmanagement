import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { vehicleApi } from '../services/api'

function VehicleList() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredVehicles, setFilteredVehicles] = useState([])

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      setFilteredVehicles(vehicles.filter(v =>
        v.gw_nr?.toLowerCase().includes(query) ||
        v.fahrgestellnummer?.toLowerCase().includes(query) ||
        v.hersteller?.toLowerCase().includes(query) ||
        v.modell?.toLowerCase().includes(query) ||
        v.wa_nr?.toLowerCase().includes(query)
      ))
    } else {
      setFilteredVehicles(vehicles)
    }
  }, [searchQuery, vehicles])

  const loadVehicles = async () => {
    try {
      const response = await vehicleApi.getAll()
      setVehicles(response.data)
      setFilteredVehicles(response.data)
    } catch (error) {
      toast.error('Fehler beim Laden der Fahrzeuge')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, gwNr) => {
    if (!window.confirm(`Fahrzeug ${gwNr} wirklich löschen?`)) return

    try {
      await vehicleApi.delete(id)
      toast.success('Fahrzeug gelöscht')
      loadVehicles()
    } catch (error) {
      toast.error('Fehler beim Löschen')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('de-DE')
  }

  const getStatusInfo = (vehicle) => {
    if (vehicle.datum_uebergabe_werkstatt && !vehicle.datum_zurueck_werkstatt) {
      return { label: 'In Werkstatt', className: 'badge-warning' }
    }
    if (vehicle.datum_uebergabe_fremdfirma && !vehicle.datum_zurueck_fremdfirma) {
      return { label: 'Bei Fremdfirma', className: 'badge-info' }
    }
    if (vehicle.datum_uebergabe_aufbereitung && !vehicle.datum_zurueck_aufbereitung) {
      return { label: 'In Aufbereitung', className: 'badge-info' }
    }
    if (vehicle.status === 'aktiv') {
      return { label: 'Aktiv', className: 'badge-success' }
    }
    return { label: vehicle.status, className: 'badge-secondary' }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="section-header">
        <h1>Fahrzeuge ({filteredVehicles.length})</h1>
        <Link to="/vehicles/new" className="btn btn-primary">
          + Neues Fahrzeug
        </Link>
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Suche nach GW-Nr., Fahrgestellnummer, Hersteller, Modell..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="card">
        {filteredVehicles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <p>{searchQuery ? 'Keine Fahrzeuge gefunden' : 'Noch keine Fahrzeuge vorhanden'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>GW-Nr.</th>
                  <th>Hersteller</th>
                  <th>Modell</th>
                  <th>Fahrgestellnummer</th>
                  <th>Einkaufsdatum</th>
                  <th>Status</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => {
                  const statusInfo = getStatusInfo(vehicle)
                  return (
                    <tr key={vehicle.id}>
                      <td>
                        <Link to={`/vehicles/${vehicle.id}`} style={{ fontWeight: 600 }}>
                          {vehicle.gw_nr}
                        </Link>
                      </td>
                      <td>{vehicle.hersteller}</td>
                      <td>{vehicle.modell}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        {vehicle.fahrgestellnummer}
                      </td>
                      <td>{formatDate(vehicle.einkaufsdatum)}</td>
                      <td>
                        <span className={`badge ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/vehicles/${vehicle.id}`} className="btn btn-outline btn-sm">
                            Details
                          </Link>
                          <Link to={`/vehicles/${vehicle.id}/edit`} className="btn btn-secondary btn-sm">
                            Bearbeiten
                          </Link>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(vehicle.id, vehicle.gw_nr)}
                          >
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default VehicleList
