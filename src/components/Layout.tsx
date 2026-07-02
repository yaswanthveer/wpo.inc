import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../db/store';
import { LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, currentFirm, logoutUser } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  if (!currentUser || !currentFirm) {
    return <>{children}</>;
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/review', label: 'Review' },
    ...(currentUser.designation === 'Partner' ? [{ path: '/compliance', label: 'Compliance' }] : []),
    { path: '/settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── PIL-Style Top Navigation Bar ── */}
      <header className="h-[56px] bg-white border-b border-black/8 px-8 flex items-center justify-between sticky top-0 z-50">
        {/* Left: Logo + Firm */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-baseline gap-0 group">
            <span className="bebas-display text-[28px] leading-none text-black tracking-[0.04em]">WPO</span>
            <span className="bebas-display text-[28px] leading-none text-accent-red tracking-[0.04em]">.INC</span>
          </Link>

          <div className="h-4 w-px bg-black/8"></div>

          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-black/70 tracking-[0.01em]">{currentFirm.name}</span>
            {currentFirm.registration_number && (
              <span className="text-[10px] text-black/40 bg-black/[0.03] px-2 py-0.5 rounded-[2px] border border-black/6 tracking-[0.04em] uppercase font-bold">
                FRN {currentFirm.registration_number}
              </span>
            )}
          </div>
        </div>

        {/* Right: Navigation + User */}
        <nav className="flex items-center gap-8">
          {/* Nav Links — PIL style: clean text, underline on active */}
          <div className="flex items-center gap-7">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative text-[13px] tracking-[0.02em] font-bold transition-colors duration-200 py-1 ${
                    isActive
                      ? 'text-black'
                      : 'text-black/40 hover:text-black/70'
                  }`}
                >
                  {item.label}
                  {/* Active indicator — PIL red underline */}
                  {isActive && (
                    <span className="absolute -bottom-[18px] left-0 right-0 h-[2px] bg-accent-red rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="h-4 w-px bg-black/8"></div>

          {/* User Profile — PIL clean style */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[12px] font-bold text-black leading-tight tracking-[0.01em]">{currentUser.full_name}</div>
              <div className="text-[10px] text-black/40 tracking-[0.02em]">{currentUser.designation}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center bebas-display text-[13px] tracking-[0.06em]">
              {currentUser.initials}
            </div>
            <button
              onClick={handleLogout}
              className="text-black/30 hover:text-accent-red transition-colors duration-200 p-1 cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </nav>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 px-8 py-8 max-w-[1440px] w-full mx-auto">
        {children}
      </main>

      {/* ── Footer — PIL minimal ── */}
      <footer className="py-5 px-8 border-t border-black/6 text-[11px] text-black/35 flex items-center justify-between tracking-[0.01em]">
        <div className="flex items-center gap-2">
          <span className="bebas-display text-[14px] text-black/20 tracking-[0.04em]">WPO.INC</span>
          <span className="text-black/15">—</span>
          <span>Audit Documentation Operating System</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="italic">"The software assists. The auditor decides. Always."</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot-pulse"></span>
            <span className="font-bold text-black/50 tracking-[0.04em] uppercase text-[10px]">Offline Secure</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
