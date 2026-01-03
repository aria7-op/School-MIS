import React, { useState, useEffect } from 'react';
import './toast.css';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          toast={toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};

interface ToastNotificationProps {
  toast: Toast;
  onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 5000;

  useEffect(() => {
    // Auto dismiss timer
    const dismissTimer = setTimeout(() => {
      onClose();
    }, duration);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const decrement = (100 / duration) * 50; // Update every 50ms
        return Math.max(0, prev - decrement);
      });
    }, 50);

    return () => {
      clearTimeout(dismissTimer);
      clearInterval(progressInterval);
    };
  }, [duration, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <div className="toast-icon toast-icon-success">
            <span className="material-icons">check_circle</span>
          </div>
        );
      case 'error':
        return (
          <div className="toast-icon toast-icon-error">
            <span className="material-icons">error</span>
          </div>
        );
      case 'warning':
        return (
          <div className="toast-icon toast-icon-warning">
            <span className="material-icons">warning</span>
          </div>
        );
      case 'info':
      default:
        return (
          <div className="toast-icon toast-icon-info">
            <span className="material-icons">info</span>
          </div>
        );
    }
  };

  return (
    <div className={`toast toast-${toast.type}`}>
      <div className="toast-content">
        {getIcon()}
        <div className="toast-text">
          <h4 className="toast-title">{toast.title}</h4>
          <p className="toast-message">{toast.message}</p>
        </div>
        <button className="toast-close" onClick={onClose}>
          <span className="material-icons">close</span>
        </button>
      </div>
      {toast.action && (
        <div className="toast-action">
          <button
            className="toast-action-button"
            onClick={() => {
              toast.action?.onClick();
              onClose();
            }}
          >
            {toast.action.label}
          </button>
        </div>
      )}
      <div className="toast-progress">
        <div
          className="toast-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ToastContainer;

