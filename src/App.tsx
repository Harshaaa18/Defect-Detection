import React from 'react';
import { MinimalAnomalyStudio } from './components/MinimalAnomalyStudio';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Clean Light Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-sm">
              KL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                  KL UNIVERSITY
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  KLCAP-2026-00050
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Capstone Project &bull; Industrial Anomaly Localization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              PatchCore Nominal Engine
            </span>
            <a
              href="http://localhost:5000/api/status"
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-blue-600 transition font-mono text-[11px]"
            >
              API Status &rarr;
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <MinimalAnomalyStudio />
      </main>

      {/* Clean Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            KLCAP-2026-00050: Lighting-Robust Unsupervised Industrial Anomaly Localization with Calibrated Unknown Detection
          </p>
          <p className="text-[11px] text-slate-400">
            KL University Capstone Office &bull; Department of Computer Science & Engineering &bull; MVTec AD Anomaly Benchmark
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
