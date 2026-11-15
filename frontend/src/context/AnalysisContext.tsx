import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { INITIAL_DEMO_HISTORY } from '../data/mockData';
import { predictionService } from '../services/predictionService';
import type {
  AnalysisRecord,
  DashboardStatistics,
  JobPostingInput,
  RiskThresholds,
} from '../types/analysis';
import { DEFAULT_RISK_THRESHOLDS } from '../utils/riskThresholds';

export interface AnalysisContextValue {
  history: AnalysisRecord[];
  activeResult: AnalysisRecord | null;
  thresholds: RiskThresholds;
  isAnalyzing: boolean;
  error: string | null;
  isMockMode: boolean;
  statistics: DashboardStatistics;
  analyzePosting: (input: JobPostingInput) => Promise<AnalysisRecord>;
  getResultById: (id: string) => AnalysisRecord | undefined;
  deleteRecord: (id: string) => void;
  updateThresholds: (next: RiskThresholds) => void;
  clearError: () => void;
}

export const AnalysisContext = createContext<AnalysisContextValue | undefined>(
  undefined
);

export const AnalysisProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [history, setHistory] = useState<AnalysisRecord[]>(
    predictionService.isMockMode ? INITIAL_DEMO_HISTORY : []
  );
  const [activeResult, setActiveResult] = useState<AnalysisRecord | null>(
    predictionService.isMockMode ? (INITIAL_DEMO_HISTORY[0] ?? null) : null
  );
  const [thresholds, setThresholds] = useState<RiskThresholds>(
    DEFAULT_RISK_THRESHOLDS
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (predictionService.isMockMode || !predictionService.fetchHistory) {
      return;
    }
    let cancelled = false;
    predictionService
      .fetchHistory([])
      .then((records) => {
        if (!cancelled) {
          setHistory(records);
          setActiveResult((prev) => prev ?? records[0] ?? null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load analysis history from backend.'
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const analyzePosting = useCallback(async (input: JobPostingInput) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const record = await predictionService.analyzeJob(input);
      setHistory((prev) => [record, ...prev]);
      setActiveResult(record);
      return record;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to complete job analysis. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const getResultById = useCallback(
    (id: string) => history.find((item) => item.id === id),
    [history]
  );

  const deleteRecord = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    setActiveResult((prev) => (prev?.id === id ? null : prev));
    if (!predictionService.isMockMode && predictionService.deleteRecord) {
      predictionService.deleteRecord(id).catch((err) => {
        setError(
          err instanceof Error ? err.message : 'Failed to delete record.'
        );
      });
    }
  }, []);

  const updateThresholds = useCallback((next: RiskThresholds) => {
    setThresholds(next);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const statistics = useMemo(
    () => predictionService.computeStatistics(history, thresholds),
    [history, thresholds]
  );

  const value = useMemo<AnalysisContextValue>(
    () => ({
      history,
      activeResult,
      thresholds,
      isAnalyzing,
      error,
      isMockMode: predictionService.isMockMode,
      statistics,
      analyzePosting,
      getResultById,
      deleteRecord,
      updateThresholds,
      clearError,
    }),
    [
      history,
      activeResult,
      thresholds,
      isAnalyzing,
      error,
      statistics,
      analyzePosting,
      getResultById,
      deleteRecord,
      updateThresholds,
      clearError,
    ]
  );

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
};
