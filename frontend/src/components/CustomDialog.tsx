import React from 'react';
import { X, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface CustomDialogProps {
  isOpen: boolean;
  title: string;
  type?: 'confirm' | 'form' | 'danger';
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  children?: React.ReactNode;
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  title,
  type = 'confirm',
  onClose,
  onConfirm,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  children
}) => {
  if (!isOpen) return null;

  const getHeaderIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle size={20} style={{ color: 'var(--color-error)' }} />;
      case 'confirm':
        return <HelpCircle size={20} style={{ color: 'var(--color-accent)' }} />;
      default:
        return <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />;
    }
  };

  return (
    <div className="run-modal-backdrop" style={{ zIndex: 3000 }}>
      <div className="run-modal-container" style={{ maxWidth: type === 'form' ? '600px' : '450px' }}>
        <div className="run-modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getHeaderIcon()}
            <span>{title}</span>
          </h3>
          <button className="run-modal-close-btn" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="run-modal-body" style={{ padding: '20px' }}>
          {children}
        </div>

        <div className="run-modal-footer">
          <button className="btn-secondary" type="button" onClick={onClose}>
            {cancelText}
          </button>
          {onConfirm && (
            <button
              className="btn-primary"
              type="button"
              onClick={onConfirm}
              style={{
                width: 'auto',
                padding: '10px 20px',
                backgroundColor: type === 'danger' ? 'var(--color-error)' : (type === 'confirm' ? 'var(--color-accent)' : 'var(--color-success)')
              }}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomDialog;
