import type { RiskLevel } from '../types/analysis';

export const DESIGN_TOKENS = {
  typography: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, ui-monospace, monospace',
  },
  spacing: {
    pageMaxWidth: 'max-w-6xl',
    sectionGap: 'space-y-8',
    cardPadding: 'p-6',
  },
  riskStyles: {
    LOW: {
      label: 'LOW RISK',
      badgeBg: 'bg-subtle',
      badgeText: 'text-emerald-300',
      badgeBorder: 'border-border-strong',
      barColor: 'bg-emerald-600',
      accentHex: '#2E7D5B',
      description: 'No strong fraud signals detected by the automated screening.',
    },
    MEDIUM: {
      label: 'MEDIUM RISK',
      badgeBg: 'bg-amber-950/50',
      badgeText: 'text-amber-300',
      badgeBorder: 'border-amber-800/70',
      barColor: 'bg-amber-500',
      accentHex: '#D97706',
      description: 'Mixed or borderline signals detected. Verify company details independently.',
    },
    HIGH: {
      label: 'HIGH RISK',
      badgeBg: 'bg-crimson/20',
      badgeText: 'text-red-200',
      badgeBorder: 'border-crimson',
      barColor: 'bg-crimson',
      accentHex: '#A31C1B',
      description: 'Elevated fraud indicators detected. Exercise caution before sharing personal data.',
    },
  } satisfies Record<
    RiskLevel,
    {
      label: string;
      badgeBg: string;
      badgeText: string;
      badgeBorder: string;
      barColor: string;
      accentHex: string;
      description: string;
    }
  >,
} as const;
