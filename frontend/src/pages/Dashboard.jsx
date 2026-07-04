import { useState, useEffect } from 'react'
import { Briefcase, TrendingUp, Gavel, ListTodo, FileText, Users, Inbox } from 'lucide-react'
import api from '../services/api'
import StatCard from '../components/StatCard'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.get('/dashboard/stats').then(res => setStats(res.data)).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="empty-state"><div className="empty-state-icon"><Inbox size={28} /></div><h4>Loading dashboard...</h4></div>
  if (!stats) return <div className="empty-state"><div className="empty-state-icon"><Inbox size={28} /></div><h4>Unable to load dashboard</h4><p>Please check your connection</p></div>

  return (
    <div>
      <div className="stats-grid">
        <StatCard label="Total Cases" value={stats.total_cases} icon={Briefcase} variant="bronze" subtitle="All registered" />
        <StatCard label="Active Cases" value={stats.active_cases} icon={TrendingUp} variant="green" subtitle="In progress" />
        <StatCard label="Upcoming Hearings" value={stats.upcoming_hearings} icon={Gavel} variant="bronze" subtitle="Scheduled" />
        <StatCard label="Pending Tasks" value={stats.pending_tasks} icon={ListTodo} variant="red" subtitle="Awaiting action" />
        <StatCard label="Total Clients" value={stats.total_clients} icon={Users} variant="blue" subtitle="Registered" />
        <StatCard label="Documents" value={stats.total_documents} icon={FileText} variant="purple" subtitle="In vault" />
      </div>
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header"><h3><Users size={16} /> Recent Clients <span className="card-count">{stats.recent_clients.length}</span></h3></div>
          <div className="card-body">
            {stats.recent_clients.length === 0
              ? <div className="empty-state"><div className="empty-state-icon"><Users size={28} /></div><h4>No clients yet</h4><p>Add your first client</p></div>
              : <ul className="recent-list">{stats.recent_clients.map(c => <li key={c.id}><span className="recent-name">{c.name}</span><span className="recent-sub">{c.phone || c.email || '—'}</span></li>)}</ul>
            }
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3><FileText size={16} /> Recent Documents <span className="card-count">{stats.recent_documents.length}</span></h3></div>
          <div className="card-body">
            {stats.recent_documents.length === 0
              ? <div className="empty-state"><div className="empty-state-icon"><FileText size={28} /></div><h4>No documents yet</h4><p>Upload your first document</p></div>
              : <ul className="recent-list">{stats.recent_documents.map(d => <li key={d.id}><span className="recent-name">{d.title}</span><span className="recent-sub">{d.file_name}</span></li>)}</ul>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
