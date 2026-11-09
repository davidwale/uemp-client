import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GradeBadge, ResultStatusBadge } from './Badge';

describe('ResultStatusBadge', () => {
  it.each([
    ['SUBMITTED', 'Awaiting approval'],
    ['REJECTED', 'Returned for correction'],
    ['APPROVED', 'Approved'],
    ['NOT_STARTED', 'Not started'],
  ])('renders %s as “%s”', (status, label) => {
    render(<ResultStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe('GradeBadge', () => {
  it('shows a placeholder when there is no grade', () => {
    render(<GradeBadge grade={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
