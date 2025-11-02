// index.js (root)
import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

/* ---- Step 2 (home page latest projects) ---- */
let latestProjects = [];
try {
  // root page -> JSON is in /lib
  const projects = await fetchJSON('./lib/projects.json');
  if (Array.isArray(projects)) {
    latestProjects = projects.slice(0, 3);
  }
} catch (err) {
  console.error('Failed to load projects for home page:', err);
}

const projectsContainer = document.querySelector('.projects');  // <- make sure this matches index.html
if (projectsContainer) {
  // even if we got 0 projects, render to avoid blank layout
  renderProjects(latestProjects, projectsContainer, 'h2');
}

/* ---- Step 3/4/5 (GitHub stats) ---- */
const githubData = await fetchGitHubData('angelayuan399');

const profileStats = document.querySelector('#profile-stats');

if (profileStats && githubData) {
  profileStats.innerHTML = `
    <h2>GitHub Profile Stats</h2>
    <dl class="stats-grid">
      <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
      <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
      <dt>Followers:</dt><dd>${githubData.followers}</dd>
      <dt>Following:</dt><dd>${githubData.following}</dd>
    </dl>
  `;
} else if (profileStats) {
  profileStats.innerHTML = `
    <h2>GitHub Profile Stats</h2>
    <p>Unable to load stats right now.</p>
  `;
}
