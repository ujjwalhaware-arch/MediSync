import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Bell, 
  Mic, 
  Check, 
  AlertTriangle, 
  Clock, 
  Package, 
  ShieldAlert, 
  CheckCircle2,
  Volume2,
  Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

export default function Header({ setMobileOpen, onOpenVoice, onOpenScanRx }) {
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    permission, 
    requestNotificationPermission, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  const { t } = useLanguage();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close popover on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.greetings.morning;
    if (hour < 18) return t.greetings.afternoon;
    return t.greetings.evening;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'MISSED_DOSE':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'CAREGIVER_ALERT':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'LOW_STOCK':
        return <Package className="w-4 h-4 text-orange-600" />;
      case 'FOLLOW_UP':
        return <Clock className="w-4 h-4 text-sky-600" />;
      default:
        return <Bell className="w-4 h-4 text-teal-600" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5">
      <div className="flex items-center justify-between">
        {/* Left Side: Mobile Menu + Greeting */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>{getGreeting()}, {user?.name?.split(' ')[0]}</span>
              <span className="text-xl">👋</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Notification Permission Request */}
          {permission !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Enable Alerts</span>
            </button>
          )}

          {/* Scan Prescription OCR Button */}
          {user?.role === 'PATIENT' && (
            <button
              onClick={onOpenScanRx}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95 shadow-emerald-600/10"
              title="Scan Doctor's Prescription (OCR)"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scan Rx</span>
            </button>
          )}

          {/* Quick Voice Assistant Button */}
          {user?.role === 'PATIENT' && (
            <button
              onClick={onOpenVoice}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-sm hover:from-teal-600 hover:to-cyan-600 transition-all shadow-teal-500/10 active:scale-95"
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.actions.listenVoice}</span>
            </button>
          )}

          {/* Notifications Bell */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setPopoverOpen(!popoverOpen)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {popoverOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Notifications</h3>
                    <p className="text-xs text-slate-400">{unreadCount} unread alerts</p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center space-x-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs">All clear! No notifications.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start space-x-3 ${!n.is_read ? 'bg-teal-50/20' : ''}`}
                      >
                        <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                          {getNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-xs font-semibold ${!n.is_read ? 'text-slate-900 font-bold' : 'text-slate-700'} truncate`}>
                              {n.title}
                            </p>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 ml-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

