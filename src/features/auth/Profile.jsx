import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import SiteChrome from '../../components/SiteChrome.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import './Auth.css'

export default function Profile() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/profile' }, replace: true })
    }
  }, [isLoading, isAuthenticated, navigate])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (isLoading || !user) {
    return (
      <SiteChrome breadcrumb={['NAMA Marine', 'Profile']}>
        <div className="nama-auth-page">
          <p className="nama-auth-subtitle" style={{ textAlign: 'center' }}>Memuat data akun...</p>
        </div>
      </SiteChrome>
    )
  }

  return (
    <SiteChrome breadcrumb={['NAMA Marine', 'Profile']}>
      <div className="nama-auth-page">
        <h1 className="nama-auth-title" style={{ textAlign: 'center' }}>Profil Saya</h1>

        <div className="nama-profile-grid">
          <div className="nama-profile-row">
            <span>Nama Lengkap</span>
            <span>{user.fullname || '-'}</span>
          </div>
          <div className="nama-profile-row">
            <span>Username</span>
            <span>{user.username}</span>
          </div>
          <div className="nama-profile-row">
            <span>Email</span>
            <span>{user.email}</span>
          </div>
          <div className="nama-profile-row">
            <span>No. HP</span>
            <span>{user.phone || '-'}</span>
          </div>
          <div className="nama-profile-row">
            <span>Role</span>
            <span>{user.role}</span>
          </div>
        </div>

        <button className="nama-profile-logout" type="button" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </SiteChrome>
  )
}
