import React from 'react';
import { 
  LayoutDashboard, 
  Pill, 
  BellRing, 
  Package, 
  Mic, 
  BarChart3, 
  HeartHandshake, 
  ShieldCheck, 
  Settings,
  LogOut,
  Globe,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({ currentTab, setCurrentTab, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const isPatient = user?.role === 'PATIENT';

  const menuItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'medicines', label: t.nav.medicines, icon: Pill },
    { id: 'reminders', label: t.nav.reminders, icon: BellRing },
    { id: 'inventory', label: t.nav.inventory, icon: Package },
    { id: 'voice', label: t.nav.voice, icon: Mic, highlight: true },
    { id: 'analytics', label: t.nav.analytics, icon: BarChart3 },
    ...(isPatient 
      ? [{ id: 'caregiver-settings', label: t.nav.caregiverSettings, icon: ShieldCheck }]
      : [{ id: 'caregiver-dashboard', label: t.nav.caregiver, icon: HeartHandshake }]),
    { id: 'settings', label: t.nav.settings, icon: Settings }
  ];

  const handleSelect = (id) => {
    setCurrentTab(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 
        flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Pill className="w-6 h-6 transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-lg text-slate-800 tracking-tight">MediSync</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium truncate max-w-[140px]">
              {user?.role === 'CAREGIVER' ? 'Caregiver Portal' : 'Patient Adherence'}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active 
                    ? 'bg-teal-50 text-teal-700 font-semibold shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  ${item.highlight && !active ? 'border border-teal-100/80 bg-teal-50/30' : ''}
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                )}
                {active && (
                  <ChevronRight className="w-4 h-4 text-teal-600" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Language Selector */}
        <div className="px-4 py-3 mx-3 mb-3 bg-slate-50 rounded-xl border border-slate-200/60">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span className="flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Language / भाषा</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[
              { code: 'en', label: 'EN' },
              { code: 'hi', label: 'हिन्दी' },
              { code: 'mr', label: 'मराठी' }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`
                  py-1 text-xs rounded-lg font-medium transition-colors
                  ${language === lang.code 
                    ? 'bg-teal-600 text-white shadow-xs' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'}
                `}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                <span className="inline-block text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title={t.nav.logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

