import React, { useState } from 'react';
import { Project } from '../types/portal';
import { getSimilarProjects } from '../lib/searchEngine';
import { jsPDF } from 'jspdf';
import {
  X, FileText, Cpu, Compass, CheckCircle2, ShieldAlert,
  Download, Bookmark, Building2, Globe, Sparkles, Layers,
  ExternalLink, ArrowRight
} from 'lucide-react';

interface DossierModalProps {
  project: Project | null;
  allProjects: Project[];
  onClose: () => void;
  onSelectProject: (p: Project) => void;
  isShortlisted: boolean;
  onToggleShortlist: (p: Project) => void;
}

type DossierTab = 'overview' | 'architecture' | 'roadmap' | 'kpis' | 'tests' | 'metadata';

export const DossierModal: React.FC<DossierModalProps> = ({
  project,
  allProjects,
  onClose,
  onSelectProject,
  isShortlisted,
  onToggleShortlist
}) => {
  if (!project) return null;

  const [activeTab, setActiveTab] = useState<DossierTab>('overview');

  const similarProjects = getSimilarProjects(project, allProjects, 4);

  // Generate & Download PDF Report
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`KL UNIVERSITY CAPSTONE DOSSIER`, 15, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246);
    doc.text(`Project ID: ${project.id} - ${project.dominantSpecialization}`, 15, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(project.title, 15, 40, { maxWidth: 180 });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);

    let y = 55;
    doc.setFont("helvetica", "bold");
    doc.text("Problem Context & Prescribed Direction:", 15, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    const probLines = doc.splitTextToSize(project.problemContext || project.mandate, 180);
    doc.text(probLines, 15, y);
    y += probLines.length * 6 + 5;

    if (project.consequenceStatement) {
      doc.setFont("helvetica", "bold");
      doc.text("Consequence Statement:", 15, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      const consLines = doc.splitTextToSize(project.consequenceStatement, 180);
      doc.text(consLines, 15, y);
      y += consLines.length * 6 + 5;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Governance & Metadata:", 15, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.text(`Issuer / Custodian: ${project.custodian}`, 15, y); y += 6;
    doc.text(`Application Sector: ${project.applicationSector}`, 15, y); y += 6;
    doc.text(`Quality Pattern: ${project.qualityPattern || 'Standard Engineering Topology'}`, 15, y); y += 6;
    doc.text(`Tech Tags: ${project.techTags.map(t => t.name).join(', ')}`, 15, y);

    doc.save(`KL_Capstone_${project.id}_Dossier.pdf`);
  };

  const tabs = [
    { id: 'overview' as DossierTab, label: 'Overview', icon: FileText },
    { id: 'architecture' as DossierTab, label: 'System Architecture', icon: Cpu },
    { id: 'roadmap' as DossierTab, label: 'Roadmap', icon: Compass },
    { id: 'kpis' as DossierTab, label: 'KPIs & Impact', icon: Sparkles },
    { id: 'tests' as DossierTab, label: 'Verification Tests', icon: CheckCircle2 },
    { id: 'metadata' as DossierTab, label: 'Metadata & Similar', icon: Layers }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-ink-950/80 backdrop-blur-md animate-fadeIn">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 border-b border-slate-800 space-y-3">
          <div className="flex items-start justify-between gap-4">
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30">
                {project.id}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {project.dominantSpecialization}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {project.impactTag}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleShortlist(project)}
                className={`p-2 rounded-xl border transition ${
                  isShortlisted
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title={isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
              >
                <Bookmark className={`w-4 h-4 ${isShortlisted ? 'fill-amber-400' : ''}`} />
              </button>

              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
            {project.title}
          </h2>

          {/* Sub Navigation */}
          <div className="flex items-center space-x-1 overflow-x-auto pt-3 border-t border-slate-800/80 no-scrollbar">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Modal Body Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar text-slate-300 text-sm">
          
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Problem Context */}
              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Problem Context & Solution Direction
                </h3>
                <p className="text-slate-200 leading-relaxed">
                  {project.problemContext || project.mandate}
                </p>
              </div>

              {/* Consequence Statement */}
              {project.consequenceStatement && (
                <div className="p-5 rounded-xl bg-rose-950/20 border border-rose-900/40 text-rose-200 space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Consequence Statement (Failure Risk)
                  </h3>
                  <p className="leading-relaxed text-slate-300">
                    {project.consequenceStatement}
                  </p>
                </div>
              )}

              {/* Mandate */}
              {project.mandate && (
                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Governing Project Mandate
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {project.mandate}
                  </p>
                </div>
              )}

              {/* Related Specializations */}
              {project.relatedSpecializations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Related Specialization Domains
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.relatedSpecializations.map((rel, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium">
                        {rel}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Tab 2: System Architecture */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  Prescribed Quality Pattern Archetype
                </h3>
                <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-200 font-semibold text-sm">
                  {project.qualityPattern || 'Closed-Loop Sensing & Service Topology'}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This archetype defines the structural boundary, node interconnections, and operational state transitions required to meet system acceptance criteria.
                </p>
              </div>

              {/* Tech Stack Breakdown */}
              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Target Technology Stack & Toolchain
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project.techTags.map((tag, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{tag.name}</span>
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color || '#3B82F6' }} />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Tab 3: Roadmap */}
          {activeTab === 'roadmap' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
                Recommended 4-Phase Capstone Execution Schedule
              </h3>
              <div className="space-y-3">
                {[
                  { phase: 'Phase I', title: 'Mandate Review & SRS Specification', weeks: 'Weeks 1–4', desc: 'Formulate stakeholder needs, literature survey, and measurable acceptance criteria.' },
                  { phase: 'Phase II', title: 'System Architecture & Dataflow Design', weeks: 'Weeks 5–8', desc: 'Construct quality pattern topology, schema definitions, and verification test plan.' },
                  { phase: 'Phase III', title: 'Module Implementation & Optimization', weeks: 'Weeks 9–12', desc: 'Build core software/hardware components, execute unit tests, and tune performance.' },
                  { phase: 'Phase IV', title: 'Integration, Field Test & Jury Defense', weeks: 'Weeks 13–16', desc: 'Final end-to-end demonstration against KPIs and submit comprehensive report.' }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                      P{idx + 1}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-white text-sm">{item.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">{item.weeks}</span>
                      </div>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: KPIs */}
          {activeTab === 'kpis' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                Measurable Acceptance Criteria & Target KPIs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Latency / Throughput</span>
                  <p className="font-bold text-white text-sm">≤ 100ms Response / 10k req/s</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">System Reliability</span>
                  <p className="font-bold text-white text-sm">99.9% Uptime under Stress</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Test Suite Coverage</span>
                  <p className="font-bold text-white text-sm">≥ 85% Code Branch Coverage</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Verification Rigor</span>
                  <p className="font-bold text-white text-sm">Zero Critical Vulnerabilities</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Tests */}
          {activeTab === 'tests' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                Verification Test Suite Strategy
              </h3>
              <div className="space-y-2">
                {[
                  'Automated Unit & Regression Tests',
                  'System Boundary & Dataflow Integration Harness',
                  'Stress & High-Throughput Load Verification',
                  'Field Acceptance & User Evaluation Sign-off'
                ].map((testName, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-200">{testName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 6: Metadata & Similar */}
          {activeTab === 'metadata' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Governance & Publisher Attributes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Upstream Custodian:</span>
                    <strong className="text-white text-sm">{project.custodian}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Source Platform:</span>
                    <strong className="text-white text-sm">{project.sourcePlatform}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Application Sector:</span>
                    <strong className="text-white text-sm">{project.applicationSector}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Custodian Sector:</span>
                    <strong className="text-white text-sm">{project.custodianSector}</strong>
                  </div>
                </div>
              </div>

              {/* Jaccard Similar Projects */}
              {similarProjects.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
                    Jaccard Similar Project Recommendations
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {similarProjects.map((simP) => (
                      <div
                        key={simP.id}
                        onClick={() => onSelectProject(simP)}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/60 transition cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-blue-400 font-extrabold">
                          <span>{simP.id}</span>
                          <span>{simP.dominantSpecialization}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{simP.title}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
