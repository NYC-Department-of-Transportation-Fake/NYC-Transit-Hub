import type { ReactNode } from "react";

// Shared page header properties
export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  titleId?: string;
}

// Reusable application page header
export default function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  children,
  className = "",
  titleId,
}: PageHeaderProps) {
  return (
    <div className={`mb-5 min-w-0 sm:mb-6 ${className}`}>
      {/* Responsive header layout */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Page title and description */}
        <div className="min-w-0 flex-1">
          {/* Optional category label */}
          {eyebrow && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-nyu">
              {eyebrow}
            </p>
          )}

          {/* Main page heading */}
          <h1 id={titleId} className="app-page-title break-words">
            {title}
          </h1>

          {/* Optional page description */}
          {description && <p className="app-page-description">{description}</p>}
        </div>

        {/* Optional page actions */}
        {actions && (
          <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:max-w-[50%] sm:justify-end">
            {actions}
          </div>
        )}
      </div>

      {/* Optional supporting content */}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
