import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileSearch, SlidersHorizontal } from 'lucide-react';
import { HeuristicIndicatorsPanel } from '../components/analysis/HeuristicIndicatorsPanel';
import { ModelLimitationsCallout } from '../components/analysis/ModelLimitationsCallout';
import { ResultSummaryCard } from '../components/analysis/ResultSummaryCard';
import { AlertBanner } from '../components/ui/AlertBanner';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useAnalysis } from '../hooks/useAnalysis';
import { validateThresholds } from '../utils/riskThresholds';

export const Results: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    activeResult,
    getResultById,
    thresholds,
    updateThresholds,
  } = useAnalysis();

  const record = id ? getResultById(id) : activeResult;

  const [mediumInput, setMediumInput] = useState(thresholds.mediumMin.toString());
  const [highInput, setHighInput] = useState(thresholds.highMin.toString());
  const [thresholdError, setThresholdError] = useState<string | null>(null);
  const [thresholdSaved, setThresholdSaved] = useState(false);

  if (!record) {
    return (
      <EmptyState
        icon={<FileSearch className="h-5 w-5" />}
        title="Analysis record not found"
        description="The requested analysis could not be found in this session. Submit a new job posting or browse your analysis history."
        action={
          <div className="flex gap-3">
            <Link
              to="/analyze"
              className="rounded-lg bg-crimson px-4 py-2 text-sm font-medium text-ink-primary hover:bg-crimson-hover transition-colors"
            >
              Analyze a Job
            </Link>
            <Link
              to="/history"
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-primary hover:bg-subtle transition-colors"
            >
              View History
            </Link>
          </div>
        }
      />
    );
  }

  const handleApplyThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    const next = {
      mediumMin: Number(mediumInput),
      highMin: Number(highInput),
    };
    if (Number.isNaN(next.mediumMin) || Number.isNaN(next.highMin)) {
      setThresholdError('Thresholds must be valid numbers.');
      setThresholdSaved(false);
      return;
    }
    const err = validateThresholds(next);
    if (err) {
      setThresholdError(err);
      setThresholdSaved(false);
      return;
    }
    setThresholdError(null);
    updateThresholds(next);
    setThresholdSaved(true);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </Link>
        <Link
          to="/analyze"
          className="rounded-lg bg-crimson px-3.5 py-1.5 text-xs font-medium text-ink-primary hover:bg-crimson-hover transition-colors"
        >
          Analyze Another Job
        </Link>
      </div>

      {record.isDemonstration && (
        <AlertBanner
          variant="warning"
          title="Demonstration Result (Simulated ML Output)"
          description="This prediction was generated locally using mock logic. Connect the FastAPI backend for live job_detector.pkl inference."
        />
      )}

      <ResultSummaryCard record={record} thresholds={thresholds} />

      <HeuristicIndicatorsPanel indicators={record.heuristics} />

      {record.documentMeta && (
        <Card>
          <h3 className="border-b border-border pb-3 text-base font-semibold text-ink-primary">
            Extracted Document &amp; Company Details
          </h3>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-secondary">
                Source File &amp; Method
              </dt>
              <dd className="mt-1 font-mono text-xs text-ink-primary">
                {record.documentMeta.filename || 'N/A'} ({record.documentMeta.extractionMethod || 'N/A'})
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-secondary">
                Company Website
              </dt>
              <dd className="mt-1 text-ink-primary">
                {record.documentMeta.companyWebsite || 'Not detected'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-secondary">
                Recruitment / Company Email
              </dt>
              <dd className="mt-1 font-mono text-xs text-ink-primary">
                {record.documentMeta.recruitmentEmail ||
                  record.documentMeta.companyEmail ||
                  'Not detected'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-ink-secondary">
                Missing Core Fields
              </dt>
              <dd className="mt-1 text-xs text-ink-secondary">
                {record.documentMeta.missingFields &&
                record.documentMeta.missingFields.length > 0
                  ? record.documentMeta.missingFields.join(', ')
                  : 'None'}
              </dd>
            </div>
          </dl>
        </Card>
      )}

      {/* Configurable Presentation Thresholds */}
      <Card>
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <SlidersHorizontal className="h-4 w-4 text-ink-secondary" />
          <h3 className="text-sm font-semibold text-ink-primary">
            Configurable Risk Tier Thresholds
          </h3>
        </div>
        <p className="mt-2 text-xs text-ink-secondary">
          Adjust how the raw model score maps to presentation tiers (LOW / MEDIUM / HIGH). Changing thresholds updates presentation only and never alters the underlying model class.
        </p>

        <form
          onSubmit={handleApplyThresholds}
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div>
            <label htmlFor="mediumMin" className="label-base">
              Medium Risk &ge;
            </label>
            <input
              id="mediumMin"
              type="number"
              step="0.05"
              min="0.05"
              max="0.90"
              value={mediumInput}
              onChange={(e) => {
                setMediumInput(e.target.value);
                setThresholdSaved(false);
              }}
              className="input-base font-mono sm:w-32"
            />
          </div>
          <div>
            <label htmlFor="highMin" className="label-base">
              High Risk &ge;
            </label>
            <input
              id="highMin"
              type="number"
              step="0.05"
              min="0.10"
              max="0.95"
              value={highInput}
              onChange={(e) => {
                setHighInput(e.target.value);
                setThresholdSaved(false);
              }}
              className="input-base font-mono sm:w-32"
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Apply Thresholds
          </Button>
        </form>

        {thresholdError && (
          <p className="mt-2 text-xs text-red-400">{thresholdError}</p>
        )}
        {thresholdSaved && (
          <p className="mt-2 text-xs text-emerald-300">
            Presentation thresholds updated.
          </p>
        )}
      </Card>

      {/* Submitted Job Information Summary */}
      <Card>
        <h3 className="border-b border-border pb-3 text-base font-semibold text-ink-primary">
          Submitted Job Summary
        </h3>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-ink-secondary">
              Employment Type
            </dt>
            <dd className="mt-1 text-ink-primary">
              {record.input.employmentType || 'Not specified'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-ink-secondary">
              Salary Range
            </dt>
            <dd className="mt-1 text-ink-primary">
              {record.input.salaryRange || 'Not specified'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-ink-secondary">
              Experience &amp; Education
            </dt>
            <dd className="mt-1 text-ink-primary">
              {[record.input.requiredExperience, record.input.requiredEducation]
                .filter(Boolean)
                .join(' · ') || 'Not specified'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-ink-secondary">
              Industry / Function
            </dt>
            <dd className="mt-1 text-ink-primary">
              {[record.input.industry, record.input.functionArea]
                .filter(Boolean)
                .join(' · ') || 'Not specified'}
            </dd>
          </div>
        </dl>

        <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-ink-secondary">
              Description
            </h4>
            <p className="mt-1 whitespace-pre-line text-ink-secondary">
              {record.input.description}
            </p>
          </div>
          {record.input.requirements && (
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-ink-secondary">
                Requirements
              </h4>
              <p className="mt-1 whitespace-pre-line text-ink-secondary">
                {record.input.requirements}
              </p>
            </div>
          )}
        </div>
      </Card>

      <ModelLimitationsCallout disclaimer={record.disclaimer} />
    </div>
  );
};
