// projects/projects.js

// lab way of importing D3:
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// we still want your helpers from the previous step
import { renderProjects, fetchJSON } from '../global.js';

// -----------------------------------------------------
// Step 1.3–1.5: draw the pie in the existing <svg>
// -----------------------------------------------------

// select the svg we added in index.html
const svg = d3.select('#projects-pie-plot');

// the HTML example had a <circle>. once we switch to d3 paths,
// we can remove it so it doesn’t sit on top:
svg.selectAll('circle').remove();

// arc generator = “how to draw each slice”
const arcGenerator = d3
  .arc()
  .innerRadius(0)     // 0 = pie, >0 = donut
  .outerRadius(50);   // matches the r=50 from the HTML example

// Step 1.4/1.5: use data
const data = [1, 2, 3, 4, 5, 5];

// d3.pie() turns [1,2,3,...] into angle objects
const sliceGenerator = d3.pie();

// array of objects: {startAngle, endAngle, value, index, ...}
const arcData = sliceGenerator(data);

// color scale (lab says to switch to d3 scales)
const colors = d3.scaleOrdinal(d3.schemeTableau10);

// create one <path> per slice
svg
  .selectAll('path')
  .data(arcData)
  .join('path')
  .attr('d', arcGenerator)
  .attr('fill', (d, i) => colors(i));

// -----------------------------------------------------
// Step 0.1 stuff: show projects with year
// -----------------------------------------------------
(async () => {
  const container = document.querySelector('.projects');
  if (!container) return;

  const projects = await fetchJSON('../lib/projects.json').catch(() => null);

  const fallback = [
    {
      title: 'Lorem ipsum dolor sit.',
      description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.',
      year: 2024
    },
    {
      title: 'Architecto minima sed omnis?',
      description: 'Tempora dignissimos exercitationem.',
      year: 2024
    }
  ];

  renderProjects(projects ?? fallback, container, 'h2');
})();
