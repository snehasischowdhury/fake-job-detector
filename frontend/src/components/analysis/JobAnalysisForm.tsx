import React, { useState } from 'react';
import { RotateCcw, Search, Sparkles } from 'lucide-react';
import { EMPTY_JOB_INPUT, SAMPLE_PRESETS } from '../../data/mockData';
import type { FormValidationErrors, JobPostingInput } from '../../types/analysis';
import { FIELD_LIMITS, validateJobPostingInput } from '../../utils/validation';
import { AlertBanner } from '../ui/AlertBanner';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface JobAnalysisFormProps {
  onSubmit: (input: JobPostingInput) => Promise<void>;
  isSubmitting: boolean;
  apiError: string | null;
  onClearApiError: () => void;
}

export const JobAnalysisForm: React.FC<JobAnalysisFormProps> = ({
  onSubmit,
  isSubmitting,
  apiError,
  onClearApiError,
}) => {
  const [form, setForm] = useState<JobPostingInput>(EMPTY_JOB_INPUT);
  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const handleChange = (field: keyof JobPostingInput, value: string) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (submittedOnce) {
      setErrors(validateJobPostingInput(next));
    }
    if (apiError) onClearApiError();
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setForm(preset.input);
    setErrors({});
    if (apiError) onClearApiError();
  };

  const handleReset = () => {
    setForm(EMPTY_JOB_INPUT);
    setErrors({});
    setSubmittedOnce(false);
    if (apiError) onClearApiError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);
    const validationErrors = validateJobPostingInput(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {apiError && (
        <AlertBanner
          variant="error"
          title="Analysis failed"
          description={apiError}
          onDismiss={onClearApiError}
        />
      )}

      {/* Sample Presets Bar */}
      <Card padding="sm" className="bg-subtle">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-ink-secondary">
            <Sparkles className="h-4 w-4 text-ink-primary shrink-0" />
            <span>Quick-fill with a realistic sample posting:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleLoadPreset(preset.id)}
                className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink-primary hover:border-border-strong hover:bg-canvas transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Section 1: Core Text Fields (Used by ML Pipeline) */}
      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h2 className="text-base font-semibold text-ink-primary">
              Core Posting Text
            </h2>
            <p className="mt-0.5 text-xs text-ink-secondary">
              These text fields are concatenated and vectorized by the TF-IDF + Logistic Regression pipeline.
            </p>
          </div>
          <Badge variant="info">Used by ML Model</Badge>
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="title" className="label-base">
                Job Title <span className="text-red-400">*</span>
              </label>
              <span className="font-mono text-[11px] text-ink-secondary">
                {form.title.length}/{FIELD_LIMITS.title}
              </span>
            </div>
            <input
              id="title"
              type="text"
              value={form.title}
              maxLength={FIELD_LIMITS.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Backend Software Engineer (Python / FastAPI)"
              className={`input-base ${errors.title ? 'border-crimson focus:border-crimson focus:ring-crimson' : ''}`}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-400">{errors.title}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="companyProfile" className="label-base">
                Company Name / Profile
              </label>
              <span className="font-mono text-[11px] text-ink-secondary">
                {form.companyProfile.length}/{FIELD_LIMITS.companyProfile}
              </span>
            </div>
            <textarea
              id="companyProfile"
              rows={2}
              value={form.companyProfile}
              maxLength={FIELD_LIMITS.companyProfile}
              onChange={(e) => handleChange('companyProfile', e.target.value)}
              placeholder="Brief company overview, founding context, or mission statement..."
              className="input-base"
            />
            {errors.companyProfile && (
              <p className="mt-1 text-xs text-red-400">{errors.companyProfile}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="description" className="label-base">
                Job Description <span className="text-red-400">*</span>
              </label>
              <span className="font-mono text-[11px] text-ink-secondary">
                {form.description.length}/{FIELD_LIMITS.description}
              </span>
            </div>
            <textarea
              id="description"
              rows={5}
              value={form.description}
              maxLength={FIELD_LIMITS.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Paste the full role responsibilities, day-to-day duties, and application instructions..."
              className={`input-base ${errors.description ? 'border-crimson focus:border-crimson focus:ring-crimson' : ''}`}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-400">{errors.description}</p>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="requirements" className="label-base">
                  Requirements
                </label>
                <span className="font-mono text-[11px] text-ink-secondary">
                  {form.requirements.length}/{FIELD_LIMITS.requirements}
                </span>
              </div>
              <textarea
                id="requirements"
                rows={4}
                value={form.requirements}
                maxLength={FIELD_LIMITS.requirements}
                onChange={(e) => handleChange('requirements', e.target.value)}
                placeholder="Required skills, years of experience, or tools..."
                className="input-base"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="benefits" className="label-base">
                  Benefits
                </label>
                <span className="font-mono text-[11px] text-ink-secondary">
                  {form.benefits.length}/{FIELD_LIMITS.benefits}
                </span>
              </div>
              <textarea
                id="benefits"
                rows={4}
                value={form.benefits}
                maxLength={FIELD_LIMITS.benefits}
                onChange={(e) => handleChange('benefits', e.target.value)}
                placeholder="Health coverage, PTO, retirement match, or stipends..."
                className="input-base"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Section 2: Structured Metadata (Stored for Context & Audit, Not Sent as Separate ML Features) */}
      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h2 className="text-base font-semibold text-ink-primary">
              Structured Job Metadata (Optional)
            </h2>
            <p className="mt-0.5 text-xs text-ink-secondary">
              Recorded for your analysis summary and history. The current text-only ML pipeline does not score these fields independently.
            </p>
          </div>
          <Badge variant="neutral">Context Only</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="location" className="label-base">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={form.location}
              maxLength={FIELD_LIMITS.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="e.g., Austin, TX or Remote"
              className="input-base"
            />
          </div>

          <div>
            <label htmlFor="department" className="label-base">
              Department
            </label>
            <input
              id="department"
              type="text"
              value={form.department}
              maxLength={FIELD_LIMITS.department}
              onChange={(e) => handleChange('department', e.target.value)}
              placeholder="e.g., Platform Engineering"
              className="input-base"
            />
          </div>

          <div>
            <label htmlFor="salaryRange" className="label-base">
              Salary Range
            </label>
            <input
              id="salaryRange"
              type="text"
              value={form.salaryRange}
              maxLength={FIELD_LIMITS.salaryRange}
              onChange={(e) => handleChange('salaryRange', e.target.value)}
              placeholder="e.g., $120,000 - $145,000"
              className="input-base"
            />
          </div>

          <div>
            <label htmlFor="employmentType" className="label-base">
              Employment Type
            </label>
            <select
              id="employmentType"
              value={form.employmentType}
              onChange={(e) => handleChange('employmentType', e.target.value)}
              className="input-base"
            >
              <option value="">Select type...</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Temporary">Temporary</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="requiredExperience" className="label-base">
              Required Experience
            </label>
            <select
              id="requiredExperience"
              value={form.requiredExperience}
              onChange={(e) => handleChange('requiredExperience', e.target.value)}
              className="input-base"
            >
              <option value="">Select level...</option>
              <option value="Internship">Internship</option>
              <option value="Entry level">Entry level</option>
              <option value="Associate">Associate</option>
              <option value="Mid-Senior level">Mid-Senior level</option>
              <option value="Director">Director</option>
              <option value="Executive">Executive</option>
              <option value="Not Applicable">Not Applicable</option>
            </select>
          </div>

          <div>
            <label htmlFor="requiredEducation" className="label-base">
              Required Education
            </label>
            <select
              id="requiredEducation"
              value={form.requiredEducation}
              onChange={(e) => handleChange('requiredEducation', e.target.value)}
              className="input-base"
            >
              <option value="">Select education...</option>
              <option value="Unspecified">Unspecified</option>
              <option value="High School or equivalent">High School or equivalent</option>
              <option value="Associate Degree">Associate Degree</option>
              <option value="Bachelor's Degree">Bachelor&apos;s Degree</option>
              <option value="Master's Degree">Master&apos;s Degree</option>
              <option value="Doctorate">Doctorate</option>
            </select>
          </div>

          <div>
            <label htmlFor="industry" className="label-base">
              Industry
            </label>
            <input
              id="industry"
              type="text"
              value={form.industry}
              maxLength={FIELD_LIMITS.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              placeholder="e.g., Computer Software"
              className="input-base"
            />
          </div>

          <div>
            <label htmlFor="functionArea" className="label-base">
              Function
            </label>
            <input
              id="functionArea"
              type="text"
              value={form.functionArea}
              maxLength={FIELD_LIMITS.functionArea}
              onChange={(e) => handleChange('functionArea', e.target.value)}
              placeholder="e.g., Engineering"
              className="input-base"
            />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={handleReset}
          disabled={isSubmitting}
        >
          <RotateCcw className="h-4 w-4" />
          Reset Form
        </Button>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
        >
          <Search className="h-4 w-4" />
          {isSubmitting ? 'Analyzing Posting...' : 'Analyze Job'}
        </Button>
      </div>
    </form>
  );
};
