import React from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const Loading = ({ message = 'Inspecting SentinelFlow telemetry...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
        <div className="absolute w-10 h-10 rounded-full border-2 border-emerald-500/20 border-b-emerald-400 animate-spin [animation-direction:reverse]"></div>
        <ShieldAlert className="w-6 h-6 text-cyan-400 animate-pulse absolute" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-cyan-300 font-mono tracking-wide">{message}</p>
        <p className="text-xs text-slate-500 mt-1 font-mono">ENCRYPTED GATEWAY RUNTIME</p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#070b14]/90 backdrop-blur-md flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

export const SkeletonCard = () => (
  <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-4 bg-slate-800 rounded w-24"></div>
      <div className="h-8 w-8 bg-slate-800 rounded-lg"></div>
    </div>
    <div className="h-8 bg-slate-800 rounded w-36"></div>
    <div className="h-3 bg-slate-800/60 rounded w-48"></div>
  </div>
);

export default Loading;
