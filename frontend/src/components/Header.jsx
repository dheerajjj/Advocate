import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Bell, LogOut } from 'lucide-react'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/clients': 'Client Management',
  '/cases': 'Case Management',
  '/hearings': 'Hearing Schedule',
  '/documents': 'Document Vault',
  '/tasks': 'Task Management',
  '/court-status': 'Court Status',
}

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const title = pageTitles[location.pathname] || "Advocate's Vault"

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login') }

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-title">{title}</div>
      </div>
      <div className="header-right">
        <div className="header-search"><Search size={16} /><input placeholder="Search records..." /></div>
        <button className="header-icon-btn"><Bell size={18} /><span className="notif-dot"></span></button>
        <div className="header-user">
          <div className="header-user-info">
            <div className="name">{user.full_name || 'Advocate'}</div>
            <div className="role">Advocate</div>
          </div>
        <div className="header-avatar">{(user.full_name || 'A')[0].toUpperCase()}</div>
        </div>
        <button className="btn-logout" onClick={handleLogout}><LogOut size={14} /> Logout</button>
      </div>
    </header>
  )
}
