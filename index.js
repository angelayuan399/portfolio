// index.js (root)
import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

/* ---- Step 2 (home page latest projects) ---- */
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = Array.isArray(projects) ? projects.slice(0, 3) : [];
const projectsContainer = document.querySelector('.projects');
renderProjects(latestProjects, projectsContainer, 'h2');

/* ---- Step 3/4/5 (GitHub stats) ---- */
// Replace with YOUR username (e.g., 'angelayuan399')
const githubData = await fetchGitHubData('angelayuan399');

// Step 4 — select container
const profileStats = document.querySelector('#profile-stats');

// Step 5 — update HTML
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


