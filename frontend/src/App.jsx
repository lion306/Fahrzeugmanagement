import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import VehicleList from './pages/VehicleList'
import VehicleDetail from './pages/VehicleDetail'
import VehicleForm from './pages/VehicleForm'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  const { user } = useAuth()

  return (
    <div className="app-container">
      {user && <Header />}
      <main className="main-content">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/vehicles" element={
            <ProtectedRoute>
              <VehicleList />
            </ProtectedRoute>
          } />

          <Route path="/vehicles/new" element={
            <ProtectedRoute>
              <VehicleForm />
            </ProtectedRoute>
          } />

          <Route path="/vehicles/:id" element={
            <ProtectedRoute>
              <VehicleDetail />
            </ProtectedRoute>
          } />

          <Route path="/vehicles/:id/edit" element={
            <ProtectedRoute>
              <VehicleForm />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <AdminRoute>
              <Settings />
            </AdminRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
