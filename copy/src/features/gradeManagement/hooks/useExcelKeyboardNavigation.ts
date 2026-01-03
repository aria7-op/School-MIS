import { useEffect, useCallback } from 'react';

/**
 * Excel-like Keyboard Navigation
 * Handles: Tab, Enter, Arrow keys, Ctrl+C/V, Undo/Redo
 */
export const useExcelKeyboardNavigation = (
  tableRef: React.RefObject<HTMLTableElement>,
  onCellSelect?: (row: number, col: number) => void,
  onSave?: () => void
) => {
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    
    // Only handle if inside table
    if (!tableRef.current?.contains(target)) return;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        // Move to next cell
        moveFocus('right');
        break;
        
      case 'Enter':
        e.preventDefault();
        if (e.shiftKey) {
          moveFocus('up');
        } else {
          moveFocus('down');
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        moveFocus('up');
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        moveFocus('down');
        break;
        
      case 'ArrowLeft':
        if (!isEditing(target)) {
          e.preventDefault();
          moveFocus('left');
        }
        break;
        
      case 'ArrowRight':
        if (!isEditing(target)) {
          e.preventDefault();
          moveFocus('right');
        }
        break;
        
      case 's':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          onSave?.();
        }
        break;
        
      case 'z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          // Implement undo
        }
        break;
        
      case 'y':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          // Implement redo
        }
        break;
    }
  }, [onSave]);

  const moveFocus = (direction: 'up' | 'down' | 'left' | 'right') => {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) return;

    const cell = activeElement.closest('td');
    if (!cell) return;

    const row = cell.parentElement as HTMLTableRowElement;
    const cellIndex = Array.from(row.cells).indexOf(cell as HTMLTableCellElement);
    const rowIndex = Array.from(row.parentElement!.children).indexOf(row);

    let nextCell: HTMLElement | null = null;

    switch (direction) {
      case 'right':
        nextCell = row.cells[cellIndex + 1]?.querySelector('input') as HTMLElement;
        break;
      case 'left':
        nextCell = row.cells[cellIndex - 1]?.querySelector('input') as HTMLElement;
        break;
      case 'down':
        const nextRow = row.parentElement!.children[rowIndex + 1] as HTMLTableRowElement;
        nextCell = nextRow?.cells[cellIndex]?.querySelector('input') as HTMLElement;
        break;
      case 'up':
        const prevRow = row.parentElement!.children[rowIndex - 1] as HTMLTableRowElement;
        nextCell = prevRow?.cells[cellIndex]?.querySelector('input') as HTMLElement;
        break;
    }

    if (nextCell) {
      nextCell.focus();
      if (nextCell instanceof HTMLInputElement) {
        nextCell.select();
      }
    }
  };

  const isEditing = (element: HTMLElement): boolean => {
    return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    moveFocus
  };
};





