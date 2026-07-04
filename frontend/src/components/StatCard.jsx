export default function StatCard({ label, value, icon: Icon, variant = 'bronze', subtitle }) {
  return (
    <div className="stat-card">
      <div className="stat-card-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {subtitle && <div className="stat-sub">{subtitle}</div>}
      </div>
      {Icon && <div className={`stat-card-icon ${variant}`}><Icon size={22} /></div>}
    </div>
  )
}
