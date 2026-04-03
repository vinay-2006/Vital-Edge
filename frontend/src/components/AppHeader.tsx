import { Activity, WifiOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useServerWakeup } from '@/hooks/use-server-wakeup';

const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = navigator.onLine;
  const { serverStatus } = useServerWakeup();

  const navItems = [
    { path: '/', label: 'Triage' },
    { path: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <>
      <header className="bg-surface-elevated border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0">
            <img src="/pratham-icon.svg" alt="Pratham" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight tracking-tight">PRATHAM</h1>
            <p className="text-xs text-muted-foreground font-medium">AI Triage System</p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors min-h-[44px] ${
                location.pathname === item.path
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {item.label}
            </button>
          ))}
          {!isOnline && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full triage-moderate-bg-soft triage-moderate-text text-xs font-semibold ml-2">
              <WifiOff size={14} />
              Offline
            </div>
          )}
        </nav>
      </header>

      {/* Server status banner — only shown during cold start */}
      {serverStatus === 'checking' && (
        <div className="w-full bg-blue-950/80 border-b border-blue-500/30 px-4 py-2 flex items-center gap-2 text-blue-300 text-xs font-medium">
          <Loader2 size={13} className="animate-spin shrink-0" />
          Connecting to server…
        </div>
      )}
      {serverStatus === 'waking' && (
        <div className="w-full bg-amber-950/80 border-b border-amber-500/30 px-4 py-2 flex items-center gap-2 text-amber-300 text-xs font-medium">
          <Loader2 size={13} className="animate-spin shrink-0" />
          Server is waking up (free tier cold start) — please wait up to 60 seconds…
        </div>
      )}
      {serverStatus === 'online' && (
        <div className="w-full bg-green-950/80 border-b border-green-500/30 px-4 py-2 flex items-center gap-2 text-green-300 text-xs font-medium transition-opacity duration-500">
          <CheckCircle2 size={13} className="shrink-0" />
          Server is online — ready to accept requests
        </div>
      )}
      {serverStatus === 'offline' && (
        <div className="w-full bg-red-950/80 border-b border-red-500/30 px-4 py-2 flex items-center gap-2 text-red-300 text-xs font-medium">
          <AlertCircle size={13} className="shrink-0" />
          Cannot reach server — check your connection or try refreshing the page
        </div>
      )}
    </>
  );
};

export default AppHeader;
