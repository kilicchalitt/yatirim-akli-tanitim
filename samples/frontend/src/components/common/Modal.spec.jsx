import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal.jsx';
import Input from './Input.jsx';

function Form({ onClose = () => {}, error }) {
  return (
    <Modal isOpen onClose={onClose} title="Yeni portföy">
      <Input label="Portföy adı" error={error} />
      <button type="button">Kaydet</button>
    </Modal>
  );
}

describe('Modal', () => {
  test('is a labelled dialog and focuses the first field', () => {
    render(<Form />);
    const dialog = screen.getByRole('dialog', { name: 'Yeni portföy' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByLabelText('Portföy adı')).toHaveFocus();
  });

  test('Escape closes it', async () => {
    const onClose = vi.fn();
    render(<Form onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('Tab stays inside the dialog', async () => {
    render(<Form />);
    const dialog = screen.getByRole('dialog');
    for (let i = 0; i < 6; i += 1) {
      await userEvent.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await userEvent.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  test('returns focus to the opener when it closes', () => {
    const { rerender } = render(<button type="button">Aç</button>);
    screen.getByRole('button', { name: 'Aç' }).focus();
    rerender(
      <>
        <button type="button">Aç</button>
        <Form />
      </>
    );
    rerender(<button type="button">Aç</button>);
    expect(screen.getByRole('button', { name: 'Aç' })).toHaveFocus();
  });

  test('a field error is announced and linked to the input', () => {
    render(<Form error="Portföy adı boş bırakılamaz." />);
    const input = screen.getByLabelText('Portföy adı');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Portföy adı boş bırakılamaz.');
    expect(screen.getByRole('alert')).toHaveTextContent('Portföy adı boş bırakılamaz.');
  });
});
