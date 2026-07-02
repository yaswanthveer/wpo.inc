import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../db/store';
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  X
} from 'lucide-react';
import type { Engagement } from '../db/schema';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    engagements, 
    clients, 
    users, 
    workingPapers,
    createEngagement 
  } = useAppStore();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Onboarding Tooltip banner state
  const [showTooltip, setShowTooltip] = useState(!!location.state?.showOnboardingTooltip);

  // New Engagement Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPan, setClientPan] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientIndustry, setClientIndustry] = useState('');
  const [financialYear, setFinancialYear] = useState('FY 2025-26');
  const [engagementType, setEngagementType] = useState<'Statutory Audit' | 'Tax Audit' | 'Internal Audit'>('Statutory Audit');
  const [partnerId, setPartnerId] = useState('');
  const [managerId, setManagerId] = useState('');

  const partners = users.filter(u => u.designation === 'Partner');
  const managers = users.filter(u => u.designation === 'Manager' || u.designation === 'Senior');

  const handleCreateEngagement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) {
      alert('Client Name is required');
      return;
    }
    const id = createEngagement({
      clientName,
      pan: clientPan || undefined,
      city: clientCity || undefined,
      industry: clientIndustry || undefined,
      financialYear,
      engagementType,
      partnerId: partnerId || undefined,
      managerId: managerId || undefined,
    });
    setIsModalOpen(false);
    // Reset Form
    setClientName('');
    setClientPan('');
    setClientCity('');
    setClientIndustry('');
    setPartnerId('');
    setManagerId('');
    navigate(`/engagement/${id}`);
  };

  // Stats calculation
  const totalWp = workingPapers.length;
  const activeEng = engagements.filter(e => e.status === 'in-progress').length;
  const reviewEng = engagements.filter(e => e.status === 'review').length;
  const completedEng = engagements.filter(e => e.status === 'complete').length;

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
  };

  const getPartnerInitials = (userId?: string) => {
    if (!userId) return '-';
    return users.find(u => u.id === userId)?.initials || '-';
  };

  const getStatusBadgeClass = (status: Engagement['status']) => {
    switch (status) {
      case 'complete':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'review':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'in-progress':
        return 'bg-sky-50 text-sky-700 border border-sky-200';
      default:
        return 'bg-black/[0.02] text-black/50 border border-black/8';
    }
  };

  const getStatusLabel = (status: Engagement['status']) => {
    switch (status) {
      case 'complete': return 'Complete';
      case 'review': return 'Under Review';
      case 'in-progress': return 'In Progress';
      default: return 'Not Started';
    }
  };

  const getEngagementProgress = (engagementId: string) => {
    const wpList = workingPapers.filter(w => w.engagement_id === engagementId);
    if (wpList.length === 0) return 0;
    
    const areaList = useAppStore.getState().auditAreas.filter(a => a.engagement_id === engagementId);
    if (areaList.length === 0) return 0;
    
    const sum = areaList.reduce((acc, curr) => acc + curr.completion_pct, 0);
    return Math.round(sum / areaList.length);
  };

  const filteredEngagements = engagements.filter(e => {
    const name = getClientName(e.client_id).toLowerCase();
    const type = e.engagement_type.toLowerCase();
    const yr = e.financial_year.toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || type.includes(query) || yr.includes(query);
  });

  const stats = [
    { label: 'Active', value: activeEng, accent: 'text-accent-red' },
    { label: 'Review', value: reviewEng, accent: 'text-amber-600' },
    { label: 'Complete', value: completedEng, accent: 'text-emerald-700' },
    { label: 'Papers', value: totalWp, accent: 'text-black/70' },
  ];

  return (
    <div className="space-y-8">
      {/* Onboarding Tooltip banner */}
      {showTooltip && (
        <div className="bg-black/[0.02] border border-black/8 rounded-[12px] p-6 flex justify-between items-start ui-enter-stagger">
          <div className="space-y-2">
            <h4 className="bebas-display text-[20px] text-black tracking-[0.04em] flex items-center gap-2">
              Setup Complete
              <span className="text-accent-red">.</span>
              <span className="text-[14px] text-black/40">Welcome to WPO.inc</span>
            </h4>
            <p className="text-[13px] text-black/55 max-w-[900px] leading-relaxed tracking-[0.01em]">
              Your firm instance has been successfully initialized. Your first client workspace is loaded. 
              Click on the client name below to open the 12 standard audit areas and check out the <strong>Trade Receivables</strong> template. 
              Remember: <em>"The software assists. The auditor decides. Always."</em>
            </p>
          </div>
          <button 
            onClick={() => setShowTooltip(false)}
            className="text-black/30 hover:text-black p-1 transition-colors duration-200 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Statistics Row — PIL editorial number display ── */}
      <div className="grid grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="bg-white border border-black/6 rounded-[12px] p-6 card-hover-lift ui-enter-stagger"
            style={{ '--enter-delay': `${i * 0.08}s` } as React.CSSProperties}
          >
            <span className="text-[10px] font-bold text-black/35 tracking-[0.12em] uppercase block">{stat.label}</span>
            <h3 className={`bebas-display text-[clamp(36px,5vw,48px)] leading-none mt-1 ${stat.accent}`}>{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* ── Main Engagement Table — PIL clean editorial ── */}
      <div className="bg-white border border-black/6 rounded-[12px] p-7 space-y-6 ui-enter-stagger" style={{ '--enter-delay': '0.32s' } as React.CSSProperties}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="bebas-display text-[clamp(26px,3.2vw,40px)] text-black leading-none tracking-[0.02em]">
              Audit Engagements
            </h2>
            <p className="text-[13px] text-black/40 mt-1 tracking-[0.01em]">
              Active, pending and archived audit client files assigned to your firm.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-black/30" size={13} />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 w-64 bg-white border border-black/10 rounded-[2px] text-[13px] focus:outline-none focus:border-black/30 text-black placeholder:text-black/25 transition-colors duration-200"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-black text-white px-5 py-2 rounded-[2px] text-[12px] font-bold tracking-[0.04em] uppercase hover:bg-black/85 transition-colors duration-200 cursor-pointer"
            >
              <Plus size={14} />
              <span>New Engagement</span>
            </button>
          </div>
        </div>

        {/* Engagement Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black/10 text-left">
                <th className="py-3 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">Client Name</th>
                <th className="py-3 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">Audit Type</th>
                <th className="py-3 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">Financial Year</th>
                <th className="py-3 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase w-1/4">Progress</th>
                <th className="py-3 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase">Status</th>
                <th className="py-3 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase text-center">Partner</th>
                <th className="py-3 text-[10px] font-bold tracking-[0.1em] text-black/35 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6">
              {filteredEngagements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[14px] text-black/30 italic">
                    No active engagements found. Click "+ New Engagement" to start.
                  </td>
                </tr>
              ) : (
                filteredEngagements.map((eng) => {
                  const cName = getClientName(eng.client_id);
                  const progress = getEngagementProgress(eng.id);
                  const isPlanningPending = !eng.planning?.planning_finalized;
                  return (
                    <tr key={eng.id} className="hover:bg-black/[0.015] transition-colors duration-200 group">
                      <td className="py-4 text-[14px] text-black font-bold tracking-[0.005em]">
                        <span 
                          onClick={() => navigate(isPlanningPending ? `/engagement/${eng.id}/planning` : `/engagement/${eng.id}`)}
                          className="hover:text-accent-red cursor-pointer transition-colors duration-200"
                        >
                          {cName}
                        </span>
                        {isPlanningPending && (
                          <span className="ml-2 text-[9px] text-accent-red bg-red-50 border border-red-150 px-1.5 py-0.5 rounded-[2px] font-bold uppercase tracking-[0.05em] font-mono">
                            Planning Req
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-[12px] text-black/55 font-bold tracking-[0.01em]">{eng.engagement_type}</td>
                      <td className="py-4 text-[12px] font-mono text-black/50">{eng.financial_year}</td>
                      <td className="py-4 pr-8">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-[3px] bg-black/[0.04] rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-700 rounded-full ${
                                progress === 100 ? 'bg-emerald-500' : 'bg-accent-red'
                              }`} 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono font-bold text-black/60">{progress}%</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-[2px] tracking-[0.04em] uppercase ${
                          isPlanningPending ? 'bg-red-50 text-red-700 border border-red-200' : getStatusBadgeClass(eng.status)
                        }`}>
                          {isPlanningPending ? 'Planning Draft' : getStatusLabel(eng.status)}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span 
                          className="inline-flex w-7 h-7 rounded-full bg-black text-white items-center justify-center bebas-display text-[11px] tracking-[0.04em]"
                          title={`Partner ID: ${eng.partner_id}`}
                        >
                          {getPartnerInitials(eng.partner_id)}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => navigate(isPlanningPending ? `/engagement/${eng.id}/planning` : `/engagement/${eng.id}`)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-black/40 hover:text-accent-red transition-colors duration-200 cursor-pointer tracking-[0.04em] uppercase"
                        >
                          <span>{isPlanningPending ? 'Plan' : 'Open'}</span>
                          <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── NEW ENGAGEMENT MODAL — PIL clean overlay ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border border-black/8 rounded-[12px] w-full max-w-[600px] shadow-2xl ui-enter-stagger">
            {/* Modal Header */}
            <div className="px-7 py-5 border-b border-black/8 flex items-center justify-between">
              <h3 className="bebas-display text-[24px] text-black tracking-[0.04em]">
                New Engagement
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-black/30 hover:text-black transition-colors duration-200 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateEngagement}>
              <div className="p-7 space-y-5 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-black/40 mb-2">
                    Client Legal Name <span className="text-accent-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Reliance Industries Limited"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2.5 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black placeholder:text-black/20 transition-colors duration-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-black/40 mb-2">
                      PAN number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., AADCR5432B"
                      value={clientPan}
                      onChange={(e) => setClientPan(e.target.value)}
                      className="w-full px-3 py-2.5 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black placeholder:text-black/20 transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-black/40 mb-2">
                      Industry Sector
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Textiles / Telecom"
                      value={clientIndustry}
                      onChange={(e) => setClientIndustry(e.target.value)}
                      className="w-full px-3 py-2.5 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black placeholder:text-black/20 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-black/40 mb-2">
                      Financial Year
                    </label>
                    <select
                      value={financialYear}
                      onChange={(e) => setFinancialYear(e.target.value)}
                      className="w-full px-3 py-2.5 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black transition-colors duration-200"
                    >
                      <option value="FY 2025-26">FY 2025-26</option>
                      <option value="FY 2024-25">FY 2024-25</option>
                      <option value="FY 2023-24">FY 2023-24</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-black/40 mb-2">
                      Audit Type
                    </label>
                    <select
                      value={engagementType}
                      onChange={(e) => setEngagementType(e.target.value as any)}
                      className="w-full px-3 py-2.5 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black transition-colors duration-200"
                    >
                      <option value="Statutory Audit">Statutory Audit</option>
                      <option value="Tax Audit">Tax Audit</option>
                      <option value="Internal Audit">Internal Audit</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-black/40 mb-2">
                      Lead Partner
                    </label>
                    <select
                      value={partnerId}
                      onChange={(e) => setPartnerId(e.target.value)}
                      className="w-full px-3 py-2.5 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black transition-colors duration-200"
                    >
                      <option value="">Select Partner</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name} ({p.initials})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-black/40 mb-2">
                      Manager / Senior
                    </label>
                    <select
                      value={managerId}
                      onChange={(e) => setManagerId(e.target.value)}
                      className="w-full px-3 py-2.5 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black transition-colors duration-200"
                    >
                      <option value="">Select Manager</option>
                      {managers.map(m => (
                        <option key={m.id} value={m.id}>{m.full_name} ({m.initials})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-7 py-5 border-t border-black/6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-black/10 rounded-[2px] text-[12px] font-bold text-black/50 hover:text-black hover:border-black/25 transition-colors duration-200 tracking-[0.04em] uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-6 py-2.5 rounded-[2px] text-[12px] font-bold tracking-[0.04em] uppercase hover:bg-black/85 transition-colors duration-200 cursor-pointer"
                >
                  Create Engagement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
