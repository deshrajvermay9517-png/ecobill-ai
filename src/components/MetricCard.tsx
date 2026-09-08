import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: "emerald" | "amber" | "rose" | "slate" | "blue";
  };
  footnote?: string;
  icon?: React.ReactNode;
}

export default function MetricCard({
  title,
  value,
  unit,
  subtitle,
  badge,
  footnote,
  icon,
}: MetricCardProps) {
  const getBadgeClasses = (variant?: string) => {
    switch (variant) {
      case "emerald":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "amber":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "rose":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "blue":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            {title}
          </span>
          {icon && <div className="text-slate-400">{icon}</div>}
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono">
            {value}
          </span>
          {unit && (
            <span className="text-sm font-semibold text-slate-700">{unit}</span>
          )}
        </div>

        {subtitle && (
          <p className="mt-1 text-xs text-slate-700 leading-normal">{subtitle}</p>
        )}
      </div>

      {(badge || footnote) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {badge && (
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getBadgeClasses(
                badge.variant
              )}`}
            >
              {badge.text}
            </span>
          )}
          {footnote && (
            <span className="text-[11px] text-slate-700 font-mono">
              {footnote}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
