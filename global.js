

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


// const prefersDarkMQ = window.matchMedia("(prefers-color-scheme: dark)");
// const prefersDark = prefersDarkMQ.matches;
// let autoLabel = `Automatic (${prefersDark ? "Dark" : "Light"})`;

// document.body.insertAdjacentHTML(
//   "afterbegin",
//   `
//   <label class="color-scheme">
//     Theme:
//     <select id="theme-select" aria-label="Color scheme">
//       <option value="light dark">${autoLabel}</option>
//       <option value="light">Light</option>
//       <option value="dark">Dark</option>
//     </select>
//   </label>
// `
// );

// const select = document.querySelector("#theme-select");

// function applyScheme(schemeValue) {
//   document.documentElement.style.setProperty("color-scheme", schemeValue);
//   if (select && select.value !== schemeValue) {
//     select.value = schemeValue;
//   }
// }

// const saved = localStorage.colorScheme;
// applyScheme(saved ? saved : "light dark");
// if (saved) {
//   select.value = saved;
// }

// select.addEventListener("input", (event) => {
//   const value = event.target.value;            
//   localStorage.colorScheme = value;            
//   applyScheme(value);                        
//   console.log("color scheme changed to", value);
// });

// prefersDarkMQ.addEventListener?.("change", (e) => {
//   const newLabel = `Automatic (${e.matches ? "Dark" : "Light"})`;
//   const autoOption = select.querySelector('option[value="light dark"]');
//   if (autoOption) autoOption.textContent = newLabel;

//   if (select.value === "light dark") {
//     applyScheme("light dark");
//   }
// });
