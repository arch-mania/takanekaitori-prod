import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Link } from '@remix-run/react';

import { cn } from '~/lib/utils';

const buttonVariants = cva(
  'inline-flex w-fit items-center justify-center whitespace-nowrap rounded-md ring-offset-background transition-colors transition-opacity disabled:pointer-events-none disabled:opacity-50 hover:opacity-80',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-input bg-background',
        secondary: 'border-[2px] border-primary text-primary rounded-[6px]',
        tertiary: 'bg-[rgba(168,218,220,0.2)] text-primary opacty-20',
        tag: 'border-primary text-primary bg-background',
        ghost: 'text-primary',
        link: 'text-primary underline-offset-4',
      },
      size: {
        default: 'h-14 rounded-[8px] px-8 text-base font-bold',
        xs: 'h-[37px] rounded-[8px] px-4 text-sm font-medium w-fit lg:text-lg lg:h-[43px] lg:px-6',
        sm: 'h-11 rounded-[8px] px-6 text-sm font-bold w-[240px]',
        lg: 'h-12 min-w-[180px] rounded-[8px] px-8 text-base font-bold',
        icon: 'h-12 w-[51px] rounded-[8px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  to?: string;
  target?: '_blank';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, to, target, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const classes = cn(buttonVariants({ variant, size, className }));

    if (to) {
      return (
        <Link
          to={to}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          className={classes}
          prefetch="render"
        >
          <Comp className="flex size-full items-center justify-center" ref={ref} {...props}>
            {children}
          </Comp>
        </Link>
      );
    }

    return (
      <Comp className={classes} ref={ref} {...props}>
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
