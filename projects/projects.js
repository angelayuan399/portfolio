// projects/projects.js

// 1) import D3 + helpers
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

// grab shared DOM nodes once
const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');

// global state
let allProjects = [];
let currentQuery = '';
let selectedIndex = -1;     // -1 = nothing selected
let selectedLabel = null;   // e.g. '2024'

// --------------------------------------------------
// helpers
// --------------------------------------------------
function filterProjectsByQuery(projects, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return projects;
  return projects.filter((project) => {
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(needle);
  });
}

/**
 * Given the "base" list (i.e. after search), return
 * either the whole thing (no slice selected)
 * or only the projects for the selected year
 */
function applySelectedYear(projects) {
  if (selectedIndex === -1 || !selectedLabel) {
    return projects;
  }
  return projects.filter((p) => String(p.year ?? 'Unknown') === selectedLabel);
}

/**
 * Render the pie + legend for a given "base" set of projects
 * (i.e. projects AFTER the search, but BEFORE year filter)
 * and highlight whichever slice is currently selected.
 */
function renderPieChart(baseProjects) {
  // clear old
  svg.selectAll('path').remove();
  svg.selectAll('circle').remove();
  legend.selectAll('li').remove();

  if (!Array.isArray(baseProjects) || baseProjects.length === 0) return;

  // group by year
  const rolled = d3.rollups(
    baseProjects,
    (v) => v.length,
    (d) => d.year ?? 'Unknown'
  );

  // [{ label, value }]
  const data = rolled.map(([year, count]) => ({
    label: String(year),
    value: count,
  }));

  // generators
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(data);

  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // draw slices
  const paths = svg
    .selectAll('path')
    .data(arcData)
    .join('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, i) => colors(i))
    .attr('class', (d, i) => (i === selectedIndex ? 'selected' : ''))
    .style('cursor', 'pointer')
    .on('click', (_, dObj) => {
      const i = arcData.indexOf(dObj);

      // toggle
      if (selectedIndex === i) {
        // deselect
        selectedIndex = -1;
        selectedLabel = null;
      } else {
        selectedIndex = i;
        selectedLabel = data[i].label;
      }

      // re-render projects based on NEW selection
      updateView();
    });

  // build legend
  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('class', `legend-item ${idx === selectedIndex ? 'selected' : ''}`)
      .attr('style', `--color:${colors(idx)}`)
      .html(
        `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`
      )
      .on('click', () => {
        // same toggle logic for legend
        if (selectedIndex === idx) {
          selectedIndex = -1;
          selectedLabel = null;
        } else {
          selectedIndex = idx;
          selectedLabel = d.label;
        }
        updateView();
      });
  });
}

/**
 * Main render pipeline:
 * 1. start from ALL projects
 * 2. apply search
 * 3. render pie based on search-only set
 * 4. apply selected year to produce FINAL visible list
 * 5. renderProjects(final)
 */
function updateView() {
  // 1) search
  const searchFiltered = filterProjectsByQuery(allProjects, currentQuery);

  // 2) pie is always based on "what I'm currently seeing after search"
  renderPieChart(searchFiltered);

  // 3) now apply year selection to that set
  const finalVisible = applySelectedYear(searchFiltered);

  // 4) render cards
  renderProjects(finalVisible, projectsContainer, 'h2');

  // 5) update title
  const titleEl = document.querySelector('.projects-title');
  if (titleEl) {
    titleEl.textContent = `Projects (${finalVisible.length})`;
  }
}

// --------------------------------------------------
// init
// --------------------------------------------------
(async () => {
  allProjects =
    (await fetchJSON('../lib/projects.json').catch(() => null)) ?? [];

  // initial render
  updateView();

  // search listener
  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      currentQuery = event.target.value || '';
      // when we type, we do NOT reset the selected year;
      // we just narrow down the pool
      updateView();
    });
  }
})();

// projects data module
export const projects = [
  {
    id: 'bikewatching',
    title: 'BikeWatching',
    desc: 'Interactive site that visualizes bicycle counts and routes — built with D3 and map overlays. Live demo and dataset-driven visual exploration.',
    url: 'https://angelayuan399.github.io/bikewatching/',
    screenshot: 'https://angelayuan399.github.io/bikewatching/', // used as iframe src for preview
    tags: ['D3', 'Interactive', 'Mapping']
  },

  // ...add other projects here, include a "url" key for those that have a live demo
];
