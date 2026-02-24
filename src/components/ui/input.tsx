import * as React from 'react';

import { cn } from '@/lib/utils';

type InputVariant = 'default' | 'ghost';

type InputProps = React.ComponentProps<'input'> & {
  variant?: InputVariant;
  ref?: React.Ref<HTMLInputElement>;
};

function Input({ className, type, variant = 'default', ref, ...props }: InputProps) {
  const variantClasses =
    variant === 'ghost'
      ? 'border border-transparent bg-transparent shadow-none placeholder:text-muted-foreground/70 focus-visible:border-ring/70 focus-visible:ring-1 focus-visible:ring-ring/30'
      : 'border border-ui-border-ghost bg-elevation-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)] focus-visible:border-ui-border-focus focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:shadow-[inset_0_1px_3px_rgba(0,0,0,0.08),0_0_0_3px_hsl(var(--ring)/0.15)]';

  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-lg px-3 text-sm text-foreground transition-[border-color,background-color,box-shadow] duration-150 placeholder:text-muted-foreground/70 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        variantClasses,
        className,
      )}
      ref={ref}
      {...props}
    />
  );
}

export { Input };
