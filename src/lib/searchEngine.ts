import { Project } from '../types/portal';

export interface FilterState {
  query: string;
  specializations: string[];
  impactTags: string[];
  sectors: string[];
  techTags: string[];
  sortBy: 'relevance' | 'title_asc' | 'title_desc' | 'impact';
  page: number;
  pageSize: number;
}

export interface SearchResult {
  projects: Project[];
  totalMatches: number;
  totalPages: number;
  facetCounts: {
    specializations: Record<string, number>;
    impactTags: Record<string, number>;
    sectors: Record<string, number>;
    techTags: Record<string, number>;
  };
}

export function filterProjects(allProjects: Project[], filter: FilterState): SearchResult {
  const queryLower = filter.query.trim().toLowerCase();
  const queryTerms = queryLower ? queryLower.split(/\s+/).filter(Boolean) : [];

  // Scored matching
  const scored: { project: Project; score: number }[] = [];

  for (const p of allProjects) {
    // Check facet criteria first
    if (filter.specializations.length > 0) {
      if (!filter.specializations.includes(p.dominantSpecialization)) {
        continue;
      }
    }

    if (filter.impactTags.length > 0) {
      if (!filter.impactTags.includes(p.impactTag)) {
        continue;
      }
    }

    if (filter.sectors.length > 0) {
      if (!filter.sectors.includes(p.applicationSector)) {
        continue;
      }
    }

    if (filter.techTags.length > 0) {
      const pTagNames = p.techTags.map(t => t.name);
      const hasAnyTechTag = filter.techTags.some(t => pTagNames.includes(t));
      if (!hasAnyTechTag) {
        continue;
      }
    }

    // Text Search Score
    let score = 0;
    if (queryTerms.length > 0) {
      const titleLower = p.title.toLowerCase();
      const specLower = p.dominantSpecialization.toLowerCase();
      const problemLower = p.problemContext.toLowerCase();
      const consLower = p.consequenceStatement.toLowerCase();
      const custLower = p.custodian.toLowerCase();
      const sectorLower = p.applicationSector.toLowerCase();
      const tagsStr = p.techTags.map(t => t.name.toLowerCase()).join(' ');

      for (const term of queryTerms) {
        let termScore = 0;
        if (p.id.toLowerCase() === term) termScore += 10;
        if (titleLower.includes(term)) termScore += 3.5;
        if (specLower.includes(term)) termScore += 2.5;
        if (custLower.includes(term) || sectorLower.includes(term)) termScore += 2.0;
        if (tagsStr.includes(term)) termScore += 1.8;
        if (problemLower.includes(term) || consLower.includes(term)) termScore += 1.0;

        if (termScore === 0) {
          // If a query term isn't found anywhere in project text, zero out
          score = 0;
          break;
        }
        score += termScore;
      }

      if (score === 0) {
        continue;
      }
    } else {
      score = 1.0;
    }

    scored.push({ project: p, score });
  }

  // Sort
  if (filter.sortBy === 'relevance' && queryTerms.length > 0) {
    scored.sort((a, b) => b.score - a.score);
  } else if (filter.sortBy === 'title_asc') {
    scored.sort((a, b) => a.project.title.localeCompare(b.project.title));
  } else if (filter.sortBy === 'title_desc') {
    scored.sort((a, b) => b.project.title.localeCompare(a.project.title));
  } else if (filter.sortBy === 'impact') {
    const impactWeight = (imp: string) => {
      if (imp.includes('Industry')) return 4;
      if (imp.includes('Research')) return 3;
      if (imp.includes('Societal')) return 2;
      return 1;
    };
    scored.sort((a, b) => impactWeight(b.project.impactTag) - impactWeight(a.project.impactTag));
  }

  const matchingProjects = scored.map(s => s.project);
  const totalMatches = matchingProjects.length;
  const totalPages = Math.ceil(totalMatches / filter.pageSize) || 1;

  const startIndex = (filter.page - 1) * filter.pageSize;
  const paginatedProjects = matchingProjects.slice(startIndex, startIndex + filter.pageSize);

  // Compute Facet Counts over the matching set
  const specCounts: Record<string, number> = {};
  const impactCounts: Record<string, number> = {};
  const sectorCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  for (const p of matchingProjects) {
    if (p.dominantSpecialization) {
      specCounts[p.dominantSpecialization] = (specCounts[p.dominantSpecialization] || 0) + 1;
    }
    if (p.impactTag) {
      impactCounts[p.impactTag] = (impactCounts[p.impactTag] || 0) + 1;
    }
    if (p.applicationSector) {
      sectorCounts[p.applicationSector] = (sectorCounts[p.applicationSector] || 0) + 1;
    }
    for (const t of p.techTags) {
      tagCounts[t.name] = (tagCounts[t.name] || 0) + 1;
    }
  }

  return {
    projects: paginatedProjects,
    totalMatches,
    totalPages,
    facetCounts: {
      specializations: specCounts,
      impactTags: impactCounts,
      sectors: sectorCounts,
      techTags: tagCounts
    }
  };
}

export function getSimilarProjects(targetProject: Project, allProjects: Project[], topN = 5): Project[] {
  const targetTagSet = new Set(targetProject.techTags.map(t => t.name));
  const targetSpec = targetProject.dominantSpecialization;
  const targetRelated = new Set(targetProject.relatedSpecializations);

  const similarities: { project: Project; sim: number }[] = [];

  for (const p of allProjects) {
    if (p.id === targetProject.id) continue;

    const pTagSet = new Set(p.techTags.map(t => t.name));
    
    // Calculate Jaccard similarity over tech tags
    let intersection = 0;
    targetTagSet.forEach(tag => {
      if (pTagSet.has(tag)) intersection++;
    });
    const union = targetTagSet.size + pTagSet.size - intersection;
    let jaccard = union > 0 ? intersection / union : 0;

    // Bonus for matching dominant or related specialization
    if (p.dominantSpecialization === targetSpec) {
      jaccard += 0.3;
    }
    if (targetRelated.has(p.dominantSpecialization) || p.relatedSpecializations.includes(targetSpec)) {
      jaccard += 0.2;
    }

    if (jaccard > 0) {
      similarities.push({ project: p, sim: jaccard });
    }
  }

  similarities.sort((a, b) => b.sim - a.sim);
  return similarities.slice(0, topN).map(s => s.project);
}
