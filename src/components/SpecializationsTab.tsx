import React, { useState } from 'react';
import { Specialization, Project } from '../types/portal';
import { Layers, ArrowRight, Search, Sparkles } from 'lucide-react';

interface SpecializationsTabProps {
  specializations: Specialization[];
  projects: Project[];
  onSelectSpecialization: (specName: string) => void;
}

export const SpecializationsTab: React.FC<SpecializationsTabProps> = ({
  specializations,
  projects,
  onSelectSpecialization
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSpecs = specializations.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute top tech tags per spec
  const specTechTags: Record<string, string[]> = {};
  projects.forEach(p => {
    const spec = p.dominantSpecialization;
    if (!specTechTags[spec]) specTechTags[spec] = [];
    p.techTags.forEach(t => {
      if (!specTechTags[spec].includes(t.name) && specTechTags[spec].length < 4) {
        specTechTags[spec].push(t.name);
      }
    });
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>47 Specialization Domains & 2,605 Industry-Vetted Capstones</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Academic Specializations & Problem Systems
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Browse capstone project systems categorized by academic specialization track. Each domain encapsulates governing industry mandates, quality pattern architectures, and technical toolchains.
          </p>

          {/* Quick Search Input */}
          <div className="pt-2 flex items-center max-w-md relative">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search specialization domains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-ink-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Specializations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSpecs.map((spec) => {
          const tags = specTechTags[spec.name] || [];
          return (
            <div
              key={spec.id}
              onClick={() => onSelectSpecialization(spec.name)}
              className="group relative rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 hover:border-blue-500/50 hover:bg-slate-800/50 transition cursor-pointer flex flex-col justify-between"
              style={{ borderLeftColor: spec.color, borderLeftWidth: '4px' }}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {spec.id}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Layers className="w-3 h-3" />
                    {spec.projectCount} Projects
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition leading-snug">
                  {spec.name}
                </h3>

                {/* Tech tag preview */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-blue-400 transition">
                <span>Explore Catalog</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
              </div>
            </div>
          );
        })}
      </div>

      {filteredSpecs.length === 0 && (
        <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-slate-800">
          <p className="text-slate-400 text-sm">No specializations match "{searchTerm}".</p>
        </div>
      )}

    </div>
  );
};
