import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Scale, UserPlus, Phone, Mail, MapPin } from 'lucide-react'
import api from '../services/api'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Chandigarh', 'Puducherry', 'Jammu and Kashmir', 'Ladakh',
]

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefillMobile = location.state?.mobile_number || ''

  const [form, setForm] = useState({
    full_name: '', mobile_number: prefillMobile, email: '', state: '', district: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('user', JSON.stringify({
        user_id: res.data.user_id,
        full_name: res.data.full_name,
        mobile_number: res.data.mobile_number,
      }))
      navigate('/dashboard')
    } catch (err) { setError(err.response?.data?.detail || 'Registration failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="login-page">
      <div className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-brand-icon"><Scale size={40} color="#FFF" /></div>
          <h1>Advocate's Vault</h1>
          <div className="tagline">Secure Legal Workspace</div>
          <p className="desc">Join thousands of advocates managing their practice efficiently.</p>
        </div>
      </div>
      <div className="login-form-panel">
        <div className="login-card">
          <div className="login-card-header">
            <h2>Create Account</h2>
            <p>Register as a new advocate</p>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Full Name *</label>
              <div className="login-input-wrap"><div className="login-input-icon"><UserPlus size={18} /></div>
              <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="Your full name" required /></div>
            </div>
            <div className="form-group"><label>Mobile Number *</label>
              <div className="login-input-wrap"><div className="login-input-icon"><Phone size={18} /></div>
              <input type="tel" value={form.mobile_number} onChange={e => setForm({...form, mobile_number: e.target.value})} placeholder="10-digit mobile number" required minLength={10} /></div>
            </div>
            <div className="form-group"><label>Email (Optional)</label>
              <div className="login-input-wrap"><div className="login-input-icon"><Mail size={18} /></div>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="your@email.com" /></div>
            </div>
            <div className="form-group"><label>State</label>
              <div className="login-input-wrap"><div className="login-input-icon"><MapPin size={18} /></div>
              <select value={form.state} onChange={e => setForm({...form, state: e.target.value})} style={{ flex: 1, border: 'none', padding: '13px 14px 13px 0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', color: 'var(--text)', background: 'transparent' }}>
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
            </div>
            <div className="form-group"><label>District / City</label>
              <div className="login-input-wrap"><div className="login-input-icon"><MapPin size={18} /></div>
              <input value={form.district} onChange={e => setForm({...form, district: e.target.value})} placeholder="District or city name" /></div>
            </div>
            <button type="submit" className="btn btn-gold btn-block" disabled={loading} style={{ padding: '14px' }}>
              {loading ? 'Creating Account...' : 'Register & Sign In'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <span style={{ fontSize: '13px', color: '#999' }}>Already registered? </span>
              <a href="/login" style={{ fontSize: '13px', color: 'var(--bronze)', fontWeight: 600, textDecoration: 'none' }}>Sign in here</a>
            </div>
          </form>
          <div className="login-footer">Advocate's Vault &copy; 2024</div>
        </div>
      </div>
    </div>
  )
}
