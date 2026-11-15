import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FileText, Plus } from 'lucide-react';
import { RecentAnalysesList } from '../components/dashboard/RecentAnalysesList';
import { RiskDistributionChart } from '../components/dashboard/RiskDistributionChart';
import { AlertBanner } from '../components/ui/AlertBanner';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { StatCard } from '../components/ui/StatCard';
import { useAnalysis } from '../hooks/useAnalysis';

export const Dashboard: React.FC = () => {
  const { history, statistics, thresholds } = useAnalysis();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
              Screening Dashboard
            </h1>
            {statistics.isSampleData && (
              <Badge variant="demo">Sample Data</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-secondary">
            Overview of evaluated job postings and risk tier distribution.
          </p>
        </div>

        <Link
          to="/analyze"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-crimson px-4 py-2 text-sm font-medium text-ink-primary hover:bg-crimson-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Analysis
        </Link>
      </div>

      {statistics.isSampleData && (
        <AlertBanner
          variant="info"
          title="Showing Phase 1 Sample Statistics"
          description="These counts and charts are computed from local demonstration records. In Phase 4–5, they will reflect persisted PostgreSQL/SQLite records."
        />
      )}

      {history.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No analyses recorded yet"
          description="Submit your first job posting to populate screening metrics and risk distribution charts."
          action={
            <Link
              to="/analyze"
              className="rounded-lg bg-crimson px-4 py-2 text-sm font-medium text-ink-primary hover:bg-crimson-hover transition-colors"
            >
              Analyze a Job
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total Jobs Analyzed"
              value={statistics.totalAnalyzed}
              subtext="Includes session submissions"
              icon={<FileText className="h-5 w-5" />}
            />
            <StatCard
              label="Potentially Fraudulent"
              value={statistics.potentiallyFraudulent}
              subtext="Model class 1 detections"
              icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
            />
            <StatCard
              label="Legitimate Identified"
              value={statistics.legitimateIdentified}
              subtext="Model class 0 detections"
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
            />
          </div>

          <RiskDistributionChart statistics={statistics} />

          <RecentAnalysesList records={history} thresholds={thresholds} />
        </>
      )}
    </div>
  );
};
