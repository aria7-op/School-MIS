import React, { useState, useCallback } from 'react';
import Toast from './Toast';
import { NotificationType } from '../types/notification';

export interface ToastMessage {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemoveToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  const handleClose = useCallback((id: string) => {
    onRemoveToast(id);
  }, [onRemoveToast]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={handleClose}
        />
      ))}
    </div>
  );
};

export default ToastContainer; 