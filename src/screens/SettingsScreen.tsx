import React, { useState } from 'react';
import { useAppStore } from '../db/store';
import { 
  Building, 
  Users, 
  Settings as SettingsIcon, 
  Database, 
  Plus, 
  Trash2, 
  Save, 
  Link2, 
  AlertCircle 
} from 'lucide-react';
import type { User } from '../db/schema';

export const SettingsScreen: React.FC = () => {
  const { 
    currentFirm, 
    users, 
    supabaseSettings, 
    addStaff, 
    removeStaff, 
    updateSupabaseSettings 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'staff' | 'templates' | 'supabase'>('profile');

  // Firm Form State
  const [firmName, setFirmName] = useState(currentFirm?.name || '');
  const [firmReg, setFirmReg] = useState(currentFirm?.registration_number || '');
  const [firmCity, setFirmCity] = useState(currentFirm?.city || '');
  const [firmState, setFirmState] = useState(currentFirm?.state || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Staff Form State
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffDesignation, setStaffDesignation] = useState<User['designation']>('Article');

  // Supabase Form State
  const [sUrl, setSUrl] = useState(supabaseSettings?.supabaseUrl || '');
  const [sKey, setSKey] = useState(supabaseSettings?.supabaseAnonKey || '');
  const [sEnabled, setSEnabled] = useState(supabaseSettings?.isEnabled || false);

  const handleUpdateFirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName) return;
    
    // We update the firm details in the store
    useAppStore.setState(state => ({
      currentFirm: state.currentFirm 
        ? { ...state.currentFirm, name: firmName, registration_number: firmReg, city: firmCity, state: firmState }
        : null,
      firms: state.firms.map(f => 
        f.id === state.currentFirm?.id 
          ? { ...f, name: firmName, registration_number: firmReg, city: firmCity, state: firmState }
          : f
      )
    }));

    useAppStore.getState().addAuditTrail('firm_details_updated', { firmName });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail) return;

    addStaff({
      full_name: staffName,
      email: staffEmail,
      designation: staffDesignation,
      initials: staffName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3),
    });

    setStaffName('');
    setStaffEmail('');
    setStaffDesignation('Article');
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseSettings({
      supabaseUrl: sUrl,
      supabaseAnonKey: sKey,
      isEnabled: sEnabled,
    });
    alert('Supabase credentials saved. App will re-route DB traffic.');
  };

  const navItems = [
    { key: 'profile' as const, icon: Building, label: 'Firm Profile' },
    { key: 'staff' as const, icon: Users, label: 'Staff Management' },
    { key: 'templates' as const, icon: SettingsIcon, label: 'Audit Templates' },
    { key: 'supabase' as const, icon: Database, label: 'Supabase Database' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeInUp">
      {/* Settings Navigation Sidebar */}
      <div className="bg-white rounded-[12px] border border-black/6 p-5 space-y-1 h-fit">
        <h2 className="bebas-display text-[24px] tracking-[0.04em] text-black border-b border-black/6 pb-2 mb-4">
          Practice Settings
        </h2>
        
        {navItems.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left rounded-[2px] transition-all duration-200 cursor-pointer ${
              activeTab === key 
                ? 'text-black font-bold border-l-2 border-accent-red bg-black/[0.03]' 
                : 'text-black/40 hover:bg-black/[0.02] hover:text-black/55'
            }`}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Settings Main Content Area */}
      <div className="lg:col-span-3 bg-white rounded-[12px] border border-black/6 p-6 min-h-[400px]">
        
        {/* TAB 1: FIRM PROFILE */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateFirm} className="space-y-6">
            <div>
              <h3 className="bebas-display text-[24px] tracking-[0.04em] text-black">Firm Profile Details</h3>
              <p className="text-[13px] text-black/40">Manage details used in audit report headers and printable working papers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase mb-2">Practice / Firm Name</label>
                <input
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase mb-2">Firm Registration Number (FRN)</label>
                <input
                  type="text"
                  value={firmReg}
                  onChange={(e) => setFirmReg(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase mb-2">City</label>
                <input
                  type="text"
                  value={firmCity}
                  onChange={(e) => setFirmCity(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase mb-2">State</label>
                <input
                  type="text"
                  value={firmState}
                  onChange={(e) => setFirmState(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black transition-colors duration-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-black/6">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-black text-white px-5 py-2 rounded-[2px] text-[13px] font-bold tracking-[0.04em] uppercase hover:bg-black/90 transition-colors duration-200 cursor-pointer"
              >
                <Save size={14} />
                <span>Save Changes</span>
              </button>
              {saveSuccess && (
                <span className="text-[13px] text-green-600 font-medium">Changes updated successfully.</span>
              )}
            </div>
          </form>
        )}

        {/* TAB 2: STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div>
              <h3 className="bebas-display text-[24px] tracking-[0.04em] text-black">Firm Staff Roster</h3>
              <p className="text-[13px] text-black/40">Add partners, managers, and articles assistants to sign off procedures.</p>
            </div>

            {/* Add Staff Form */}
            <form onSubmit={handleAddStaff} className="p-4 bg-black/[0.02] border border-black/6 rounded-[12px] grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="CA R. K. Gupta"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-1.5 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase mb-2">Email</label>
                <input
                  type="email"
                  required
                  placeholder="gupta@firm.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase mb-2">Designation</label>
                <select
                  value={staffDesignation}
                  onChange={(e) => setStaffDesignation(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black transition-colors duration-200"
                >
                  <option value="Partner">Partner (FCA)</option>
                  <option value="Manager">Manager</option>
                  <option value="Senior">Senior Audit Associate</option>
                  <option value="Article">Article Clerk / Trainee</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 bg-black text-white py-1.5 rounded-[2px] text-[13px] font-bold tracking-[0.04em] uppercase hover:bg-black/90 transition-all duration-200 cursor-pointer"
              >
                <Plus size={14} className="text-accent-red" />
                <span>Add Member</span>
              </button>
            </form>

            {/* Roster Table */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase">Roster Staff Accounts</h4>
              <div className="border border-black/6 rounded-[12px] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/[0.02] text-[10px] text-black/40 border-b border-black/6 uppercase font-bold tracking-[0.1em]">
                      <th className="p-3">Staff Name</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Designation</th>
                      <th className="p-3 text-center">Sign-off Initials</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/6 text-[14px] text-black">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-black/[0.015] transition-colors duration-200">
                        <td className="p-3 font-semibold">{u.full_name}</td>
                        <td className="p-3 font-mono text-[12px] text-black/55">{u.email}</td>
                        <td className="p-3 text-black/55">{u.designation}</td>
                        <td className="p-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-[2px] bg-accent-red/10 border border-accent-red/20 font-bold text-[10px] text-accent-red tracking-[0.04em]">
                            {u.initials}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            disabled={u.designation === 'Partner'}
                            onClick={() => removeStaff(u.id)}
                            className={`p-1 transition-colors duration-200 ${
                              u.designation === 'Partner' 
                                ? 'text-black/20 cursor-not-allowed opacity-50' 
                                : 'text-black/35 hover:text-accent-red cursor-pointer'
                            }`}
                            title={u.designation === 'Partner' ? 'Signing Partners cannot be removed' : 'Remove user'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div>
              <h3 className="bebas-display text-[24px] tracking-[0.04em] text-black">Audit Area Templates (SA-230 Standard)</h3>
              <p className="text-[13px] text-black/40">Verify pre-loaded standard folders, checklist questionnaires, and default audit documents.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-black/6 rounded-[12px] space-y-2">
                <span className="font-mono text-[10px] bg-accent-red/10 text-accent-red border border-accent-red/20 px-1.5 py-0.5 rounded-[2px] font-bold tracking-[0.04em]">TRE</span>
                <h4 className="bebas-display text-base tracking-[0.04em] text-black">Trade Receivables Checklist Template</h4>
                <ul className="text-[12px] text-black/55 space-y-1 pl-4 list-disc">
                  <li>Trade Receivables Ledger verification</li>
                  <li>Ageing analysis review (MSME 45-day check)</li>
                  <li>Adequacy of provisions for doubtful debts</li>
                  <li>Debtor confirmation letters</li>
                  <li>Subsequent bank collections trace</li>
                </ul>
              </div>

              <div className="p-4 border border-black/6 rounded-[12px] space-y-2">
                <span className="font-mono text-[10px] bg-black/[0.04] text-black/55 border border-black/10 px-1.5 py-0.5 rounded-[2px] font-bold tracking-[0.04em]">CAN</span>
                <h4 className="bebas-display text-base tracking-[0.04em] text-black">Cash & Bank Balance Template</h4>
                <ul className="text-[12px] text-black/55 space-y-1 pl-4 list-disc">
                  <li>Obtain lead schedules and reconcile GL</li>
                  <li>Bank Statement verification</li>
                  <li>Check bank reconciliation statements</li>
                  <li>Verify physical cash-on-hand counts</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SUPABASE DATABASE */}
        {activeTab === 'supabase' && (
          <form onSubmit={handleSaveSupabase} className="space-y-6">
            <div>
              <h3 className="bebas-display text-[24px] tracking-[0.04em] text-black">Supabase Connection Settings</h3>
              <p className="text-[13px] text-black/40">Configure a direct hosted PostgreSQL Supabase client. When disabled, database works Offline/Local-First.</p>
            </div>

            <div className="p-4 bg-accent-red/[0.05] border border-accent-red/15 rounded-[12px] flex items-start gap-3">
              <AlertCircle size={16} className="text-accent-red shrink-0 mt-0.5" />
              <div className="text-[12px] text-black/55 leading-normal">
                <strong className="text-black">Offline Persistence Active:</strong> All changes are persistently saved in your browser's local sandbox store. Configuring cloud Supabase connects real-time database sync for multiple firm members.
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase mb-2">Supabase API URL</label>
                <input
                  type="text"
                  placeholder="https://xyz.supabase.co"
                  value={sUrl}
                  onChange={(e) => setSUrl(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black font-mono transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase mb-2">Supabase Anon Public API Key</label>
                <input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={sKey}
                  onChange={(e) => setSKey(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] bg-white border border-black/10 rounded-[2px] focus:outline-none focus:border-black/30 text-black font-mono transition-colors duration-200"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="supabase_enable"
                  checked={sEnabled}
                  onChange={(e) => setSEnabled(e.target.checked)}
                  className="accent-accent-red rounded-[2px] cursor-pointer"
                />
                <label htmlFor="supabase_enable" className="text-[14px] text-black font-medium cursor-pointer flex items-center gap-1.5">
                  <Link2 size={12} className="text-accent-red" />
                  <span>Route all queries to Supabase Cloud Server</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-black/6">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-black text-white px-5 py-2 rounded-[2px] text-[13px] font-bold tracking-[0.04em] uppercase hover:bg-black/90 transition-all duration-200 cursor-pointer"
              >
                <Database size={14} className="text-accent-red" />
                <span>Save Database Settings</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
