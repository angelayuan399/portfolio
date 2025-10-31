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

// projects.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { renderProjects, fetchJSON } from '../global.js';

// 1) draw the pie ----------------------------------------------------
const svg = d3.select('#projects-pie-plot');

// arc generator: radius 50, full pie
const arcGenerator = d3.arc()
  .innerRadius(0)      // 0 => pie, >0 => donut
  .outerRadius(50);

// some sample data
const data = [1, 2, 3, 4, 5, 5];

// d3.pie will turn [1,2,3,...] into angle objects
const sliceGenerator = d3.pie();

// array of {startAngle, endAngle, value, index, ...}
const arcData = sliceGenerator(data);

// color scale (step 1.5)
const colors = d3.scaleOrdinal(d3.schemeTableau10);

// append one <path> per slice
arcData.forEach((d, i) => {
  svg
    .append('path')
    .attr('d', arcGenerator(d))
    .attr('fill', colors(i));
});

// 2) render your real projects list (if you have projects.json) ------
(async () => {
  const container = document.querySelector('.projects');
  if (!container) return;

  // change this to the actual path where your JSON lives
  // e.g. './projects.json' or '../data/projects.json'
  const projects = await fetchJSON('./projects.json').catch(() => null);

  // fall back to some dummy data if fetch fails
  const fallback = [
    {
      title: 'Lorem ipsum dolor sit.',
      description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.',
      year: 2024
    },
    {
      title: 'Architecto minima sed omnis?',
      description: 'Temporibus exercitationem enim unde hic delectus.',
      year: 2024
    }
  ];

  renderProjects(projects ?? fallback, container, 'h2');
})();
