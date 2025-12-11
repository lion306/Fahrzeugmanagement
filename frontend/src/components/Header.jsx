import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Header() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="header">
      <div className="header-logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-3-6H5a2 2 0 0 0-2 2v9c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
        FMS
      </div>

      <nav className="header-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
          Dashboard
        </NavLink>
        <NavLink to="/vehicles" className={({ isActive }) => isActive ? 'active' : ''}>
          Fahrzeuge
        </NavLink>
        {isAdmin && (
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
            Einstellungen
          </NavLink>
        )}
      </nav>

      <div className="header-user">
        <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
          {user?.username}
          {isAdmin && <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>Admin</span>}
        </span>
        <button className="btn btn-outline btn-sm" onClick={handleLogout}>
          Abmelden
        </button>
      </div>
    </header>
  )
}

export default Header
