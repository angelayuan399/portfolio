// --- sanity: prove the file loaded on this page ---
console.log("IT'S ALIVE!", location.pathname);

// --- ensure the theme control exists, even if other code errors later ---
(function ensureThemeControl() {
  // Avoid duplicates if re-run
  if (document.querySelector("#theme-select")) return;

  const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
  const autoLabel = `Automatic (${prefersDark ? "Dark" : "Light"})`;

  document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <label class="color-scheme">
      Theme:
      <select id="theme-select" aria-label="Color scheme">
        <option value="light dark">${autoLabel}</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    `
  );

  const select = document.querySelector("#theme-select");

  function applyScheme(value) {
    document.documentElement.style.setProperty("color-scheme", value);
    if (select.value !== value) select.value = value;
  }

  // Load saved preference or default to Automatic
  const saved = localStorage.colorScheme;
  applyScheme(saved ? saved : "light dark");
  if (saved) select.value = saved;

  // Persist changes
  select.addEventListener("input", (e) => {
    const value = e.target.value;        // "light dark" | "light" | "dark"
    localStorage.colorScheme = value;
    applyScheme(value);
    console.log("color scheme changed to", value);
  });

  // Keep Automatic label up-to-date if OS theme flips
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", (e) => {
    const autoOption = select.querySelector('option[value="light dark"]');
    if (autoOption) autoOption.textContent = `Automatic (${e.matches ? "Dark" : "Light"})`;
    if (select.value === "light dark") applyScheme("light dark");
  });
})();


// Helper: querySelectorAll -> Array
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/* ----------------------------
   NAV DATA
   ---------------------------- */
let pages = [
  { url: "",           title: "Home" },
  { url: "projects/",  title: "Projects" },
  { url: "contact/",   title: "Contact" },
  { url: "cv/",        title: "CV" },
  { url: "https://github.com/angelayuan399", title: "GitHub" }, // external
];

/* ----------------------------------------------------------
   BASE PATH (local vs GitHub Pages)
   ---------------------------------------------------------- */
const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
const isGitHubPages = location.hostname.endsWith("github.io");

// 🔧 If your repo name changes, update here:
const REPO_NAME = "portfolio";

const BASE_PATH = isLocal ? "/" : (isGitHubPages ? `/${REPO_NAME}/` : "/");

/* ---------------------------------------
   INSERT <nav> AT TOP OF <body>
   --------------------------------------- */
let nav = document.createElement("nav");
document.body.prepend(nav);

/* -----------------------------------------------------------
   BUILD NAV LINKS (prefix internal URLs with BASE_PATH)
   ----------------------------------------------------------- */
for (let { url, title } of pages) {
  const isExternal = /^https?:\/\//i.test(url);
  const href = isExternal ? url : BASE_PATH + url;
  const extra = isExternal ? ' target="_blank" rel="noopener"' : "";
  nav.insertAdjacentHTML("beforeend", `<a href="${href}"${extra}>${title}</a>`);
}

/* -------------------------------------------------------------
   HIGHLIGHT CURRENT PAGE LINK (/foo/ vs /foo/index.html)
   ------------------------------------------------------------- */
function normalize(pathname) {
  return pathname.endsWith("/") ? pathname + "index.html" : pathname;
}
let navLinks = $$("nav a");
let currentLink = navLinks.find(
  (a) =>
    a.host === location.host &&
    (a.pathname === location.pathname ||
     normalize(a.pathname) === normalize(location.pathname))
);
currentLink?.classList.add("current");

/* ============================
   STEP 4: DARK MODE SWITCH
   ============================ */

/* 4.1/4.2: Insert the control at the start of <body>.
   We do this *after* inserting the nav, but we place it before nav. */
const prefersDarkMQ = window.matchMedia("(prefers-color-scheme: dark)");
const prefersDark = prefersDarkMQ.matches;
let autoLabel = `Automatic (${prefersDark ? "Dark" : "Light"})`;

document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select id="theme-select" aria-label="Color scheme">
      <option value="light dark">${autoLabel}</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
`
);

/* 4.4: Make it work */
const select = document.querySelector("#theme-select");

// Apply a given scheme to <html> and sync the select value
function applyScheme(schemeValue) {
  document.documentElement.style.setProperty("color-scheme", schemeValue);
  if (select && select.value !== schemeValue) {
    select.value = schemeValue;
  }
}

// 4.5: Load persisted preference (if any), else default to automatic
const saved = localStorage.colorScheme;
applyScheme(saved ? saved : "light dark");
if (saved) {
  select.value = saved;
}

// Listen for user changes; persist and apply
select.addEventListener("input", (event) => {
  const value = event.target.value;            // "light dark" | "light" | "dark"
  localStorage.colorScheme = value;            // persist
  applyScheme(value);                          // apply
  console.log("color scheme changed to", value);
});

// Keep the Automatic label up to date if the OS theme changes
prefersDarkMQ.addEventListener?.("change", (e) => {
  const newLabel = `Automatic (${e.matches ? "Dark" : "Light"})`;
  const autoOption = select.querySelector('option[value="light dark"]');
  if (autoOption) autoOption.textContent = newLabel;

  // If user is in Automatic, re-apply to reflect OS change (no need to persist)
  if (select.value === "light dark") {
    applyScheme("light dark");
  }
});
