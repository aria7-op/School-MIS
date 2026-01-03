import React from 'react';
import { useUltraAdvancedAccessControl } from '../contexts/UltraAdvancedAccessControlContext';

interface SecureComponentProps {
  componentId: string;
  action?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  [key: string]: any;
}

const SecureComponent: React.FC<SecureComponentProps> = ({
  componentId,
  action = 'view',
  fallback = null,
  children,
  ...props
}) => {
  const { canAccessComponent } = useUltraAdvancedAccessControl();

  const hasAccess = canAccessComponent(componentId, action);

  if (!hasAccess) {
    return fallback;
  }

  return React.cloneElement(children as React.ReactElement, props);
};

export default SecureComponent; 
