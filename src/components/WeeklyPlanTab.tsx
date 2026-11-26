import React, { useState } from 'react';
import { PROGRAM_OPTIONS } from '../data/rubricsAndPlans';
import { Calendar, CheckCircle2, Lock, Sparkles, ChevronRight, Award, ShieldCheck } from 'lucide-react';

export const WeeklyPlanTab: React.FC = () => {
  const [selectedProgramId, setSelectedProgramId] = useState(PROGRAM_OPTIONS[0].id);

  const selectedProgram = PROGRAM_OPTIONS.find(p => p.id === selectedProgramId) || PROGRAM_OPTIONS[0];

  // Track completed week IDs state
  const [passedWeekKeys, setPassedWeekKeys] = useState<Set<string>>(new Set(['prog-btech-cse-1-1', 'prog-btech-cse-1-2']));

  const toggleWeekPassed = (key: string) => {
    setPassedWeekKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // State Walker Algorithm: Determine if Phase N is unlocked
  const isPhaseUnlocked = (phaseIndex: number) => {
    if (phaseIndex === 0) return true;
    // Previous phase must have its gate week passed
    const prevPhase = selectedProgram.phases[phaseIndex - 1];
    const prevGateWeek = prevPhase.weeks.find(w => w.isGate);
    if (!prevGateWeek) return true;
    const gateKey = `${selectedProgram.id}-${prevPhase.phaseNumber}-${prevGateWeek.weekNumber}`;
    return passedWeekKeys.has(gateKey);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/80 border border-slate-800 p-8 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>REVIEWS & WEEKLY PLAN ROADMAP</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              16-Week Phase-Gate Execution Roadmap
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl">
              Track capstone milestone progression through mandatory phase gates and week-by-week deliverable review checklists.
            </p>
          </div>

          {/* Program Selector (`mrProgram`) */}
          <div className="space-y-1 bg-ink-950 p-3 rounded-xl border border-slate-700 min-w-[280px]">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Select Capstone Program (`mrProgram`)
            </label>
            <select
              id="mrProgram"
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-xs font-bold text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
            >
              {PROGRAM_OPTIONS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* 4 Phases Timeline */}
      <div className="space-y-6">
        {selectedProgram.phases.map((phase, pIdx) => {
          const unlocked = isPhaseUnlocked(pIdx);

          return (
            <div
              key={phase.phaseNumber}
              className={`rounded-2xl border transition-all ${
                unlocked
                  ? 'bg-slate-900/80 border-slate-800 shadow-lg'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              
              {/* Phase Title Bar */}
              <div className="p-6 border-b border-slate-800/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl font-extrabold text-sm flex items-center justify-center border ${
                      unlocked
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    P{phase.phaseNumber}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base sm:text-lg flex items-center gap-2">
                      <span>{phase.title}</span>
                      {!unlocked && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <Lock className="w-3 h-3" /> Locked Gate
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">{phase.description}</p>
                  </div>
                </div>
              </div>

              {/* Weeks Grid */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {phase.weeks.map((week) => {
                  const weekKey = `${selectedProgram.id}-${phase.phaseNumber}-${week.weekNumber}`;
                  const isPassed = passedWeekKeys.has(weekKey);

                  return (
                    <div
                      key={week.weekNumber}
                      onClick={() => unlocked && toggleWeekPassed(weekKey)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                        isPassed
                          ? 'bg-emerald-950/20 border-emerald-800/50 hover:bg-emerald-950/30'
                          : week.isGate
                          ? 'bg-amber-950/20 border-amber-800/40 hover:bg-amber-950/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            Week {week.weekNumber}
                          </span>
                          {week.isGate ? (
                            <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> GATE REVIEW
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-semibold">Review</span>
                          )}
                        </div>

                        <h4 className="font-bold text-white text-xs leading-snug">
                          {week.title}
                        </h4>

                        {/* Deliverables List */}
                        <div className="space-y-1 pt-1">
                          {week.deliverables.map((d, dIdx) => (
                            <div key={dIdx} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <span>{d}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold">
                        <span className={isPassed ? 'text-emerald-400' : 'text-slate-400'}>
                          {isPassed ? 'Passed' : 'Pending Review'}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isPassed ? 'bg-emerald-500 text-ink-950' : 'bg-slate-800 text-slate-600'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
