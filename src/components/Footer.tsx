import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-slate-50/70 text-slate-600">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand and Mission */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 20A7 7 0 0 1 4 13a8 8 0 0 1 8-8c5.5 0 9 3.5 9 9a7 7 0 0 1-7 7Z" />
                  <path d="M13 10V6l-4 6h4v4l4-6h-4Z" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                EcoBill <span className="text-emerald-700">AI</span>
              </span>
            </Link>

            <p className="max-w-md text-sm text-slate-600 leading-relaxed">
              Empowering households to convert monthly electricity bills into practical, verifiable climate action plans with transparent math and actionable AI insights.
            </p>

            <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/70 p-3 text-xs text-emerald-900">
              <span className="font-semibold text-emerald-950">Engineering Principle:</span>{" "}
              AI extracts and explains. Deterministic calculations handle energy and carbon estimates.
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Navigation
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/" className="transition-colors hover:text-emerald-700">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="transition-colors hover:text-emerald-700">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/analyze" className="transition-colors hover:text-emerald-700">
                  Analyze Bill
                </Link>
              </li>
            </ul>
          </div>

          {/* Methodology & Hackathon */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Transparency
            </h3>
            <ul className="mt-4 space-y-2 text-xs text-slate-500 leading-normal">
              <li>
                <strong className="text-slate-700">Grid Factor:</strong> Reference baseline calibrated at 0.72 kg CO₂e/kWh (Central Electricity Authority CEA benchmark; reference factor to be source-verified before final submission).
              </li>
              <li>
                <strong className="text-slate-700">Privacy note:</strong> Manual usage calculations are processed in the browser. Uploaded bills are sent only to the server-side extraction endpoint for analysis and are not used by the deterministic carbon calculation engine until the user reviews and confirms the extracted values.
              </li>
              <li className="pt-2 text-[11px] text-slate-400">
                Built for Devpost Hackathon 2026.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} EcoBill AI. Designed for clean climate intelligence.</p>
          <p className="mt-2 sm:mt-0 text-slate-400">
            Deterministic carbon math • Transparent calculation methodology
          </p>
        </div>
      </div>
    </footer>
  );
}
