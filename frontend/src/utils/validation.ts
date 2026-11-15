import type { FormValidationErrors, JobPostingInput } from '../types/analysis';

export const FIELD_LIMITS = {
  title: 150,
  companyProfile: 3000,
  location: 120,
  department: 120,
  salaryRange: 100,
  description: 8000,
  requirements: 4000,
  benefits: 2500,
  industry: 120,
  functionArea: 120,
} as const;

export function validateJobPostingInput(input: JobPostingInput): FormValidationErrors {
  const errors: FormValidationErrors = {};

  const title = input.title.trim();
  const description = input.description.trim();

  if (!title) {
    errors.title = 'Job title is required.';
  } else if (title.length < 3) {
    errors.title = 'Job title must be at least 3 characters.';
  } else if (title.length > FIELD_LIMITS.title) {
    errors.title = `Job title must be ${FIELD_LIMITS.title} characters or fewer.`;
  }

  if (!description) {
    errors.description = 'Job description is required for text analysis.';
  } else if (description.length < 30) {
    errors.description = 'Please enter at least 30 characters in the job description.';
  } else if (description.length > FIELD_LIMITS.description) {
    errors.description = `Job description must be ${FIELD_LIMITS.description} characters or fewer.`;
  }

  if (input.companyProfile.length > FIELD_LIMITS.companyProfile) {
    errors.companyProfile = `Company profile must be ${FIELD_LIMITS.companyProfile} characters or fewer.`;
  }
  if (input.requirements.length > FIELD_LIMITS.requirements) {
    errors.requirements = `Requirements must be ${FIELD_LIMITS.requirements} characters or fewer.`;
  }
  if (input.benefits.length > FIELD_LIMITS.benefits) {
    errors.benefits = `Benefits must be ${FIELD_LIMITS.benefits} characters or fewer.`;
  }

  return errors;
}

export function extractCompanyName(companyProfile: string): string {
  const trimmed = companyProfile.trim();
  if (!trimmed) return 'Unspecified Company';
  const firstSentence = trimmed.split(/[.\n-]/)[0]?.trim() || trimmed;
  return firstSentence.length > 48 ? `${firstSentence.slice(0, 45)}...` : firstSentence;
}
