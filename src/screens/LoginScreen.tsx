import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../db/store';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { firms, users, onboardFirm, loginUser, createEngagement } = useAppStore();
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  // Onboarding Wizard State
  const [isOnboarding, setIsOnboarding] = useState(firms.length === 0);
  const [onboardStep, setOnboardStep] = useState(1);
  
  // Firm Setup
  const [firmName, setFirmName] = useState('');
  const [firmReg, setFirmReg] = useState('');
  const [firmCity, setFirmCity] = useState('');
  const [firmState, setFirmState] = useState('');

  // Partner Setup
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');

  // First Engagement Setup
  const [clientName, setClientName] = useState('');
  const [clientPan, setClientPan] = useState('');
  const [clientIndustry, setClientIndustry] = useState('');
  const [financialYear, setFinancialYear] = useState('FY 2025-26');
  const [engagementType, setEngagementType] = useState<'Statutory Audit' | 'Tax Audit' | 'Internal Audit'>('Statutory Audit');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    if (!email) {
      setLoginError('Please enter your email address.');
      return;
    }

    if (isMagicLink) {
      // Magic link simulation
      setLoginSuccess('A magic sign-in link has been sent to your email.');
      setTimeout(() => {
        const success = loginUser(email);
        if (success) {
          navigate('/dashboard');
        } else {
          setLoginSuccess('');
          setLoginError('This email is not registered with WPO.inc. Check the staff roster.');
        }
      }, 1500);
    } else {
      // Regular password simulation
      const success = loginUser(email);
      if (success) {
        navigate('/dashboard');
      } else {
        setLoginError('Invalid credentials. Check your email or try magic link.');
      }
    }
  };

  const handleOnboardSubmit = () => {
    if (onboardStep === 1) {
      if (!firmName) {
        alert('Firm Name is required.');
        return;
      }
      setOnboardStep(2);
    } else if (onboardStep === 2) {
      if (!partnerName || !partnerEmail) {
        alert('Partner Name and Email are required.');
        return;
      }
      setOnboardStep(3);
    } else if (onboardStep === 3) {
      if (!clientName) {
        alert('Client Name is required.');
        return;
      }
      
      // Perform onboarding saving
      onboardFirm(
        { name: firmName, registrationNumber: firmReg, city: firmCity, state: firmState },
        partnerName,
        partnerEmail
      );

      // Create the first client and engagement
      const id = createEngagement({
        clientName,
        pan: clientPan || undefined,
        industry: clientIndustry || undefined,
        financialYear,
        engagementType,
      });

      // Navigate to planning canvas
      setIsOnboarding(false);
      navigate(`/engagement/${id}/planning`);
    }
  };

  const selectTestUser = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('••••••••••••');
  };

  /* ── PIL shared style tokens ── */
  const inputClass =
    'w-full bg-white border border-black/10 rounded-[2px] px-3 py-2.5 text-[14px] text-black/80 focus:outline-none focus:border-black/30 placeholder:text-black/20 transition-colors duration-200';
  const labelClass =
    'block text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase mb-2';
  const selectClass =
    'w-full bg-white border border-black/10 rounded-[2px] px-3 py-2.5 text-[14px] text-black/80 focus:outline-none focus:border-black/30 transition-colors duration-200';

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-accent-red/10 selection:text-accent-red">
      {/* ── PIL Header ── */}
      <header className="py-8 px-12 flex justify-between items-center max-w-[1440px] w-full mx-auto">
        <div className="flex items-baseline gap-0">
          <span className="bebas-display text-[clamp(28px,4vw,36px)] leading-none text-black tracking-[0.04em]">WPO</span>
          <span className="bebas-display text-[clamp(28px,4vw,36px)] leading-none text-accent-red tracking-[0.04em]">.INC</span>
        </div>
        <span className="font-news text-[12px] text-black/30 tracking-[0.14em] uppercase">
          Chartered Accountants Act, 1949 Mandate
        </span>
      </header>

      {/* ── Main Body ── */}
      <main className="flex-1 flex items-center justify-center py-10 px-6">
        {isOnboarding ? (
          /* ═══ ONBOARDING FLOW WIZARD ═══ */
          <div className="w-full max-w-md ui-enter-stagger">
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-10">
              <h2 className="bebas-display text-[clamp(26px,3.5vw,34px)] text-black leading-none tracking-[0.02em]">
                Firm Onboarding
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.1em] text-black/30 uppercase">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-[2px] ${onboardStep === 1 ? 'bg-black text-white' : 'bg-black/[0.04] text-black/30'}`}>1</span>
                <span className="text-black/15">/</span>
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-[2px] ${onboardStep === 2 ? 'bg-black text-white' : 'bg-black/[0.04] text-black/30'}`}>2</span>
                <span className="text-black/15">/</span>
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-[2px] ${onboardStep === 3 ? 'bg-black text-white' : 'bg-black/[0.04] text-black/30'}`}>3</span>
              </div>
            </div>

            {/* STEP 1: FIRM DETAILS */}
            {onboardStep === 1 && (
              <div className="space-y-6 ui-enter-stagger" style={{ '--enter-delay': '0.1s' } as React.CSSProperties}>
                <div className="mb-8">
                  <p className="font-news text-[12px] text-black/30 tracking-[0.14em] uppercase">
                    Register Your CA Practice
                  </p>
                  <p className="text-[13px] text-black/40 mt-2 leading-relaxed">
                    Create a firm-wide instance. All engagement data is cryptographically stored.
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Firm Name <span className="text-accent-red">*</span></label>
                    <input
                      type="text"
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                      placeholder="e.g., K.S. Aiyar & Co."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>ICAI Firm Registration Number (FRN)</label>
                    <input
                      type="text"
                      value={firmReg}
                      onChange={(e) => setFirmReg(e.target.value)}
                      placeholder="e.g., 100018W"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>City</label>
                      <input
                        type="text"
                        value={firmCity}
                        onChange={(e) => setFirmCity(e.target.value)}
                        placeholder="e.g., Mumbai"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>State</label>
                      <input
                        type="text"
                        value={firmState}
                        onChange={(e) => setFirmState(e.target.value)}
                        placeholder="e.g., Maharashtra"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PARTNER DETAILS */}
            {onboardStep === 2 && (
              <div className="space-y-6 ui-enter-stagger" style={{ '--enter-delay': '0.1s' } as React.CSSProperties}>
                <div className="mb-8">
                  <p className="font-news text-[12px] text-black/30 tracking-[0.14em] uppercase">
                    Lead Partner Profile
                  </p>
                  <p className="text-[13px] text-black/40 mt-2 leading-relaxed">
                    Create the primary signing administrator user for your practice.
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Full Name <span className="text-accent-red">*</span></label>
                    <input
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="e.g., CA Yaswanth Veerk"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address <span className="text-accent-red">*</span></label>
                    <input
                      type="email"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      placeholder="partner@firm.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Designation</label>
                    <input
                      type="text"
                      value="Partner (FCA)"
                      disabled
                      className="w-full bg-black/[0.02] border border-black/10 rounded-[2px] px-3 py-2.5 text-[14px] text-black/30 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: FIRST CLIENT ENGAGEMENT */}
            {onboardStep === 3 && (
              <div className="space-y-6 ui-enter-stagger" style={{ '--enter-delay': '0.1s' } as React.CSSProperties}>
                <div className="mb-8">
                  <p className="font-news text-[12px] text-black/30 tracking-[0.14em] uppercase">
                    Create First Engagement
                  </p>
                  <p className="text-[13px] text-black/40 mt-2 leading-relaxed">
                    Initialize your first client workspace. Default audit area templates will load automatically.
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Client Legal Name <span className="text-accent-red">*</span></label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g., Tata Motors Limited"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Client PAN</label>
                      <input
                        type="text"
                        value={clientPan}
                        onChange={(e) => setClientPan(e.target.value)}
                        placeholder="AAACT1234F"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Industry</label>
                      <input
                        type="text"
                        value={clientIndustry}
                        onChange={(e) => setClientIndustry(e.target.value)}
                        placeholder="e.g., Manufacturing"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Financial Year</label>
                      <select
                        value={financialYear}
                        onChange={(e) => setFinancialYear(e.target.value)}
                        className={selectClass}
                      >
                        <option value="FY 2025-26">FY 2025-26</option>
                        <option value="FY 2024-25">FY 2024-25</option>
                        <option value="FY 2023-24">FY 2023-24</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Audit Type</label>
                      <select
                        value={engagementType}
                        onChange={(e) => setEngagementType(e.target.value as any)}
                        className={selectClass}
                      >
                        <option value="Statutory Audit">Statutory Audit</option>
                        <option value="Tax Audit">Tax Audit</option>
                        <option value="Internal Audit">Internal Audit</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="p-3 border border-black/8 rounded-[2px] bg-black/[0.02]">
                    <p className="text-[11px] text-black/40 leading-relaxed">
                      <span className="font-bold text-black/55">Note:</span> Onboarding will create 12 standard audit areas (GEN, RSK, CAN, TRE, etc.) including prepopulated working paper structures and document request checklists.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-10 pt-8 border-t border-black/8">
              {onboardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setOnboardStep(prev => prev - 1)}
                  className="text-[10px] font-bold tracking-[0.1em] text-black/40 uppercase hover:text-black/70 transition-colors duration-200 cursor-pointer"
                >
                  Previous
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={handleOnboardSubmit}
                className="bg-black text-white rounded-[2px] px-8 py-3 text-[12px] font-bold tracking-[0.04em] uppercase hover:bg-black/90 transition-colors duration-200 cursor-pointer"
              >
                {onboardStep === 3 ? 'Finish Setup' : 'Continue'}
              </button>
            </div>
          </div>
        ) : (
          /* ═══ STANDARD SIGN-IN SCREEN ═══ */
          <div className="w-full max-w-md">
            {/* Brand mark */}
            <div className="text-center mb-12 hero-title-enter">
              <h1 className="bebas-display text-[clamp(40px,8vw,72px)] leading-none text-black tracking-[0.04em] flex items-baseline justify-center">
                WPO<span className="text-accent-red">.INC</span>
              </h1>
              <p className="font-news text-[12px] text-black/30 tracking-[0.14em] uppercase mt-4">
                Audit Documentation Operating System
              </p>
            </div>

            {/* Error / Success Alerts */}
            {loginError && (
              <div className="mb-6 p-3 border border-accent-red/20 rounded-[2px] text-[12px] text-accent-red bg-accent-red/[0.04] ui-enter-stagger">
                {loginError}
              </div>
            )}

            {loginSuccess && (
              <div className="mb-6 p-3 border border-emerald-500/20 rounded-[2px] text-[12px] text-emerald-600 bg-emerald-500/[0.04] ui-enter-stagger">
                {loginSuccess}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5 ui-enter-stagger" style={{ '--enter-delay': '0.18s' } as React.CSSProperties}>
              <div>
                <label className={labelClass}>
                  Professional Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ca.name@wpo.inc"
                  className={inputClass}
                />
              </div>

              {!isMagicLink && (
                <div>
                  <label className={labelClass}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={inputClass}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={isMagicLink}
                  onChange={(e) => setIsMagicLink(e.target.checked)}
                  className="accent-black rounded-[2px] cursor-pointer"
                />
                <span className="text-[12px] text-black/40 cursor-pointer select-none">
                  Sign in with Magic Link
                </span>
              </div>

              <button
                type="submit"
                className="bg-black text-white rounded-[2px] w-full py-3 text-[12px] font-bold tracking-[0.04em] uppercase hover:bg-black/90 transition-colors duration-200 cursor-pointer mt-4"
              >
                {isMagicLink ? 'Request Magic Link' : 'Secure Login'}
              </button>
            </form>

            {/* Test Roster list to ease developer review */}
            {users.length > 0 && (
              <div className="mt-10 pt-8 border-t border-black/8 ui-enter-stagger" style={{ '--enter-delay': '0.32s' } as React.CSSProperties}>
                <p className="font-news text-[10px] text-black/25 tracking-[0.14em] uppercase mb-4 text-center font-bold">
                  Firm Staff Roster (Select to Test)
                </p>
                <div className="flex flex-col gap-1.5">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => selectTestUser(u.email)}
                      className={`text-left px-3 py-2.5 rounded-[2px] text-[12px] flex justify-between items-center transition-colors duration-200 border cursor-pointer ${
                        email === u.email 
                          ? 'bg-black/[0.04] border-black/20 text-black' 
                          : 'bg-transparent hover:bg-black/[0.02] border-black/6 text-black/55'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-black/70">{u.full_name}</span>
                        <span className="text-[10px] text-black/30 ml-1.5">({u.designation})</span>
                      </div>
                      <span className="font-mono text-[10px] text-black/25">{u.email}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-8 text-center ui-enter-stagger" style={{ '--enter-delay': '0.4s' } as React.CSSProperties}>
              <button
                onClick={() => {
                  setFirmName('');
                  setPartnerName('');
                  setPartnerEmail('');
                  setClientName('');
                  setOnboardStep(1);
                  setIsOnboarding(true);
                }}
                className="text-[10px] font-bold tracking-[0.1em] text-black/30 hover:text-accent-red transition-colors duration-200 uppercase cursor-pointer"
              >
                Onboard Another Practice Firm
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── PIL Footer ── */}
      <footer className="py-6 px-12 border-t border-black/6 text-[10px] text-black/25 flex items-center justify-between max-w-[1440px] w-full mx-auto tracking-[0.04em]">
        <span>WPO.inc — Audit Documentation Operating System.</span>
        <span>"The software assists. The auditor decides. Always."</span>
      </footer>
    </div>
  );
};
