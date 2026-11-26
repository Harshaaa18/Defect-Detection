import React from 'react';
import { Project } from '../types/portal';
import { X, Scale, Trash2, ExternalLink } from 'lucide-react';

interface CompareModalProps {
  shortlistedProjects: Project[];
  isOpen: boolean;
  onClose: () => void;
  onRemove: (project: Project) => void;
  onOpenDossier: (project: Project) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  shortlistedProjects,
  isOpen,
  onClose,
  onRemove,
  onOpenDossier
}) => {
  if (!isOpen) return null;

  const compareRows = [
    { label: 'Project ID', key: 'id' },
    { label: 'Dominant Specialization', key: 'dominantSpecialization' },
    { label: 'Impact Orientation', key: 'impactTag' },
    { label: 'Quality Pattern', key: 'qualityPattern' },
    { label: 'Upstream Custodian', key: 'custodian' },
    { label: 'Application Sector', key: 'applicationSector' },
    { label: 'Source Platform', key: 'sourcePlatform' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink-950/80 backdrop-blur-md animate-fadeIn">
      
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-extrabold text-white">
              Capstone Comparison Matrix ({shortlistedProjects.length} Selected)
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Matrix Table */}
        <div className="p-6 overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
          {shortlistedProjects.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No capstone projects in shortlist. Add projects to compare attributes.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="p-3 font-bold text-slate-400 uppercase w-48 bg-slate-950/50">
                    Attribute / Feature
                  </th>
                  {shortlistedProjects.map(p => (
                    <th key={p.id} className="p-3 font-extrabold text-white min-w-[220px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-blue-400">{p.id}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onOpenDossier(p)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="View Dossier"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRemove(p)}
                            className="p-1 rounded bg-rose-950/40 text-rose-400 hover:bg-rose-900/60"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-slate-200 text-xs font-bold mt-1 line-clamp-2">{p.title}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {compareRows.map(row => {
                  // Check if values differ across columns
                  const values = shortlistedProjects.map(p => (p as any)[row.key] || '');
                  const isDiffering = new Set(values).size > 1;

                  return (
                    <tr key={row.key} className={isDiffering ? 'bg-amber-950/10' : ''}>
                      <td className="p-3 font-semibold text-slate-400 bg-slate-950/40">
                        {row.label}
                      </td>
                      {shortlistedProjects.map(p => (
                        <td
                          key={p.id}
                          className={`p-3 font-medium ${
                            isDiffering ? 'text-amber-200 font-semibold' : 'text-slate-300'
                          }`}
                        >
                          {(p as any)[row.key] || '—'}
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {/* Tech Tags Row */}
                <tr className="bg-slate-950/20">
                  <td className="p-3 font-semibold text-slate-400 bg-slate-950/40">
                    Tech Stack & Tools
                  </td>
                  {shortlistedProjects.map(p => (
                    <td key={p.id} className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {p.techTags.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
};
