import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../db/store';
import { ArrowLeft, Lock, FileText, CheckCircle2, ShieldAlert, Plus, X } from 'lucide-react';

export const ArchiveViewer: React.FC = () => {
  const { engagementId } = useParams<{ engagementId: string }>();
  const { 
    engagements, clients, auditAreas, workingPapers, users,
    postLockdownAddenda, addPostLockdownAddendum, currentUser
  } = useAppStore();

  const engagement = engagements.find(e => e.id === engagementId);
  const client = engagement ? clients.find(c => c.id === engagement.client_id) : null;
  const areas = auditAreas.filter(a => a.engagement_id === engagementId);
  const wps = workingPapers.filter(w => w.engagement_id === engagementId);

  const [selectedWpId, setSelectedWpId] = useState<string | null>(null);
  
  // Post-Lockdown overrides states
  const [isAddendumOpen, setIsAddendumOpen] = useState(false);
  const [addendumReason, setAddendumReason] = useState('');
  const [addendumContent, setAddendumContent] = useState('');

  if (!engagement || !client || !engagement.archive) {
    return (
      <div className="text-center py-12 bg-white border border-black/6 rounded-[12px] max-w-xl mx-auto mt-20">
        <p className="text-[14px] text-black/55 italic">Locked engagement archive not found.</p>
        <Link to="/compliance" className="text-[12px] text-accent-red hover:underline mt-4">Return to Compliance Console</Link>
      </div>
    );
  }

  const selectedWp = wps.find(w => w.id === selectedWpId);
  
  const addendumLogs = postLockdownAddenda.filter(a => a.engagement_id === engagementId);

  const handlePostLockdownSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addendumReason.trim() || !addendumContent.trim()) return;

    addPostLockdownAddendum(engagement.id, {
      reason: addendumReason,
      content: addendumContent,
    });

    setAddendumReason('');
    setAddendumContent('');
    setIsAddendumOpen(false);
  };

  const getPreparerName = (wp: typeof wps[0]) => {
    if (!wp.prepared_by) return '-';
    return users.find(u => u.id === wp.prepared_by)?.full_name || 'System';
  };

  const getReviewerName = (wp: typeof wps[0]) => {
    if (!wp.reviewed_by) return '-';
    return users.find(u => u.id === wp.reviewed_by)?.full_name || 'System';
  };

  return (
    <div className="space-y-6 ui-enter-stagger">
      {/* Nav */}
      <nav className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <Link to="/compliance" className="text-black/40 hover:text-black transition-colors duration-200">
            Compliance Tower
          </Link>
          <span className="text-black/20">/</span>
          <span className="text-black font-medium">{client.name} (Archived File)</span>
        </div>
        
        <Link 
          to="/compliance"
          className="flex items-center gap-1 text-[11px] text-black/55 hover:text-black transition-colors duration-200"
        >
          <ArrowLeft size={12} />
          <span>Back to Tower</span>
        </Link>
      </nav>

      {/* Warning Archival Header */}
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[12px] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="text-emerald-700" size={20} />
            <h2 className="bebas-display text-[24px] text-black tracking-[0.04em] leading-none">
              SECURE RECORD HARD ARCHIVE (SA 230)
            </h2>
          </div>
          <p className="text-[12px] text-emerald-700 leading-normal">
            This file was signed off on <strong>{new Date(engagement.archive.audit_report_date).toLocaleDateString()}</strong>. In accordance with SQC 1 compliance rules, this engagement is locked for a retention cycle of 7 years, expiring on <strong>{new Date(engagement.archive.retention_expires_at).toLocaleDateString()}</strong>.
          </p>
        </div>

        {currentUser?.designation === 'Partner' && (
          <button
            onClick={() => setIsAddendumOpen(true)}
            className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-[2px] text-[11px] font-bold tracking-[0.04em] uppercase hover:bg-black/90 transition-colors"
          >
            <Plus size={12} />
            <span>Post-Lockdown Addendum</span>
          </button>
        )}
      </div>

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Folders Menu (1/4 width) */}
        <div className="bg-white border border-black/6 rounded-[12px] p-5 space-y-4">
          <h3 className="bebas-display text-[18px] text-black tracking-[0.04em] border-b border-black/6 pb-2">
            Archived Audit Areas
          </h3>
          
          <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
            {wps.map(wp => {
              const area = areas.find(a => a.id === wp.area_id);
              const isSelected = wp.id === selectedWpId;
              return (
                <button
                  key={wp.id}
                  onClick={() => setSelectedWpId(wp.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-[2px] border text-[13px] transition-colors flex items-center justify-between ${
                    isSelected 
                      ? 'bg-black text-white border-black font-bold' 
                      : 'bg-transparent border-black/6 text-black/55 hover:bg-black/[0.015]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={13} />
                    <span className="font-mono text-[11px] font-bold">{area?.code}</span>
                    <span className="truncate max-w-[120px]">{area?.name}</span>
                  </div>
                  <Lock size={10} className={isSelected ? 'text-white' : 'text-black/30'} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Read-Only Working Paper Details (3/4 width) */}
        <div className="lg:col-span-3 bg-white border border-black/6 rounded-[12px] p-6 min-h-[420px] space-y-6">
          {selectedWp ? (
            <div className="space-y-6 animate-fadeInUp">
              
              {/* Ref Details */}
              <div className="border-b border-black/6 pb-4 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-[2px] border border-amber-200">
                      {selectedWp.reference_code}
                    </span>
                    <h2 className="bebas-display text-[24px] text-black tracking-[0.04em]">
                      {selectedWp.title}
                    </h2>
                  </div>
                  <p className="text-[12px] text-black/40 mt-1">
                    Audited and signed off by peer verification managers.
                  </p>
                </div>
                
                <div className="text-right text-[11px] text-black/40">
                  <div>Prepared By: <span className="text-black font-bold">{getPreparerName(selectedWp)}</span></div>
                  <div>Reviewed By: <span className="text-black font-bold">{getReviewerName(selectedWp)}</span></div>
                </div>
              </div>

              {/* Objective */}
              <div className="space-y-1">
                <span className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Audit Objective</span>
                <p className="text-[13px] text-black/60 leading-relaxed font-mono italic">
                  {selectedWp.objective || 'Objective details not documented.'}
                </p>
              </div>

              {/* Substantive findings */}
              <div className="space-y-1">
                <span className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Assessed Observations Log</span>
                <div className="p-4 bg-black/[0.015] border border-black/6 rounded-[4px] font-mono text-[12.5px] leading-relaxed text-black/70 whitespace-pre-line">
                  {selectedWp.observations || 'No substantive observations logged.'}
                </div>
              </div>

              {/* Final conclusion */}
              <div className="space-y-2 border-l-2 border-emerald-600 pl-4 py-1">
                <span className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Final Professional Conclusion</span>
                <p className="text-[14px] text-black font-serif italic leading-relaxed">
                  {selectedWp.conclusion || 'Audit conclusion not signed.'}
                </p>
                <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold tracking-[0.04em] uppercase mt-1">
                  <CheckCircle2 size={13} />
                  <span>Statically Approved & Crypto-Stamped (SA 230)</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center">
              <FileText className="text-black/25" size={40} />
              <p className="text-[14px] text-black/40 italic">
                Select an archived folder tab from the side panel menu to load regulatory document content records.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* POST-LOCKDOWN ADDENDUM LEDGER */}
      {addendumLogs.length > 0 && (
        <div className="bg-white border border-black/6 rounded-[12px] p-6 space-y-4 ui-enter-stagger">
          <h3 className="bebas-display text-[20px] text-black tracking-[0.04em]">
            EXCEPTIONAL POST-LOCKDOWN MODIFICATION LOGS (SA 230 PARA 16 ADDENDUMS)
          </h3>
          
          <div className="divide-y divide-black/6">
            {addendumLogs.map(log => {
              const prep = users.find(u => u.id === log.preparer_id)?.full_name || 'Partner';
              return (
                <div key={log.id} className="py-4 space-y-2 text-[12.5px]">
                  <div className="flex justify-between items-baseline text-[10px] font-bold text-black/40 uppercase">
                    <span>Addendum Log ID: {log.id}</span>
                    <span className="font-mono">IP: {log.ip_address} | Timestamp: {new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-bold text-black block mb-0.5">Late Modification Rationale:</span>
                    <p className="text-accent-red font-mono">{log.reason}</p>
                  </div>
                  <div className="pt-1">
                    <span className="font-bold text-black block mb-0.5">Addendum Details & Findings:</span>
                    <p className="text-black/70 leading-relaxed font-mono whitespace-pre-line bg-black/[0.01] p-3 border border-black/6 rounded-[4px]">
                      {log.content}
                    </p>
                  </div>
                  <div className="text-[11px] text-black/40 italic">
                    Stamped by: {prep}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* POST LOCKDOWN ADD MODAL */}
      {isAddendumOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-black/8 rounded-[12px] w-full max-w-[550px] shadow-2xl p-6 space-y-4 animate-fadeInUp">
            <div className="flex justify-between items-center border-b border-black/6 pb-2">
              <h3 className="bebas-display text-[20px] text-black tracking-[0.04em]">
                Post-Lockdown Addendum (SA 230 Para 16)
              </h3>
              <button onClick={() => setIsAddendumOpen(false)} className="text-black/30 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostLockdownSubmit} className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 text-accent-red text-[11px] rounded-[12px] leading-relaxed">
                <ShieldAlert size={14} className="inline mr-1" />
                <strong>Audit File is Hard-Locked.</strong> Modifying or deleting existing observations and attachments is strictly blocked. Use this console only to append newly discovered subsequent facts.
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">
                  Reason for Late Addition / Fact Discovery
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Circular confirmation circularized late by Tata Motors bank rep."
                  value={addendumReason}
                  onChange={(e) => setAddendumReason(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">
                  Addendum Content / Evidentiary Data
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="e.g., We received direct balance confirmation letter from SBI Bank on July 15, confirming the year-end balance of ₹45,12,000, matching general ledger books. Discrepancy cleared..."
                  value={addendumContent}
                  onChange={(e) => setAddendumContent(e.target.value)}
                  className="w-full p-3 text-[13px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddendumOpen(false)}
                  className="px-4 py-2 border border-black/10 rounded-[2px] text-[11px] font-bold text-black/55 uppercase hover:bg-black/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-5 py-2 rounded-[2px] text-[11px] font-bold tracking-[0.04em] uppercase"
                >
                  Append Addendum Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
