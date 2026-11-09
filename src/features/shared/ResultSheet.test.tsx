import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SheetView } from '@/types/api';
import { ResultSheet } from './ResultSheet';

const noCapabilities = { canView: true, canEdit: false, canSubmit: false, canReview: false, canReopen: false };

function sheet(overrides: Partial<SheetView>): SheetView {
  return {
    sheetId: 'sheet-1',
    status: 'SUBMITTED',
    course: { id: 'c1', code: 'CSC205', title: 'Operating Systems I', units: 3, level: 200, department: null },
    semester: { id: 'sem1', label: '2026/2027 First Semester', type: 'FIRST' } as SheetView['semester'],
    lecturer: { id: 'l1', fullName: 'Dr. Chinedu Eze', email: 'lecturer@uemp.edu.ng' },
    submittedAt: '2026-11-01T10:00:00.000Z',
    reviewedAt: null,
    reviewComment: null,
    rows: [
      {
        registrationId: 'r1',
        student: { id: 's1', fullName: 'Adaeze Okonkwo', matricNumber: 'CSC/2025/001', level: 200, program: 'B.Sc. Computer Science' },
        caScore: 25,
        examScore: 50,
        totalScore: 75,
        grade: 'A',
        gradePoint: 5,
      },
    ],
    summary: { registered: 1, graded: 1, average: 75, highest: 75, lowest: 75, passRate: 100, distribution: { A: 1 } },
    capabilities: noCapabilities,
    ...overrides,
  };
}

/** Routes each API path to a canned JSON response. */
function mockApi(view: SheetView) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    const body = url.includes('/settings/academic')
      ? { data: { gradeScale: [], caMaxScore: 30, examMaxScore: 70, maxUnitsPerSemester: 24 } }
      : url.endsWith('/history')
        ? { data: [] }
        : { data: view };
    return new Response(JSON.stringify(body), { status: 200 });
  });
}

function renderSheet() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ResultSheet target={{ sheetId: 'sheet-1' }} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ResultSheet review actions', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows Approve and Return to a reviewer of a submitted sheet', async () => {
    mockApi(sheet({ capabilities: { ...noCapabilities, canReview: true } }));
    renderSheet();

    expect(await screen.findByRole('button', { name: /approve results/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /return for correction/i })).toBeInTheDocument();
    expect(screen.getByText('Submitted for your approval')).toBeInTheDocument();
  });

  it('hides review actions from someone who may only view', async () => {
    mockApi(sheet({}));
    renderSheet();

    expect(await screen.findByText('Awaiting departmental approval')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /approve results/i })).not.toBeInTheDocument();
  });

  it('offers reopen, not approve, on an approved sheet', async () => {
    mockApi(sheet({ status: 'APPROVED', capabilities: { ...noCapabilities, canReopen: true } }));
    renderSheet();

    expect(await screen.findByRole('button', { name: /reopen for correction/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /approve results/i })).not.toBeInTheDocument();
  });
});
