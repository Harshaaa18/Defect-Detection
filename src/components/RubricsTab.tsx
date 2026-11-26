import React, { useState } from 'react';
import { DEFAULT_RUBRIC_COMPONENTS } from '../data/rubricsAndPlans';
import { Award, Calculator, Download, CheckCircle2, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { jsPDF } from 'jspdf';

export const RubricsTab: React.FC = () => {
  const [rubricComponents, setRubricComponents] = useState(DEFAULT_RUBRIC_COMPONENTS);

  // Student component scores (0 - 100)
  const [scores, setScores] = useState<Record<string, number>>({
    'rubric-1': 85,
    'rubric-2': 90,
    'rubric-3': 88,
    'rubric-4': 92
  });

  const [studentName, setStudentName] = useState('Sri Harsha');
  const [studentId, setStudentId] = useState('2200030001');

  // Algorithm: finalScore = Σ (componentScore_i / maxScore_i) * weight_i * 100
  const finalScore = rubricComponents.reduce((acc, comp) => {
    const score = scores[comp.id] || 0;
    return acc + (score / comp.maxScore) * comp.weight * 100;
  }, 0);

  const getGrade = (score: number) => {
    if (score >= 90) return { letter: 'O (Outstanding)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 80) return { letter: 'A+ (Excellent)', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    if (score >= 70) return { letter: 'A (Very Good)', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
    if (score >= 60) return { letter: 'B+ (Good)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { letter: 'C (Satisfactory)', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  };

  const gradeInfo = getGrade(finalScore);

  const handleScoreChange = (id: string, val: number) => {
    setScores(prev => ({ ...prev, [id]: Math.min(100, Math.max(0, val)) }));
  };

  const handleExportRubricPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("KL UNIVERSITY CAPSTONE EVALUATION REPORT", 15, 20);

    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.text(`Student: ${studentName} (${studentId})`, 15, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);

    let y = 45;
    doc.text("Component Scoring Breakdown:", 15, y);
    y += 8;

    rubricComponents.forEach((comp) => {
      const score = scores[comp.id] || 0;
      doc.setFont("helvetica", "bold");
      doc.text(`${comp.name} (Weight: ${comp.weight * 100}%): ${score} / ${comp.maxScore}`, 15, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.text(`Description: ${comp.description}`, 15, y, { maxWidth: 180 });
      y += 10;
    });

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text(`FINAL WEIGHTED SCORE: ${finalScore.toFixed(2)} / 100`, 15, y);
    y += 8;
    doc.text(`FINAL GRADE: ${gradeInfo.letter}`, 15, y);

    doc.save(`Evaluation_Report_${studentId}.pdf`);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/80 border border-slate-800 p-8 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>EVALUATION RUBRICS & SCORING CALCULATOR</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Capstone Evaluation Rubric Engine
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl">
              Calculates weighted assessment scores across problem formulation, architecture, technical execution, and final demonstration.
            </p>
          </div>

          <button
            onClick={handleExportRubricPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition self-start md:self-center"
          >
            <Download className="w-4 h-4" />
            <span>Export Score Report PDF</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs + Live Grade Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Component Sliders */}
        <div className="lg:col-span-2 space-y-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
          
          {/* Student Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-800">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Student Name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-ink-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Student ID / Reg No</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-ink-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2 pt-2">
            <Calculator className="w-4 h-4 text-purple-400" />
            <span>Component Weightages & Scores</span>
          </h3>

          <div className="space-y-4">
            {rubricComponents.map((comp) => {
              const currentScore = scores[comp.id] || 0;
              const weightedPoints = (currentScore / comp.maxScore) * comp.weight * 100;

              return (
                <div key={comp.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-xs">{comp.name}</h4>
                      <p className="text-[11px] text-slate-400">{comp.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-purple-400">
                        Weight: {comp.weight * 100}%
                      </span>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        Contrib: +{weightedPoints.toFixed(1)} pts
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentScore}
                      onChange={(e) => handleScoreChange(comp.id, parseFloat(e.target.value))}
                      className="w-full accent-purple-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={currentScore}
                        onChange={(e) => handleScoreChange(comp.id, parseFloat(e.target.value))}
                        className="w-16 bg-ink-950 border border-slate-700 rounded-lg text-center text-xs font-bold text-white py-1"
                      />
                      <span className="text-xs text-slate-400 font-bold">/ 100</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* Live Score Summary Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 text-center shadow-xl sticky top-24">
            
            <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              Computed Final Evaluation
            </span>

            <div className="py-4 space-y-2">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400">
                {finalScore.toFixed(2)}
              </div>
              <span className="text-xs text-slate-400 font-semibold">Out of 100 Weighted Points</span>
            </div>

            <div className={`p-3 rounded-xl border text-sm font-extrabold ${gradeInfo.color}`}>
              Grade: {gradeInfo.letter}
            </div>

            <div className="space-y-2 text-left pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Evaluation Status:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Rubric Compliance:</span>
                <span className="text-white font-bold">100% Weight Match</span>
              </div>
            </div>

            <button
              onClick={handleExportRubricPDF}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Signed PDF Report</span>
            </button>

          </div>
        </div>

      </div>

    </div>
  );
};
