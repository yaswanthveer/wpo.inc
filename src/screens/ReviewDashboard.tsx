import React, { useState } from 'react';
import { useAppStore } from '../db/store';
import { 
  CheckCircle, 
  CornerDownLeft, 
  MessageSquare, 
  ArrowRight, 
  Send,
  FileText,
  FileSpreadsheet,
  X
} from 'lucide-react';
import type { WorkingPaper } from '../db/schema';

export const ReviewDashboard: React.FC = () => {
  const { 
    workingPapers, clients, engagements, users, observations, reviewNotes,
    rejectAndBounceBack, approveAndSignOff,
    setObservationDisposition, addReviewNote
  } = useAppStore();

  const [selectedWpId, setSelectedWpId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  
  // Rejection note dialog state
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');

  // Local JV reference input map
  const [jvRefMap, setJvRefMap] = useState<Record<string, string>>({});

  const reviewPapers = workingPapers.filter(wp => wp.status === 'review');

  const getClientName = (wp: WorkingPaper) => {
    const eng = engagements.find(e => e.id === wp.engagement_id);
    return clients.find(c => c.id === eng?.client_id)?.name || 'Unknown Client';
  };

  const getPreparedBy = (wp: WorkingPaper) => {
    return users.find(u => u.id === wp.prepared_by)?.full_name || 'Senior Associate';
  };

  const selectedWp = workingPapers.find(w => w.id === selectedWpId);
  const selectedWpComments = selectedWpId 
    ? reviewNotes.filter(n => n.working_paper_id === selectedWpId) 
    : [];
  
  const selectedWpObs = selectedWpId 
    ? observations.filter(o => o.working_paper_id === selectedWpId) 
    : [];

  const handleApproveClick = (wpId: string) => {
    try {
      approveAndSignOff(wpId);
      alert('Working paper signed-off and approved. Status set to Complete.');
      setSelectedWpId(null);
    } catch (err: any) {
      alert(err.message || 'Approval blocked.');
    }
  };

  const handleReturnClick = () => {
    if (!selectedWpId) return;
    if (!rejectionNote.trim()) {
      alert('Please state a reason for returning the folder.');
      return;
    }

    rejectAndBounceBack(selectedWpId, rejectionNote);
    alert('Working paper returned to draft status with review notes.');
    setIsRejectOpen(false);
    setRejectionNote('');
    setSelectedWpId(null);
  };

  const postComment = (wpId: string) => {
    if (!commentText.trim()) return;
    addReviewNote(wpId, commentText);
    setCommentText('');
  };

  // Check if all observations have non-pending dispositions
  const allDispositionsAddressed = selectedWpObs.every(o => o.disposition && o.disposition !== 'pending');

  return (
    <div className="space-y-6 ui-enter-stagger">
      <div>
        <h1 className="text-[clamp(26px,3.2vw,40px)] bebas-display tracking-[0.04em] text-black leading-none">
          Review Notes & Sign-Off Dashboard
        </h1>
        <p className="text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase mt-1">
          Independent review queue · Audit working papers awaiting Partner / Manager approval under Standards on Auditing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Waiting WPs (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-black/6 rounded-[12px] p-5 space-y-4">
            <h2 className="bebas-display text-xl tracking-[0.04em] text-black border-b border-black/6 pb-2">
              Awaiting Professional Sign-Off ({reviewPapers.length})
            </h2>

            <div className="divide-y divide-black/6">
              {reviewPapers.length === 0 ? (
                <div className="py-12 text-center text-[14px] text-black/35 italic">
                  No working papers currently awaiting review. All audit files clear.
                </div>
              ) : (
                reviewPapers.map((paper) => {
                  const clientName = getClientName(paper);
                  const isSelected = selectedWpId === paper.id;
                  return (
                    <div 
                      key={paper.id} 
                      onClick={() => setSelectedWpId(paper.id)}
                      className={`py-3 px-3 flex flex-col justify-between gap-2.5 cursor-pointer transition-all duration-200 rounded-[4px] border ${
                        isSelected 
                          ? 'bg-sky-50/50 border-sky-200' 
                          : 'hover:bg-black/[0.015] border-transparent'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-[2px] font-bold border border-amber-200">
                            {paper.reference_code}
                          </span>
                          <span className="text-[10px] text-black/35 font-bold uppercase font-mono">v{paper.version || 1}</span>
                        </div>
                        <h3 className="bebas-display text-[16px] text-black tracking-[0.04em] mt-1.5 leading-none">
                          {paper.title}
                        </h3>
                        <p className="text-[10px] text-black/40 mt-1 font-mono">
                          Client: {clientName}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] mt-1 text-[10px] text-black/40">
                        <span>Prep: {getPreparedBy(paper)}</span>
                        <span className="text-accent-red hover:underline flex items-center gap-0.5 font-bold tracking-[0.04em] uppercase text-[9.5px]">
                          <span>Review</span>
                          <ArrowRight size={10} />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Split Screen Viewer Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedWp ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* SPLIT 1: LEAD SHEET & DISPOSITIONS (Left viewport) */}
              <div className="bg-white border border-black/6 rounded-[12px] p-6 space-y-5">
                <div className="border-b border-black/6 pb-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-[2px] border border-amber-200">
                      {selectedWp.reference_code}
                    </span>
                    <span className="text-[10px] text-black/40 font-mono">v{selectedWp.version || 1} Lead Sheet</span>
                  </div>
                  <h3 className="bebas-display text-xl text-black tracking-[0.04em] mt-2">
                    {selectedWp.title}
                  </h3>
                  <p className="text-[10px] text-black/40 mt-0.5 font-mono">
                    Client: {getClientName(selectedWp)}
                  </p>
                </div>

                {/* Submission lock details */}
                {selectedWp.submission_lock && (
                  <div className="p-3 bg-black/[0.02] border border-black/6 rounded-[12px] space-y-2 text-[11px] font-mono text-black/55 leading-normal">
                    <div className="flex justify-between font-bold text-black border-b border-black/[0.04] pb-1">
                      <span>Audit Lock Parameters</span>
                      <span>{selectedWp.submission_lock.lead_sheet_hash}</span>
                    </div>
                    <p><strong>Objective:</strong> {selectedWp.submission_lock.audit_objective_assessed}</p>
                    <p><strong>Selection Basis (SA 530):</strong> {selectedWp.submission_lock.sample_size_basis}</p>
                    <p><strong>Conclusion:</strong> {selectedWp.submission_lock.substantive_conclusion}</p>
                  </div>
                )}

                {/* Interactive Observation Table & Dispositions */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">
                    Interactive Observations & Dispositions ({selectedWpObs.length})
                  </h4>

                  <div className="space-y-3">
                    {selectedWpObs.length === 0 ? (
                      <p className="text-[12px] text-black/35 italic">No sample exceptions logged by assistant maker.</p>
                    ) : (
                      selectedWpObs.map(obs => (
                        <div key={obs.id} className="p-3 bg-black/[0.015] border border-black/6 rounded-[4px] space-y-2.5">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-[12.5px] font-bold text-black">{obs.title}</h5>
                              <span className="text-[9.5px] text-black/40 font-mono">Row pointer: {obs.excel_row_reference}</span>
                            </div>
                            <span className="text-[11.5px] font-mono font-bold text-black">₹{obs.financial_impact.toLocaleString()}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="text-[9px] font-bold text-black/40 uppercase">Disposition:</label>
                            <select
                              value={obs.disposition || 'pending'}
                              onChange={(e) => setObservationDisposition(obs.id, e.target.value as any)}
                              className="bg-white border border-black/10 rounded-[2px] px-1.5 py-0.5 text-[10.5px]"
                            >
                              <option value="pending">Pending review</option>
                              <option value="rectified">Rectified by Client</option>
                              <option value="waived">Waived due to Immateriality</option>
                              <option value="escalated">Escalate to Partner</option>
                            </select>
                          </div>

                          {/* Mandatory Journal Voucher entry if Rectified */}
                          {obs.disposition === 'rectified' && (
                            <div className="space-y-1 pt-1 border-t border-black/[0.04]">
                              <label className="block text-[9px] font-bold text-emerald-700 uppercase">
                                Adjustment Journal Voucher Number *
                              </label>
                              <input
                                type="text"
                                placeholder="JV/2026/TRE/102"
                                value={obs.disposition_reference || jvRefMap[obs.id] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setJvRefMap(prev => ({ ...prev, [obs.id]: val }));
                                  setObservationDisposition(obs.id, 'rectified', val);
                                }}
                                className="w-full px-2 py-1 text-[11px] bg-white border border-black/10 rounded-[2px]"
                              />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Review Notes Comments thread */}
                <div className="space-y-3 pt-3 border-t border-black/6">
                  <h4 className="text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase flex items-center gap-1">
                    <MessageSquare size={12} />
                    <span>Review Queries Thread ({selectedWpComments.length})</span>
                  </h4>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {selectedWpComments.length === 0 ? (
                      <p className="text-[12.5px] text-black/35 italic text-center py-2">
                        No active review queries. All clear.
                      </p>
                    ) : (
                      selectedWpComments.map(c => (
                        <div key={c.id} className="p-2.5 bg-black/[0.02] rounded-[4px] border border-black/6 space-y-1">
                          <div className="flex justify-between text-[9px] text-black/40 font-bold">
                            <span>{c.author_name}</span>
                            <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-[13px] text-black/65 font-normal leading-normal">{c.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add reviewer query..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') postComment(selectedWp.id); }}
                      className="flex-1 px-3 py-1.5 text-[13px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30"
                    />
                    <button
                      onClick={() => postComment(selectedWp.id)}
                      className="bg-black hover:bg-black/90 text-white p-2 rounded-[2px] cursor-pointer"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-black/6">
                  <button
                    onClick={() => setIsRejectOpen(true)}
                    className="flex items-center justify-center gap-1.5 bg-accent-red hover:bg-red-600 text-white text-[10px] font-bold tracking-[0.04em] uppercase py-2.5 rounded-[2px] transition-colors"
                  >
                    <CornerDownLeft size={13} />
                    <span>Bounce Back</span>
                  </button>
                  <button
                    disabled={!allDispositionsAddressed}
                    onClick={() => handleApproveClick(selectedWp.id)}
                    className={`flex items-center justify-center gap-1.5 text-white text-[10px] font-bold tracking-[0.04em] uppercase py-2.5 rounded-[2px] transition-colors ${
                      allDispositionsAddressed 
                        ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer' 
                        : 'bg-black/15 text-black/30 border border-black/5 cursor-not-allowed'
                    }`}
                    title={!allDispositionsAddressed ? "Blocked: resolve dispositions for all observation rows" : "Approve sheet"}
                  >
                    <CheckCircle size={13} />
                    <span>Approve File</span>
                  </button>
                </div>
              </div>

              {/* SPLIT 2: EXCEL SPREADSHEET PREVIEW (Right viewport) */}
              <div className="bg-white border border-black/6 rounded-[12px] p-6 space-y-4">
                <div className="border-b border-black/6 pb-3 flex items-center gap-2">
                  <FileSpreadsheet className="text-emerald-750 text-emerald-600" size={18} />
                  <h3 className="bebas-display text-xl text-black tracking-[0.04em]">
                    Spreadsheet Vouching View
                  </h3>
                </div>

                {/* Simulated Sheet rows */}
                <div className="border border-black/10 rounded font-mono text-[10px] overflow-hidden">
                  <div className="bg-black/[0.04] p-1.5 border-b border-black/10 font-bold flex justify-between uppercase">
                    <span>Vouching Ledger Rows</span>
                    <span>Exceptions in Red</span>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-black/6 p-1 space-y-1 bg-white">
                    <div className="flex justify-between py-1 px-1 bg-red-50 text-red-700 font-bold border border-red-100">
                      <span>Row 45: Inv #1021 - ₹4,50,000</span>
                      <span>Mismatch Date</span>
                    </div>
                    <div className="flex justify-between py-1 px-1">
                      <span>Row 46: Inv #1022 - ₹1,20,000</span>
                      <span>OK</span>
                    </div>
                    <div className="flex justify-between py-1 px-1 bg-red-50 text-red-700 font-bold border border-red-100">
                      <span>Row 50: Inv #1026 - ₹9,70,000</span>
                      <span>No Challan Sign</span>
                    </div>
                    <div className="flex justify-between py-1 px-1">
                      <span>Row 51: Inv #1027 - ₹2,30,000</span>
                      <span>OK</span>
                    </div>
                    <div className="flex justify-between py-1 px-1">
                      <span>Row 52: Inv #1028 - ₹5,40,000</span>
                      <span>OK</span>
                    </div>
                    <div className="flex justify-between py-1 px-1">
                      <span>Row 180: Inv #1156 - ₹8,90,000</span>
                      <span>OK</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-black/[0.02] border border-black/6 rounded-[12px] text-[11px] text-black/55 leading-relaxed">
                  <span className="font-bold text-black block mb-0.5">Mock Excel Ingestion Grid</span>
                  Reviewing formulas and columns. Checked cells linked directly with Row pointer ref.
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-black/[0.02] border border-black/6 rounded-[12px] p-8 text-center text-[14px] text-black/35 italic min-h-[400px] flex flex-col items-center justify-center space-y-3">
              <FileText className="text-black/30" size={32} />
              <p>Select a working paper from the queue list to enter the Independent Review Viewport Canvas.</p>
            </div>
          )}
        </div>

      </div>

      {/* BOUNCE BACK REJECTION DIALOG */}
      {isRejectOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-black/8 rounded-[12px] w-full max-w-[450px] shadow-2xl p-6 space-y-4 animate-fadeInUp">
            <div className="flex justify-between items-center border-b border-black/6 pb-2">
              <h3 className="bebas-display text-[20px] text-black tracking-[0.04em]">Reject & Return Worksheet</h3>
              <button onClick={() => setIsRejectOpen(false)} className="text-black/30 hover:text-black"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <p className="text-[12.5px] text-black/55 font-bold uppercase tracking-[0.04em] text-accent-red">Correction Request Details</p>
              <textarea
                rows={4}
                required
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="State the specific audit procedures or clarifications required by the assistant..."
                className="w-full p-3 text-[13px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsRejectOpen(false)}
                className="px-4 py-2 border border-black/10 rounded-[2px] text-[11px] font-bold text-black/55 uppercase hover:bg-black/[0.02]"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnClick}
                className="bg-accent-red hover:bg-red-600 text-white px-5 py-2 rounded-[2px] text-[11px] font-bold tracking-[0.04em] uppercase"
              >
                Bounce Back File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
