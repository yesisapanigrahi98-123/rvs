import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Dashboard from './Dashboard';
import Firewall from './Firewall';
import Threats from './Threats';
import Attacks from './Attacks';
import Policies from './Policies';
import AuditLogs from './AuditLogs';
import Settings from './Settings';
import Loading from '../components/Loading';
import { useSecurity } from '../context/SecurityContext';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export const DashboardApp = ({ initialPage = 'dashboard' }) => {
  const [activePage, setActivePage] = useState(initialPage);
  const { loading, notifications, removeNotification } = useSecurity();

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={(page) => setActivePage(page)} />;
      case 'firewall':
        return <Firewall />;
      case 'threats':
        return <Threats />;
      case 'attacks':
        return <Attacks />;
      case 'policies':
        return <Policies />;
      case 'audit':
        return <AuditLogs />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={(page) => setActivePage(page)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#070b14] text-slate-100 cyber-grid relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* Subtle ambient cyber glows */}
      <div className="ambient-glow bg-cyan-500 top-0 left-1/4 -translate-y-1/2"></div>
      <div className="ambient-glow bg-purple-600 bottom-0 right-10 translate-y-1/4"></div>

      {/* Main Sidebar */}
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Navbar onOpenPolicyModal={() => setActivePage('policies')} />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="py-24">
              <Loading message="Connecting to SentinelFlow Security Gateway..." />
            </div>
          ) : (
            renderActivePage()
          )}
        </main>
      </div>

      {/* Floating Global Toast Notification Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-md w-full">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start justify-between space-x-3 transition-all duration-300 animate-in slide-in-from-bottom-5 font-mono text-xs ${
              n.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : n.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                : 'bg-slate-900/90 border-cyan-500/50 text-cyan-200'
            }`}
          >
            <div className="flex items-start space-x-2.5">
              {n.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {n.type === 'info' && <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />}

              <div>
                <div className="font-bold">{n.title}</div>
                <div className="text-[11px] opacity-90 mt-0.5 font-sans">{n.message}</div>
              </div>
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="text-slate-400 hover:text-white p-0.5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardApp;
