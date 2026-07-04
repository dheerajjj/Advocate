import { useState, useEffect } from 'react'
import { Plus, Download, Trash2, FileText, Cloud } from 'lucide-react'
import api from '../services/api'
import DataTable from '../components/DataTable'

export default function Documents() {
  const [documents, setDocuments] = useState([])
  const [cases, setCases] = useState([])
  const [clients, setClients] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [caseId, setCaseId] = useState('')
  const [clientId, setClientId] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchDocs = () => {
    setLoading(true)
    api.get('/documents')
      .then(res => setDocuments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDocs()
    api.get('/cases').then(r => setCases(r.data)).catch(() => {})
    api.get('/clients').then(r => setClients(r.data)).catch(() => {})
  }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return alert('Select a file')
    setUploading(true)
    const fd = new FormData()
    fd.append('title', title)
    fd.append('file', file)
    if (caseId) fd.append('case_id', caseId)
    if (clientId) fd.append('client_id', clientId)
    try {
      const response = await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      
      // Check if any data was extracted from the document
      if (response.data.extracted_data) {
        const extracted = response.data.extracted_data
        const confidence = response.data.extraction_confidence
        
        // Show user the extracted data for confirmation
        const confirmMessage = `📄 Document Analysis Complete (${confidence.toFixed(1)}% confidence)

Extracted Information:
${extracted.cnr_number ? `• CNR Number: ${extracted.cnr_number}` : ''}
${extracted.case_number ? `• Case Number: ${extracted.case_number}` : ''}
${extracted.court_name ? `• Court: ${extracted.court_name}` : ''}
${extracted.case_type ? `• Case Type: ${extracted.case_type}` : ''}
${extracted.petitioner ? `• Petitioner: ${extracted.petitioner}` : ''}
${extracted.respondent ? `• Respondent: ${extracted.respondent}` : ''}
${extracted.filing_date ? `• Filing Date: ${extracted.filing_date}` : ''}
${extracted.hearing_date ? `• Next Hearing: ${extracted.hearing_date}` : ''}
${extracted.judge_name ? `• Judge: ${extracted.judge_name}` : ''}

Would you like to use this information to:
1. Create a new case with these details?
2. Add a new client (Petitioner)?
3. Just save the document without creating records?`

        const choice = confirm(confirmMessage)
        if (choice && extracted.case_number) {
          // In a real app, you'd redirect to case creation with pre-filled data
          // For now, we'll just log it
          console.log('Extracted case data:', extracted)
          alert('✅ Document saved! You can create a case with the extracted details from the Cases page.')
        }
      } else {
        alert('✅ Document uploaded successfully!')
      }
      
      setShowModal(false)
      setTitle('')
      setCaseId('')
      setClientId('')
      setFile(null)
      fetchDocs()
    } catch (err) {
      alert(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (id) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/documents/download/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Download failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `document_${id}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert('Download failed: ' + (err.message || 'Unknown error'))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return
    try {
      await api.delete(`/documents/${id}`)
      fetchDocs()
    } catch {
      alert('Delete failed')
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '—'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3><Cloud size={16} /> Document Vault <span className="card-count">{documents.length}</span></h3>
          <button className="btn btn-gold" onClick={() => setShowModal(true)} disabled={uploading}>
            <Plus size={16} /> Upload
          </button>
        </div>
        <div className="card-body">
          {loading ? <div className="empty-state"><h4>Loading...</h4></div> :
            <DataTable columns={['Title', 'File Name', 'Size', 'Case', 'Client', 'Uploaded', 'Actions']} data={documents} emptyMessage="No documents in vault" emptyIcon={Cloud}
              renderRow={(d) => (
                <tr key={d.id}>
                  <td className="td-primary">{d.title}</td>
                  <td className="td-secondary">{d.file_name}</td>
                  <td>{formatFileSize(d.file_size)}</td>
                  <td>{d.case_id || '—'}</td>
                  <td>{d.client_id || '—'}</td>
                  <td className="td-secondary">{d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString() : '—'}</td>
                  <td>
                    <div className="action-btns">
                      <button className="action-btn download" onClick={() => handleDownload(d.id)} title="Download from cloud"><Download size={15} /></button>
                      <button className="action-btn delete" onClick={() => handleDelete(d.id)} title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              )} />
          }
        </div>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Cloud size={18} /> Upload to Cloud Storage</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>File *</label>
                  <input type="file" onChange={e => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Link to Case</label>
                    <select value={caseId} onChange={e => setCaseId(e.target.value)}>
                      <option value="">None</option>
                      {cases.map(c => <option key={c.id} value={c.id}>{c.case_number}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Link to Client</label>
                    <select value={clientId} onChange={e => setClientId(e.target.value)}>
                      <option value="">None</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-gold" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload to Cloud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
