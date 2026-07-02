import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../db/store';
import { Calendar, ArrowRight, Plus, FolderSync, ShieldCheck, HelpCircle, X } from 'lucide-react';
import type { AuditArea } from '../db/schema';

export const EngagementDetail: React.FC = () => {
  const { engagementId } = useParams<{ engagementId: string }>();
  const navigate = useNavigate();
  const { 
    engagements, clients, auditAreas, workingPapers, users,
    addCustomAuditArea, updateAreaAssignment, createClientRequest,
    updateAuditAreaName, deleteAuditArea, trashBin, restoreAuditArea
  } = useAppStore();

  const engagement = engagements.find(e => e.id === engagementId);
  if (!engagement) {
    return (
      <div className="text-center py-12 bg-white border border-black/6 rounded-[12px]">
        <p className="text-[12px] text-black/35 italic">Engagement not found.</p>
        <Link to="/dashboard" className="text-[12px] text-accent-red hover:underline mt-4 inline-block font-bold tracking-[0.04em] uppercase">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const client = clients.find(c => c.id === engagement.client_id);
  const areas = auditAreas.filter(a => a.engagement_id === engagement.id);
  const wps = workingPapers.filter(w => w.engagement_id === engagement.id);

  // Modal Injector states
  const [isInjectOpen, setIsInjectOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customObjective, setCustomObjective] = useState('');
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  // Inline PBC Request states
  const [pbcAreaId, setPbcAreaId] = useState<string | null>(null);
  const [pbcDocReq, setPbcDocReq] = useState('');
  const [pbcPeriod, setPbcPeriod] = useState('');
  const [pbcPriority, setPbcPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // Stats calculation
  const totalAreas = areas.length;
  const completedAreas = areas.filter(a => a.status === 'complete').length;
  const reviewAreas = areas.filter(a => a.status === 'review').length;
  
  // Overall progress
  const overallProgress = totalAreas > 0 
    ? Math.round(areas.reduce((acc, curr) => acc + curr.completion_pct, 0) / totalAreas) 
    : 0;

  const partner = users.find(u => u.id === engagement.partner_id);
  const manager = users.find(u => u.id === engagement.manager_id);

  const getAreaStatusBadgeClass = (status: AuditArea['status']) => {
    switch (status) {
      case 'complete':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'review':
        return 'bg-sky-50 text-sky-700 border border-sky-200';
      case 'in-progress':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-black/[0.03] text-black/40 border border-black/6';
    }
  };

  const getAreaStatusLabel = (status: AuditArea['status']) => {
    switch (status) {
      case 'complete': return 'Complete';
      case 'review': return 'Under Review';
      case 'in-progress': return 'In Progress';
      default: return 'Pending';
    }
  };

  const handleAreaClick = (area: AuditArea) => {
    const wp = wps.find(w => w.area_id === area.id);
    if (wp) {
      navigate(`/wp/${wp.id}`);
    } else {
      alert(`No working paper initialized for this area. Code: ${area.code}`);
    }
  };

  const handleInjectCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customObjective.trim()) return;
    addCustomAuditArea(engagement.id, customName, customObjective);
    setCustomName('');
    setCustomObjective('');
    setIsInjectOpen(false);
  };

  const submitPbcRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pbcAreaId || !pbcDocReq.trim()) return;
    createClientRequest(engagement.id, pbcAreaId, pbcDocReq, pbcPeriod, pbcPriority);
    setPbcDocReq('');
    setPbcPeriod('');
    setPbcAreaId(null);
    alert('Document request logged. Shared in PBC Matrix.');
  };

  const isPlanningFinalized = engagement.planning?.planning_finalized;

  return (
    <div className="space-y-6 ui-enter-stagger">
      
      {/* Navigation Breadcrumbs */}
      <nav className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="text-black/40 hover:text-black transition-colors duration-200">
            Engagements
          </Link>
          <span className="text-black/20">/</span>
          <span className="text-black font-medium">{client?.name || 'Client Details'}</span>
        </div>
        <Link 
          to="/dashboard"
          className="flex items-center gap-1 text-[11px] text-black/55 hover:text-black transition-colors duration-200"
        >
          <ArrowRight className="rotate-180" size={12} />
          <span>Dashboard</span>
        </Link>
      </nav>

      {/* STAGE 1: Planning status indicator banner */}
      {!isPlanningFinalized ? (
        <div className="bg-red-50 border border-red-200 rounded-[12px] p-5 flex items-center justify-between gap-4 animate-fadeInUp">
          <div className="space-y-1">
            <h4 className="text-[14px] font-bold text-accent-red flex items-center gap-1.5 uppercase tracking-[0.04em]">
              <HelpCircle size={16} />
              <span>Engagement Planning Pending (SA 210 / SA 315)</span>
            </h4>
            <p className="text-[12px] text-black/55">
              The engagement is not initialized. Please sign the Terms of Engagement letter and document Risk Assessments before publishing.
            </p>
          </div>
          <Link
            to={`/planning`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/engagement/${engagement.id}/planning`);
            }}
            className="bg-accent-red text-white font-bold tracking-[0.04em] uppercase text-[11px] px-4 py-2 rounded-[2px] hover:bg-red-600 transition-colors"
          >
            Start Planning
          </Link>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-[12px] p-4 flex items-center justify-between gap-4 animate-fadeInUp text-[12px] text-emerald-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-700 shrink-0" size={18} />
            <p>
              <strong>SA 210 & SA 315 Planning finalized</strong> on {new Date(engagement.planning?.planning_finalized_at || '').toLocaleDateString()}. Worksheets unlocked for execution.
            </p>
          </div>
          <Link
            to={`/engagement/${engagement.id}/planning`}
            className="text-[11px] text-emerald-700 font-bold uppercase tracking-[0.04em] hover:underline"
          >
            View Planning Docs
          </Link>
        </div>
      )}

      {/* Engagement Header Card */}
      <div className="bg-white border border-black/6 rounded-[12px] p-6 space-y-6 ui-enter-stagger" style={{ '--enter-delay': '0.06s' } as React.CSSProperties}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="bebas-display text-[clamp(26px,3.2vw,40px)] text-black leading-none tracking-[0.04em]">
                {client?.name}
              </h1>
              <span className="text-[10px] font-bold tracking-[0.1em] uppercase bg-accent-red/10 text-accent-red px-2 py-0.5 rounded-[2px] border border-accent-red/15">
                {engagement.engagement_type}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-black/55">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-black/35" />
                <span className="font-mono">{engagement.financial_year}</span>
              </span>
              {client?.pan && (
                <span className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">PAN:</span>
                  <span className="font-mono font-medium text-black">{client.pan}</span>
                </span>
              )}
              {client?.industry && (
                <span className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">SECTOR:</span>
                  <span className="font-medium text-black">{client.industry}</span>
                </span>
              )}
              {client?.city && (
                <span className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">LOCATION:</span>
                  <span className="font-medium text-black">{client.city}</span>
                </span>
              )}
            </div>
          </div>

          {/* Partner & Manager initials */}
          <div className="flex items-center gap-6 text-[12px] border-l border-black/6 pl-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase block">Lead Partner</span>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center font-bold text-[9px]">
                  {partner?.initials || '-'}
                </span>
                <span className="font-medium text-black">{partner?.full_name || 'Unassigned'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase block">Reviewer / Manager</span>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-black/[0.06] text-black/55 flex items-center justify-center font-bold text-[9px] border border-black/6">
                  {manager?.initials || '-'}
                </span>
                <span className="font-medium text-black">{manager?.full_name || 'Unassigned'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-black/6"></div>

        {/* Overall Completion Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-2">
            <div className="flex justify-between items-baseline text-[12px]">
              <span className="font-medium text-black/55">Overall Documentation Sufficiency</span>
              <span className="font-mono text-[14px] font-semibold text-black">{overallProgress}% <span className="text-black/40 text-[11px]">Complete</span></span>
            </div>
            <div className="h-2 bg-black/[0.04] border border-black/6 rounded-full overflow-hidden">
              <div 
                className="h-full bg-black rounded-full transition-all duration-500" 
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-around border-l border-black/6 py-1 text-center">
            <div>
              <span className="text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Completed Areas</span>
              <p className="bebas-display text-[24px] text-emerald-600 mt-0.5 tracking-[0.04em]">{completedAreas} / {totalAreas}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Under Review</span>
              <p className="bebas-display text-[24px] text-sky-600 mt-0.5 tracking-[0.04em]">{reviewAreas} / {totalAreas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Audit Area Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="bebas-display text-[24px] text-black tracking-[0.04em]">
            Standard Audit Areas (Section SA-230 Audit Documentation)
          </h2>
          <p className="text-[12px] text-black/40">
            Assigned sheets mapped with ICAI standards. Use target scopes to direct articled assistants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/engagement/${engagement.id}/pbc`)}
            className="flex items-center gap-1 border border-black/10 hover:border-black/25 rounded-[2px] px-4 py-2 text-[11px] font-bold text-black/55 tracking-[0.04em] uppercase transition-colors cursor-pointer bg-white"
          >
            <FolderSync size={12} />
            <span>PBC Client Matrix</span>
          </button>

          <button
            onClick={() => setIsTrashOpen(true)}
            className="flex items-center gap-1.5 border border-black/10 hover:border-black/25 rounded-[2px] px-4 py-2 text-[11px] font-bold text-black/55 tracking-[0.04em] uppercase transition-colors cursor-pointer bg-white"
          >
            <span>Trash Bin ({trashBin.filter(t => t.engagement_id === engagement.id).length})</span>
          </button>

          {isPlanningFinalized && (
            <button
              onClick={() => setIsInjectOpen(true)}
              className="flex items-center gap-1 bg-black text-white px-4 py-2 rounded-[2px] text-[11px] font-bold tracking-[0.04em] uppercase hover:bg-black/90 transition-colors duration-200 cursor-pointer"
            >
              <Plus size={12} />
              <span>Inject Custom Tab</span>
            </button>
          )}
        </div>
      </div>

      {/* 12+ Audit Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {areas.map((area, index) => {
          const statusBadge = getAreaStatusBadgeClass(area.status);

          return (
            <div
              key={area.id}
              className="bg-white border border-black/6 rounded-[12px] p-5 flex flex-col justify-between min-h-[220px] transition-all duration-200 hover:border-black/20 card-hover-lift ui-enter-stagger"
              style={{ '--enter-delay': `${0.18 + index * 0.04}s` } as React.CSSProperties}
            >
              <div>
                {/* Header elements */}
                <div className="flex justify-between items-center border-b border-black/6 pb-2">
                  <span 
                    onClick={() => handleAreaClick(area)}
                    className="font-mono text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[2px] border border-amber-200 cursor-pointer"
                  >
                    {area.code}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newName = prompt(`Enter new name for "${area.name}":`, area.name);
                        if (newName && newName.trim()) {
                          updateAuditAreaName(area.id, newName.trim());
                        }
                      }}
                      className="text-[9.5px] text-black/40 hover:text-black font-bold uppercase transition-colors"
                      title="Edit Area Name"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`CAUTION: Deleting "${area.name}" will permanently destroy all of its associated working papers, uploaded documents, procedures, and observation logs.\n\nAre you sure you want to proceed?`)) {
                          deleteAuditArea(area.id);
                        }
                      }}
                      className="text-[9.5px] text-black/35 hover:text-accent-red font-bold uppercase transition-colors"
                      title="Delete Area"
                    >
                      Delete
                    </button>
                    <span className={`text-[9px] uppercase tracking-[0.08em] font-bold px-2 py-0.5 rounded-[2px] ${statusBadge}`}>
                      {getAreaStatusLabel(area.status)}
                    </span>
                  </div>
                </div>

                <h3 
                  onClick={() => handleAreaClick(area)}
                  className="bebas-display text-[20px] text-black mt-3 leading-tight hover:text-accent-red cursor-pointer transition-colors duration-200 tracking-[0.04em]"
                >
                  {area.name}
                </h3>
              </div>

              {/* Assignment matrix picker controls */}
              <div className="space-y-2 mt-4 pt-3 border-t border-black/6">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="block text-[9px] font-bold text-black/35 uppercase">Lead Partner / Manager</label>
                    <select
                      value={area.assigner_id || ''}
                      onChange={(e) => updateAreaAssignment(area.id, { assignerId: e.target.value })}
                      className="w-full bg-white border border-black/10 rounded-[2px] px-1 py-0.5 mt-0.5 text-[10.5px]"
                    >
                      <option value="">Select Manager</option>
                      {users.filter(u => u.designation === 'Partner' || u.designation === 'Manager').map(u => (
                        <option key={u.id} value={u.id}>{u.initials} — {u.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-black/35 uppercase">Assigned Assistant</label>
                    <select
                      value={area.assignee_id || ''}
                      onChange={(e) => updateAreaAssignment(area.id, { assigneeId: e.target.value })}
                      className="w-full bg-white border border-black/10 rounded-[2px] px-1 py-0.5 mt-0.5 text-[10.5px]"
                    >
                      <option value="">Select Article</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.initials} — {u.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <div className="flex items-center gap-1 font-mono">
                    <span className="text-[9px] text-black/35 uppercase font-bold">Due Date:</span>
                    <input
                      type="date"
                      value={area.target_date || ''}
                      onChange={(e) => updateAreaAssignment(area.id, { targetDate: e.target.value })}
                      className="bg-transparent border-b border-black/10 focus:outline-none text-[10.5px] px-1"
                    />
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPbcAreaId(area.id);
                    }}
                    className="text-[10px] text-accent-red font-bold uppercase hover:underline"
                  >
                    + Request Doc
                  </button>
                </div>
              </div>

              {/* Progress and click links */}
              <div className="mt-3 pt-2 border-t border-black/6 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-black/55">
                  <div className="w-16 h-1 bg-black/[0.04] border border-black/6 rounded-full overflow-hidden">
                    <div className="h-full bg-black" style={{ width: `${area.completion_pct}%` }} />
                  </div>
                  <span className="font-mono text-[10px] text-black/40">{area.completion_pct}%</span>
                </div>
                
                <span 
                  onClick={() => handleAreaClick(area)}
                  className="inline-flex items-center text-accent-red font-bold gap-0.5 text-[11px] tracking-[0.04em] uppercase cursor-pointer hover:underline"
                >
                  <span>Document</span>
                  <ArrowRight size={10} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CUSTOM TAB INJECT MODAL */}
      {isInjectOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-black/8 rounded-[12px] w-full max-w-[500px] shadow-2xl p-7 space-y-4 animate-fadeInUp">
            <div className="flex justify-between items-center border-b border-black/6 pb-2">
              <h3 className="bebas-display text-[22px] text-black tracking-[0.04em]">Inject Custom Audit Tab</h3>
              <button onClick={() => setIsInjectOpen(false)} className="text-black/30 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInjectCustom} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Custom Area Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., State Industrial Subsidy Verification"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-black/10 rounded-[2px]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Core Audit Objective</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g., Verify physical capital injection assets and substantiate claims against industrial subsidy package policy rules."
                  value={customObjective}
                  onChange={(e) => setCustomObjective(e.target.value)}
                  className="w-full p-3 text-[13px] bg-white border border-black/10 rounded-[2px] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsInjectOpen(false)}
                  className="px-4 py-2 border border-black/10 rounded-[2px] text-[11px] font-bold text-black/55 uppercase hover:bg-black/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-5 py-2 rounded-[2px] text-[11px] font-bold tracking-[0.04em] uppercase"
                >
                  Inject Area Tab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK INLINE PBC REQUEST MODAL */}
      {pbcAreaId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-black/8 rounded-[12px] w-full max-w-[480px] shadow-2xl p-6 space-y-4 animate-fadeInUp">
            <div className="flex justify-between items-center border-b border-black/6 pb-2">
              <h3 className="bebas-display text-[20px] text-black tracking-[0.04em]">Request Document Item</h3>
              <button onClick={() => setPbcAreaId(null)} className="text-black/30 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitPbcRequest} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Document Requested</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Invoices journal list for October 2025"
                  value={pbcDocReq}
                  onChange={(e) => setPbcDocReq(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-black/10 rounded-[2px] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Scope Period</label>
                  <input
                    type="text"
                    placeholder="e.g., FY 2025-26"
                    value={pbcPeriod}
                    onChange={(e) => setPbcPeriod(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-white border border-black/10 rounded-[2px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Priority Category</label>
                  <select
                    value={pbcPriority}
                    onChange={(e) => setPbcPriority(e.target.value as any)}
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
                  onClick={() => setPbcAreaId(null)}
                  className="px-4 py-2 border border-black/10 rounded-[2px] text-[11px] font-bold text-black/55 uppercase hover:bg-black/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-5 py-2 rounded-[2px] text-[11px] font-bold tracking-[0.04em] uppercase"
                >
                  Create Request Row
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRASH BIN DIALOG MODAL */}
      {isTrashOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-black/8 rounded-[12px] w-full max-w-[550px] shadow-2xl p-7 space-y-4 animate-fadeInUp">
            <div className="flex justify-between items-center border-b border-black/6 pb-2">
              <h3 className="bebas-display text-[22px] text-black tracking-[0.04em]">Trash Bin (Recycle Center)</h3>
              <button onClick={() => setIsTrashOpen(false)} className="text-black/30 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 divide-y divide-black/6">
              {trashBin.filter(t => t.engagement_id === engagement.id).length === 0 ? (
                <p className="text-[13px] text-black/40 italic py-8 text-center">
                  Recycle bin is empty. No deleted audit folders found.
                </p>
              ) : (
                trashBin.filter(t => t.engagement_id === engagement.id).map(item => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-[13.5px] first:pt-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-[2px] border border-amber-200">
                          {item.data.area.code}
                        </span>
                        <h4 className="font-bold text-black">{item.name}</h4>
                      </div>
                      <span className="block text-[10px] text-black/45 mt-1 font-mono">
                        Deleted: {new Date(item.deleted_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => {
                        restoreAuditArea(item.id);
                        alert(`Successfully restored "${item.name}" audit worksheet and all related evidence logs.`);
                        setIsTrashOpen(false);
                      }}
                      className="px-3.5 py-1.5 bg-black text-white text-[11px] font-bold uppercase tracking-[0.04em] hover:bg-black/90 transition-colors rounded-[2px] cursor-pointer"
                    >
                      Restore Data
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-black/6">
              <button
                type="button"
                onClick={() => setIsTrashOpen(false)}
                className="px-4 py-2 border border-black/10 rounded-[2px] text-[11px] font-bold text-black/55 uppercase hover:bg-black/[0.02]"
              >
                Close Bin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
