import React, { useState } from 'react';
import { useAppStore } from '../db/store';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileDown, Calendar, AlertTriangle, AlertCircle, X } from 'lucide-react';

export const ComplianceTower: React.FC = () => {
  const navigate = useNavigate();
  const { 
    engagements, clients, workingPapers, clientRequests, reviewNotes, 
    observations, currentUser, setAuditReportDate, addAuditTrail
  } = useAppStore();

  const [selectedEngId, setSelectedEngId] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateError, setDateError] = useState('');

  // Checks for partner designation
  if (currentUser?.designation !== 'Partner') {
    return (
      <div className="text-center py-12 bg-white border border-black/6 rounded-[12px] max-w-xl mx-auto mt-20">
        <AlertTriangle className="mx-auto text-accent-red mb-3" size={32} />
        <p className="text-[14px] text-black/55 font-bold uppercase tracking-[0.04em]">Unauthorized Access</p>
        <p className="text-[12px] text-black/40 mt-1">This compliance console is restricted exclusively to firm Engagement Partners.</p>
        <Link to="/dashboard" className="text-[12px] text-accent-red hover:underline mt-4 inline-block font-bold tracking-[0.04em] uppercase">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
  };

  const getEngagementMetrics = (engId: string) => {
    const wps = workingPapers.filter(w => w.engagement_id === engId);
    const wpIds = wps.map(w => w.id);

    // Queries: counts unresolved review notes
    const openQueriesCount = reviewNotes.filter(n => wpIds.includes(n.working_paper_id)).length;

    // Requests: count pending client uploads
    const openRequestsCount = clientRequests.filter(r => r.engagement_id === engId && (r.status === 'pending-internal' || r.status === 'approved' || r.status === 'received' || r.status === 'rejected')).length;

    // Escalations: count observations set to escalate
    const escalatedCount = observations.filter(o => o.engagement_id === engId && o.disposition === 'escalated').length;

    return { openQueriesCount, openRequestsCount, escalatedCount };
  };

  const handleApplyReportDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEngId) return;

    setDateError('');

    const res = setAuditReportDate(selectedEngId, reportDate);
    if (res.success) {
      setSelectedEngId(null);
    } else {
      setDateError(res.error || 'Failed to sign report date.');
    }
  };

  const triggerMrlCompile = (engId: string) => {
    const eng = engagements.find(e => e.id === engId);
    const cName = getClientName(eng?.client_id || '');
    
    // Aggregates observations escalated to partner
    const escalatedObs = observations.filter(o => o.engagement_id === engId && o.disposition === 'escalated');
    
    if (escalatedObs.length === 0) {
      alert(`No matters escalated to Partner/Management Letter found for ${cName}. Ensure Manager reviews observations and sets the disposition to 'Escalate to Partner'.`);
      return;
    }

    // Generate formatted print
    const content = escalatedObs.map((o, idx) => {
      return `${idx+1}. OBJECTIVE OBSERVED: ${o.title}\nFINANCIAL IMPACT: ₹${o.financial_impact.toLocaleString()}\nDETAILED FINDINGS: ${o.findings_description}\nROW POINTER: ${o.excel_row_reference}\n----------------------------------------\n`;
    }).join('\n');

    const heading = `======================================================================\nMANAGEMENT REPRESENTATION LETTER (MRL) - APPENDIX A\nCLIENT: ${cName.toUpperCase()}\nFINANCIAL YEAR: ${eng?.financial_year}\n======================================================================\n\n`;

    const blob = new Blob([heading + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MRL_Appendix_${cName.replace(/\s+/g, '_')}_${eng?.financial_year}.txt`;
    link.click();
    
    addAuditTrail('mrl_compiled_partner', { escalatedCount: escalatedObs.length }, undefined, engId);
  };

  return (
    <div className="space-y-6 ui-enter-stagger">
      {/* Title */}
      <div className="flex justify-between items-center border-b border-black/6 pb-5">
        <div>
          <h1 className="bebas-display text-[clamp(26px,3.2vw,40px)] text-black leading-none tracking-[0.04em]">
            Firm-Wide Audit Compliance Tower
          </h1>
          <p className="text-[12px] text-black/40 mt-1">
            Aggregate cross-client risks, monitor Standard on Auditing (SA) 230 filing clocks, and execute management sign-off assemblies.
          </p>
        </div>

        <Link 
          to="/dashboard"
          className="flex items-center gap-1 text-[11px] text-black/55 hover:text-black transition-colors duration-200"
        >
          <ArrowLeft size={12} className="rotate-90" />
          <span>Dashboard Main</span>
        </Link>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-black/6 rounded-[12px] p-6 space-y-4">
        <h3 className="bebas-display text-[20px] text-black tracking-[0.04em]">
          FIRM PORTFOLIO REGULATORY MONITOR
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black/10 text-left">
                <th className="py-3 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">Client Name</th>
                <th className="py-3 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">Engagement Status</th>
                <th className="py-3 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">Open Internal Queries</th>
                <th className="py-3 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">Open Client Requests</th>
                <th className="py-3 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">SA 230 filing clock</th>
                <th className="py-3 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6 text-[13px]">
              {engagements.map(eng => {
                const cName = getClientName(eng.client_id);
                const { openQueriesCount, openRequestsCount, escalatedCount } = getEngagementMetrics(eng.id);
                
                // Calculate SA 230 clock days
                let clockText = 'Not Started';
                let clockColor = 'text-black/40';
                
                if (eng.archive) {
                  const deadline = new Date(eng.archive.assembly_deadline).getTime();
                  const remaining = Math.ceil((deadline - Date.now()) / (1000 * 60 * 60 * 24));
                  if (eng.archive.is_locked) {
                    clockText = 'Archive Locked (7-Year Hold)';
                    clockColor = 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[2px] font-bold border border-emerald-200';
                  } else if (remaining < 0) {
                    clockText = 'Assembly Overdue';
                    clockColor = 'text-accent-red bg-red-50 px-2 py-0.5 rounded-[2px] font-bold border border-red-200';
                  } else {
                    clockText = `${remaining} Days Remaining`;
                    clockColor = 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[2px] font-bold border border-amber-200';
                  }
                }

                // Check status color
                const isSigned = !!eng.archive;
                
                return (
                  <tr key={eng.id} className="hover:bg-black/[0.005]">
                    <td className="py-4 font-bold text-black">{cName}</td>
                    <td className="py-4">
                      {isSigned ? (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-[2px] bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-[0.04em]">
                          Audit Signed
                        </span>
                      ) : eng.status === 'review' ? (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-[2px] bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-[0.04em]">
                          In Review (Yellow)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-[2px] bg-red-50 text-red-700 border border-red-200 uppercase tracking-[0.04em]">
                          Fieldwork (Red)
                        </span>
                      )}
                    </td>
                    <td className="py-4 font-mono font-bold text-black/60">
                      {openQueriesCount} Active Note{openQueriesCount !== 1 ? 's' : ''}
                    </td>
                    <td className="py-4 font-mono font-bold text-black/60">
                      {openRequestsCount} Request{openRequestsCount !== 1 ? 's' : ''} pending
                    </td>
                    <td className="py-4">
                      <span className={`text-[11.5px] ${clockColor}`}>
                        {clockText}
                      </span>
                    </td>
                    <td className="py-4 text-right space-x-2">
                      {escalatedCount > 0 && (
                        <button
                          onClick={() => triggerMrlCompile(eng.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-black/10 rounded-[2px] hover:border-black/30 hover:bg-black/[0.02] text-[11px] font-bold text-black/60 uppercase tracking-[0.04em]"
                          title="Generate Management Rep Letter Appendix"
                        >
                          <FileDown size={11} />
                          <span>MRL</span>
                        </button>
                      )}

                      {!isSigned ? (
                        <button
                          onClick={() => setSelectedEngId(eng.id)}
                          className="px-3 py-1.5 bg-black text-white rounded-[2px] text-[11px] font-bold uppercase tracking-[0.04em]"
                        >
                          Sign Audit Report
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/engagement/${eng.id}/archive`)}
                          className="px-3 py-1.5 border border-black/10 text-black rounded-[2px] text-[11px] font-bold uppercase tracking-[0.04em]"
                        >
                          View Archive
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIGN REPORT DATE MODAL */}
      {selectedEngId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-black/8 rounded-[12px] w-full max-w-[480px] shadow-2xl p-6 space-y-4 animate-fadeInUp">
            <div className="flex justify-between items-center border-b border-black/6 pb-2">
              <h3 className="bebas-display text-[20px] text-black tracking-[0.04em]">
                Finalize Audit & Sign Report Date
              </h3>
              <button 
                onClick={() => { setSelectedEngId(null); setDateError(''); }} 
                className="text-black/30 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            {dateError && (
              <div className="p-3 bg-red-50 border border-red-200 text-accent-red text-[11px] rounded-[2px] flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <p className="font-mono leading-normal font-bold">{dateError}</p>
              </div>
            )}

            <form onSubmit={handleApplyReportDate} className="space-y-4">
              <div className="p-3.5 bg-amber-50/50 border border-amber-200 text-amber-800 text-[11px] rounded-[12px] leading-relaxed">
                <span className="font-bold block uppercase tracking-[0.04em] mb-0.5">SA 230 Regulatory Archival Lock:</span>
                Signing this audit report triggers a strict 60-day calendar program. On Day 61, the workspace hard locks permanently. Modifying files is blocked under Paragraph 16 guidelines.
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">
                  Physical Auditor's Report Signature Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-black/30" size={14} />
                  <input
                    type="date"
                    required
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-[13px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black font-bold font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setSelectedEngId(null); setDateError(''); }}
                  className="px-4 py-2 border border-black/10 rounded-[2px] text-[11px] font-bold text-black/55 uppercase hover:bg-black/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-5 py-2 rounded-[2px] text-[11px] font-bold tracking-[0.04em] uppercase"
                >
                  Sign & Start Assembly Clock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
