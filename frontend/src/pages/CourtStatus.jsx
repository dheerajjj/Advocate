import { useState } from 'react'
import { Scale, Search, AlertCircle, Clock, Users, Gavel, FileText, CheckCircle, Calendar, MapPin, BookOpen, Lightbulb, ArrowRight, Loader } from 'lucide-react'
import api from '../services/api'

export default function CourtStatus() {
  const [cnr, setCnr] = useState('')
  const [loading, setLoading] = useState(false)
  const [caseData, setCaseData] = useState(null)
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    const cleaned = cnr.trim().toUpperCase().replace(/[-\s]/g, '')
    if (cleaned.length < 16) { setError('CNR number must be 16 characters'); return }
    setError(''); setCaseData(null); setLoading(true)
    try {
      const res = await api.get(`/court-status/cnr/${cleaned}`)
      if (res.data.success) { setCaseData(res.data.data) }
      else { setError(res.data.error || 'Case not found') }
    } catch (err) { setError(err.response?.data?.detail || 'Failed to fetch case status') }
    finally { setLoading(false) }
  }

  const c = caseData?.data?.courtCaseData || caseData?.courtCaseData || null
  const files = caseData?.data?.files?.files || caseData?.files?.files || []
  const descriptions = caseData?.data?.descriptions?.enumLookup || {}
  const ai = files.length > 0 ? files[0]?.aiAnalysis : null
  const statusColor = (s) => { if (!s) return 'active'; const sl = s.toLowerCase(); if (sl.includes('disposed') || sl.includes('closed')) return 'disposed'; if (sl.includes('pending')) return 'pending'; return 'active' }
  const courtFullName = c ? (descriptions?.courtCode?.[c.cnrCourtCode] || c.courtName || '—') : ''

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header"><h3><Scale size={16} /> eCourts Case Status Lookup</h3></div>
        <div className="card-body">
          {!caseData && !loading && (
            <div className="empty-state" style={{ paddingTop: 12, paddingBottom: 16 }}>
              <div className="empty-state-icon"><Scale size={28} /></div>
              <h4>Live Court Case Status</h4>
              <p>Search any Indian court case using CNR number — powered by eCourts India</p>
            </div>
          )}
          <form onSubmit={handleSearch} style={{ maxWidth: 460, margin: '0 auto' }}>
            <div className="form-group"><label>CNR Number</label>
              <div className="search-input-wrap" style={{ border: '1px solid rgba(184,115,51,0.18)' }}>
                <Search size={16} />
                <input value={cnr} onChange={e => setCnr(e.target.value)} placeholder="e.g., DLHC010001232024" style={{ letterSpacing: '1px' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>16 characters: Court code + District + Case number + Year</div>
            </div>
            <button type="submit" className="btn btn-gold btn-block" disabled={loading} style={{ padding: '13px' }}>
              {loading ? 'Searching eCourts...' : 'Search Case Status'}
            </button>
          </form>
          {loading && (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'rgba(184,115,51,0.06)', padding: '14px 24px', borderRadius: '12px', border: '1px solid rgba(184,115,51,0.12)' }}>
                <Loader size={18} style={{ color: 'var(--bronze)', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '13px', color: '#666' }}>Fetching case details...</span>
              </div>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          {error && <div style={{ maxWidth: 460, margin: '16px auto 0' }}><div className="error-msg"><AlertCircle size={16} /> {error}</div></div>}
        </div>
      </div>

      {c && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Case Overview */}
          <div className="card">
            <div className="card-header">
              <h3><Gavel size={16} /> {descriptions?.caseType?.[c.caseType] || c.caseTypeRaw || 'Case'} — {c.registrationNumber || c.cnr}</h3>
              <span className={`badge badge-${statusColor(c.caseStatus)}`}><span className="badge-dot"></span> {c.caseStatus || 'Unknown'}</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <InfoItem icon={<Scale size={14} />} label="CNR Number" value={c.cnr} highlight />
                <InfoItem icon={<FileText size={14} />} label="Case Type" value={c.caseTypeRaw} />
                <InfoItem icon={<MapPin size={14} />} label="Court" value={courtFullName} />
                <InfoItem icon={<Calendar size={14} />} label="Filing Date" value={c.filingDate} />
                <InfoItem icon={<Calendar size={14} />} label="Filing Number" value={c.filingNumber} />
                <InfoItem icon={<Calendar size={14} />} label="Registration Date" value={c.registrationDate} />
                <InfoItem icon={<Gavel size={14} />} label="Judge" value={c.judges?.join(', ')} />
                <InfoItem icon={<Clock size={14} />} label="First Hearing" value={c.firstHearingDate} />
                <InfoItem icon={<Clock size={14} />} label="Last Hearing" value={c.lastHearingDate} />
                {c.decisionDate && <InfoItem icon={<CheckCircle size={14} />} label="Decision Date" value={c.decisionDate} />}
                {c.caseDurationDays != null && <InfoItem label="Case Duration" value={`${c.caseDurationDays} day(s)`} />}
                {c.purpose && <InfoItem label="Purpose" value={c.purpose} />}
              </div>
            </div>
          </div>

          {/* Parties */}
          {(c.petitioners?.length > 0 || c.respondents?.length > 0) && (
            <div className="card">
              <div className="card-header"><h3><Users size={16} /> Parties & Advocates</h3></div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <PartyBlock title="Petitioner / Appellant" parties={c.petitioners} advocates={c.petitionerAdvocates} />
                  <PartyBlock title="Respondent / Defendant" parties={c.respondents} advocates={c.respondentAdvocates} />
                </div>
              </div>
            </div>
          )}

          {/* IAs */}
          {c.interlocutoryApplications?.length > 0 && (
            <div className="card">
              <div className="card-header"><h3><FileText size={16} /> Applications (IAs) <span className="card-count">{c.interlocutoryApplications.length}</span></h3></div>
              <div className="card-body" style={{ padding: 0 }}><div className="table-container"><table>
                <thead><tr><th>Application</th><th>Filed By</th><th>Filing Date</th><th>Status</th></tr></thead>
                <tbody>{c.interlocutoryApplications.map((ia, i) => (
                  <tr key={i}><td className="td-primary">{ia.regNo}</td><td>{ia.filedBy || '—'}</td><td className="td-secondary">{ia.filingDate || '—'}</td>
                    <td><span className={`badge badge-${ia.status?.toLowerCase() === 'pending' ? 'pending' : 'completed'}`}><span className="badge-dot"></span> {ia.status}</span></td></tr>
                ))}</tbody>
              </table></div></div>
            </div>
          )}

          {/* Orders */}
          {c.judgmentOrders?.length > 0 && (
            <div className="card">
              <div className="card-header"><h3><FileText size={16} /> Orders & Judgments <span className="card-count">{c.judgmentOrders.length}</span></h3></div>
              <div className="card-body" style={{ padding: 0 }}><div className="table-container"><table>
                <thead><tr><th>Date</th><th>Type</th><th>Document</th></tr></thead>
                <tbody>{c.judgmentOrders.map((o, i) => (
                  <tr key={i}><td className="td-primary">{o.orderDate}</td><td>{o.orderType || '—'}</td><td className="td-secondary">{o.orderUrl || '—'}</td></tr>
                ))}</tbody>
              </table></div></div>
            </div>
          )}

          {/* AI Summary */}
          {ai && (
            <>
              <div className="card" style={{ border: '1px solid rgba(184,115,51,0.25)' }}>
                <div className="card-header" style={{ background: 'rgba(184,115,51,0.04)' }}><h3><Lightbulb size={16} /> AI Case Summary</h3></div>
                <div className="card-body">
                  {ai.intelligent_insights_analytics?.order_significance_and_impact_assessment?.ai_generated_executive_summary && (
                    <div style={{ fontSize: '14px', lineHeight: 1.8, color: '#333', marginBottom: '20px' }}>{ai.intelligent_insights_analytics.order_significance_and_impact_assessment.ai_generated_executive_summary}</div>
                  )}
                  {ai.intelligent_insights_analytics?.order_significance_and_impact_assessment?.plain_language_summary_for_litigants_outcome_focused && (
                    <div style={{ background: 'rgba(184,115,51,0.06)', borderRadius: '12px', padding: '18px', marginBottom: '20px', border: '1px solid rgba(184,115,51,0.12)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--bronze-dark)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> What This Means For The Parties</div>
                      <div style={{ fontSize: '13px', lineHeight: 1.8, color: '#444' }}>{ai.intelligent_insights_analytics.order_significance_and_impact_assessment.plain_language_summary_for_litigants_outcome_focused}</div>
                    </div>
                  )}
                  {ai.foundational_metadata?.procedural_details_from_order?.specific_directions_given_by_court?.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Court Directions</div>
                      {ai.foundational_metadata.procedural_details_from_order.specific_directions_given_by_court.map((d, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', fontSize: '13px', lineHeight: 1.6 }}><ArrowRight size={14} style={{ color: 'var(--bronze)', flexShrink: 0, marginTop: '3px' }} /><span>{d}</span></div>
                      ))}
                    </div>
                  )}
                  {ai.intelligent_insights_analytics?.order_significance_and_impact_assessment?.actionable_alerts_for_parties?.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Action Items & Deadlines</div>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {ai.intelligent_insights_analytics.order_significance_and_impact_assessment.actionable_alerts_for_parties.map((a, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(184,115,51,0.04)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(184,115,51,0.08)' }}>
                            <Calendar size={16} style={{ color: 'var(--bronze)', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}><div style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>{a.action_required}</div><div style={{ fontSize: '11px', color: '#999' }}>{a.responsible_party}</div></div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bronze-dark)' }}>{a.deadline}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {ai.deep_legal_substance_context?.core_legal_content_analysis?.statutes_cited_and_applied?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Statutes Applied</div>
                      {ai.deep_legal_substance_context.core_legal_content_analysis.statutes_cited_and_applied.map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', fontSize: '13px' }}><BookOpen size={14} style={{ color: 'var(--bronze)', flexShrink: 0, marginTop: '3px' }} /><span><strong>{s.act_name}, {s.section_article_rule}</strong> — {s.interpretation_focus_or_application}</span></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Conclusion */}
              <div className="card" style={{ background: 'linear-gradient(135deg, #1E1E1E, #2A2A2A)', border: 'none' }}>
                <div className="card-body" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--bronze), var(--bronze-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Scale size={18} color="#FFF" /></div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8F6F2', fontFamily: "'Cormorant Garamond', serif" }}>Conclusion</div>
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: 1.8, color: 'rgba(248,246,242,0.75)', marginBottom: '16px' }}>
                    {ai.deep_legal_substance_context?.arguments_and_reasoning_analysis?.court_reasoning_for_decision || ai.intelligent_insights_analytics?.order_significance_and_impact_assessment?.ai_generated_executive_summary || 'Case details retrieved successfully.'}
                  </div>
                  {ai.deep_legal_substance_context?.arguments_and_reasoning_analysis?.ratio_decidendi_extracted?.statement && (
                    <div style={{ borderTop: '1px solid rgba(184,115,51,0.3)', paddingTop: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bronze-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Ratio Decidendi</div>
                      <div style={{ fontSize: '13px', lineHeight: 1.8, color: 'rgba(248,246,242,0.6)', fontStyle: 'italic' }}>"{ai.deep_legal_substance_context.arguments_and_reasoning_analysis.ratio_decidendi_extracted.statement}"</div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <MiniStat label="Status" value={c.caseStatus} />
                    <MiniStat label="Duration" value={c.caseDurationDays != null ? `${c.caseDurationDays} day(s)` : '—'} />
                    <MiniStat label="Orders" value={c.orderCount ?? 0} />
                    <MiniStat label="IAs" value={c.iaCount ?? 0} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Fallback summary if no AI */}
          {!ai && c && (
            <div className="card" style={{ background: 'linear-gradient(135deg, #1E1E1E, #2A2A2A)', border: 'none' }}>
              <div className="card-body" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}><Scale size={18} color="var(--bronze-light)" />
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8F6F2', fontFamily: "'Cormorant Garamond', serif" }}>Summary</div></div>
                <div style={{ fontSize: '14px', lineHeight: 1.8, color: 'rgba(248,246,242,0.7)' }}>
                  Case <strong style={{ color: 'var(--bronze-light)' }}>{c.caseTypeRaw} {c.registrationNumber}</strong> filed on {c.filingDate} at {courtFullName}.
                  {c.petitioners?.length > 0 && <> Petitioner: <strong style={{ color: '#F8F6F2' }}>{c.petitioners[0]}</strong>.</>}
                  {c.respondents?.length > 0 && <> Respondent: <strong style={{ color: '#F8F6F2' }}>{c.respondents[0]}</strong>.</>}
                  {c.judges?.length > 0 && <> Heard by <strong style={{ color: '#F8F6F2' }}>Justice {c.judges[0]}</strong>.</>}
                  {' '}Status: <strong style={{ color: c.caseStatus === 'DISPOSED' ? '#D4956A' : '#10B981' }}>{c.caseStatus}</strong>.
                  {c.decisionDate && <> Decided on {c.decisionDate}.</>}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                  <MiniStat label="Status" value={c.caseStatus} /><MiniStat label="Filed" value={c.filingDate} /><MiniStat label="Orders" value={c.orderCount ?? 0} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoItem({ icon, label, value, highlight }) {
  if (!value) return null
  return (<div><div style={{ fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>{icon} {label}</div>
    <div style={{ fontSize: '14px', fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--bronze-dark)' : '#1E1E1E', marginTop: '3px', letterSpacing: highlight ? '0.5px' : 0 }}>{value}</div></div>)
}

function PartyBlock({ title, parties, advocates }) {
  return (<div><div style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>{title}</div>
    {parties?.map((p, i) => <div key={i} style={{ fontSize: '14px', fontWeight: 600, color: '#1E1E1E', marginBottom: '2px' }}>{p}</div>)}
    {advocates?.length > 0 && <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>Advocate: {advocates.join(', ')}</div>}
    {(!parties || parties.length === 0) && <div style={{ color: '#999', fontSize: '13px' }}>—</div>}</div>)
}

function MiniStat({ label, value }) {
  return (<div style={{ background: 'rgba(184,115,51,0.1)', padding: '8px 14px', borderRadius: '8px' }}>
    <div style={{ fontSize: '10px', color: 'var(--bronze-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8F6F2', marginTop: '2px' }}>{value}</div></div>)
}
