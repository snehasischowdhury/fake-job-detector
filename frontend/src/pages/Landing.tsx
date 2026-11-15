import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileSearch,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

export const Landing: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="mx-auto max-w-3xl pt-4 text-center sm:pt-8">
        <Badge variant="demo" className="mb-4">
          Automated Recruitment Screening · TF-IDF + Logistic Regression
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-ink-primary sm:text-5xl">
          Know Before You Apply.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-ink-secondary sm:text-lg">
          An intelligent job posting analysis platform designed to help identify
          suspicious recruitment activity and potentially fraudulent job
          opportunities before you share personal information.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/analyze"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-crimson px-5 py-2.5 text-sm font-medium text-ink-primary hover:bg-crimson-hover transition-colors focus:outline-none focus:ring-2 focus:ring-ink-primary sm:w-auto"
          >
            Analyze a Job
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-ink-primary hover:bg-subtle hover:border-border-strong transition-colors sm:w-auto"
          >
            Explore Features
          </a>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-ink-primary">
            Built for Transparency &amp; Speed
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Separates statistical text scoring from explicit rule checks so you can inspect every signal.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <div className="mb-3 inline-flex rounded-lg border border-border bg-subtle p-2 text-ink-primary">
              <FileSearch className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-ink-primary">
              NLP Text Screening
            </h3>
            <p className="mt-1.5 text-sm text-ink-secondary">
              Evaluates job titles, company profiles, descriptions, requirements, and benefits using 1–2 gram TF-IDF features.
            </p>
          </Card>

          <Card>
            <div className="mb-3 inline-flex rounded-lg border border-border bg-subtle p-2 text-crimson">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-ink-primary">
              Independent Heuristic Checks
            </h3>
            <p className="mt-1.5 text-sm text-ink-secondary">
              Flags explicit red flags like upfront registration fees or off-platform Telegram/WhatsApp requests without altering ML scores.
            </p>
          </Card>

          <Card>
            <div className="mb-3 inline-flex rounded-lg border border-border bg-subtle p-2 text-ink-primary">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-ink-primary">
              Configurable Risk Tiers
            </h3>
            <p className="mt-1.5 text-sm text-ink-secondary">
              Maps uncalibrated model scores into LOW, MEDIUM, and HIGH risk presentation tiers with adjustable thresholds.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-ink-primary">
            How the Screening Workflow Operates
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Submit Posting Details',
              desc: 'Paste the job title, description, company profile, and optional metadata into the structured form.',
            },
            {
              step: '02',
              title: 'Dual-Layer Evaluation',
              desc: 'The text pipeline computes a screening score while independent pattern rules check for known scam indicators.',
            },
            {
              step: '03',
              title: 'Review & Verify',
              desc: 'Inspect the risk tier, triggered heuristics, and model limitations before deciding to apply.',
            },
          ].map((item) => (
            <Card key={item.step}>
              <span className="font-mono text-xs font-semibold text-crimson">
                STEP {item.step}
              </span>
              <h3 className="mt-2 text-sm font-semibold text-ink-primary">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm text-ink-secondary">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Dataset & Model Transparency (Forest Green secondary section) */}
      <section>
        <Card className="bg-forest border-border-strong">
          <div className="grid gap-6 md:grid-cols-12 md:items-center">
            <div className="space-y-3 md:col-span-8">
              <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-secondary">
                <Database className="h-4 w-4 text-emerald-400" />
                Dataset &amp; Model Transparency
              </div>
              <h2 className="text-lg font-semibold text-ink-primary">
                Grounded in 17,880 Real-World Job Postings
              </h2>
              <p className="text-sm text-ink-secondary">
                Trained on a public recruitment dataset containing 17,014 legitimate and 866 fraudulent postings (4.84% fraud rate) using a balanced Logistic Regression classifier over 10,000 TF-IDF features. Because fraud detection involves severe class imbalance, scores are presented as advisory screening indicators rather than definitive proof.
              </p>
              <div className="pt-1">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-primary hover:underline"
                >
                  Read full methodology &amp; limitations
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="space-y-2.5 rounded-lg border border-border bg-subtle p-4 text-xs md:col-span-4">
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">Dataset Records</span>
                <span className="font-mono font-semibold text-ink-primary">17,880</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">Fraudulent Share</span>
                <span className="font-mono font-semibold text-ink-primary">4.84% (866)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">TF-IDF Max Features</span>
                <span className="font-mono font-semibold text-ink-primary">10,000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">Classifier</span>
                <span className="font-mono font-semibold text-ink-primary">LogReg (balanced)</span>
              </div>
              <div className="flex items-center gap-1.5 pt-2 text-[11px] text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>No unsupported accuracy claims</span>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};
