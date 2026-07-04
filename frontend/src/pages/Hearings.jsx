import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, CheckCircle, Gavel } from 'lucide-react'
import api from '../services/api'
import DataTable from '../components/DataTable'

const emptyForm = { case_id: '', hearing_date: '', court_room: '', judge_name: '', notes: '', status: 'Scheduled' }
const hearingStatuses = ['Scheduled', 'Completed', 'Adjourned', 'Cancelled']

export default function Hearings() {
  const [hearings, setHearings] = useState([]); const [cases, setCases] = useState([])
  const [showModal, setShowModal] = useState(false); const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm); const [loading, setLoading] = useState(true)

  const fetchHearings = () => { setLoading(true); api.get('/hearings').then(res => setHearings(res.data)).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(() => { fetchHearings(); api.get('/cases').then(res => setCases(res.data)).catch(() => {}) }, [])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (h) => { setEditing(h.id); setForm({ case_id: h.case_id, hearing_date: h.hearing_date, court_room: h.court_room||'', judge_name: h.judge_name||'', notes: h.notes||'', status: h.status||'Scheduled' }); setShowModal(true) }
  const handleSave = async (e) => { e.preventDefault(); try { const p = {...form, case_id: parseInt(form.case_id)}; if (editing) await api.put(`/hearings/${editing}`, p); else await api.post('/hearings', p); setShowModal(false); fetchHearings() } catch (err) { alert(err.response?.data?.detail || 'Error') } }
  const markCompleted = async (id) => { try { await api.put(`/hearings/${id}`, { status: 'Completed' }); fetchHearings() } catch { alert('Error') } }
  const handleDelete = async (id) => { if (!confirm('Delete?')) return; try { await api.delete(`/hearings/${id}`); fetchHearings() } catch { alert('Error') } }

  const Badge = ({ status }) => <span className={`badge badge-${(status||'').toLowerCase()}`}><span className="badge-dot"></span> {status}</span>

  return (
    <div>
      <div className="card">
        <div className="card-header"><h3><Gavel size={16} /> Hearings <span className="card-count">{hearings.length}</span></h3><button className="btn btn-gold" onClick={openAdd}><Plus size={16} /> Add Hearing</button></div>
        <div className="card-body">
          {loading ? <div className="empty-state"><h4>Loading...</h4></div> :
            <DataTable columns={['Case', 'Date', 'Court Room', 'Judge', 'Status', 'Actions']} data={hearings} emptyMessage="No hearings scheduled" emptyIcon={Gavel}
              renderRow={(h) => (<tr key={h.id}><td className="td-primary">{h.case?.case_number || `#${h.case_id}`}</td><td>{h.hearing_date}</td><td>{h.court_room||'—'}</td><td>{h.judge_name||'—'}</td><td><Badge status={h.status} /></td>
                <td><div className="action-btns">{h.status === 'Scheduled' && <button className="action-btn complete" onClick={() => markCompleted(h.id)}><CheckCircle size={15} /></button>}<button className="action-btn edit" onClick={() => openEdit(h)}><Pencil size={15} /></button><button className="action-btn delete" onClick={() => handleDelete(h.id)}><Trash2 size={15} /></button></div></td></tr>)} />}
        </div>
      </div>
      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{editing ? 'Edit Hearing' : 'New Hearing'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSave}><div className="modal-body">
          <div className="form-row"><div className="form-group"><label>Case *</label><select value={form.case_id} onChange={e => setForm({...form, case_id: e.target.value})} required><option value="">Select</option>{cases.map(c => <option key={c.id} value={c.id}>{c.case_number}</option>)}</select></div><div className="form-group"><label>Date *</label><input type="date" value={form.hearing_date} onChange={e => setForm({...form, hearing_date: e.target.value})} required /></div></div>
          <div className="form-row"><div className="form-group"><label>Court Room</label><input value={form.court_room} onChange={e => setForm({...form, court_room: e.target.value})} /></div><div className="form-group"><label>Judge</label><input value={form.judge_name} onChange={e => setForm({...form, judge_name: e.target.value})} /></div></div>
          <div className="form-group"><label>Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>{hearingStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-gold">{editing ? 'Update' : 'Save'}</button></div></form>
      </div></div>)}
    </div>
  )
}
