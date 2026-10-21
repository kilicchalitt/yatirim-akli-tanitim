import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary.jsx';

let shouldThrow = true;
function Bomb() {
  if (shouldThrow) throw new Error('boom');
  return <p>all good</p>;
}

beforeEach(() => {
  shouldThrow = true;
  // React logs the caught error; keep the test output clean.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('ErrorBoundary', () => {
  test('shows a message instead of a blank page when a child throws', () => {
    render(
      <ErrorBoundary variant="page">
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Bu sayfa yüklenirken bir sorun oluştu');
    expect(screen.queryByText('all good')).not.toBeInTheDocument();
  });

  test('"Tekrar dene" renders the children again', async () => {
    render(
      <ErrorBoundary variant="page">
        <Bomb />
      </ErrorBoundary>
    );
    shouldThrow = false;
    await userEvent.click(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(screen.getByText('all good')).toBeInTheDocument();
  });

  test('the app-level variant offers a reload', () => {
    render(
      <ErrorBoundary variant="app">
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: 'Sayfayı yenile' })).toBeInTheDocument();
  });

  test('content outside the boundary is untouched', () => {
    render(
      <div>
        <p>outside</p>
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>
      </div>
    );
    expect(screen.getByText('outside')).toBeInTheDocument();
  });
});
