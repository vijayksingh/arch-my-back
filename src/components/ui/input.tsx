import * as React from 'react';

import { cn } from '@/lib/utils';

type InputVariant = 'default' | 'ghost';

type InputProps = React.ComponentProps<'input'> & {
  variant?: InputVariant;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', ...props }, ref) => {
    const variantClasses =
      variant === 'ghost'
        ? 'border border-transparent bg-transparent shadow-none placeholder:text-muted-foreground/70 focus-visible:border-ring/70 focus-visible:ring-1 focus-visible:ring-ring/30'
        : 'border border-input bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-visible:border-ring/80 focus-visible:ring-2 focus-visible:ring-ring/25';

    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-lg px-3 text-sm text-foreground transition-[border-color,background-color,box-shadow] duration-150 placeholder:text-muted-foreground/80 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
          variantClasses,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
