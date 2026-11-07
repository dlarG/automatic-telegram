import { Link } from "react-router-dom";

/* ------------------------------------------------------------------
   THEME: change the colors here and the whole page follows.
   ------------------------------------------------------------------ */
const THEME = {
  "--bp": "#0A2540", // blueprint blue (hero, header, table head)
  "--bp-deep": "#061729", // darker blue (final CTA, footer)
  "--line": "#8FD3FF", // drafting-line cyan on dark backgrounds
  "--paper": "#F3F6FA", // page background
  "--card": "#FFFFFF", // cards
  "--ink": "#0B1B2E", // main text
  "--muted": "#52637A", // secondary text
  "--rule": "#D5DEE8", // borders on light backgrounds
  "--accent": "#FF7A1A", // buttons and highlights
  "--accent-ink": "#1A0F00", // text on accent
};

const FONT_SANS = "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace";

const GRID_DARK = {
  backgroundImage: `
    linear-gradient(color-mix(in srgb, var(--line) 22%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--line) 22%, transparent) 1px, transparent 1px),
    linear-gradient(color-mix(in srgb, var(--line) 9%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--line) 9%, transparent) 1px, transparent 1px)`,
  backgroundSize: "120px 120px, 120px 120px, 24px 24px, 24px 24px",
};

const FEATURES = [
  {
    tag: "S-01",
    title: "3-view PDF capture",
    body: "Upload a plan set and crop the Locator, Schedule, and Detail views directly in the browser. No external PDF tool needed.",
  },
  {
    tag: "S-02",
    title: "OCR + regex pipeline",
    body: "PaddleOCR and PyMuPDF extract text from scanned or digital PDFs. A defensive regex engine turns it into structured column data.",
  },
  {
    tag: "S-03",
    title: "NSCP 2015 rule engine",
    body: "Four deterministic checks on rebar ratio, minimum bars, tie diameter, and tie spacing. No AI, no black box, just auditable math.",
  },
  {
    tag: "S-04",
    title: "PDF screening report",
    body: "Export a professional screening report with per-rule verdicts and an overall compliance banner for each column.",
  },
];

const STEPS = [
  {
    n: "01",
    t: "Capture three views",
    d: "Upload the PDF. Crop the Locator, Schedule, and Detail regions in the browser so each region is analyzed on its own terms.",
  },
  {
    n: "02",
    t: "Extract and merge",
    d: "OCR and regex pull structured fields from each view. The merger resolves conflicts and records field provenance.",
  },
  {
    n: "03",
    t: "Screen against NSCP",
    d: "Four deterministic rules run on the merged data. Export a PDF report with per-rule and overall verdicts.",
  },
];

const RULES = [
  {
    id: "REBAR-RATIO-01",
    check: "Longitudinal reinforcement ratio",
    criterion: "1% – 6%",
  },
  {
    id: "C2-MIN-BARS",
    check: "Minimum number of longitudinal bars",
    criterion: "≥ 4",
  },
  {
    id: "TIE-DIA-01",
    check: "Minimum tie bar diameter",
    criterion: "NSCP 425.7.2.2",
  },
  {
    id: "C3-TIE-SPACING",
    check: "Maximum tie spacing",
    criterion: "NSCP 425.7.2.1",
  },
];

const VERDICTS = [
  {
    label: "Compliant",
    color: "border-emerald-500 bg-emerald-50 text-emerald-900",
    dot: "bg-emerald-500",
    desc: "All four NSCP checks pass on the extracted data.",
  },
  {
    label: "Non-compliant",
    color: "border-rose-500 bg-rose-50 text-rose-900",
    dot: "bg-rose-500",
    desc: "One or more rules fail. Flag for engineer review.",
  },
  {
    label: "Incomplete evidence",
    color: "border-amber-500 bg-amber-50 text-amber-900",
    dot: "bg-amber-500",
    desc: "Critical fields were not found in the drawings.",
  },
];

const STACK = [
  "React (Vite)",
  "Tailwind CSS",
  "pdfjs-dist",
  "Python",
  "FastAPI",
  "SQLAlchemy / SQLite",
  "PaddleOCR 3.x",
  "PyMuPDF",
  "OpenCV",
  "fpdf2",
];

