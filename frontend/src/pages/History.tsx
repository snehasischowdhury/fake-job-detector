import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { History as HistoryIcon, Plus } from 'lucide-react';
import {
  HistoryFilters,
  type SortOption,
} from '../components/history/HistoryFilters';
import { HistoryTable } from '../components/history/HistoryTable';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { useAnalysis } from '../hooks/useAnalysis';
import type { RiskLevel } from '../types/analysis';
import { classifyRiskLevel } from '../utils/riskThresholds';

export const History: React.FC = () => {
  const { history, thresholds, deleteRecord, isMockMode } = useAnalysis();
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return history
      .filter((item) => {
        const level = classifyRiskLevel(item.mlPrediction.score, thresholds);
        if (riskFilter !== 'ALL' && level !== riskFilter) {
          return false;
        }
        if (!query) return true;
        return (
          item.input.title.toLowerCase().includes(query) ||
          item.input.companyProfile.toLowerCase().includes(query) ||
          item.input.location.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date-asc':
            return a.createdAt.localeCompare(b.createdAt);
          case 'score-desc':
            return b.mlPrediction.score - a.mlPrediction.score;
          case 'score-asc':
            return a.mlPrediction.score - b.mlPrediction.score;
          case 'date-desc':
          default:
            return b.createdAt.localeCompare(a.createdAt);
        }
      });
  }, [history, searchQuery, riskFilter, sortBy, thresholds]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
              Analysis History
            </h1>
            {isMockMode && <Badge variant="demo">Session Demo Data</Badge>}
          </div>
          <p className="mt-1 text-sm text-ink-secondary">
            Search, filter, and inspect previous job posting evaluations.
          </p>
        </div>

        <Link
          to="/analyze"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-crimson px-4 py-2 text-sm font-medium text-ink-primary hover:bg-crimson-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Analyze Job
        </Link>
      </div>

      <HistoryFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        riskFilter={riskFilter}
        onRiskFilterChange={setRiskFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {filteredRecords.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon className="h-5 w-5" />}
          title="No matching analyses"
          description={
            history.length === 0
              ? 'Your analysis history is currently empty. Run your first job check to see results here.'
              : 'No records match your current search or risk filter.'
          }
          action={
            history.length === 0 ? (
              <Link
                to="/analyze"
                className="rounded-lg bg-crimson px-4 py-2 text-sm font-medium text-ink-primary hover:bg-crimson-hover transition-colors"
              >
                Analyze a Job
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setRiskFilter('ALL');
                }}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-primary hover:bg-subtle transition-colors"
              >
                Clear Filters
              </button>
            )
          }
        />
      ) : (
        <HistoryTable
          records={filteredRecords}
          thresholds={thresholds}
          onDelete={deleteRecord}
        />
      )}
    </div>
  );
};
