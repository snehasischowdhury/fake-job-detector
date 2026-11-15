import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card } from '../ui/Card';

export const ModelLimitationsCallout: React.FC<{ disclaimer: string }> = ({
  disclaimer,
}) => {
  return (
    <Card className="bg-subtle">
      <div className="flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-ink-secondary shrink-0 mt-0.5" />
        <div className="space-y-2 text-xs text-ink-secondary">
          <h3 className="text-sm font-semibold text-ink-primary">
            Model Limitations &amp; Responsible Interpretation
          </h3>
          <p>{disclaimer}</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              <strong className="text-ink-primary">Uncalibrated score:</strong> Logistic Regression trained with{' '}
              <code className="font-mono text-ink-primary">class_weight=&quot;balanced&quot;</code> shifts the decision
              intercept; the score is a relative screening signal, not a calibrated fraud probability.
            </li>
            <li>
              <strong className="text-ink-primary">Text-only scope:</strong> The ML model evaluates text patterns (TF-IDF bigrams)
              and does not verify corporate domains, recruiter identities, or external registries.
            </li>
            <li>
              <strong className="text-ink-primary">Recommended next steps:</strong> Verify the company&apos;s official careers page,
              confirm recruiter email domains, and never pay onboarding fees or share bank credentials.
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
