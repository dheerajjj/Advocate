import { useState, useEffect } from 'react'
import { FileText, Search, Link, AlertCircle, CheckCircle, Eye } from 'lucide-react'
import api from '../services/api'
import DataTable from '../components/DataTable'

export default function DocumentAnalysis() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(null)
  const [analysisResults, setAnalysisResults] = useState({})
  const [showDetail, setShowDetail] = useState(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = () => {
    setLoading(true)
    api.get('/documents')
      .then(res => setDocuments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleAnalyze = async (docId) => {
    setAnalyzing(docId)
    try {
      const response = await api.get(`/documents/analyze/${docId}`)
      setAnalysisResults(prev => ({
        ...prev,
        [docId]: response.data
      }))
    } catch (err) {
      console.error('Analysis failed:', err)
      setAnalysisResults(prev => ({
        ...prev,
        [docId]: { success: false, error: 'Analysis failed' }
      }))
    } finally {
      setAnalyzing(null)
    }
  }

  const handleViewDetails = (docId) => {
    if (!analysisResults[docId]) {
      handleAnalyze(docId).then(() => setShowDetail(docId))
    } else {
      setShowDetail(showDetail === docId ? null : docId)
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return '#10b981'  // green
    if (confidence >= 40) return '#f59e0b'  // amber
    return '#ef4444'  // red
  }

  const renderExtractedFields = (data) => {
    if (!data || Object.keys(data).length === 0) {
      return <p style={{ color: '#64748b', fontSize: '14px' }}>No data extracted from this document.</p>
    }

    const fields = Object.entries(data).filter(([k, v]) => v !== null && k !== '__type__')
    
    if (fields.length === 0) {
      return <p style={{ color: '#64748b', fontSize: '14px' }}>No recognizable case details found.</p>
    }

    return (
      <div style={{ display: 'grid', gap: '12px' }}>
        {fields.map(([key, value]) => (
          <div key={key} style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '14px 18px',
            background: '#f8f5f0',
            borderRadius: '8px',
            border: '1px solid #d4c5b0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <span style={{ 
              color: '#8b6914', 
              fontWeight: '600', 
              fontSize: '13px',
              minWidth: '150px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            <span style={{ 
              color: '#1a1a1a', 
              fontWeight: '700', 
              fontSize: '16px',
              textAlign: 'right',
              wordBreak: 'break-word',
              flex: 1,
              marginLeft: '12px'
            }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3><Search size={16} /> Document Analysis <span className="card-count">{documents.length}</span></h3>
          <button className="btn btn-gold" onClick={fetchDocuments}>
            <Search size={16} /> Refresh
          </button>
        </div>
        <div className="card-body">
          {loading ? <div className="empty-state"><h4>Loading...</h4></div> :
            documents.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} />
                <h4>No documents found</h4>
                <p>Upload documents to analyze their content</p>
              </div>
            ) : (
              <DataTable 
                columns={['Title', 'File Name', 'Size', 'Status', 'Actions']} 
                data={documents} 
                emptyMessage="No documents to analyze" 
                emptyIcon={FileText}
                renderRow={(d) => {
                  const result = analysisResults[d.id]
                  const confidence = result?.confidence || 0
                  const isAnalyzed = !!result
                  
                  return (
                    <tr key={d.id}>
                      <td className="td-primary">{d.title}</td>
                      <td className="td-secondary">{d.file_name}</td>
                      <td>
                        {d.file_size 
                          ? d.file_size < 1024 
                            ? `${d.file_size} B`
                            : d.file_size < 1024 * 1024 
                              ? `${(d.file_size / 1024).toFixed(1)} KB`
                              : `${(d.file_size / (1024 * 1024)).toFixed(1)} MB`
                          : '—'
                        }
                      </td>
                      <td>
                        {isAnalyzed ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {result.success ? (
                              <CheckCircle size={16} color="#10b981" />
                            ) : (
                              <AlertCircle size={16} color="#ef4444" />
                            )}
                            <span>
                              {result.success 
                                ? result.auto_linked 
                                  ? 'Auto-linked' 
                                  : confidence > 0 
                                    ? `Extracted (${confidence.toFixed(0)}%)`
                                    : 'No content'
                                : 'Failed'
                              }
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Not analyzed</span>
                        )}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button 
                            className="action-btn download" 
                            onClick={() => handleViewDetails(d.id)} 
                            title="View analysis"
                            disabled={analyzing === d.id}
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            className="action-btn" 
                            style={{ color: '#d4af37' }}
                            onClick={() => handleAnalyze(d.id)}
                            disabled={analyzing === d.id}
                            title="Re-analyze"
                          >
                            {analyzing === d.id ? '⏳' : <Search size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }} 
              />
            )
          }
        </div>
      </div>

      {/* Analysis Detail Modal */}
      {showDetail && analysisResults[showDetail] && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3><Search size={18} /> Document Analysis Results</h3>
              <button className="modal-close" onClick={() => setShowDetail(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {(() => {
                const result = analysisResults[showDetail]
                const doc = documents.find(d => d.id === showDetail)
                
                if (!result.success) {
                  return (
                    <div style={{ 
                      padding: '16px', 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      <p style={{ color: '#ef4444' }}>❌ {result.error || 'Analysis failed'}</p>
                    </div>
                  )
                }

                return (
                  <div>
                    {/* Document Info */}
                    <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f5f0', borderRadius: '10px', border: '1px solid #d4c5b0' }}>
                      <h4 style={{ margin: '0 0 6px', color: '#1a1a1a', fontSize: '18px' }}>{doc?.title}</h4>
                      <p style={{ margin: '0', color: '#64748b', fontSize: '13px' }}>
                        📄 {doc?.file_name} &middot; {doc?.file_size 
                          ? (doc.file_size < 1024 ? `${doc.file_size} B` 
                            : doc.file_size < 1024*1024 ? `${(doc.file_size/1024).toFixed(1)} KB`
                            : `${(doc.file_size/(1024*1024)).toFixed(1)} MB`)
                          : '—'
                        }
                      </p>
                    </div>

                    {/* Confidence Bar */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#374151', fontWeight: '600', fontSize: '14px' }}>Extraction Confidence</span>
                        <span style={{ 
                          color: getConfidenceColor(result.confidence),
                          fontWeight: '700',
                          fontSize: '14px'
                        }}>
                          {result.confidence.toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ 
                        height: '10px', 
                        background: '#e5e7eb', 
                        borderRadius: '5px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${result.confidence}%`,
                          background: getConfidenceColor(result.confidence),
                          borderRadius: '5px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>

                    {/* Auto-link status */}
                    {result.auto_linked && (
                      <div style={{ 
                        padding: '14px 16px', 
                        background: '#ecfdf5',
                        border: '1px solid #10b981',
                        borderRadius: '8px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Link size={16} color="#10b981" />
                        <span style={{ color: '#065f46', fontWeight: '600', fontSize: '14px' }}>
                          ✅ Auto-linked to Case #{result.linked_case_id}
                          {result.linked_client_id && ` and Client #${result.linked_client_id}`}
                        </span>
                      </div>
                    )}

                    {/* Extracted Details Card */}
                    <div style={{ 
                      marginBottom: '24px',
                      padding: '20px',
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}>
                      <h4 style={{ color: '#1a1a1a', marginBottom: '16px', fontSize: '16px', borderBottom: '2px solid #d4af37', paddingBottom: '8px' }}>📋 Extracted Details</h4>
                      {renderExtractedFields(result.extracted_data)}
                    </div>

                    {/* Case Summary / Status Card */}
                    <div style={{ 
                      padding: '20px',
                      background: '#fffbeb',
                      borderRadius: '12px',
                      border: '1px solid #f59e0b',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}>
                      <h4 style={{ color: '#92400e', marginBottom: '12px', fontSize: '16px', borderBottom: '2px solid #f59e0b', paddingBottom: '8px' }}>⚖️ Case Summary & Status</h4>
                      <div style={{ color: '#1a1a1a', lineHeight: '1.8', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                        {result.summary || 'No summary available.'}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
