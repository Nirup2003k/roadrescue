import React from 'react';
import Modal from './Modal';
import Button from './Button';
export default function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Confirm', variant = 'danger', loading = false, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={
      <>
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </>
    }>
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}
