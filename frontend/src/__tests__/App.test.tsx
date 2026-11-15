import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('App routing and layout', () => {
  it('renders the Landing page headline, navbar links, and primary CTA', () => {
    render(<App />);
    expect(screen.getByText('Know Before You Apply.')).toBeInTheDocument();
    expect(screen.getAllByText('Analyze a Job').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('History').length).toBeGreaterThan(0);
    expect(screen.getByText('How It Works')).toBeInTheDocument();
  });
});
