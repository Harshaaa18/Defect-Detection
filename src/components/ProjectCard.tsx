import React from 'react';
import { Project } from '../types/portal';
import { Bookmark, ExternalLink, Cpu, Building2, Globe, ShieldCheck } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onOpenDossier: (project: Project) => void;
  isShortlisted: boolean;
  onToggleShortlist: (project: Project) => void;
  viewMode?: 'grid' | 'list';
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onOpenDossier,
  isShortlisted,
  onToggleShortlist,
  viewMode = 'grid'
}) => {
  const getImpactColor = (impact: string) => {
    if (impact.includes('Industry')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (impact.includes('Research')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (impact.includes('Societal')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  if (viewMode === 'list') {
    return (
      <div className="group rounded-xl bg-slate-900/70 border border-slate-800 p-4 hover:border-slate-700 hover:bg-slate-800/40 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-extrabold px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
              {project.id}
            </span>
            <span className="font-semibold text-slate-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {project.dominantSpecialization}
            </span>
            <span className={`font-semibold px-2 py-0.5 rounded border ${getImpactColor(project.impactTag)}`}>
              {project.impactTag}
            </span>
          </div>
          <h4
            onClick={() => onOpenDossier(project)}
            className="text-base font-bold text-white group-hover:text-blue-400 cursor-pointer transition"
          >
            {project.title}
          </h4>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {project.problemContext}
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <button
            onClick={() => onToggleShortlist(project)}
            className={`p-2 rounded-lg border transition ${
              isShortlisted
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
          >
            <Bookmark className={`w-4 h-4 ${isShortlisted ? 'fill-amber-400' : ''}`} />
          </button>
          <button
            onClick={() => onOpenDossier(project)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
          >
            <span>Dossier</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-blue-500/40 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 flex flex-col justify-between"
      style={{ borderTop: `3px solid ${project.scColor || '#3B82F6'}` }}
    >
      <div className="space-y-3">
        
        {/* Card Meta Top */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
            {project.id}
          </span>
          <span className="text-[10px] font-semibold text-slate-300 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/80 truncate max-w-[180px]">
            {project.dominantSpecialization}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getImpactColor(project.impactTag)}`}>
            {project.impactTag}
          </span>
        </div>

        {/* Title */}
        <h4
          onClick={() => onOpenDossier(project)}
          className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition cursor-pointer leading-snug line-clamp-2"
        >
          {project.title}
        </h4>

        {/* Quality Pattern Pill */}
        {project.qualityPattern && (
          <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-md">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{project.qualityPattern}</span>
          </div>
        )}

        {/* Problem Context snippet */}
        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
          {project.problemContext || project.mandate}
        </p>

        {/* Metadata Lines */}
        <div className="space-y-1.5 pt-2 text-[11px] text-slate-400 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate text-slate-300">{project.custodian}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{project.applicationSector}</span>
          </div>
        </div>

        {/* Tech Tags */}
        <div className="flex flex-wrap gap-1 pt-1">
          {project.techTags.map((t, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium px-2 py-0.5 rounded text-slate-200 border border-slate-700/60"
              style={{ backgroundColor: t.color ? `${t.color}33` : 'rgba(30,41,59,0.8)' }}
            >
              {t.name}
            </span>
          ))}
        </div>

      </div>

      {/* Card Actions Footer */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <button
          onClick={() => onToggleShortlist(project)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
            isShortlisted
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isShortlisted ? 'fill-amber-400' : ''}`} />
          <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
        </button>

        <button
          onClick={() => onOpenDossier(project)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
        >
          <span>Dossier</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
