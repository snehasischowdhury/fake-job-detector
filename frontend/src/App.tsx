import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AnalysisProvider } from './context/AnalysisContext';
import { About } from './pages/About';
import { Analyze } from './pages/Analyze';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { Landing } from './pages/Landing';
import { Results } from './pages/Results';

export const App: React.FC = () => {
  return (
    <AnalysisProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/results/:id" element={<Results />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </AnalysisProvider>
  );
};

export default App;
