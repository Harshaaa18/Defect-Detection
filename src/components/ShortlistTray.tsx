import React from 'react';
import { Project } from '../types/portal';
import { Bookmark, Scale, Trash2, ArrowUpRight } from 'lucide-react';

interface ShortlistTrayProps {
  shortlistedProjects: Project[];
  onOpenCompare: () => void;
  onClearAll: () => void;
}

export const ShortlistTray: React.FC<ShortlistTrayProps> = ({
  shortlistedProjects,
  onOpenCompare,
  onClearAll
}) => {
  if (shortlistedProjects.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 animate-slideUp">
      <div className="flex items-center gap-3 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md">
        
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-extrabold text-xs border border-amber-500/30">
            {shortlistedProjects.length}
          </div>
          <div className="hidden sm:block">
            <span className="text-xs font-bold text-white block leading-tight">Shortlisted</span>
            <span className="text-[10px] text-slate-400">Capstones Ready</span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        <button
          onClick={onOpenCompare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition"
        >
          <Scale className="w-4 h-4" />
          <span>Compare Matrix</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onClearAll}
          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition"
          title="Clear Shortlist"
        >
          <Trash2 className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
