import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../db/store';
import { ArrowLeft, Plus, Check, X, ShieldAlert, Mail, Copy } from 'lucide-react';

export const PBCMatrix: React.FC = () => {
  const { engagementId } = useParams<{ engagementId: string }>();
  const { 
    engagements, clients, auditAreas, clientRequests,
    createClientRequest, approveClientRequest, deleteClientRequest, clonePriorYearRequests,
    generateClientPortalToken, verifyClientDocument
  } = useAppStore();

  const engagement = engagements.find(e => e.id === engagementId);
  const client = engagement ? clients.find(c => c.id === engagement.client_id) : null;
  const currentAreas = auditAreas.filter(a => a.engagement_id === engagementId);

  // Form State for new Request row
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [areaId, setAreaId] = useState(currentAreas[0]?.id || '');
  const [docReq, setDocReq] = useState('');
  const [period, setPeriod] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // Client Portal link generator states
  const [clientEmail, setClientEmail] = useState('');
  const [showPortalToken, setShowPortalToken] = useState<any>(null);

  // Manager rejection comment modal
  const [rejectComment, setRejectComment] = useState('');
  const [rejectingReqId, setRejectingReqId] = useState<string | null>(null);

  if (!engagement || !client) {
    return (
      <div className="text-center py-12 bg-white border border-black/6 rounded-[12px] max-w-xl mx-auto mt-20">
        <p className="text-[14px] text-black/55 italic">Engagement not found.</p>
        <Link to="/dashboard" className="text-[12px] text-accent-red hover:underline mt-4">Return to Dashboard</Link>
      </div>
    );
  }

  const activeReqs = clientRequests.filter(r => r.engagement_id === engagementId);

  // Other engagements to clone from
  const otherEngagements = engagements.filter(e => e.client_id === engagement.client_id && e.id !== engagement.id);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docReq.trim()) return;
    createClientRequest(engagement.id, areaId, docReq, period, priority);
    setDocReq('');
    setPeriod('');
    setIsFormOpen(false);
  };

  const handleSharePortal = () => {
    if (!clientEmail.trim()) {
      alert('Please enter client contact email address.');
      return;
    }
    const tokenObj = generateClientPortalToken(engagement.id, clientEmail);
    setShowPortalToken(tokenObj);
  };

  const submitReject = () => {
    if (!rejectingReqId) return;
    verifyClientDocument(rejectingReqId, false, rejectComment);
    setRejectingReqId(null);
    setRejectComment('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6 ui-enter-stagger">
      {/* Nav */}
      <nav className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="text-black/40 hover:text-black transition-colors duration-200">
            Engagements
          </Link>
          <span className="text-black/20">/</span>
          <Link to={`/engagement/${engagement.id}`} className="text-black/40 hover:text-black transition-colors duration-200">
            {client.name}
          </Link>
          <span className="text-black/20">/</span>
          <span className="text-black font-medium">Consolidated Client Requests (PBC)</span>
        </div>
        <Link 
          to={`/engagement/${engagement.id}`}
          className="flex items-center gap-1 text-[11px] text-black/55 hover:text-black transition-colors duration-200"
        >
          <ArrowLeft size={12} />
          <span>Back to Workspace</span>
        </Link>
      </nav>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/6 pb-5">
        <div>
          <h1 className="bebas-display text-[clamp(26px,3.2vw,40px)] text-black leading-none tracking-[0.04em]">
            Client Document Request Matrix (PBC)
          </h1>
          <p className="text-[12px] text-black/40 mt-1">
            Centrally manage audit evidence requests, compile prior year logs, and verify client portal uploads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {otherEngagements.length > 0 && (
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to clone request items from previous audit file (${otherEngagements[0].financial_year})?`)) {
                  clonePriorYearRequests(engagement.id, otherEngagements[0].id);
                }
              }}
              className="px-4 py-2 border border-black/10 rounded-[2px] text-[11px] font-bold text-black/50 hover:text-black hover:border-black/25 transition-colors duration-200 tracking-[0.04em] uppercase cursor-pointer"
            >
              Clone Prior Year Requests
            </button>
          )}

          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1 bg-black text-white px-4 py-2 rounded-[2px] text-[11px] font-bold tracking-[0.04em] uppercase hover:bg-black/90 transition-colors duration-200 cursor-pointer"
          >
            <Plus size={12} />
            <span>Add Request Item</span>
          </button>
        </div>
      </div>

      {/* Main Grid: left request table, right client portal details */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* REQUESTS LIST (3/4 width) */}
        <div className="lg:col-span-3 bg-white border border-black/6 rounded-[12px] p-6 space-y-4">
          <h3 className="bebas-display text-[20px] text-black tracking-[0.04em]">
            Consolidated Requirements Ledger ({activeReqs.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-black/10 text-left">
                  <th className="py-2 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">Area</th>
                  <th className="py-2 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">Requested Document</th>
                  <th className="py-2 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">Period/Context</th>
                  <th className="py-2 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">Priority</th>
                  <th className="py-2 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">Status</th>
                  <th className="py-2 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/6">
                {activeReqs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[13px] text-black/35 italic">
                      No document request items logged. Click "+ Add Request Item" to create one.
                    </td>
                  </tr>
                ) : (
                  activeReqs.map(req => {
                    const area = currentAreas.find(a => a.id === req.area_id);
                    return (
                      <tr key={req.id} className="hover:bg-black/[0.01] transition-colors duration-150">
                        <td className="py-3 font-mono text-[11px] font-bold text-amber-700">{area?.code || 'GEN'}</td>
                        <td className="py-3">
                          <div className="text-[13px] font-bold text-black">{req.document_requested}</div>
                          {req.client_uploaded_file && (
                            <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
                              📎 Uploaded: {req.client_uploaded_file}
                            </div>
                          )}
                          {req.status === 'rejected' && req.manager_comment && (
                            <div className="text-[10px] text-accent-red font-mono mt-0.5">
                              ⚠️ Reject Reason: {req.manager_comment}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-[12px] text-black/60 font-mono">{req.period_context || 'N/A'}</td>
                        <td className="py-3">
                          <span className={`text-[9px] font-bold tracking-[0.05em] uppercase px-1.5 py-0.5 rounded-[2px] ${
                            req.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-200' :
                            req.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                            'bg-black/[0.03] text-black/55 border border-black/8'
                          }`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`text-[9px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-[2px] ${
                            req.status === 'pending-internal' ? 'bg-black/[0.04] text-black/40' :
                            req.status === 'approved' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                            req.status === 'received' ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold' :
                            req.status === 'verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-red-50 text-red-600 border border-red-200'
                          }`}>
                            {req.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {req.status === 'received' && (
                              <>
                                <button
                                  onClick={() => verifyClientDocument(req.id, true)}
                                  className="p-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                  title="Accept & Ingest Document"
                                >
                                  <Check size={13} />
                                </button>
                                <button
                                  onClick={() => setRejectingReqId(req.id)}
                                  className="p-1 rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                                  title="Reject Document"
                                >
                                  <X size={13} />
                                </button>
                              </>
                            )}
                            {req.status === 'pending-internal' && (
                              <button
                                onClick={() => approveClientRequest(req.id)}
                                className="text-[10px] text-sky-600 font-bold hover:underline"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              onClick={() => deleteClientRequest(req.id)}
                              className="text-[10px] text-black/30 hover:text-accent-red font-bold uppercase transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CLIENT PORTAL LINK CONTROLLER (1/4 width) */}
        <div className="bg-white border border-black/6 rounded-[12px] p-6 space-y-5 h-fit">
          <div className="border-b border-black/6 pb-2">
            <h3 className="bebas-display text-[20px] text-black tracking-[0.04em]">
              Client Portal Access
            </h3>
            <p className="text-[11px] text-black/40 mt-1">
              Initialize a secure direct document ingestion portal for the client.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">
                Client Contact Email
              </label>
              <input
                type="email"
                placeholder="cfo@client.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-3 py-2 text-[13px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black transition-colors"
              />
            </div>

            <button
              onClick={handleSharePortal}
              className="w-full flex items-center justify-center gap-1.5 bg-black text-white py-2.5 rounded-[2px] text-[11px] font-bold tracking-[0.04em] uppercase hover:bg-black/90 transition-colors"
            >
              <Mail size={13} />
              <span>Generate & Share Access</span>
            </button>
          </div>

          {showPortalToken && (
            <div className="p-4 bg-black/[0.02] border border-black/6 rounded-[12px] space-y-3 text-[11px] animate-fadeInUp">
              <div className="flex items-center gap-1.5 text-accent-red font-bold uppercase tracking-[0.04em]">
                <ShieldAlert size={12} />
                <span>Simulated Secure Token</span>
              </div>
              <p className="text-black/55 leading-normal">
                Direct client interface link has been generated. Expiry: 14 days.
              </p>
              
              <div className="space-y-1.5 pt-2 border-t border-black/6">
                <div className="flex justify-between items-center text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">
                  <span>Magic Access Link</span>
                  <button 
                    onClick={() => {
                      copyToClipboard(`${window.location.origin}/portal/${showPortalToken.token}`);
                      alert('Portal Link copied to clipboard.');
                    }}
                    className="text-accent-red hover:underline flex items-center gap-0.5 cursor-pointer lowercase font-normal text-[9px]"
                  >
                    <Copy size={9} /> Copy Link
                  </button>
                </div>
                <div className="bg-white border border-black/10 p-2 rounded-[2px] font-mono break-all text-[9.5px] select-all">
                  {window.location.origin}/portal/{showPortalToken.token}
                </div>
              </div>

              <div className="space-y-1 font-mono pt-1">
                <div className="text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Simulated OTP Mobile Code</div>
                <div className="text-[16px] font-bold text-black tracking-widest">{showPortalToken.otp_code}</div>
              </div>

              <button
                onClick={() => window.open(`/portal/${showPortalToken.token}`, '_blank')}
                className="w-full text-center py-1.5 border border-black/10 rounded-[2px] bg-white hover:bg-black/[0.02] text-[11px] font-bold text-black/55 tracking-[0.04em] uppercase transition-colors"
              >
                Mock Open Portal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CREATE REQUEST DIALOG MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-black/8 rounded-[12px] w-full max-w-[500px] shadow-2xl p-6 space-y-4 animate-fadeInUp">
            <div className="flex justify-between items-center border-b border-black/6 pb-2">
              <h3 className="bebas-display text-[20px] text-black tracking-[0.04em]">Add Document Request</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-black/30 hover:text-black"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Audit Area Category</label>
                <select
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  className="w-full bg-white border border-black/10 rounded-[2px] px-3 py-2 text-[13px]"
                >
                  {currentAreas.map(a => (
                    <option key={a.id} value={a.id}>({a.code}) {a.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Document/Report Requested</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., GST-3B filings summary report"
                  value={docReq}
                  onChange={(e) => setDocReq(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Financial Period / Scope</label>
                  <input
                    type="text"
                    placeholder="e.g., FY 2025-26 - Q3"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-white border border-black/10 rounded-[2px] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Priority Category</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-white border border-black/10 rounded-[2px] px-3 py-2 text-[13px]"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-black/10 rounded-[2px] text-[11px] font-bold text-black/55 uppercase hover:bg-black/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-5 py-2 rounded-[2px] text-[11px] font-bold tracking-[0.04em] uppercase"
                >
                  Add Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION REASON DIALOG MODAL */}
      {rejectingReqId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-black/8 rounded-[12px] w-full max-w-[450px] shadow-2xl p-6 space-y-4 animate-fadeInUp">
            <div className="flex justify-between items-center border-b border-black/6 pb-2">
              <h3 className="bebas-display text-[20px] text-black tracking-[0.04em]">Reject Document Request</h3>
              <button onClick={() => setRejectingReqId(null)} className="text-black/30 hover:text-black"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <p className="text-[12px] text-black/55">Provide details to the client explaining why the uploaded document was rejected.</p>
              <textarea
                rows={4}
                required
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="e.g. The uploaded ledger is missing transactions for March 2026. Please upload the complete FY ledger."
                className="w-full p-3 text-[13px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectingReqId(null)}
                className="px-4 py-2 border border-black/10 rounded-[2px] text-[11px] font-bold text-black/55 uppercase hover:bg-black/[0.02]"
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                className="bg-accent-red text-white px-5 py-2 rounded-[2px] text-[11px] font-bold tracking-[0.04em] uppercase hover:bg-red-600 transition-colors"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
