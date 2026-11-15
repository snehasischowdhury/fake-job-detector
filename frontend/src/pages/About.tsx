import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';

export const About: React.FC = () => {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
          How Fake Job Detector Works
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Methodology, dataset characteristics, and responsible AI boundaries.
        </p>
      </div>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold text-ink-primary">
          1. The Dataset &amp; Class Imbalance
        </h2>
        <p className="text-sm text-ink-secondary">
          The underlying model was trained on a dataset of{' '}
          <strong className="text-ink-primary">17,880 job postings</strong>{' '}
          across 18 attributes, consisting of 17,014 legitimate listings (95.16%)
          and 866 fraudulent listings (4.84%). Because fraudulent postings are a
          small minority, accuracy alone is not an adequate evaluation metric—precision,
          recall, and Precision-Recall AUC are tracked carefully during validation.
        </p>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold text-ink-primary">
          2. Machine Learning Pipeline (TF-IDF + Logistic Regression)
        </h2>
        <div className="space-y-2 text-sm text-ink-secondary">
          <p>
            The production pipeline (<code className="font-mono text-xs text-ink-primary">job_detector.pkl</code>)
            combines two scikit-learn stages:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-ink-primary">TfidfVectorizer:</strong> Converts
              job text into up to 10,000 unigram and bigram features (<code className="font-mono text-xs text-ink-primary">ngram_range=(1, 2)</code>)
              after removing English stop words.
            </li>
            <li>
              <strong className="text-ink-primary">LogisticRegression:</strong> Linear
              classifier configured with <code className="font-mono text-xs text-ink-primary">class_weight=&quot;balanced&quot;</code>{' '}
              and <code className="font-mono text-xs text-ink-primary">max_iter=1000</code> to penalize
              missed fraudulent postings during training.
            </li>
          </ul>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold text-ink-primary">
          3. Prediction Workflow &amp; Independent Heuristics
        </h2>
        <p className="text-sm text-ink-secondary">
          When you submit a job posting, the ML pipeline produces a binary
          classification (<code className="font-mono text-xs text-ink-primary">0 = Legitimate</code>,{' '}
          <code className="font-mono text-xs text-ink-primary">1 = Potentially Fraudulent</code>) and an
          uncalibrated score. Separately, a transparent rule engine scans for
          explicit red flags—such as upfront registration fees, requests to
          forward funds through personal bank accounts, or off-platform Telegram/WhatsApp
          recruitment. These heuristic warnings never silently alter the ML score.
        </p>
      </Card>

      <Card className="space-y-3 bg-subtle">
        <h2 className="text-base font-semibold text-ink-primary">
          4. Model Limitations &amp; Responsible Use
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-secondary">
          <li>
            <strong className="text-ink-primary">No live domain verification:</strong> The
            model only inspects text; it cannot confirm whether a recruiter email
            matches an official corporate domain.
          </li>
          <li>
            <strong className="text-ink-primary">Uncalibrated probabilities:</strong>{' '}
            Balanced class weighting shifts predicted scores upward; treat{' '}
            <code className="font-mono text-xs text-ink-primary">LOW / MEDIUM / HIGH RISK</code>{' '}
            as screening tiers, not statistical guarantees.
          </li>
          <li>
            <strong className="text-ink-primary">Human judgment required:</strong>{' '}
            Never rely solely on automated screening when making career or financial decisions.
          </li>
        </ul>
      </Card>

      <div className="flex justify-end">
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 rounded-lg bg-crimson px-4 py-2 text-sm font-medium text-ink-primary hover:bg-crimson-hover transition-colors"
        >
          Try the Job Analyzer
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};
