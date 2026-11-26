import { RubricComponent, ProgramOption } from '../types/portal';

export const DEFAULT_RUBRIC_COMPONENTS: RubricComponent[] = [
  {
    id: "rubric-1",
    name: "Problem Formulation & Literature Context",
    description: "Depth of problem framing, stakeholder alignment, literature review, and measurable criteria.",
    weight: 0.20,
    maxScore: 100
  },
  {
    id: "rubric-2",
    name: "Architectural Design & System Modeling",
    description: "Quality pattern selection, dataflow diagramming, component modularity, and risk identification.",
    weight: 0.25,
    maxScore: 100
  },
  {
    id: "rubric-3",
    name: "Technical Implementation & Rigor",
    description: "Code/hardware execution quality, algorithmic efficiency, tool usage, and implementation completeness.",
    weight: 0.35,
    maxScore: 100
  },
  {
    id: "rubric-4",
    name: "Acceptance Testing & Final Demonstration",
    description: "Verification test suite, live system demonstration, KPI achievement, and final report.",
    weight: 0.20,
    maxScore: 100
  }
];

export const PROGRAM_OPTIONS: ProgramOption[] = [
  {
    id: "prog-btech-cse",
    name: "B.Tech CSE / Software Engineering Capstone (2026-27)",
    code: "CSE-CP-2026",
    phases: [
      {
        phaseNumber: 1,
        title: "Phase I: Problem Definition & Literature Benchmark",
        description: "Establish stakeholder problem context, consequence statement, and literature review.",
        weeks: [
          { weekNumber: 1, title: "Stakeholder Framing & Mandate Review", isGate: false, deliverables: ["Problem Statement Draft", "Mandate Matrix"] },
          { weekNumber: 2, title: "Literature Benchmark & Tool Audit", isGate: false, deliverables: ["State-of-the-Art Survey", "Toolchain Selection"] },
          { weekNumber: 3, title: "Requirements & Measurable Criteria", isGate: false, deliverables: ["SRS Specification", "KPI Definition Sheet"] },
          { weekNumber: 4, title: "Gate 1 Review: Problem & Feasibility Approval", isGate: true, deliverables: ["Gate 1 Dossier", "Panel Defense Presentation"] }
        ]
      },
      {
        phaseNumber: 2,
        title: "Phase II: Architecture & System Modeling",
        description: "Formulate quality patterns, dataflow diagrams, API endpoints, and test suites.",
        weeks: [
          { weekNumber: 5, title: "Quality Pattern Selection & Topology", isGate: false, deliverables: ["High-Level Architecture Diagram"] },
          { weekNumber: 6, title: "Interface & Data Schema Design", isGate: false, deliverables: ["DB Schema", "API Contracts / Spec"] },
          { weekNumber: 7, title: "Verification Strategy & Test Harness Setup", isGate: false, deliverables: ["Test Plan", "CI/CD Pipeline Configuration"] },
          { weekNumber: 8, title: "Gate 2 Review: Architecture Approval", isGate: true, deliverables: ["Detailed Design Document (DDD)", "Prototype Walkthrough"] }
        ]
      },
      {
        phaseNumber: 3,
        title: "Phase III: Core Implementation & Validation",
        description: "Build system modules, run algorithmic optimizations, and execute integration tests.",
        weeks: [
          { weekNumber: 9, title: "Module Alpha Development", isGate: false, deliverables: ["Core Algorithm Commit", "Unit Tests"] },
          { weekNumber: 10, title: "Module Beta & Pipeline Integration", isGate: false, deliverables: ["Integrated Assembly", "API Test Results"] },
          { weekNumber: 11, title: "Performance Tuning & Stress Testing", isGate: false, deliverables: ["Benchmarking Report", "Security Audit Log"] },
          { weekNumber: 12, title: "Gate 3 Review: Mid-Term Code & Execution Evaluation", isGate: true, deliverables: ["Working MVP Build", "Code Review Sign-off"] }
        ]
      },
      {
        phaseNumber: 4,
        title: "Phase IV: System Demonstration & Final Defense",
        description: "Final verification against acceptance criteria, user documentation, and capstone presentation.",
        weeks: [
          { weekNumber: 13, title: "Acceptance Criteria Verification", isGate: false, deliverables: ["KPI Verification Matrix", "User Manual"] },
          { weekNumber: 14, title: "Final Dossier & Report Formatting", isGate: false, deliverables: ["Comprehensive Capstone Report PDF"] },
          { weekNumber: 15, title: "Poster & Live System Demo Setup", isGate: false, deliverables: ["Project Poster", "Demo Video / Live Rig"] },
          { weekNumber: 16, title: "Gate 4 Review: Final Capstone Defense", isGate: true, deliverables: ["Final Jury Defense", "Repository Handoff"] }
        ]
      }
    ]
  },
  {
    id: "prog-btech-ai",
    name: "B.Tech AI & Autonomous Systems Capstone",
    code: "AI-CP-2026",
    phases: [
      {
        phaseNumber: 1,
        title: "Phase I: Problem Framing & Dataset Curation",
        description: "Define ML model scope, dataset requirements, and baseline metrics.",
        weeks: [
          { weekNumber: 1, title: "Problem Context & Consequence Framing", isGate: false, deliverables: ["ML Mandate Document"] },
          { weekNumber: 2, title: "Data Collection & Preprocessing", isGate: false, deliverables: ["Clean Dataset", "Data Pipeline Notebook"] },
          { weekNumber: 3, title: "Baseline Model Exploration", isGate: false, deliverables: ["Baseline Benchmark Matrix"] },
          { weekNumber: 4, title: "Gate 1 Review: Data & Scope Approval", isGate: true, deliverables: ["Gate 1 Defense", "Data Governance Approval"] }
        ]
      },
      {
        phaseNumber: 2,
        title: "Phase II: Architecture & Pipeline Design",
        description: "Model selection, neural topology, data synthesis, and evaluation metric setup.",
        weeks: [
          { weekNumber: 5, title: "Model Architecture Definition", isGate: false, deliverables: ["Model Spec & Flow Diagram"] },
          { weekNumber: 6, title: "Training Pipeline & MLOps Infrastructure", isGate: false, deliverables: ["MLOps Pipeline Code"] },
          { weekNumber: 7, title: "Hyperparameter Tuning Framework", isGate: false, deliverables: ["Experiment Tracking Setup"] },
          { weekNumber: 8, title: "Gate 2 Review: Architecture Approval", isGate: true, deliverables: ["Architecture Sign-off"] }
        ]
      },
      {
        phaseNumber: 3,
        title: "Phase III: Model Training & Validation",
        description: "Train models, perform adversarial evaluation, and optimize deployment latency.",
        weeks: [
          { weekNumber: 9, title: "Model Training & Convergence Analysis", isGate: false, deliverables: ["Training Loss Curves", "Model Checkpoint"] },
          { weekNumber: 10, title: "Model Optimization & Quantization", isGate: false, deliverables: ["ONNX/TensorRT Export", "Latency Log"] },
          { weekNumber: 11, title: "Edge / Service Deployment", isGate: false, deliverables: ["Inference Microservice Container"] },
          { weekNumber: 12, title: "Gate 3 Review: Mid-Term Demonstration", isGate: true, deliverables: ["Live Model Demo"] }
        ]
      },
      {
        phaseNumber: 4,
        title: "Phase IV: Final Evaluation & Report",
        description: "Field testing, robustness verification, and capstone presentation.",
        weeks: [
          { weekNumber: 13, title: "Field Test & Out-of-Distribution Validation", isGate: false, deliverables: ["Robustness Report"] },
          { weekNumber: 14, title: "Technical Report & Paper Draft", isGate: false, deliverables: ["Capstone Research Paper"] },
          { weekNumber: 15, title: "Poster & Dashboard Preparation", isGate: false, deliverables: ["Analytics Dashboard & Poster"] },
          { weekNumber: 16, title: "Gate 4 Review: Final Defense", isGate: true, deliverables: ["Jury Presentation"] }
        ]
      }
    ]
  }
];
