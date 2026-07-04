import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, CheckCircle, RotateCcw, CheckSquare } from 'lucide-react'
import api from '../services/api'
import DataTable from '../components/DataTable'

const emptyForm = { title: '', description: '', case_id: '', client_id: '', due_date: '', priority: 'Medium', status: 'Pending' }
const priorities = ['Low', 'Medium', 'High', 'Urgent']

export default function Tasks() {
  const [tasks, setTasks] = useState([]); const [cases, setCases] = useState([]); const [clients, setClients] = useState([])
  const [showModal, setShowModal] = useState(false); const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm); const [loading, setLoading] = useState(true)

  const fetchTasks = () => { setLoading(true); api.get('/tasks').then(res => setTasks(res.data)).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(() => { fetchTasks(); api.get('/cases').then(r => setCases(r.data)).catch(() => {}); api.get('/clients').then(r => setClients(r.data)).catch(() => {}) }, [])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (t) => { setEditing(t.id); setForm({ title: t.title, description: t.description||'', case_id: t.case_id||'', client_id: t.client_id||'', due_date: t.due_date||'', priority: t.priority||'Medium', status: t.status||'Pending' }); setShowModal(true) }
  const handleSave = async (e) => { e.preventDefault(); const p = {...form}; p.case_id = p.case_id ? parseInt(p.case_id) : null; p.client_id = p.client_id ? parseInt(p.client_id) : null; try { if (editing) await api.put(`/tasks/${editing}`, p); else await api.post('/tasks', p); setShowModal(false); fetchTasks() } catch (err) { alert(err.response?.data?.detail || 'Error') } }
  const toggleStatus = async (t) => { try { await api.put(`/tasks/${t.id}`, { status: t.status === 'Pending' ? 'Completed' : 'Pending' }); fetchTasks() } catch { alert('Error') } }
  const handleDelete = async (id) => { if (!confirm('Delete?')) return; try { await api.delete(`/tasks/${id}`); fetchTasks() } catch { alert('Error') } }

  const Badge = ({ value }) => <span className={`badge badge-${(value||'').toLowerCase()}`}><span className="badge-dot"></span> {value}</span>

  return (
    <div>
      <div className="card">
        <div className="card-header"><h3><CheckSquare size={16} /> Tasks <span className="card-count">{tasks.length}</span></h3><button className="btn btn-gold" onClick={openAdd}><Plus size={16} /> Add Task</button></div>
        <div className="card-body">
          {loading ? <div className="empty-state"><h4>Loading...</h4></div> :
            <DataTable columns={['Title', 'Due Date', 'Priority', 'Status', 'Actions']} data={tasks} emptyMessage="No tasks found" emptyIcon={CheckSquare}
              renderRow={(t) => (<tr key={t.id}><td><span className="td-primary">{t.title}</span>{t.description && <div className="td-secondary">{t.description}</div>}</td><td>{t.due_date||'—'}</td><td><Badge value={t.priority} /></td><td><Badge value={t.status} /></td>
                <td><div className="action-btns"><button className="action-btn complete" onClick={() => toggleStatus(t)}>{t.status === 'Pending' ? <CheckCircle size={15} /> : <RotateCcw size={15} />}</button><button className="action-btn edit" onClick={() => openEdit(t)}><Pencil size={15} /></button><button className="action-btn delete" onClick={() => handleDelete(t.id)}><Trash2 size={15} /></button></div></td></tr>)} />}
        </div>
      </div>
      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{editing ? 'Edit Task' : 'New Task'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSave}><div className="modal-body">
          <div className="form-group"><label>Title *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="form-row"><div className="form-group"><label>Case</label><select value={form.case_id} onChange={e => setForm({...form, case_id: e.target.value})}><option value="">None</option>{cases.map(c => <option key={c.id} value={c.id}>{c.case_number}</option>)}</select></div><div className="form-group"><label>Client</label><select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})}><option value="">None</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div>
          <div className="form-row"><div className="form-group"><label>Due Date</label><input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} /></div><div className="form-group"><label>Priority</label><select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>{priorities.map(p => <option key={p} value={p}>{p}</option>)}</select></div></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-gold">{editing ? 'Update' : 'Save'}</button></div></form>
      </div></div>)}
    </div>
  )
}
