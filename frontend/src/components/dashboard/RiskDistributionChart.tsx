import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DESIGN_TOKENS } from '../../styles/designTokens';
import type { DashboardStatistics } from '../../types/analysis';
import { Card } from '../ui/Card';

interface RiskDistributionChartProps {
  statistics: DashboardStatistics;
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({
  statistics,
}) => {
  const distributionData = statistics.riskDistribution.map((item) => ({
    name: `${item.level} RISK`,
    count: item.count,
    color: DESIGN_TOKENS.riskStyles[item.level].accentHex,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h3 className="text-sm font-semibold text-ink-primary">
          Risk Tier Distribution
        </h3>
        <p className="mt-0.5 text-xs text-ink-secondary">
          Breakdown of analyzed postings across presentation risk tiers.
        </p>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26352D" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#858B86' }}
                axisLine={{ stroke: '#26352D' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#858B86' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(16, 32, 23, 0.5)' }}
                contentStyle={{
                  backgroundColor: '#202522',
                  borderColor: '#26352D',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#F2F2EF',
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {distributionData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-ink-primary">
          Screening Activity by Day
        </h3>
        <p className="mt-0.5 text-xs text-ink-secondary">
          Legitimate vs. flagged postings over recorded sessions.
        </p>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statistics.recentTrend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26352D" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#858B86' }}
                axisLine={{ stroke: '#26352D' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#858B86' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(16, 32, 23, 0.5)' }}
                contentStyle={{
                  backgroundColor: '#202522',
                  borderColor: '#26352D',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#F2F2EF',
                }}
              />
              <Bar dataKey="legitimate" name="Legitimate" stackId="a" fill="#2E7D5B" radius={[0, 0, 0, 0]} maxBarSize={42} />
              <Bar dataKey="flagged" name="Flagged" stackId="a" fill="#A31C1B" radius={[6, 6, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
