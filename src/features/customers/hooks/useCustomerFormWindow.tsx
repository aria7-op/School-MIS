import { useCallback } from 'react';
import { useWindowManager } from '../components/WindowManager';
import CustomerFormWindow from '../components/CustomerFormWindow';
import React from 'react';
import { Customer } from '../types';

interface UseCustomerFormWindowProps {
  onSubmit: (data: Customer) => void;
  loading?: boolean;
}

export const useCustomerFormWindow = ({ onSubmit, loading = false }: UseCustomerFormWindowProps) => {
  const { openWindow, closeWindow } = useWindowManager();

  const openCustomerForm = useCallback((initialValues?: Customer) => {
    const windowId = `customer-form-${Date.now()}-${Math.random()}`;
    const title = initialValues 
      ? `Edit Customer - ${initialValues.name || 'Untitled'}` 
      : 'New Customer';

    const handleClose = () => {
      closeWindow(windowId);
    };

    const handleSubmit = (data: Customer) => {
      onSubmit(data);
      closeWindow(windowId);
    };

    openWindow({
      id: windowId,
      title,
      component: (
        <CustomerFormWindow
          initialValues={initialValues}
          onSubmit={handleSubmit}
          loading={loading}
          windowId={windowId}
          onClose={handleClose}
        />
      ),
    });

    return windowId;
  }, [openWindow, closeWindow, onSubmit, loading]);

  return { openCustomerForm };
};

