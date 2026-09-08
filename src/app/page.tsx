import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-emerald-50/40 via-white to-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Hero Content */}
            <div className="space-y-6 lg:col-span-7">
              {/* Climate Tag */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Deterministic Climate Intelligence</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.15]">
                Turn your electricity bill into an{" "}
                <span className="text-emerald-700 underline decoration-emerald-300 decoration-wavy underline-offset-8">
                  actionable climate plan.
                </span>
              </h1>

              {/* Supporting Copy */}
              <p className="max-w-xl text-lg text-slate-600 leading-relaxed">
                Understand your energy usage, estimate real carbon impact with verifiable math, and discover realistic reduction opportunities to cut both emissions and power costs.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/analyze"
                  className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-emerald-700 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md active:scale-[0.98]"
                >
                  <span>Analyze My Bill</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  <span>See How It Works</span>
                  <svg
                    className="h-4 w-4 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </a>
              </div>

              {/* Trust & Architecture Note */}
              <div className="pt-2">
                <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <svg
                    className="h-4 w-4 text-emerald-600 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>
                    <strong>Engineering Transparency:</strong> AI extracts and explains. Deterministic calculations handle energy and carbon estimates.
                  </span>
                </p>
              </div>
            </div>

            {/* Right Hero Visual / Interactive Preview Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Sample Analysis Preview
                    </span>
                  </div>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/50">
                    Urban Household • 280 kWh
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                      <span className="text-[11px] font-medium uppercase text-slate-500">Monthly Bill</span>
                      <p className="mt-1 font-mono text-xl font-bold text-slate-900">₹2,100</p>
                      <span className="text-[10px] text-slate-500">Effective: ₹7.50 / kWh</span>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
                      <span className="text-[11px] font-medium uppercase text-emerald-800">Carbon Footprint</span>
                      <p className="mt-1 font-mono text-xl font-bold text-emerald-900">201.6 kg</p>
                      <span className="text-[10px] text-emerald-700">@ 0.72 kg CO₂e / kWh</span>
                    </div>
                  </div>

                  {/* Simulator snippet */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">15% Reduction Scenario</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                        -42 kWh / mo
                      </span>
                    </div>

                    <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md bg-white p-2 border border-slate-100">
                        <span className="text-slate-500 block text-[10px]">Monthly Rupee Savings</span>
                        <span className="font-bold font-mono text-slate-900 text-sm">₹315 / mo</span>
                      </div>
                      <div className="rounded-md bg-white p-2 border border-slate-100">
                        <span className="text-slate-500 block text-[10px]">Annual CO₂ Prevented</span>
                        <span className="font-bold font-mono text-emerald-700 text-sm">362.9 kg</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px] text-slate-500">
                      <span>Equivalent: ~16 mature tree seedlings</span>
                      <span className="font-semibold text-emerald-700">Deterministic calculations</span>
                    </div>
                  </div>

                  <Link
                    href="/analyze"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                  >
                    <span>Run for Your Own Bill</span>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Workflow Section */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-slate-50/50 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              How EcoBill AI Works
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              From power bill to targeted emission reduction in less than a minute.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-xs transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 font-extrabold text-lg border border-emerald-200">
                1
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">
                Upload or enter usage
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Provide your monthly bill via quick manual input (kWh, amount in ₹, state) or use our bill document uploader.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-700">
                Supports PDF, JPG, PNG & Manual Entry →
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-xs transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 font-extrabold text-lg border border-emerald-200">
                2
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">
                Understand your impact
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                View your carbon footprint, annualized energy forecast, effective ₹/kWh rate, and residential tier benchmark computed with verified grid factors.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-700">
                Transparent calculation methodology →
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-xs transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 font-extrabold text-lg border border-emerald-200">
                3
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">
                Explore reduction actions
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Simulate 5% to 20% savings scenarios to immediately see rupee and CO₂ reductions, setting the stage for personalized action recommendations.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-700">
                Interactive simulator + AI roadmap →
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Core Capabilities
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Climate-Tech Architecture Built for Trust
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              We separate automated document intelligence from deterministic carbon calculations to ensure total auditability.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1: Bill Intelligence */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-emerald-300 hover:shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 text-base">Bill Intelligence</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Smart extraction pipeline engineered to parse billing cycles, tariff slabs, and consumption totals without manual data entry.
              </p>
              <span className="mt-4 inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                AI bill extraction — active
              </span>
            </div>

            {/* Feature 2: Carbon Impact */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-emerald-300 hover:shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 text-base">Carbon Impact</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Auditable CO₂ equivalent math calculated via regional and national grid emission baseline factors (~0.72 kg CO₂e/kWh reference baseline).
              </p>
              <span className="mt-4 inline-block text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Deterministic calculations
              </span>
            </div>

            {/* Feature 3: Savings Simulator */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-emerald-300 hover:shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 text-base">Savings Simulator</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Test realistic target reductions (5%–20%) and immediately see corresponding rupee savings and environmental abatement metrics.
              </p>
              <span className="mt-4 inline-block text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Active & Interactive
              </span>
            </div>

            {/* Feature 4: Personalized Actions */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-emerald-300 hover:shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 text-base">Personalized Actions</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Gemini-powered insights providing customized, high-leverage recommendations for appliance schedules, HVAC, and behavioral shifts.
              </p>
              <span className="mt-4 inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Personalized AI actions — active
              </span>
            </div>
          </div>

          {/* Principle Banner */}
          <div className="mt-12 rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8 text-center max-w-3xl mx-auto">
            <h4 className="text-base font-bold text-emerald-950">
              The EcoBill AI Transparency Commitment
            </h4>
            <p className="mt-2 text-sm text-emerald-900 leading-relaxed">
              &ldquo;AI extracts and explains. Deterministic calculations handle energy and carbon estimates.&rdquo;
              <br />
              <span className="text-xs text-emerald-700">
                We believe trustworthy climate action begins with uncompromising mathematical integrity.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-extrabold sm:text-4xl tracking-tight">
            Ready to measure your household carbon footprint?
          </h2>
          <p className="max-w-xl mx-auto text-slate-300 text-base">
            Take the first step toward smart energy savings. Enter your electricity usage details in less than 30 seconds.
          </p>
          <div>
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3.5 text-base font-semibold text-slate-950 shadow-sm transition-all hover:bg-emerald-400 active:scale-[0.98]"
            >
              <span>Start Free Analysis</span>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
