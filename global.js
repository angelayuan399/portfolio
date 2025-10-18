console.log("IT'S ALIVE!", location.pathname);

(function mountThemeSwitch() {
  if (document.querySelector("[data-theme-switch]")) return;

  const prefersDarkMQ = matchMedia("(prefers-color-scheme: dark)");
  const prefersDark = prefersDarkMQ.matches;
  const autoLabel = `Automatic (${prefersDark ? "Dark" : "Light"})`;

  const wrap = document.createElement("label");
  wrap.className = "color-scheme";
  wrap.setAttribute("data-theme-switch", "");
  wrap.innerHTML = `
    Theme:
    <select id="theme-select" aria-label="Color scheme">
      <option value="light dark">${autoLabel}</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  `;


  document.body.insertAdjacentElement("afterbegin", wrap);

  const select = wrap.querySelector("#theme-select");

  function applyScheme(value) {
    document.documentElement.style.setProperty("color-scheme", value);
    if (select.value !== value) select.value = value;
  }

  const saved = localStorage.colorScheme;
  applyScheme(saved || "light dark");
  if (saved) select.value = saved;

  select.addEventListener("input", (e) => {
    const value = e.target.value;
    localStorage.colorScheme = value;
    applyScheme(value);
    console.log("color scheme changed to", value);
  });

  prefersDarkMQ.addEventListener?.("change", (e) => {
    const opt = select.querySelector('option[value="light dark"]');
    if (opt) opt.textContent = `Automatic (${e.matches ? "Dark" : "Light"})`;
    if (select.value === "light dark") applyScheme("light dark");
  });
})();
  
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: "",           title: "Home" },
  { url: "projects/",  title: "Projects" },
  { url: "contact/",   title: "Contact" },
  { url: "cv/",        title: "CV" },
  { url: "https://github.com/angelayuan399", title: "GitHub" },
];

const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
const isGitHubPages = location.hostname.endsWith("github.io");
const REPO_NAME = "portfolio";                // <-- change if repo name changes
const BASE_PATH = isLocal ? "/" : (isGitHubPages ? `/${REPO_NAME}/` : "/");

let nav = document.createElement("nav");
document.body.prepend(nav);

const themeSwitch = document.querySelector("[data-theme-switch]");
if (themeSwitch) nav.insertAdjacentElement("beforebegin", themeSwitch);

for (let { url, title } of pages) {
  const isExternal = /^https?:\/\//i.test(url);
  const href
