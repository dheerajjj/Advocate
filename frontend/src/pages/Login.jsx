import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scale, Phone, KeyRound, Info, Shield, Users, FileText, Gavel } from 'lucide-react'
import api from '../services/api'

export default function Login() {
  const [step, setStep] = useState('mobile') // 'mobile' | 'otp'
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [otpHint, setOtpHint] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRequestOtp = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.post('/auth/request-otp', { mobile_number: mobile })
      if (!res.data.user_exists) {
        // New user — redirect to register with mobile pre-filled
        navigate('/register', { state: { mobile_number: mobile } })
        return
      }
      setOtpHint(res.data.otp) // For local testing
      setStep('otp')
    } catch (err) { setError(err.response?.data?.detail || 'Failed to send OTP') }
    finally { setLoading(false) }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.post('/auth/verify-otp', { mobile_number: mobile, otp_code: otp })
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('user', JSON.stringify({
        user_id: res.data.user_id,
        full_name: res.data.full_name,
        mobile_number: res.data.mobile_number,
      }))
      navigate('/dashboard')
    } catch (err) {
      if (err.response?.status === 404) {
        navigate('/register', { state: { mobile_number: mobile } })
      } else {
        setError(err.response?.data?.detail || 'Invalid OTP')
      }
    }
    finally { setLoading(false) }
  }

  return (
    <div className="login-page">
      <div className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-brand-icon"><Scale size={40} color="#FFF" /></div>
          <h1>Advocate's Vault</h1>
          <div className="tagline">Secure Legal Workspace</div>
          <p className="desc">
            A secure workspace crafted for distinguished advocates and premier law firms across India.
          </p>
          <div className="login-features">
            <div className="login-feature"><Shield size={18} /> End-to-end case lifecycle management</div>
            <div className="login-feature"><Gavel size={18} /> Hearing calendar &amp; court tracking</div>
            <div className="login-feature"><FileText size={18} /> Secure document vault</div>
            <div className="login-feature"><Users size={18} /> Client relationship management</div>
          </div>
        </div>
      </div>
      <div className="login-form-panel">
        <div className="login-card">
          <div className="login-card-header">
            <h2>{step === 'mobile' ? 'Welcome' : 'Verify OTP'}</h2>
            <p>{step === 'mobile' ? 'Enter your mobile number to sign in' : `OTP sent to ${mobile}`}</p>
          </div>
          {error && <div className="error-msg">{error}</div>}

          {step === 'mobile' ? (
            <form onSubmit={handleRequestOtp}>
              <div className="form-group"><label>Mobile Number</label>
                <div className="login-input-wrap"><div className="login-input-icon"><Phone size={18} /></div>
                <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Enter 10-digit mobile number" required minLength={10} maxLength={15} /></div>
              </div>
              <button type="submit" className="btn btn-gold btn-block" disabled={loading} style={{ padding: '14px' }}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <span style={{ fontSize: '13px', color: '#999' }}>New advocate? </span>
                <a href="/register" style={{ fontSize: '13px', color: 'var(--bronze)', fontWeight: 600, textDecoration: 'none' }}>Register here</a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              {otpHint && (
                <div className="login-demo-hint">
                  <Info size={16} /><span>Dev OTP: <strong>{otpHint}</strong></span>
                </div>
              )}
              <div className="form-group"><label>Enter OTP</label>
                <div className="login-input-wrap"><div className="login-input-icon"><KeyRound size={18} /></div>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" required minLength={6} maxLength={6} style={{ letterSpacing: '4px', fontWeight: 700 }} /></div>
              </div>
              <button type="submit" className="btn btn-gold btn-block" disabled={loading} style={{ padding: '14px' }}>
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <button type="button" onClick={() => { setStep('mobile'); setOtp(''); setOtpHint(''); setError('') }}
                  style={{ background: 'none', border: 'none', color: 'var(--bronze)', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
                  ← Change mobile number
                </button>
              </div>
            </form>
          )}
          <div className="login-footer">Advocate's Vault &copy; 2024. Secure Legal Workspace for Advocates.</div>
        </div>
      </div>
    </div>
  )
}
