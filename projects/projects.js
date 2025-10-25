// /projects/projects.js
import { fetchJSON, renderProjects } from '../global.js';

try {
  // Step 1.3 – fetch data
  const projects = await fetchJSON('../lib/projects.json');

  // Step 1.3/1.4 – select container & render
  const projectsContainer = document.querySelector('.projects');
  renderProjects(projects ?? [], projectsContainer, 'h2');

  // Step 1.6 – count projects and update the title
  const titleEl = document.querySelector('.projects-title');
  if (titleEl) {
    const count = Array.isArray(projects) ? projects.length : 0;
    // Example: "Projects (7)"
    titleEl.textContent = `${titleEl.textContent.replace(/\s*\(\d+\)$/, '')} (${count})`;
  }
} catch (err) {
  console.error('projects.js error:', err);
}

// Select the <h1> with class="projects-title"
const projectsTitle = document.querySelector('.projects-title');

if (projectsTitle && Array.isArray(projects)) {
  const count = projects.length;
  // Update the title text dynamically
  projectsTitle.textContent = `Projects (${count})`;
}
