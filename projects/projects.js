// projects/projects.js

// 1) import D3 + helpers
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

(async () => {
  // 2) fetch your real projects
  const projects = await fetchJSON('../lib/projects.json').catch(() => null);

  // render the actual project cards no matter what
  const projectsContainer = document.querySelector('.projects');
  renderProjects(projects ?? [], projectsContainer, 'h2');

  // optional: update heading
  const titleEl = document.querySelector('.projects-title');
  if (titleEl && Array.isArray(projects)) {
    titleEl.textContent = `Projects (${projects.length})`;
  }

  // 3) if we have no data, bail out of the chart
  if (!Array.isArray(projects) || projects.length === 0) {
    // you could show an empty-state chart here if you want
    return;
  }

  // -------------------------------------------------
  // Step 3.1 — roll up projects by year
  // -------------------------------------------------
  // some projects might not have year; put them in "Unknown"
  const rolled = d3.rollups(
    projects,
    (v) => v.length,                 // count how many in this group
    (d) => d.year ?? 'Unknown'       // group by d.year
  );

  // rolled looks like: [ ['2024', 3], ['2023', 4], ... ]
  // turn it into the format our pie code expects
  const data = rolled.map(([year, count]) => ({
    value: count,
    label: String(year),
  }));

  // -------------------------------------------------
  // pie + legend (same as before, but using `data`)
  // -------------------------------------------------
  const svg = d3.select('#projects-pie-plot');

  // remove starter circle
  svg.selectAll('circle').remove();

  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

  // IMPORTANT: pie must read d.value now
  const sliceGenerator = d3.pie().value((d) => d.value);

  const arcData = sliceGenerator(data);

  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // draw the slices
  svg
    .selectAll('path')
    .data(arcData)
    .join('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, i) => colors(i));

  // build the legend
  const legend = d3.select('.legend');
  legend.selectAll('li').remove(); // clear if we ever re-render

  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('class', 'legend-item')
      .attr('style', `--color:${colors(idx)}`)
      .html(
        `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`
      );
  });
})();
