import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, FolderOpen, Gavel, FileText, CheckSquare, Scale, Settings, Search } from 'lucide-react'

const mainNav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/cases', label: 'Cases', icon: FolderOpen },
  { path: '/hearings', label: 'Hearings', icon: Gavel },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/doc-analysis', label: 'Doc Analysis', icon: Search },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
]
const secondaryNav = [
  { path: '/court-status', label: 'Court Status', icon: Scale },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon"><Scale size={22} /></div>
        <div className="sidebar-brand-text">
          <h2>Advocate's Vault</h2>
          <p>Legal Workspace</p>
        </div>
      </div>
      <div className="sidebar-section-label">Practice</div>
      <nav className="sidebar-nav">
        {mainNav.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon"><item.icon size={18} /></span>{item.label}
          </NavLink>
        ))}
        <div className="sidebar-section-label" style={{ padding: '16px 10px 8px' }}>Legal Tools</div>
        {secondaryNav.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon"><item.icon size={18} /></span>{item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">Advocate's Vault &middot; Secure Workspace</div>
    </aside>
  )
}
