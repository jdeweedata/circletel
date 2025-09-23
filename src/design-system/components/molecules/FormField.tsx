/**
 * CircleTel Design System - FormField Molecule
 *
 * A complete form field with label, input, validation message, and help text.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Label, Input, Textarea } from '../atoms';
import { Text } from '../atoms/Text';
import { Icon } from '../atoms/Icon';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export interface FormFieldProps {
  /** Field label */
  label?: string;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea';
  /** Field name */
  name?: string;
  /** Field value */
  value?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Help text displayed below input */
  helpText?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Warning message */
  warning?: string;
  /** Required field indicator */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Additional CSS classes for container */
  className?: string;
  /** Additional CSS classes for input */
  inputClassName?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Blur handler */
  onBlur?: () => void;
  /** Focus handler */
  onFocus?: () => void;
  /** Additional input props */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>;
}

export const FormField = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  FormFieldProps
>(({
  label,
  type = 'text',
  name,
  value,
  placeholder,
  helpText,
  error,
  success,
  warning,
  required,
  disabled,
  loading,
  className,
  inputClassName,
  onChange,
  onBlur,
  onFocus,
  inputProps,
  ...props
}, ref) => {
  const fieldId = name || `field-${Math.random().toString(36).substr(2, 9)}`;
  const hasValidation = error || success || warning;
  const validationState = error ? 'error' : success ? 'success' : warning ? 'warning' : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  const getValidationIcon = () => {
    if (error) return <Icon icon={AlertCircle} size="sm" color="error" />;
    if (success) return <Icon icon={CheckCircle} size="sm" color="success" />;
    if (warning) return <Icon icon={AlertTriangle} size="sm" color="warning" />;
    return null;
  };

  const getValidationMessage = () => {
    if (error) return error;
    if (success) return success;
    if (warning) return warning;
    return null;
  };

  const getValidationColor = () => {
    if (error) return 'error';
    if (success) return 'success';
    if (warning) return 'warning';
    return undefined;
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <Label htmlFor={fieldId} className="flex items-center gap-1">
          {label}
          {required && (
            <span className="text-red-500 text-sm" aria-label="required">
              *
            </span>
          )}
        </Label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Input or Textarea */}
        {type === 'textarea' ? (
          <Textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={fieldId}
            name={name}
            value={value}
            placeholder={placeholder}
            disabled={disabled || loading}
            className={cn(
              hasValidation && 'pr-10',
              validationState === 'error' && 'border-red-500 focus:ring-red-500',
              validationState === 'success' && 'border-green-500 focus:ring-green-500',
              validationState === 'warning' && 'border-yellow-500 focus:ring-yellow-500',
              inputClassName
            )}
            onChange={handleChange}
            onBlur={onBlur}
            onFocus={onFocus}
            aria-invalid={!!error}
            aria-describedby={
              [
                helpText && `${fieldId}-help`,
                hasValidation && `${fieldId}-validation`
              ].filter(Boolean).join(' ') || undefined
            }
            {...(inputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            {...props}
          />
        ) : (
          <Input
            ref={ref as React.Ref<HTMLInputElement>}
            type={type}
            id={fieldId}
            name={name}
            value={value}
            placeholder={placeholder}
            disabled={disabled || loading}
            className={cn(
              hasValidation && 'pr-10',
              validationState === 'error' && 'border-red-500 focus:ring-red-500',
              validationState === 'success' && 'border-green-500 focus:ring-green-500',
              validationState === 'warning' && 'border-yellow-500 focus:ring-yellow-500',
              inputClassName
            )}
            onChange={handleChange}
            onBlur={onBlur}
            onFocus={onFocus}
            aria-invalid={!!error}
            aria-describedby={
              [
                helpText && `${fieldId}-help`,
                hasValidation && `${fieldId}-validation`
              ].filter(Boolean).join(' ') || undefined
            }
            {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)}
            {...props}
          />
        )}

        {/* Validation Icon */}
        {hasValidation && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {getValidationIcon()}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-muted border-t-circleTel-orange rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Help Text */}
      {helpText && (
        <Text
          as="p"
          variant="caption"
          id={`${fieldId}-help`}
          className="text-muted-foreground"
        >
          {helpText}
        </Text>
      )}

      {/* Validation Message */}
      {hasValidation && (
        <Text
          as="p"
          variant="caption"
          color={getValidationColor()}
          id={`${fieldId}-validation`}
          className="flex items-center gap-1"
        >
          {getValidationIcon()}
          {getValidationMessage()}
        </Text>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';