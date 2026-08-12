import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import SiteChrome from '../../components/SiteChrome.jsx'
import { register } from '../../services/authService.js'
import { ApiError } from '../../services/api.js'
import './Auth.css'

const initialForm = {
  username: '',
  fullname: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: '',
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.passwordConfirm) {
      setError('Konfirmasi password tidak sama.')
      return
    }

    setSubmitting(true)
    try {
      await register(form)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mendaftar, coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SiteChrome breadcrumb={['NAMA Marine', 'Register']}>
      <div className="nama-auth-page">
        <div className="nama-auth-card">
          <h1 className="nama-auth-title">Register</h1>
          <p className="nama-auth-subtitle">Buat akun untuk mulai booking paket bersama NAMA Marine.</p>

          <form className="nama-auth-form" onSubmit={handleSubmit}>
            {error && <p className="nama-auth-error">{error}</p>}
            {success && <p className="nama-auth-success">Registrasi berhasil! Mengarahkan ke halaman login...</p>}

            <div className="nama-auth-field">
              <label htmlFor="fullname">Nama Lengkap</label>
              <input id="fullname" name="fullname" required value={form.fullname} onChange={handleChange} autoComplete="name" />
            </div>

            <div className="nama-auth-field">
              <label htmlFor="username">Username</label>
              <input id="username" name="username" required value={form.username} onChange={handleChange} autoComplete="username" />
            </div>

            <div className="nama-auth-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} autoComplete="email" />
            </div>

            <div className="nama-auth-field">
              <label htmlFor="phone">No. HP</label>
              <input id="phone" name="phone" required value={form.phone} onChange={handleChange} placeholder="08xxxxxxxxxx" autoComplete="tel" />
            </div>

            <div className="nama-auth-field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required minLength={8} value={form.password} onChange={handleChange} autoComplete="new-password" />
            </div>

            <div className="nama-auth-field">
              <label htmlFor="passwordConfirm">Konfirmasi Password</label>
              <input id="passwordConfirm" name="passwordConfirm" type="password" required minLength={8} value={form.passwordConfirm} onChange={handleChange} autoComplete="new-password" />
            </div>

            <button className="nama-auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Memproses...' : 'Register'}
            </button>
          </form>

          <p className="nama-auth-switch">
            Sudah punya akun? <Link to="/login">Login di sini</Link>
          </p>
        </div>
      </div>
    </SiteChrome>
  )
}
