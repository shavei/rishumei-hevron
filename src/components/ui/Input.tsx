import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, dir = 'auto', ...props }, ref) => (
    <input
      ref={ref}
      dir={dir}
      className={cn(
        'h-11 w-full rounded-md border border-border bg-surface px-3 text-base text-text',
        'placeholder:text-text-subtle focus:border-accent focus:outline-none',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
