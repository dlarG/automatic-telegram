import { useState } from "react";

/* Same theme as LandingPage. Edit the colors here (or move this object
   into a shared theme file and import it in both pages). */
const THEME = {
  "--bp": "#0A2540",
  "--bp-deep": "#061729",
  "--line": "#8FD3FF",
  "--paper": "#F3F6FA",
  "--card": "#FFFFFF",
  "--ink": "#0B1B2E",
  "--muted": "#52637A",
  "--rule": "#D5DEE8",
  "--accent": "#FF7A1A",
  "--accent-ink": "#1A0F00",
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

export default function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Separate states for error (red) and success (green)
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";

    try {
      const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      if (isRegister) {
        // If register successful, switch to login and show success message
        setIsRegister(false);
        setSuccess("Registration successful! Please log in.");
        setPassword(""); // Optional: clear password field for security
      } else {
        // Login successful
        onLogin(data.username);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[var(--paper)] text-[var(--ink)] lg:grid lg:grid-cols-2"
      style={{ ...THEME, fontFamily: FONT_SANS }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* ---------- Mobile brand bar ---------- */}
      <div className="flex h-16 items-center bg-[var(--bp)] px-6 lg:hidden">
        <Brand />
      </div>

      {/* ---------- Blueprint panel (desktop) ---------- */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden bg-[var(--bp)] p-12 text-white lg:flex"
        style={GRID_DARK}
      >
        <Brand />

        <div>
          <SectionDrawing />
          <h2 className="mt-10 max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Preliminary evidence screening for RC column plans
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-slate-300">
            Capture the views, extract the fields, and check them against NSCP
            2015 rules with auditable math.
          </p>
        </div>

        <p
          className="text-xs tracking-wide text-slate-400"
          style={{ fontFamily: FONT_MONO }}
        >
          THESIS PROTOTYPE · NOT A SUBSTITUTE FOR ENGINEERING JUDGMENT
        </p>
      </aside>

      {/* ---------- Form ---------- */}
      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <p
            className="text-xs font-medium tracking-widest text-[var(--accent)]"
            style={{ fontFamily: FONT_MONO }}
          >
            {isRegister ? "REGISTER" : "SIGN IN"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {isRegister ? "Create an account" : "Sign in"}
          </h1>
          <p className="mt-2 leading-relaxed text-[var(--muted)]">
            {isRegister
              ? "Register to access the column screening system."
              : "Enter your credentials to access the system."}
          </p>

          {/* ERROR */}
          {error && (
            <div
              role="alert"
              className="mt-6 border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-900"
            >
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div
              role="status"
              className="mt-6 border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8">
            <div className="border-2 border-[var(--bp)] bg-[var(--rule)]">
              <div className="grid gap-px">
                <label className="block bg-[var(--card)] px-4 py-3 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-600">
                  <span className="block text-xs font-medium text-[var(--muted)]">
                    Username
                  </span>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full bg-transparent text-base text-[var(--ink)] placeholder-slate-400 focus:outline-none"
                    placeholder="engineer_juan"
                  />
                </label>

                <label className="block bg-[var(--card)] px-4 py-3 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-600">
                  <span className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--muted)]">
                      Password
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] focus:outline-none focus-visible:underline"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full bg-transparent text-base text-[var(--ink)] placeholder-slate-400 focus:outline-none"
                    placeholder="••••••••"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-ink)] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bp)] focus-visible:ring-offset-2 disabled:bg-slate-300 disabled:text-slate-500"
            >
              {loading ? "Processing..." : isRegister ? "Register" : "Log in"}
            </button>
          </form>

          <p className="mt-8 border-t border-[var(--rule)] pt-6 text-sm text-[var(--muted)]">
            {isRegister
              ? "Already have an account? "
              : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
                setSuccess(""); // Clear success message when toggling
              }}
              className="font-semibold text-[var(--bp)] underline underline-offset-4 hover:text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bp)]"
            >
              {isRegister ? "Sign in" : "Register"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
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
      <span className="text-base font-semibold tracking-tight text-white">
        RC Screen
      </span>
    </div>
  );
}

/* Smaller version of the landing-page section drawing */
function SectionDrawing() {
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
    <svg
      viewBox="90 50 240 280"
      role="img"
      aria-label="Column cross-section with longitudinal bars, ties and a width dimension"
      className="h-56 w-auto"
      style={{ fontFamily: FONT_MONO }}
    >
      <defs>
        <pattern
          id="login-concrete"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="3" r="0.7" fill="var(--line)" opacity="0.35" />
          <circle cx="7" cy="8" r="0.7" fill="var(--line)" opacity="0.35" />
        </pattern>
      </defs>
      <rect
        x="110"
        y="110"
        width="200"
        height="200"
        fill="url(#login-concrete)"
        stroke="var(--line)"
        strokeWidth="2.5"
      />
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
      {bars.map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="8"
          fill="var(--accent)"
        />
      ))}
      <g stroke="var(--line)" strokeWidth="1" fill="none">
        <line x1="110" y1="104" x2="110" y2="72" />
        <line x1="310" y1="104" x2="310" y2="72" />
        <line x1="110" y1="80" x2="310" y2="80" />
        <line x1="105" y1="85" x2="115" y2="75" />
        <line x1="305" y1="85" x2="315" y2="75" />
      </g>
      <text x="210" y="68" textAnchor="middle" fontSize="13" fill="var(--line)">
        400
      </text>
    </svg>
  );
}
