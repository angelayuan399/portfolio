

console.log("IT'S ALIVE!", location.pathname);

(function mountThemeSwitch() {
  if (window.__themeSwitchMounted) return;
  window.__themeSwitchMounted = true;

  const allExisting = Array.from(document.querySelectorAll('[data-theme-switch], label.color-scheme'));
  if (allExisting.length > 1) {
    allExisting.slice(1).forEach(el => el.remove());
  }

  let wrap = document.querySelector('[data-theme-switch], label.color-scheme');
  if (!wrap) {
    const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const autoLabel = `Automatic (${prefersDark ? 'Dark' : 'Light'})`;
    wrap = document.createElement('label');
    wrap.className = 'color-scheme';
    wrap.setAttribute('data-theme-switch', '');
    wrap.innerHTML = `
      Theme:
      <select id="theme-select" aria-label="Color scheme">
        <option value="light dark">${autoLabel}</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    `;
    document.body.insertAdjacentElement('afterbegin', wrap);
  } else {
    wrap.setAttribute('data-theme-switch', '');
  }

  const select = wrap.querySelector('#theme-select');

  function applyScheme(value) {
    document.documentElement.style.setProperty('color-scheme', value);
    if (select.value !== value) select.value = value;
  }

  const saved = localStorage.colorScheme;
  applyScheme(saved || 'light dark');
  if (saved) select.value = saved;

  select.addEventListener('input', (e) => {
    const value = e.target.value;
    localStorage.colorScheme = value;
    applyScheme(value);
  });

  const mq = matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener?.('change', (e) => {
    const opt = select.querySelector('option[value="light dark"]');
    if (opt) opt.textContent = `Automatic (${e.matches ? 'Dark' : 'Light'})`;
    if (select.value === 'light dark') applyScheme('light dark');
  });

  const observer = new MutationObserver(() => {
    const nav = document.querySelector('nav');
    if (nav && wrap.nextElementSibling !== nav) {
      nav.insertAdjacentElement('beforebegin', wrap);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();


(function ensureThemeControl() {

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

  const saved = localStorage.colorScheme;
  applyScheme(saved ? saved : "light dark");
  if (saved) select.value = saved;

  select.addEventListener("input", (e) => {
    const value = e.target.value;       
    localStorage.colorScheme = value;
    applyScheme(value);
    console.log("color scheme changed to", value);
  });

  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", (e) => {
    const autoOption = select.querySelector('option[value="light dark"]');
    if (autoOption) autoOption.textContent = `Automatic (${e.matches ? "Dark" : "Light"})`;
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


const REPO_NAME = "portfolio";

const BASE_PATH = isLocal ? "/" : (isGitHubPages ? `/${REPO_NAME}/` : "/");

let nav = document.createElement("nav");
document.body.prepend(nav);

for (let { url, title } of pages) {
  const isExternal = /^https?:\/\//i.test(url);
  const href = isExternal ? url : BASE_PATH + url;
  const extra = isExternal ? ' target="_blank" rel="noopener"' : "";
  nav.insertAdjacentHTML("beforeend", `<a href="${href}"${extra}>${title}</a>`);
}


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


// global.js
export async function fetchJSON(url) {
  try {
    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    console.log(response); // Step 1.2 – inspect in DevTools
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
    }
    const data = await response.json(); // Step 1.2/1.3
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
    return null; // callers can handle null
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = ''; // avoid duplicates

  // validate headingLevel; fall back to h2 if invalid
  const allowed = new Set(['h1','h2','h3','h4','h5','h6']);
  const tag = allowed.has(String(headingLevel).toLowerCase()) ? String(headingLevel).toLowerCase() : 'h2';

  // empty state
  if (!Array.isArray(projects) || projects.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'projects-empty';
    empty.textContent = 'No projects to display yet.';
    containerElement.appendChild(empty);
    return;
  }

  for (const project of projects) {
    const article = document.createElement('article');
    article.innerHTML = `
      <${tag}>${project.title ?? 'Untitled Project'}</${tag}>
      ${project.image ? `<img src="${project.image}" alt="${project.title ?? 'Project image'}">` : ''}
      <p>${project.description ?? ''}</p>
    `;
    containerElement.appendChild(article);
  }
}
// Step 3.2 — uses your existing fetchJSON helper
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${encodeURIComponent(username)}`);
}


// ---------- base-path helpers (keep your existing values if you already have them) ----------
const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
const isGitHubPages = location.hostname.endsWith("github.io");
const REPO_NAME = "portfolio";
export const BASE_PATH = isLocal ? "/" : (isGitHubPages ? `/${REPO_NAME}/` : "/");

// Resolve images like "/images/foo.png" so they work on both localhost and GH Pages
export function resolveAssetPath(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const clean = String(path).replace(/^\/+/, ""); // strip leading slash(s)
  return BASE_PATH + clean;
}

// ---------- robust fetch ----------
export async function fetchJSON(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: { "Accept": "application/json", ...(options.headers || {}) },
      cache: "no-store", // avoid stale responses (esp. GitHub API)
      ...options
    });
    // Helpful to see what's happening
    console.log("[fetchJSON]", response.url, response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    console.error("Error fetching or parsing JSON:", err);
    return null;
  }
}

// ---------- GitHub API helper ----------
export async function fetchGitHubData(username) {
  const url = `https://api.github.com/users/${encodeURIComponent(username)}?t=${Date.now()}`;
  return fetchJSON(url, { headers: { "Accept": "application/vnd.github+json" } });
}

// ---------- renderProjects (uses resolveAssetPath so images work on every page) ----------
export function renderProjects(projects, containerElement, headingLevel = "h2") {
  if (!(containerElement instanceof Element)) return;

  containerElement.innerHTML = "";

  const allowed = new Set(["h1","h2","h3","h4","h5","h6"]);
  const tag = allowed.has(String(headingLevel).toLowerCase()) ? String(headingLevel).toLowerCase() : "h2";

  if (!Array.isArray(projects) || projects.length === 0) {
    const empty = document.createElement("div");
    empty.className = "projects-empty";
    empty.textContent = "No projects to display yet.";
    containerElement.appendChild(empty);
    return;
  }

  for (const p of projects) {
    const article = document.createElement("article");
    const src = p?.image ? resolveAssetPath(p.image) : "";

    article.innerHTML = `
      <${tag}>${p?.title ?? "Untitled Project"}</${tag}>
      ${src ? `<img src="${src}" alt="${(p?.title ?? "Project").replace(/"/g, "&quot;")}">` : ""}
      <p>${p?.description ?? ""}</p>
    `;
    containerElement.appendChild(article);
  }
}
