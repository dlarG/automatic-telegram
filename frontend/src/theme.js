/* Shared theme for the app pages. Change the colors here and every page
   that imports this file follows. (Same values as LandingPage and LoginPage.) */
export const THEME = {
  "--bp": "#0A2540", // blueprint blue
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

export const FONT_SANS =
  "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif";
export const FONT_MONO =
  "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace";

/* Spread this on a page's root element: style={pageStyle} */
export const pageStyle = { ...THEME, fontFamily: FONT_SANS };
