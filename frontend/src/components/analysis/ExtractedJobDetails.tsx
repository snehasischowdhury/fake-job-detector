import React, { useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import type {
  DocumentExtractionResponse,
  JobInformationExtracted,
} from '../../types/analysis';
import { AlertBanner } from '../ui/AlertBanner';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ExtractionFieldRow } from './ExtractionField';
import { ExtractionWarnings } from './ExtractionWarnings';

interface ExtractedJobDetailsProps {
  extraction: DocumentExtractionResponse;
  onBackToUpload: () => void;
  onAnalyze: (reviewed: JobInformationExtracted) => Promise<void>;
  isAnalyzing: boolean;
  apiError: string | null;
}

const FIELD_GROUPS: {
  title: string;
  fields: {
    key: keyof JobInformationExtracted;
    label: string;
    multiline?: boolean;
  }[];
}[] = [
  {
    title: 'Basic Job Details',
    fields: [
      { key: 'jobTitle', label: 'Job Title' },
      { key: 'companyName', label: 'Company Name' },
      { key: 'companyWebsite', label: 'Company Website' },
      { key: 'companyEmail', label: 'Company Email' },
      { key: 'companyAddress', label: 'Company Address' },
      { key: 'location', label: 'Job Location' },
      { key: 'department', label: 'Department' },
      { key: 'industry', label: 'Industry' },
      { key: 'employmentType', label: 'Employment Type' },
      { key: 'workMode', label: 'Remote / Hybrid / On-Site' },
    ],
  },
  {
    title: 'Compensation & Benefits',
    fields: [
      { key: 'salaryRange', label: 'Salary Range' },
      { key: 'currency', label: 'Currency' },
      { key: 'paymentFrequency', label: 'Payment Frequency' },
      { key: 'commission', label: 'Commission' },
      { key: 'incentives', label: 'Incentives / Bonus' },
      { key: 'benefits', label: 'Benefits', multiline: true },
    ],
  },
  {
    title: 'Job Requirements & Description',
    fields: [
      { key: 'jobDescription', label: 'Job Description', multiline: true },
      { key: 'responsibilities', label: 'Responsibilities', multiline: true },
      { key: 'qualifications', label: 'Qualifications / Requirements', multiline: true },
      { key: 'skills', label: 'Skills', multiline: true },
      { key: 'requiredExperience', label: 'Required Experience' },
      { key: 'requiredEducation', label: 'Required Education' },
    ],
  },
  {
    title: 'Recruitment Details',
    fields: [
      { key: 'recruitmentEmail', label: 'Recruitment Email' },
      { key: 'contactInformation', label: 'Contact Information' },
      { key: 'applicationInstructions', label: 'Application Instructions', multiline: true },
      { key: 'interviewProcess', label: 'Interview Process', multiline: true },
      { key: 'applicationDeadline', label: 'Application Deadline' },
      { key: 'feesMentioned', label: 'Registration / Processing Fees Mentioned' },
      { key: 'paymentOrPersonalInfoRequests', label: 'Payment or Personal Info Requests' },
    ],
  },
];

export const ExtractedJobDetails: React.FC<ExtractedJobDetailsProps> = ({
  extraction,
  onBackToUpload,
  onAnalyze,
  isAnalyzing,
  apiError,
}) => {
  const [reviewed, setReviewed] = useState<JobInformationExtracted>(
    extraction.jobInformation
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const summaryCounts = useMemo(() => {
    const entries = Object.values(reviewed);
    const identified = entries.filter((f) => f.value && f.value.trim()).length;
    const missing = entries.length - identified;
    const attention = entries.filter(
      (f) =>
        Boolean(f.conflictNote) ||
        (f.value && f.value.trim() && f.confidence < 0.7)
    ).length;
    return { identified, missing, attention };
  }, [reviewed]);

  const handleFieldChange = (
    key: keyof JobInformationExtracted,
    newVal: string
  ) => {
    setReviewed((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: newVal.trim() ? newVal : null,
      },
    }));
    if (localError) setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const descLen = (reviewed.jobDescription.value ?? '').trim().length;
    if (descLen < 30) {
      setLocalError(
        'Please ensure the Job Description field has at least 30 characters before running ML analysis.'
      );
      return;
    }
    setLocalError(null);
    await onAnalyze(reviewed);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToUpload}
          disabled={isAnalyzing}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Upload a Different Document
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="demo">
            {extraction.filename} · {extraction.pageCount} page(s)
          </Badge>
          <Badge variant="info">Method: {extraction.extractionMethod}</Badge>
        </div>
      </div>

      {/* Calculated Summary Counts */}
      <Card padding="sm" className="bg-subtle">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 font-mono">
            <span className="text-emerald-300">
              {summaryCounts.identified} fields identified
            </span>
            <span className="text-ink-secondary">
              {summaryCounts.missing} fields missing
            </span>
            <span className="text-amber-300">
              {summaryCounts.attention}{' '}
              {summaryCounts.attention === 1
                ? 'field requires your attention'
                : 'fields require your attention'}
            </span>
          </div>
          <span className="text-ink-secondary">
            Rule-match confidence is a heuristic indicator, not a fraud probability.
          </span>
        </div>
      </Card>

      <ExtractionWarnings
        warnings={extraction.warnings}
        conflictingFields={extraction.conflictingFields}
        documentStatus={extraction.documentStatus}
      />

      {(localError || apiError) && (
        <AlertBanner
          variant="error"
          title="Cannot run analysis"
          description={localError || apiError || ''}
        />
      )}

      {FIELD_GROUPS.map((group) => (
        <Card key={group.title}>
          <h3 className="mb-4 border-b border-border pb-3 text-base font-semibold text-ink-primary">
            {group.title}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {group.fields.map((f) => (
              <div
                key={f.key}
                className={f.multiline ? 'md:col-span-2' : undefined}
              >
                <ExtractionFieldRow
                  fieldKey={f.key}
                  label={f.label}
                  field={reviewed[f.key]}
                  multiline={f.multiline}
                  onChange={(val) => handleFieldChange(f.key, val)}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="secondary"
          disabled={isAnalyzing}
          onClick={onBackToUpload}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="lg" isLoading={isAnalyzing}>
          <Search className="h-4 w-4" />
          {isAnalyzing ? 'Analysing Job Offer...' : 'Analyse Job Offer'}
        </Button>
      </div>
    </form>
  );
};
