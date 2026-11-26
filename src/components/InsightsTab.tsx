import React, { useState, useMemo } from 'react';
import { Project, InsightsData } from '../types/portal';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3, PieChart as PieIcon, ShieldAlert, Building, Filter, Layers } from 'lucide-react';

interface InsightsTabProps {
  insights: InsightsData;
  projects: Project[];
  onOpenDossier: (project: Project) => void;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({
  insights,
  projects,
  onOpenDossier
}) => {
  const [evidenceFilter, setEvidenceFilter] = useState<string>('all');

  // Format sector distribution data for Pie Chart
  const sectorData = useMemo(() => {
    return Object.entries(insights.sectorCounts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [insights]);

  // Top Custodian data for Bar Chart
  const custodianData = useMemo(() => {
    return Object.entries(insights.custodianCounts)
      .map(([name, count]) => ({ name: name.length > 25 ? name.substring(0, 25) + '...' : name, fullName: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [insights]);

  // Consequence Archetypes
  const consequenceArchetypes = [
    { id: 'all', label: 'All Consequence Types' },
    { id: 'evidence', label: 'Misaligned / Incomplete Evidence', keyword: 'misaligned' },
    { id: 'safety', label: 'Safety, Instability & Failure', keyword: 'unstable' },
    { id: 'confidentiality', label: 'Confidentiality / Integrity Failure', keyword: 'confidentiality' },
    { id: 'acceptance', label: 'Acceptance & Configuration Rejection', keyword: 'accepted' }
  ];

  const filteredByConsequence = useMemo(() => {
    if (evidenceFilter === 'all') return projects.slice(0, 6);
    const archetype = consequenceArchetypes.find(a => a.id === evidenceFilter);
    if (!archetype || !archetype.keyword) return projects.slice(0, 6);

    return projects.filter(p =>
      p.consequenceStatement.toLowerCase().includes(archetype.keyword!)
    ).slice(0, 6);
  }, [projects, evidenceFilter]);

  const COLORS = ['#3B82F6', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 border border-slate-800 p-8 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>PORTFOLIO INTELLIGENCE & ANALYTICS</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          System Portfolio Distribution & Risk Evidence
        </h2>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          Aggregated intelligence across 2,605 capstone systems covering application sector market share, custodian institution distribution, and failure consequence archetypes.
        </p>

        {/* Top Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Capstones</span>
            <p className="text-2xl font-extrabold text-white">{insights.totalProjects.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Specializations</span>
            <p className="text-2xl font-extrabold text-blue-400">{insights.totalSpecializations}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Sectors Covered</span>
            <p className="text-2xl font-extrabold text-indigo-400">{Object.keys(insights.sectorCounts).length}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Key Custodians</span>
            <p className="text-2xl font-extrabold text-amber-400">{Object.keys(insights.custodianCounts).length}</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sector Distribution Pie Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-400" />
              <span>Application Sector Distribution</span>
            </h3>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sectorData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Custodian Bar Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Top Problem Issuer / Upstream Custodians</span>
            </h3>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={custodianData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={10} width={130} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Consequence & Evidence Archetype Filter (`viEvidenceFilter`) */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Evidence & Consequence Archetype Explorer (`viEvidenceFilter`)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Filter capstone systems by their primary risk failure mode and consequence archetype.
            </p>
          </div>

          {/* Selector */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={evidenceFilter}
              onChange={(e) => setEvidenceFilter(e.target.value)}
              className="bg-ink-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
            >
              {consequenceArchetypes.map(a => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtered Sample Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredByConsequence.map(p => (
            <div
              key={p.id}
              onClick={() => onOpenDossier(p)}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-rose-500/40 transition cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-rose-400">{p.id}</span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{p.dominantSpecialization}</span>
              </div>
              <h4 className="font-bold text-white text-xs line-clamp-1">{p.title}</h4>
              <p className="text-[11px] text-rose-200/80 line-clamp-2 italic bg-rose-950/20 p-2 rounded border border-rose-900/30">
                "{p.consequenceStatement || 'System failure resulting in unmitigated risk.'}"
              </p>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
