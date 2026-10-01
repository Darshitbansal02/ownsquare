import React from 'react';

export function FormField({
  id,
  label,
  required = false,
  error,
  helpText,
  guidance,
  children,
  className = ''
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-sm font-semibold text-[#0F2A4A]">
            {label}
            {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </label>
          {guidance && (
            <span className="text-xs text-gray-500 font-normal">{guidance}</span>
          )}
        </div>
      )}

      {children}

      {helpText && !error && (
        <p id={id ? `${id}-help` : undefined} className="text-xs text-gray-500">
          {helpText}
        </p>
      )}

      {error && (
        <p
          id={id ? `${id}-error` : undefined}
          role="alert"
          className="text-xs font-medium text-red-600 flex items-center space-x-1"
        >
          <svg className="w-3.5 h-3.5 inline mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export default FormField;
