import type { HTMLAttributes, ReactNode } from "react";

// Available card variants
export type CardVariant = "default" | "outlined" | "selected" | "flat";

// Available card padding sizes
export type CardPadding = "none" | "sm" | "md" | "lg";

// Shared card properties
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
}

// Shared card variant styles
const VARIANT_STYLES: Record<CardVariant, string> = {
  default: "border border-app-border bg-app-surface shadow-sm",

  outlined: "border border-app-border bg-app-surface",

  selected: "border-2 border-nyu bg-app-surface shadow-sm",

  flat: "border border-transparent bg-app-surface",
};

// Shared card padding styles
const PADDING_STYLES: Record<CardPadding, string> = {
  none: "p-0",

  sm: "p-3",

  md: "p-3 sm:p-5",

  lg: "p-4 sm:p-6",
};

// Main reusable card container
export default function Card({
  variant = "default",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  const cardClassName = [
    "min-w-0 rounded-xl",
    VARIANT_STYLES[variant],
    PADDING_STYLES[padding],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div {...props} className={cardClassName}>
      {children}
    </div>
  );
}

// Shared card header properties
export interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  titleId?: string;
  className?: string;
}

// Reusable card header
export function CardHeader({
  title,
  description,
  actions,
  headingLevel = 2,
  titleId,
  className = "",
}: CardHeaderProps) {
  const Heading = headingLevel === 2 ? "h2" : headingLevel === 3 ? "h3" : "h4";

  return (
    <div
      className={`mb-4 flex flex-wrap items-start justify-between gap-3 ${className}`}
    >
      {/* Card title and description */}
      <div className="min-w-0 flex-1">
        <Heading
          id={titleId}
          className="break-words text-base font-semibold text-app-text sm:text-lg"
        >
          {title}
        </Heading>

        {description && (
          <p className="mt-1 text-sm leading-relaxed text-app-muted">
            {description}
          </p>
        )}
      </div>

      {/* Optional header actions */}
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

// Shared card content properties
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

// Reusable card content
export function CardContent({
  className = "",
  children,
  ...props
}: CardContentProps) {
  return (
    <div {...props} className={`min-w-0 space-y-3 ${className}`}>
      {children}
    </div>
  );
}

// Shared card footer properties
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

// Reusable card footer
export function CardFooter({
  className = "",
  children,
  ...props
}: CardFooterProps) {
  return (
    <div
      {...props}
      className={`mt-4 flex flex-wrap items-center gap-3 border-t border-app-border pt-4 ${className}`}
    >
      {children}
    </div>
  );
}
