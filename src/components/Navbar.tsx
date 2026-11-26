import React from 'react';
import { Layers, Search, BarChart3, Calendar, Award, Bookmark, ShieldAlert } from 'lucide-react';

export type TabType = 'specializations' | 'explore' | 'insights' | 'weekly' | 'rubrics' | 'mvtec';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  shortlistCount: number;
  onOpenShortlist: () => void;
  totalProjects: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  shortlistCount,
  onOpenShortlist,
  totalProjects
}) => {
  const tabs = [
    { id: 'mvtec' as TabType, label: 'MVTec PatchCore AD', icon: ShieldAlert, badge: 'NEW' },
    { id: 'specializations' as TabType, label: 'Specializations', icon: Layers },
    { id: 'explore' as TabType, label: 'Explore Capstones', icon: Search, badge: totalProjects.toLocaleString() },
    { id: 'insights' as TabType, label: 'Portfolio Intelligence', icon: BarChart3 },
    { id: 'weekly' as TabType, label: 'Reviews & Weekly Plan', icon: Calendar },
    { id: 'rubrics' as TabType, label: 'Evaluation Rubrics', icon: Award }
  ];

  return (
    <header className="sticky top-0 z-40 bg-ink-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-ink-950 rounded-[10px] flex items-center justify-center">
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 text-lg">
                  KL
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold tracking-tight text-white text-base sm:text-lg">
                  KL UNIVERSITY
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                  AY 2026-27
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Capstone Systems Engineering Portal
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tab-transition ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons & Shortlist Dock */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenShortlist}
              className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition"
              title="View Shortlisted Projects"
            >
              <Bookmark className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <span className="hidden sm:inline">Shortlist</span>
              {shortlistCount > 0 && (
                <span className="w-5 h-5 flex items-center justify-center text-[11px] font-bold rounded-full bg-blue-600 text-white animate-pulse">
                  {shortlistCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Tab Navigation */}
        <div className="md:hidden flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
