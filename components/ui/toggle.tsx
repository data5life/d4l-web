import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Accessible on/off switch. Single source of truth for the toggle styling so
 * every screen (settings, future cards, ...) renders the exact same control.
 */
function Toggle({
  checked,
  onChange,
  disabled,
  className,
  ...props
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
} & Omit<React.ComponentProps<'button'>, 'onChange' | 'type' | 'role' | 'aria-checked'>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'bg-violet-600' : 'bg-gray-300',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200',
          checked ? 'translate-x-7' : 'translate-x-1',
        )}
      />
    </button>
  );
}

export { Toggle };
