import { fetchJSON, renderProjects } from '../global.js';

// 1) Fetch the JSON
const projects = await fetchJSON('../lib/projects.json');

// 2) Select the container
const projectsContainer = document.querySelector('.projects');

// 3) Render them (with <h2> headings)
renderProjects(projects, projectsContainer, 'h2');

const titleEl = document.querySelector('.projects-title');
if (titleEl && Array.isArray(projects)) {
  titleEl.textContent = `Projects (${projects.length})`;
}
