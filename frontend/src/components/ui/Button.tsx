import type { ButtonHTMLAttributes, ReactNode } from "react";

// Available button variants
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

// Available button sizes
export type ButtonSize = "sm" | "md" | "lg";

// Shared button properties
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Shared variant styles
const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: "app-btn-primary",

  secondary: "app-btn-secondary",

  outline: "app-btn-outline",

  ghost:
    "inline-flex min-h-11 items-center " +
    "justify-center gap-2 rounded-lg " +
    "text-sm font-medium text-slate-600 " +
    "transition-colors hover:bg-slate-100 " +
    "focus-visible:outline-none " +
    "focus-visible:ring-2 " +
    "focus-visible:ring-purple-500 " +
    "focus-visible:ring-offset-2 " +
    "disabled:cursor-not-allowed " +
    "disabled:opacity-60 " +
    "motion-reduce:transition-none",
};

// Shared size styles
const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 py-2 text-sm",

  md: "min-h-11 px-4 py-3 text-sm",

  lg: "min-h-12 px-6 py-3 text-base",
};

// Loading indicator
function LoadingSpinner() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-25"
      />

      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="opacity-90"
      />
    </svg>
  );
}

// Reusable application button
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled = false,
  type = "button",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const buttonClassName = [
    VARIANT_STYLES[variant],
    SIZE_STYLES[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={buttonClassName}
    >
      {/* Loading indicator or left icon */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        leftIcon && (
          <span aria-hidden="true" className="shrink-0">
            {leftIcon}
          </span>
        )
      )}

      {/* Button label */}
      <span>{loading && loadingText ? loadingText : children}</span>

      {/* Right icon */}
      {!loading && rightIcon && (
        <span aria-hidden="true" className="shrink-0">
          {rightIcon}
        </span>
      )}
    </button>
  );
}
