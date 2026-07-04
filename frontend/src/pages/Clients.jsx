import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react'
import api from '../services/api'
import DataTable from '../components/DataTable'

const emptyForm = { name: '', phone: '', email: '', address: '', notes: '' }

export default function Clients() {
  const [clients, setClients] = useState([]); const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false); const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm); const [loading, setLoading] = useState(true)

  const fetchClients = () => { setLoading(true); api.get('/clients', { params: search ? { search } : {} }).then(res => setClients(res.data)).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(() => { fetchClients() }, [search])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (c) => { setEditing(c.id); setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' }); setShowModal(true) }
  const handleSave = async (e) => { e.preventDefault(); try { if (editing) await api.put(`/clients/${editing}`, form); else await api.post('/clients', form); setShowModal(false); fetchClients() } catch (err) { alert(err.response?.data?.detail || 'Error') } }
  const handleDelete = async (id) => { if (!confirm('Delete this client?')) return; try { await api.delete(`/clients/${id}`); fetchClients() } catch { alert('Error') } }

  return (
    <div>
      <div className="card">
        <div className="card-header"><h3><Users size={16} /> Clients <span className="card-count">{clients.length}</span></h3><button className="btn btn-gold" onClick={openAdd}><Plus size={16} /> Add Client</button></div>
        <div className="card-body">
          <div className="search-filter-bar"><div className="search-input-wrap"><Search size={16} /><input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
          {loading ? <div className="empty-state"><h4>Loading...</h4></div> :
            <DataTable columns={['Name', 'Phone', 'Email', 'Address', 'Actions']} data={clients} emptyMessage="No clients found" emptyIcon={Users}
              renderRow={(c) => (<tr key={c.id}><td className="td-primary">{c.name}</td><td>{c.phone || '—'}</td><td>{c.email || '—'}</td><td className="td-secondary">{c.address || '—'}</td>
                <td><div className="action-btns"><button className="action-btn edit" onClick={() => openEdit(c)}><Pencil size={15} /></button><button className="action-btn delete" onClick={() => handleDelete(c.id)}><Trash2 size={15} /></button></div></td></tr>)} />}
        </div>
      </div>
      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{editing ? 'Edit Client' : 'New Client'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSave}><div className="modal-body">
          <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-row"><div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div><div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div></div>
          <div className="form-group"><label>Address</label><textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
          <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-gold">{editing ? 'Update' : 'Save'}</button></div></form>
      </div></div>)}
    </div>
  )
}
