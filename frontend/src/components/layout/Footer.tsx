import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-forest">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-ink-secondary sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1">
          <p className="font-medium text-ink-primary">
            Fake Job Detector — Automated Recruitment Screening
          </p>
          <p>
            Screening scores are advisory and not definitive proof of fraud. Always verify employers independently.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/analyze" className="hover:text-ink-primary transition-colors">
            Analyze
          </Link>
          <Link to="/dashboard" className="hover:text-ink-primary transition-colors">
            Dashboard
          </Link>
          <Link to="/history" className="hover:text-ink-primary transition-colors">
            History
          </Link>
          <Link to="/about" className="hover:text-ink-primary transition-colors">
            Methodology
          </Link>
        </div>
      </div>
    </footer>
  );
};
