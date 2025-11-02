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

// Step 2.1: data with labels
const data = [
  { value: 1, label: 'apples' },
  { value: 2, label: 'oranges' },
  { value: 3, label: 'mangos' },
  { value: 4, label: 'pears' },
  { value: 5, label: 'limes' },
  { value: 5, label: 'cherries' },
];

/* ------------------------------
   Step 1.3–2.1: pie from labeled data
------------------------------ */
const svg = d3.select('#projects-pie-plot');

// remove the starter circle
svg.selectAll('circle').remove();

const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// tell the pie how to read { value, label }
const sliceGenerator = d3.pie().value((d) => d.value);

// this now contains start/end angles AND our original object in d.data
const arcData = sliceGenerator(data);

// color scale
const colors = d3.scaleOrdinal(d3.schemeTableau10);

// draw slices
svg
  .selectAll('path')
  .data(arcData)
  .join('path')
  .attr('d', arcGenerator)
  .attr('fill', (d, i) => colors(i));

/* ------------------------------
   Step 2.2: create legend <li> with D3
------------------------------ */
const legend = d3.select('.legend');

data.forEach((d, idx) => {
  legend
    .append('li')
    .attr('style', `--color:${colors(idx)}`)
    .attr('class', 'legend-item')
    .html(
      `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`
    );
});

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
