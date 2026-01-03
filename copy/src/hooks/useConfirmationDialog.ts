import { useState, useCallback } from 'react';

interface UseConfirmationDialogOptions {
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  confirmText?: string;
  cancelText?: string;
}

export const useConfirmationDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<UseConfirmationDialogOptions>({
    onConfirm: () => {},
    title: 'Confirm',
    message: 'Are you sure?',
    type: 'info',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
  });

  const showDialog = useCallback((options: UseConfirmationDialogOptions) => {
    setConfig({
      title: 'Confirm',
      message: 'Are you sure?',
      type: 'info',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      ...options,
    });
    setIsOpen(true);
  }, []);

  const hideDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      await config.onConfirm();
    } catch (error) {
      if (typeof window !== 'undefined' && window.logger) {
        window.logger.error('Error in confirmation dialog action', error);
      }
    } finally {
      setIsOpen(false);
    }
  }, [config]);

  return {
    isOpen,
    config,
    showDialog,
    hideDialog,
    handleConfirm,
  };
};


