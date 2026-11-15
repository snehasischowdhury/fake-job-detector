import React from 'react';
import { Search } from 'lucide-react';
import type { RiskLevel } from '../../types/analysis';
import { Card } from '../ui/Card';

export type SortOption = 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc';

interface HistoryFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  riskFilter: RiskLevel | 'ALL';
  onRiskFilterChange: (value: RiskLevel | 'ALL') => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  riskFilter,
  onRiskFilterChange,
  sortBy,
  onSortChange,
}) => {
  return (
    <Card padding="sm">
      <div className="grid gap-3 md:grid-cols-12">
        <div className="relative md:col-span-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by job title or company..."
            aria-label="Search analysis history"
            className="input-base pl-9"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={riskFilter}
            onChange={(e) => onRiskFilterChange(e.target.value as RiskLevel | 'ALL')}
            aria-label="Filter by risk category"
            className="input-base"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            aria-label="Sort analyses"
            className="input-base"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="score-desc">Highest Score</option>
            <option value="score-asc">Lowest Score</option>
          </select>
        </div>
      </div>
    </Card>
  );
};
