export interface TechTag {
  name: string;
  color: string;
}

export interface Project {
  id: string;
  title: string;
  mandate: string;
  problemContext: string;
  consequenceStatement: string;
  dominantSpecialization: string;
  relatedSpecializations: string[];
  impactTag: string;
  qualityPattern: string;
  custodian: string;
  custodianSector: string;
  sourcePlatform: string;
  applicationSector: string;
  techTags: TechTag[];
  scColor: string;
  icColor: string;
}

export interface Specialization {
  id: string;
  name: string;
  color: string;
  projectCount: number;
}

export interface InsightsData {
  totalProjects: number;
  totalSpecializations: number;
  sectorCounts: Record<string, number>;
  custodianCounts: Record<string, number>;
  impactCounts: Record<string, number>;
  topTechTags: Record<string, number>;
}

export interface RubricComponent {
  id: string;
  name: string;
  description: string;
  weight: number; // e.g. 0.25 (25%)
  maxScore: number;
}

export interface WeeklyWeek {
  weekNumber: number;
  title: string;
  isGate: boolean;
  deliverables: string[];
}

export interface WeeklyPhase {
  phaseNumber: number;
  title: string;
  description: string;
  weeks: WeeklyWeek[];
}

export interface ProgramOption {
  id: string;
  name: string;
  code: string;
  phases: WeeklyPhase[];
}
