import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  // Navigate,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import AnalysisPage from "./pages/AnalysisPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage"; // <-- Import LoginPage
import { pageStyle } from "./theme";

const EMPTY_PROJECT = {
  projectId: "",
  title: "",
  sheetId: "",
  preparedBy: "",
  notes: "",
};

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/analysis", label: "Analysis" },
  { to: "/history", label: "History" },
];

function NavLink({ to, label }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`flex h-16 items-center border-b-2 px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:bg-white/10 ${
        active
          ? "border-[var(--accent)] text-white"
          : "border-transparent text-slate-300 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 flex-none" aria-hidden="true">
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

function AppShell() {
  const [project, setProject] = useState(EMPTY_PROJECT);
  const [user, setUser] = useState(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Check for logged-in user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("rc_user");
    if (savedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(savedUser);
    }
  }, []);

  const handleLogin = (username) => {
    setUser(username);
    localStorage.setItem("rc_user", username);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("rc_user");
  };

  // If not logged in, show the login screen (except on the landing page)
  if (!user && pathname !== "/") {
    return <LoginPage onLogin={handleLogin} />;
  }

  const onLanding = pathname === "/";

  return (
    <div
      className="min-h-screen bg-[var(--paper)] text-[var(--ink)]"
      style={pageStyle}
    >
      {/* Fonts for every page. Or move this @import into index.html. */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* --- INTERNAL APP HEADER --- */}
      {!onLanding && (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--bp)]">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
            <Link to="/" className="flex min-w-0 items-center gap-3">
              <LogoMark />
              <span className="min-w-0">
                <span className="block text-base font-semibold leading-tight tracking-tight text-white">
                  RC Screen
                </span>
                <span className="hidden text-xs leading-tight text-slate-400 md:block">
                  Preliminary evidence screening prototype — MVP
                </span>
              </span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-5">
              <nav className="flex">
                {NAV.map((n) => (
                  <NavLink key={n.to} {...n} />
                ))}
              </nav>
              <div className="hidden h-6 w-px bg-white/20 sm:block"></div>
              <button
                onClick={handleLogout}
                className="whitespace-nowrap text-sm font-medium text-slate-300 hover:text-white focus:outline-none focus-visible:underline"
              >
                Log out
                <span className="hidden sm:inline"> ({user})</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* --- MAIN CONTENT ROUTER --- */}
      <main className={onLanding ? "" : "mx-auto max-w-6xl px-6 py-10"}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                project={project}
                setProject={setProject}
                onStartAnalysis={() => navigate("/analysis")}
              />
            }
          />
          <Route
            path="/analysis"
            element={<AnalysisPage project={project} />}
          />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>

      {/* --- INTERNAL APP FOOTER --- */}
      {!onLanding && (
        <footer className="mx-auto max-w-6xl border-t border-[var(--rule)] px-6 pb-8 pt-5 text-center text-xs text-[var(--muted)]">
          Preliminary screening only — not a substitute for professional
          engineering judgment.
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
