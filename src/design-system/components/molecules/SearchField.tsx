/**
 * CircleTel Design System - SearchField Molecule
 *
 * A search input field with integrated search icon and optional clear functionality.
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import { Input } from '../atoms';
import { Icon } from '../atoms/Icon';

export interface SearchFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Show clear button when input has value */
  clearable?: boolean;
  /** Callback when clear button is clicked */
  onClear?: () => void;
  /** Custom search icon */
  searchIcon?: React.ReactNode;
  /** Position of search icon */
  iconPosition?: 'left' | 'right';
  /** Additional CSS classes for container */
  containerClassName?: string;
  /** Loading state */
  loading?: boolean;
}

export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  ({
    className,
    containerClassName,
    clearable = true,
    onClear,
    searchIcon,
    iconPosition = 'left',
    loading = false,
    value,
    onChange,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState(value || '');
    const currentValue = value !== undefined ? value : internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    };

    const handleClear = () => {
      if (value === undefined) {
        setInternalValue('');
      }
      onClear?.();
    };

    const showClearButton = clearable && currentValue && !loading;

    return (
      <div className={cn('relative', containerClassName)}>
        {/* Search Icon */}
        {iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {searchIcon || <Icon icon={Search} size="sm" color="muted" decorative />}
          </div>
        )}

        {/* Input Field */}
        <Input
          ref={ref}
          type="search"
          value={currentValue}
          onChange={handleChange}
          className={cn(
            iconPosition === 'left' && 'pl-10',
            iconPosition === 'right' && 'pr-10',
            showClearButton && 'pr-10',
            className
          )}
          {...props}
        />

        {/* Right Side Icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Loading Spinner */}
          {loading && (
            <div className="w-4 h-4 border-2 border-muted border-t-circleTel-orange rounded-full animate-spin" />
          )}

          {/* Search Icon (right position) */}
          {iconPosition === 'right' && !loading && (
            <div>
              {searchIcon || <Icon icon={Search} size="sm" color="muted" decorative />}
            </div>
          )}

          {/* Clear Button */}
          {showClearButton && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm hover:bg-accent"
              aria-label="Clear search"
            >
              <Icon icon={X} size="sm" decorative />
            </button>
          )}
        </div>
      </div>
    );
  }
);

SearchField.displayName = 'SearchField';