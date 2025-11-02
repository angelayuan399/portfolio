// Import D3 and our helpers
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

// Step 2.1: Data with labels
const data = [
  { value: 1, label: 'apples' },
  { value: 2, label: 'oranges' },
  { value: 3, label: 'mangos' },
  { value: 4, label: 'pears' },
  { value: 5, label: 'limes' },
  { value: 5, label: 'cherries' },
];

// Select the SVG
const svg = d3.select('#projects-pie-plot');

// Remove starter circle
svg.selectAll('circle').remove();

// Arc generator
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// Pie generator that reads d.value
const sliceGenerator = d3.pie().value((d) => d.value);

// Angles
const arcData = sliceGenerator(data);

// Color scale
const colors = d3.scaleOrdinal(d3.schemeTableau10);

// Draw slices
svg
  .selectAll('path')
  .data(arcData)
  .join('path')
  .attr('d', arcGenerator)
  .attr('fill', (d, i) => colors(i));

// Step 2.2: Legend
const legend = d3.select('.legend');

data.forEach((d, idx) => {
  legend
    .append('li')
    .attr('class', 'legend-item')
    .attr('style', `--color:${colors(idx)}`)
    .html(
      `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`
    );
});

// Project list rendering
const projectsContainer = document.querySelector('.projects');
const projects = await fetchJSON('../lib/projects.json').catch(() => null);
renderProjects(projects ?? [], projectsContainer, 'h2');

// Optional title update
const titleEl = document.querySelector('.projects-title');
if (titleEl && Array.isArray(projects)) {
  titleEl.textContent = `Projects (${projects.length})`;
}
