// index.js (root)
import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// ---- (existing Step 2 code for latest projects can stay) ----

// Step 3 — Fetch GitHub data for a user (replace with your username)
const githubData = await fetchGitHubData('giorgianicolaou'); // e.g., 'your-username'

// Step 4 — Select the container where stats will go
const profileStats = document.querySelector('#profile-stats');

// Step 5 — Update the HTML if the container exists and data came back
if (profileStats && githubData) {
  profileStats.innerHTML = `
    <dl>
      <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
      <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
      <dt>Followers:</dt><dd>${githubData.followers}</dd>
      <dt>Following:</dt><dd>${githubData.following}</dd>
    </dl>
  `;
} else if (profileStats) {
  profileStats.textContent = 'Unable to load GitHub profile stats right now.';
}
// Step 4 — select the container where stats will render
const profileStats = document.querySelector('#profile-stats');

// Step 5 — update the HTML using the fetched data
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