const STATS = [
  ["4", "deterministic NSCP checks"],
  ["3", "views captured per column"],
  ["3", "possible verdicts"],
  ["1", "PDF screening report"],
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen bg-[var(--paper)] text-[var(--ink)]"
      style={{ ...THEME, fontFamily: FONT_SANS }}
    >
      {/* Fonts. You can move this @import to index.html if you prefer. */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'); html { scroll-behavior: smooth; }`}</style>

      {/* ---------------- Header ---------------- */}
      <header className="sticky top-0 z-50 h-16 border-b border-white/10 bg-[var(--bp)]">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <a href="#top" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-base font-semibold tracking-tight text-white">
              RC Screen
            </span>
          </a>
          <nav className="hidden gap-8 md:flex">
            {[
              ["#features", "Features"],
              ["#how-it-works", "How it works"],
              ["#checks", "Checks"],
              ["#outcomes", "Outcomes"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-sm text-slate-300 hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>
          <Link
            to="/dashboard"
            className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bp)]"
          >
            Launch app
          </Link>
        </div>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section
        id="top"
        className="relative flex min-h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-[var(--bp)] text-white"
        style={GRID_DARK}
      >
        <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-16 lg:grid-cols-2">
          <div>
            <span
              className="inline-block border border-[var(--line)]/40 px-3 py-1 text-xs tracking-wide text-[var(--line)]"
              style={{ fontFamily: FONT_MONO }}
            >
              THESIS PROTOTYPE · STRUCTURAL ENGINEERING
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              AI-assisted structural column plan screening
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              A preliminary evidence-screening system that reads column
              schedules from plan sets, extracts reinforcement data via OCR, and
              checks it against NSCP 2015 rules, before an engineer ever lifts a
              calculator.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="rounded bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-ink)] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bp)]"
              >
                Enter the system →
              </Link>
              <a
                href="#how-it-works"
                className="rounded border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                How it works
              </a>
            </div>
            <p className="mt-6 max-w-md text-xs leading-relaxed text-slate-400">
              Preliminary screening only. Not a substitute for professional
              engineering judgment.
            </p>
          </div>

          <ColumnDrawing />
        </div>

        {/* Stats strip */}
        <div className="border-t border-white/10 bg-[var(--bp-deep)]/60">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 divide-white/10 px-6 md:grid-cols-4 md:divide-x">
            {STATS.map(([n, label]) => (
              <div key={label} className="px-0 py-5 md:px-6 md:first:pl-0">
                <dt
                  className="text-3xl font-medium text-[var(--accent)]"
                  style={{ fontFamily: FONT_MONO }}
                >
                  {n}
                </dt>
                <dd className="mt-1 text-sm text-slate-300">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section
        id="features"
        className="mx-auto max-w-6xl scroll-mt-16 px-6 py-20"
      >
        <SectionHead
          eyebrow="What the system does"
          title="From plan-set PDF to a per-column verdict"
          sub="Four stages, each one auditable on its own."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="group border border-[var(--rule)] border-t-4 border-t-[var(--bp)] bg-[var(--card)] p-7 transition-colors hover:border-t-[var(--accent)]"
            >
              <span
                className="text-xs text-[var(--muted)]"
                style={{ fontFamily: FONT_MONO }}
              >
                {f.tag}
              </span>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">
                {f.title}
              </h3>
              <p className="mt-3 leading-relaxed text-[var(--muted)]">
                {f.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section
        id="how-it-works"
        className="scroll-mt-16 border-y border-[var(--rule)] bg-[var(--card)]"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SectionHead
            eyebrow="How it works"
            title="Three steps, one column at a time"
          />
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="relative">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 flex-none items-center justify-center border-2 border-[var(--bp)] text-sm font-medium text-[var(--bp)]"
                    style={{ fontFamily: FONT_MONO }}
                  >
                    {s.n}
                  </span>
                  <span className="hidden h-px flex-1 bg-[var(--rule)] md:block" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">
                  {s.t}
                </h3>
                <p className="mt-2 leading-relaxed text-[var(--muted)]">
                  {s.d}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- Checks (rule schedule) ---------------- */}
      <section
        id="checks"
        className="mx-auto max-w-6xl scroll-mt-16 px-6 py-20"
      >
        <SectionHead
          eyebrow="Rule schedule"
          title="The four NSCP 2015 checks"
          sub="Every rule is plain arithmetic on the merged fields."
        />
        <div className="mt-10 overflow-x-auto border-2 border-[var(--bp)] bg-[var(--card)]">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="bg-[var(--bp)] text-white">
              <tr>
                <th className="px-5 py-3 font-medium">Rule ID</th>
                <th className="px-5 py-3 font-medium">Check</th>
                <th className="px-5 py-3 font-medium">Criterion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)]">
              {RULES.map((r) => (
                <tr key={r.id}>
                  <td
                    className="whitespace-nowrap px-5 py-4 font-medium text-[var(--bp)]"
                    style={{ fontFamily: FONT_MONO }}
                  >
                    {r.id}
                  </td>
                  <td className="px-5 py-4">{r.check}</td>
                  <td
                    className="whitespace-nowrap px-5 py-4 text-[var(--muted)]"
                    style={{ fontFamily: FONT_MONO }}
                  >
                    {r.criterion}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------- Outcomes ---------------- */}
      <section
        id="outcomes"
        className="scroll-mt-16 border-t border-[var(--rule)] bg-[var(--card)]"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SectionHead
            eyebrow="Outcomes"
            title="Three possible verdicts"
            sub="Every column analyzed gets exactly one deterministic verdict."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {VERDICTS.map((v) => (
              <div key={v.label} className={`border-l-4 p-6 ${v.color}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${v.dot}`} />
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    {v.label}
                  </span>
                </div>
                <p className="mt-3 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Stack ---------------- */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p
          className="text-center text-xs tracking-widest text-[var(--muted)]"
          style={{ fontFamily: FONT_MONO }}
        >
          BUILT WITH
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {STACK.map((s) => (
            <span
              key={s}
              className="border border-[var(--rule)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--ink)]"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section
        className="relative bg-[var(--bp-deep)] text-white"
        style={GRID_DARK}
      >
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to screen a column?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Start a project, upload your plan set, and get a verdict with its
            evidence.
          </p>
          <Link
            to="/dashboard"
            className="mt-8 inline-block rounded bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-[var(--accent-ink)] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bp-deep)]"
          >
            Enter the system →
          </Link>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="bg-[var(--bp-deep)] text-slate-400">
        <div className="mx-auto max-w-4xl border-t border-white/10 px-6 py-8 text-center text-xs leading-relaxed">
          <p className="text-slate-300">
            RC Column Plan Screening · Preliminary evidence screening prototype
          </p>
          <p className="mt-2">
            This system provides preliminary screening only. It does not replace
            professional engineering judgment, site inspection, or the
            signed-and-sealed calculations of a licensed civil engineer.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SectionHead({ eyebrow, title, sub }) {
  return (
    <div className="max-w-2xl">
      <p
        className="text-xs font-medium tracking-widest text-[var(--accent)]"
        style={{ fontFamily: FONT_MONO }}
      >
        {eyebrow.toUpperCase()}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {sub && (
        <p className="mt-3 text-lg leading-relaxed text-[var(--muted)]">
          {sub}
        </p>
      )}
    </div>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      <rect
        x="3"
        y="3"
        width="26"
        height="26"
        fill="none"
        stroke="var(--line)"
        strokeWidth="2"
      />
      <rect
        x="8"
        y="8"
        width="16"
        height="16"
        fill="none"
        stroke="var(--line)"
        strokeWidth="1"
        opacity="0.7"
      />
      {[
        [11, 11],
        [21, 11],
        [11, 21],
        [21, 21],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="2.2"
          fill="var(--accent)"
        />
      ))}
    </svg>
  );
}

/* Illustrative column cross-section with dimension lines */
function ColumnDrawing() {
  const bars = [
    [136, 136],
    [210, 136],
    [284, 136],
    [136, 210],
    [284, 210],
    [136, 284],
    [210, 284],
    [284, 284],
  ];
  return (
    <figure className="mx-auto w-full max-w-md">
      <svg
        viewBox="0 0 420 420"
        role="img"
        aria-label="Sample column cross-section showing longitudinal bars, ties and dimensions"
        className="w-full"
        style={{ fontFamily: FONT_MONO }}
      >
        <defs>
          <pattern
            id="concrete"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="3" r="0.7" fill="var(--line)" opacity="0.35" />
            <circle cx="7" cy="8" r="0.7" fill="var(--line)" opacity="0.35" />
          </pattern>
        </defs>

        {/* Section */}
        <rect
          x="110"
          y="110"
          width="200"
          height="200"
          fill="url(#concrete)"
          stroke="var(--line)"
          strokeWidth="2.5"
        />
        {/* Ties */}
        <rect
          x="122"
          y="122"
          width="176"
          height="176"
          rx="6"
          fill="none"
          stroke="var(--line)"
          strokeWidth="1.5"
        />
        {/* Bars */}
        {bars.map(([cx, cy]) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="8"
            fill="var(--accent)"
          />
        ))}

        {/* Dimension: width */}
        <g stroke="var(--line)" strokeWidth="1" fill="none">
          <line x1="110" y1="104" x2="110" y2="72" />
          <line x1="310" y1="104" x2="310" y2="72" />
          <line x1="110" y1="80" x2="310" y2="80" />
          <line x1="105" y1="85" x2="115" y2="75" />
          <line x1="305" y1="85" x2="315" y2="75" />
        </g>
        <text
          x="210"
          y="68"
          textAnchor="middle"
          fontSize="13"
          fill="var(--line)"
        >
          400
        </text>

        {/* Dimension: depth */}
        <g stroke="var(--line)" strokeWidth="1" fill="none">
          <line x1="316" y1="110" x2="348" y2="110" />
          <line x1="316" y1="310" x2="348" y2="310" />
          <line x1="340" y1="110" x2="340" y2="310" />
          <line x1="335" y1="115" x2="345" y2="105" />
          <line x1="335" y1="315" x2="345" y2="305" />
        </g>
        <text
          x="362"
          y="215"
          textAnchor="middle"
          fontSize="13"
          fill="var(--line)"
          transform="rotate(90 362 210)"
        >
          400
        </text>

        {/* Callouts */}
        <g stroke="var(--accent)" strokeWidth="1" fill="none">
          <polyline points="284,284 318,350 380,350" />
          <polyline points="122,270 80,340 30,340" />
        </g>
        <text x="320" y="368" fontSize="12" fill="var(--accent)">
          8 – Ø20 bars
        </text>
        <text x="30" y="358" fontSize="12" fill="var(--accent)">
          Ø10 ties @ 100
        </text>

        <text
          x="210"
          y="402"
          textAnchor="middle"
          fontSize="12"
          letterSpacing="2"
          fill="var(--line)"
          opacity="0.8"
        >
          C-1 · SECTION (SAMPLE)
        </text>
      </svg>
    </figure>
  );
}
