import { useContext } from 'react';
import {
  AnalysisContext,
  type AnalysisContextValue,
} from '../context/AnalysisContext';

export function useAnalysis(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext);
  if (!ctx) {
    throw new Error('useAnalysis must be used within an AnalysisProvider.');
  }
  return ctx;
}
