import React from 'react';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink-primary">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      <Footer />
    </div>
  );
};
