import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { HeuristicIndicator } from '../../types/analysis';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface HeuristicIndicatorsPanelProps {
  indicators: HeuristicIndicator[];
}

export const HeuristicIndicatorsPanel: React.FC<
  HeuristicIndicatorsPanelProps
> = ({ indicators }) => {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
        <div>
          <h3 className="text-base font-semibold text-ink-primary">
            Rule-Based Warning Indicators
          </h3>
          <p className="mt-0.5 text-xs text-ink-secondary">
            Evaluated independently from the ML pipeline using transparent pattern rules. These indicators do not alter the model score.
          </p>
        </div>
        <Badge variant="neutral">Independent Heuristics</Badge>
      </div>

      {indicators.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-border-strong bg-subtle px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            No rule-based red flags (such as upfront fees or off-platform messaging) were triggered in the submitted text.
          </span>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {indicators.map((item) => {
            const icon =
              item.severity === 'alert' ? (
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              ) : item.severity === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="h-4 w-4 text-emerald-300 shrink-0 mt-0.5" />
              );

            return (
              <li
                key={item.id}
                className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 ${
                  item.severity === 'alert'
                    ? 'border-crimson/60 bg-crimson/10'
                    : 'border-border bg-canvas'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {icon}
                  <div>
                    <p className="text-sm font-medium text-ink-primary">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-secondary">
                      {item.description}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    item.severity === 'alert'
                      ? 'alert'
                      : item.severity === 'warning'
                        ? 'warning'
                        : 'info'
                  }
                >
                  {item.matchedField}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};
