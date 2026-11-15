import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, ShieldCheck, X } from 'lucide-react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { Badge } from '../ui/Badge';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/analyze', label: 'Analyze Job' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/history', label: 'History' },
  { to: '/about', label: 'How It Works' },
];

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isMockMode } = useAnalysis();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ink-primary ${
      isActive
        ? 'bg-subtle text-ink-primary border border-border'
        : 'text-ink-secondary hover:text-ink-primary hover:bg-subtle/60 border border-transparent'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-forest/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-ink-primary focus:outline-none focus:ring-1 focus:ring-ink-primary rounded-md"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-strong bg-subtle text-ink-primary">
              <ShieldCheck className="h-4 w-4 text-crimson" />
            </span>
            <span className="tracking-tight">Fake Job Detector</span>
          </Link>
          {isMockMode && (
            <Badge variant="demo" className="hidden sm:inline-flex">
              Demo Mode · Simulated ML
            </Badge>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/analyze"
            className="hidden sm:inline-flex items-center rounded-lg bg-crimson px-3.5 py-1.5 text-xs font-medium text-ink-primary hover:bg-crimson-hover transition-colors focus:outline-none focus:ring-2 focus:ring-ink-primary"
          >
            Analyze a Job
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-subtle p-2 text-ink-primary hover:border-border-strong md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-forest px-4 py-3 md:hidden">
          {isMockMode && (
            <div className="mb-2">
              <Badge variant="demo">Demo Mode · Simulated ML</Badge>
            </div>
          )}
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={linkClass}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
