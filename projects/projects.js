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
  if (titleEl && Array.isArray(projects)) {
    const count = projects.length;
    // updates the heading text, e.g., “Projects (3)”
    titleEl.textContent = `Projects (${count})`;
  }
} catch (err) {
  console.error('projects.js error:', err);
}

