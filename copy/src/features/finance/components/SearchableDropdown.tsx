import React, { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  id: string;
  label: string;
  subtitle?: string;
  data?: any;
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (option: DropdownOption) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
  maxHeight?: string;
  showSearchCount?: boolean;
  // Pagination helpers (optional)
  showSeeMore?: boolean;
  onSeeMore?: () => void;
  isLoadingMore?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  onSelect,
  placeholder = "Search and select...",
  label,
  required = false,
  disabled = false,
  loading = false,
  error,
  className = "",
  maxHeight = "max-h-60",
  showSearchCount = true,
  showSeeMore = false,
  onSeeMore,
  isLoadingMore = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    
    // Open dropdown when typing
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Handle option selection
  const handleOptionSelect = (option: DropdownOption) => {
    setSearchTerm(option.label);
    onChange(option.label);
    onSelect(option);
    setIsOpen(false);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
    // If there's a selected value, clear it to show all options
    if (value && !searchTerm) {
      setSearchTerm('');
    }
  };

  // Handle input blur with delay to allow option selection
  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && filteredOptions.length === 1) {
      e.preventDefault();
      handleOptionSelect(filteredOptions[0]);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        />
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          </div>
        )}
        
        {/* Dropdown arrow */}
        {!loading && (
          <div className="absolute right-3 top-2.5">
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg ${maxHeight} overflow-y-auto`}>
          {/* Search count */}
          {showSearchCount && searchTerm && (
            <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
              {filteredOptions.length} result{filteredOptions.length !== 1 ? 's' : ''} found
            </div>
          )}
          
          {/* Options */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => handleOptionSelect(option)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-gray-900">
                  {option.label}
                </div>
                {option.subtitle && (
                  <div className="text-sm text-gray-500 mt-0.5">
                    {option.subtitle}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-gray-500">
              {searchTerm ? 'No results found' : 'No options available'}
            </div>
          )}

          {/* See more footer */}
          {showSeeMore && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                // Keep dropdown open while loading more
                if (onSeeMore) onSeeMore();
              }}
              className="w-full text-center px-3 py-2 bg-gray-50 hover:bg-gray-100 text-purple-700 font-medium border-t border-gray-200"
            >
              {isLoadingMore ? 'Loading…' : 'See more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;