import React, { useState, useMemo } from 'react';
import { Project, Specialization } from '../types/portal';
import { filterProjects, FilterState } from '../lib/searchEngine';
import { ProjectCard } from './ProjectCard';
import { Search, Filter, X, SlidersHorizontal, Grid, List, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface ExploreTabProps {
  projects: Project[];
  specializations: Specialization[];
  onOpenDossier: (project: Project) => void;
  shortlistIds: string[];
  onToggleShortlist: (project: Project) => void;
  initialSpecFilter?: string | null;
}

export const ExploreTab: React.FC<ExploreTabProps> = ({
  projects,
  specializations,
  onOpenDossier,
  shortlistIds,
  onToggleShortlist,
  initialSpecFilter
}) => {
  const [filter, setFilter] = useState<FilterState>({
    query: '',
    specializations: initialSpecFilter ? [initialSpecFilter] : [],
    impactTags: [],
    sectors: [],
    techTags: [],
    sortBy: 'relevance',
    page: 1,
    pageSize: 12
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Execute indexed search
  const searchResult = useMemo(() => {
    return filterProjects(projects, filter);
  }, [projects, filter]);

  // Extract unique sectors & impact options
  const allImpactTags = ['Industry Impact', 'Research Impact', 'Societal Impact', 'Environmental Impact'];
  const allSectors = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => { if (p.applicationSector) set.add(p.applicationSector); });
    return Array.from(set).sort();
  }, [projects]);

  const allTechTags = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => p.techTags.forEach(t => { counts[t.name] = (counts[t.name] || 0) + 1; }));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(entry => entry[0]);
  }, [projects]);

  const toggleArrayItem = (arr: string[], item: string) => {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  };

  const handleResetFilters = () => {
    setFilter({
      query: '',
      specializations: [],
      impactTags: [],
      sectors: [],
      techTags: [],
      sortBy: 'relevance',
      page: 1,
      pageSize: 12
    });
  };

  const activeFilterCount =
    (filter.query ? 1 : 0) +
    filter.specializations.length +
    filter.impactTags.length +
    filter.sectors.length +
    filter.techTags.length;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Search & Toolbar */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search 2,605 project mandates, domains, custodians, tools, or problem statements..."
              value={filter.query}
              onChange={(e) => setFilter(prev => ({ ...prev, query: e.target.value, page: 1 }))}
              className="w-full pl-11 pr-10 py-3 bg-ink-950/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />
            {filter.query && (
              <button
                onClick={() => setFilter(prev => ({ ...prev, query: '', page: 1 }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Controls: Mobile Toggle, Sort, View Mode */}
          <div className="flex items-center gap-3 justify-between md:justify-end">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="md:hidden flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold"
            >
              <Filter className="w-4 h-4 text-blue-400" />
              <span>Filters ({activeFilterCount})</span>
            </button>

            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={filter.sortBy}
                onChange={(e) => setFilter(prev => ({ ...prev, sortBy: e.target.value as any, page: 1 }))}
                className="bg-ink-950/90 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="relevance">Relevance Rank</option>
                <option value="title_asc">Title (A-Z)</option>
                <option value="title_desc">Title (Z-A)</option>
                <option value="impact">Highest Impact</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-ink-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Active Filter Pills Bar */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-slate-400 font-medium">Active Filters:</span>
            {filter.specializations.map(spec => (
              <span key={spec} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {spec}
                <button onClick={() => setFilter(prev => ({ ...prev, specializations: prev.specializations.filter(s => s !== spec), page: 1 }))}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            ))}
            {filter.impactTags.map(imp => (
              <span key={imp} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {imp}
                <button onClick={() => setFilter(prev => ({ ...prev, impactTags: prev.impactTags.filter(i => i !== imp), page: 1 }))}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            ))}
            {filter.sectors.map(sec => (
              <span key={sec} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {sec}
                <button onClick={() => setFilter(prev => ({ ...prev, sectors: prev.sectors.filter(s => s !== sec), page: 1 }))}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            ))}
            {filter.techTags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {tag}
                <button onClick={() => setFilter(prev => ({ ...prev, techTags: prev.techTags.filter(t => t !== tag), page: 1 }))}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            ))}
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white font-semibold underline ml-2"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>
        )}

      </div>

      {/* Content Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Filter Sidebar */}
        <aside className={`lg:block ${mobileFilterOpen ? 'block' : 'hidden'} space-y-6 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl`}>
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-400" />
              <span>Catalog Facets</span>
            </h3>
            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-blue-400 hover:underline font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Specializations Facet */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Specialization Domain
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {specializations.map(spec => {
                const count = searchResult.facetCounts.specializations[spec.name] || 0;
                const isSelected = filter.specializations.includes(spec.name);
                return (
                  <label
                    key={spec.id}
                    className={`flex items-center justify-between text-xs p-1.5 rounded-lg cursor-pointer transition ${
                      isSelected ? 'bg-blue-600/20 text-blue-300' : 'hover:bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => setFilter(prev => ({
                          ...prev,
                          specializations: toggleArrayItem(prev.specializations, spec.name),
                          page: 1
                        }))}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0 bg-ink-950"
                      />
                      <span className="truncate max-w-[170px]">{spec.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 px-1.5 py-0.2 rounded bg-slate-800">
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Impact Tags Facet */}
          <div className="space-y-2 pt-3 border-t border-slate-800/60">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Impact Orientation
            </h4>
            <div className="space-y-1">
              {allImpactTags.map(tag => {
                const isSelected = filter.impactTags.includes(tag);
                const count = searchResult.facetCounts.impactTags[tag] || 0;
                return (
                  <label
                    key={tag}
                    className={`flex items-center justify-between text-xs p-1.5 rounded-lg cursor-pointer transition ${
                      isSelected ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => setFilter(prev => ({
                          ...prev,
                          impactTags: toggleArrayItem(prev.impactTags, tag),
                          page: 1
                        }))}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0 bg-ink-950"
                      />
                      <span>{tag}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 px-1.5 py-0.2 rounded bg-slate-800">
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Application Sector Facet */}
          <div className="space-y-2 pt-3 border-t border-slate-800/60">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Application Sector
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {allSectors.map(sec => {
                const isSelected = filter.sectors.includes(sec);
                const count = searchResult.facetCounts.sectors[sec] || 0;
                return (
                  <label
                    key={sec}
                    className={`flex items-center justify-between text-xs p-1.5 rounded-lg cursor-pointer transition ${
                      isSelected ? 'bg-purple-600/20 text-purple-300' : 'hover:bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => setFilter(prev => ({
                          ...prev,
                          sectors: toggleArrayItem(prev.sectors, sec),
                          page: 1
                        }))}
                        className="rounded border-slate-700 text-purple-600 focus:ring-0 bg-ink-950"
                      />
                      <span className="truncate max-w-[160px]">{sec}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 px-1.5 py-0.2 rounded bg-slate-800">
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Tech Tag Clusters */}
          <div className="space-y-2 pt-3 border-t border-slate-800/60">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Toolchain & Tech Tags
            </h4>
            <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto custom-scrollbar pt-1">
              {allTechTags.map(tag => {
                const isSelected = filter.techTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => setFilter(prev => ({
                      ...prev,
                      techTags: toggleArrayItem(prev.techTags, tag),
                      page: 1
                    }))}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-md transition border ${
                      isSelected
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

        </aside>

        {/* Results Main Section */}
        <main className="lg:col-span-3 space-y-6">
          
          {/* Header Stats */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-white">{searchResult.projects.length}</strong> of{' '}
              <strong className="text-white">{searchResult.totalMatches}</strong> matching project systems
            </span>
            <span>
              Page <strong className="text-white">{filter.page}</strong> of <strong className="text-white">{searchResult.totalPages}</strong>
            </span>
          </div>

          {/* Cards Grid / List */}
          {searchResult.projects.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-5' : 'space-y-4'}>
              {searchResult.projects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpenDossier={onOpenDossier}
                  isShortlisted={shortlistIds.includes(project.id)}
                  onToggleShortlist={onToggleShortlist}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
              <Search className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Capstone Projects Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No project systems matched your filter parameters. Try loosening search terms or resetting facets.
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow hover:bg-blue-500 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Search Filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {searchResult.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                disabled={filter.page === 1}
                onClick={() => setFilter(prev => ({ ...prev, page: prev.page - 1 }))}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, searchResult.totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (searchResult.totalPages > 5 && filter.page > 3) {
                    pageNum = filter.page - 3 + i;
                    if (pageNum > searchResult.totalPages) pageNum = searchResult.totalPages - (4 - i);
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setFilter(prev => ({ ...prev, page: pageNum }))}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                        filter.page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={filter.page === searchResult.totalPages}
                onClick={() => setFilter(prev => ({ ...prev, page: prev.page + 1 }))}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </main>

      </div>

    </div>
  );
};
