import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-forest text-white hover:bg-forest-deep',
  secondary: 'bg-forest/10 text-forest hover:bg-forest hover:text-white',
  ghost: 'bg-transparent text-ink hover:bg-ink/5',
};

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold tracking-[0.2em] uppercase transition-colors';

interface CommonProps {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: never;
    href?: never;
  };

type ButtonAsLink = CommonProps &
  Omit<LinkProps, 'className' | 'children'> & {
    href?: never;
  };

type ButtonAsAnchor = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    to?: never;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor;

// Primary/secondary/ghost variants replacing ad hoc button classNames.
// Renders a <Link> when `to` is given, an <a> when `href` is given, else a <button>.
export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`;

  if ('to' in props && props.to !== undefined) {
    const { to, ...rest } = props;
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  if ('href' in props && props.href !== undefined) {
    const { href, ...rest } = props;
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
