import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, FolderOpen } from 'lucide-react'
import api from '../services/api'
import DataTable from '../components/DataTable'

const emptyForm = { case_number: '', cnr_number: '', client_id: '', court_name: '', case_type: '', filing_date: '', next_hearing_date: '', status: 'Active', description: '' }
const statuses = ['Active', 'Pending', 'Closed', 'Disposed']
const caseTypes = ['Civil', 'Criminal', 'Family', 'Labour', 'Consumer', 'Writ', 'Appeal', 'Other']

export default function Cases() {
  const [cases, setCases] = useState([]); const [clients, setClients] = useState([])
  const [search, setSearch] = useState(''); const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false); const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm); const [loading, setLoading] = useState(true)

  const fetchCases = () => { setLoading(true); const p = {}; if (search) p.search = search; if (statusFilter) p.status = statusFilter; api.get('/cases', { params: p }).then(res => setCases(res.data)).catch(() => {}).finally(() => setLoading(false)) }
  const fetchClients = () => { api.get('/clients').then(res => setClients(res.data)).catch(() => {}) }
  useEffect(() => { fetchCases(); fetchClients() }, [search, statusFilter])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (c) => { setEditing(c.id); setForm({ case_number: c.case_number, cnr_number: c.cnr_number||'', client_id: c.client_id, court_name: c.court_name||'', case_type: c.case_type||'', filing_date: c.filing_date||'', next_hearing_date: c.next_hearing_date||'', status: c.status||'Active', description: c.description||'' }); setShowModal(true) }
  const handleSave = async (e) => { e.preventDefault(); const payload = {...form, client_id: parseInt(form.client_id)}; try { if (editing) await api.put(`/cases/${editing}`, payload); else await api.post('/cases', payload); setShowModal(false); fetchCases() } catch (err) { alert(err.response?.data?.detail || 'Error') } }
  const handleDelete = async (id) => { if (!confirm('Delete this case?')) return; try { await api.delete(`/cases/${id}`); fetchCases() } catch { alert('Error') } }

  const Badge = ({ status }) => <span className={`badge badge-${(status||'').toLowerCase()}`}><span className="badge-dot"></span> {status}</span>

  return (
    <div>
      <div className="card">
        <div className="card-header"><h3><FolderOpen size={16} /> Cases <span className="card-count">{cases.length}</span></h3><button className="btn btn-gold" onClick={openAdd}><Plus size={16} /> Add Case</button></div>
        <div className="card-body">
          <div className="search-filter-bar"><div className="search-input-wrap"><Search size={16} /><input placeholder="Search cases..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">All Status</option>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          {loading ? <div className="empty-state"><h4>Loading...</h4></div> :
            <DataTable columns={['Case #', 'CNR', 'Client', 'Court', 'Type', 'Next Hearing', 'Status', 'Actions']} data={cases} emptyMessage="No cases found" emptyIcon={FolderOpen}
              renderRow={(c) => (<tr key={c.id}><td className="td-primary">{c.case_number}</td><td className="td-secondary">{c.cnr_number||'—'}</td><td>{c.client?.name||'—'}</td><td className="td-secondary">{c.court_name||'—'}</td><td>{c.case_type||'—'}</td><td>{c.next_hearing_date||'—'}</td><td><Badge status={c.status} /></td>
                <td><div className="action-btns"><button className="action-btn edit" onClick={() => openEdit(c)}><Pencil size={15} /></button><button className="action-btn delete" onClick={() => handleDelete(c.id)}><Trash2 size={15} /></button></div></td></tr>)} />}
        </div>
      </div>
      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{editing ? 'Edit Case' : 'New Case'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSave}><div className="modal-body">
          <div className="form-row"><div className="form-group"><label>Case Number *</label><input value={form.case_number} onChange={e => setForm({...form, case_number: e.target.value})} required /></div><div className="form-group"><label>CNR Number</label><input value={form.cnr_number} onChange={e => setForm({...form, cnr_number: e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Client *</label><select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} required><option value="">Select</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="form-group"><label>Case Type</label><select value={form.case_type} onChange={e => setForm({...form, case_type: e.target.value})}><option value="">Select</option>{caseTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div></div>
          <div className="form-group"><label>Court Name</label><input value={form.court_name} onChange={e => setForm({...form, court_name: e.target.value})} /></div>
          <div className="form-row"><div className="form-group"><label>Filing Date</label><input type="date" value={form.filing_date} onChange={e => setForm({...form, filing_date: e.target.value})} /></div><div className="form-group"><label>Next Hearing</label><input type="date" value={form.next_hearing_date} onChange={e => setForm({...form, next_hearing_date: e.target.value})} /></div></div>
          <div className="form-group"><label>Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-gold">{editing ? 'Update' : 'Save'}</button></div></form>
      </div></div>)}
    </div>
  )
}
