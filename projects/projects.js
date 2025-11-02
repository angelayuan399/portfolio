// projects/projects.js

// 1) import D3 + helpers
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

// grab shared DOM nodes once
const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');

// we'll store ALL projects here
let allProjects = [];

/**
 * renderPieChart(projectsGiven)
 * plots a pie + legend for whatever subset you pass in
 */
function renderPieChart(projectsGiven) {
  // clear old stuff
  svg.selectAll('path').remove();
  svg.selectAll('circle').remove();
  legend.selectAll('li').remove();

  if (!Array.isArray(projectsGiven) || projectsGiven.length === 0) {
    // nothing to plot
    return;
  }

  // Step 3.1 — group by year
  const rolled = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year ?? 'Unknown'
  );

  // to [{ value, label }]
  const data = rolled.map(([year, count]) => ({
    value: count,
    label: String(year),
  }));

  // arc + pie
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(data);

  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // draw pie
  svg
    .selectAll('path')
    .data(arcData)
    .join('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, i) => colors(i));

  // build legend
  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('class', 'legend-item')
      .attr('style', `--color:${colors(idx)}`)
      .html(
        `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`
      );
  });
}

/**
 * filter helper — search across all project values, case-insensitive
 */
function filterProjects(projects, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return projects;

  return projects.filter((project) => {
    // join all values into 1 string
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(needle);
  });
}

(async () => {
  // 2) fetch your real projects
  const projects = await fetchJSON('../lib/projects.json').catch(() => null);
  allProjects = Array.isArray(projects) ? projects : [];

  // render the actual project cards
  renderProjects(allProjects, projectsContainer, 'h2');

  // optional: update heading
  const titleEl = document.querySelector('.projects-title');
  if (titleEl) {
    titleEl.textContent = `Projects (${allProjects.length})`;
  }

 
  renderPieChart(allProjects);

  if (searchInput) {
    // use 'input' for real-time; change to 'change' if you want only on blur
    searchInput.addEventListener('input', (event) => {
      const query = event.target.value || '';

      const filtered = filterProjects(allProjects, query);

      // re-render cards
      renderProjects(filtered, projectsContainer, 'h2');

      // re-render pie + legend with ONLY visible projects
      renderPieChart(filtered);
    });
  }
})();
