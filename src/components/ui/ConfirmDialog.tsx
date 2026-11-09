import { useState, type ReactNode } from 'react';
import { Button } from './Button';
import { Textarea } from './Field';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  tone?: 'primary' | 'danger' | 'success';
  loading?: boolean;
  /** When set, asks for a note (e.g. a rejection reason). */
  noteLabel?: string;
  noteRequired?: boolean;
  notePlaceholder?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'primary',
  loading,
  noteLabel,
  noteRequired,
  notePlaceholder,
}: ConfirmDialogProps) {
  const [note, setNote] = useState('');
  const invalid = noteRequired && note.trim().length < 5;

  const close = () => {
    setNote('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone} loading={loading} disabled={invalid} onClick={() => onConfirm(note.trim())}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <div className="text-sm text-slate-600">{description}</div>}
      {noteLabel && (
        <Textarea
          containerClassName="mt-4"
          label={noteLabel}
          required={noteRequired}
          placeholder={notePlaceholder}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          hint={noteRequired ? 'At least 5 characters.' : undefined}
          autoFocus
        />
      )}
    </Modal>
  );
}
