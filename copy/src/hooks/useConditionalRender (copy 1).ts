import React from 'react';
import { useUltraAdvancedAccessControl } from '../contexts/UltraAdvancedAccessControlContext';

export const useConditionalRender = () => {
  const { canAccessComponent, canAccessFile, hasDataScope } = useUltraAdvancedAccessControl();

  const renderIf = (condition: boolean, component: React.ReactNode, fallback: React.ReactNode = null) => {
    return condition ? component : fallback;
  };

  const renderComponentIf = (componentId: string, action: string, component: React.ReactNode, fallback: React.ReactNode = null) => {
    return renderIf(canAccessComponent(componentId, action), component, fallback);
  };

  const renderFileIf = (fileId: string, action: string, component: React.ReactNode, fallback: React.ReactNode = null) => {
    return renderIf(canAccessFile(fileId, action), component, fallback);
  };

  const renderScopeIf = (scope: string, component: React.ReactNode, fallback: React.ReactNode = null) => {
    return renderIf(hasDataScope(scope), component, fallback);
  };

  return {
    renderIf,
    renderComponentIf,
    renderFileIf,
    renderScopeIf
  };
}; 
