// console.log("IT'S ALIVE!");

// function $$(selector, context = document) {
//   return Array.from(context.querySelectorAll(selector));
// }

// let navLinks = $$("nav a");

// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname
// );

// if (currentLink) {
//   currentLink.classList.add("current");
// }

console.log("IT'S ALIVE!");

// Helper: selects all matching elements
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Step 1: Define your site pages here
let pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "cv/", title: "CV" },
  { url: "https://github.com/angelayuan399", title: "GitHub" }
];

// Step 2: Detect environment (local vs GitHub Pages) and set BASE_PATH
const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
const isGitHubPages = location.hostname.endsWith("github.io");

// ⚠️ IMPORTANT: Replace this with your repo name
const REPO_NAME = "portfolio";

const BASE_PATH = isLocal ? "/" : (isGitHubPages ? `/${REPO_NAME}/` : "/");

// Step 3: Create <nav> and insert it at the top of <body>
let nav = document.createElement("nav");
document.body.prepend(nav);

// Step 4: Add links dynamically
for (let { url, title } of pages) {
  const isExternal = /^https?:\/\//i.test(url);
  let href = isExternal ? url : BASE_PATH + url;
  let extra = isExternal ? ' target="_blank" rel="noopener"' : "";

  nav.insertAdjacentHTML("beforeend", `<a href="${href}"${extra}>${title}</a>`);
}

// Step 5: Highlight current page link
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
