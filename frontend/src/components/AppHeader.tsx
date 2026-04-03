import { Activity, WifiOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = navigator.onLine;

  const navItems = [
    { path: '/', label: 'Triage' },
    { path: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <header className="bg-surface-elevated border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="bg-primary rounded-lg p-2">
          <Activity size={20} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">AI Triage Optimizer</h1>
          <p className="text-xs text-muted-foreground">Government Hospital System</p>
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
  );
};

export default AppHeader;
