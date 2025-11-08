// meta/main.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// --- Adjust these 2 if your repo/user are different ---
const GITHUB_USER = 'angelayuan399';
const REPO_NAME   = 'portfolio';

// 0) Load and parse the CSV (numbers + dates become real types)
async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line:   +row.line,
    depth:  +row.depth,
    length: +row.length,
    // date string like 2024-10-31, time zone like +00:00
    date:     new Date(`${row.date}T00:00${row.timezone}`),
    datetime: new Date(row.datetime),
  }));
  return data;
}

// 1) Build a commit array from line-level rows
function processCommits(data) {
  return d3
    .groups(data, d => d.commit)                     // [commitId, lines[]]
    .map(([commit, lines]) => {
      const first = lines[0];                        // same author/time per commit
      const { author, date, time, timezone, datetime } = first;

      const ret = {
        id: commit,
        url: `https://github.com/${GITHUB_USER}/${REPO_NAME}/commit/${commit}`,
        author,
        date,
        time,
        timezone,
        datetime,
        // hour as decimal (e.g., 14.5 means 2:30pm)
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        // number of lines touched by this commit
        totalLines: lines.length,
      };

      // keep raw lines, but hidden from console/for..in
      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,     // <-- don't show in console.table / Object.keys
        writable: false,
        configurable: false,
      });

      return ret;
    });
}

// 2) Render a small definition list of summary stats
function addStat(dl, label, valueHTML) {
  const container = dl.append('div').attr('class', 'stat-item');
  container.append('dt').html(label);
  container.append('dd').html(valueHTML);
}

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats')
    .append('dl')
    .attr('class', 'stats');

  addStat(dl, 'Total LOC', data.length);
  addStat(dl, 'Total commits', commits.length);

  const fileCount = d3.group(data, d => d.file).size;
  addStat(dl, 'Files', fileCount);

  const fileLengths = d3.rollups(data, v => d3.max(v, d => d.line), d => d.file);
  const longest = d3.greatest(fileLengths, d => d[1]);
  addStat(dl, 'Longest file', `${longest[0]}<br>(${longest[1]} lines)`);

  const workByPeriod = d3.rollups(
    data,
    v => v.length,
    d => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
  );
  const peak = d3.greatest(workByPeriod, d => d[1])?.[0];
  addStat(dl, 'Peak time of day', peak);
}



// --- Scatterplot ------------------------------------------------------------
function renderScatterPlot(data, commits) {
  // clear previous renders (safe for hot reloads)
  const container = d3.select('#chart');
  container.selectAll('*').remove();

  // responsive SVG via viewBox; width/height just define the coordinate space
  const width = 900;
  const height = 420;
  const margin = { top: 16, right: 24, bottom: 40, left: 48 };

  const usable = {
    left: margin.left,
    right: width - margin.right,
    top: margin.top,
    bottom: height - margin.bottom,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = container
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')   // scales with the page
    .style('overflow', 'visible');

  // scales
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usable.left, usable.right])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usable.bottom, usable.top]);

  // gridlines (draw BEFORE axes so axes sit on top)
  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usable.left},0)`)
    .call(d3.axisLeft(yScale).tickSize(-usable.width).tickFormat(''));

  // axes
  const xAxis = d3.axisBottom(xScale).ticks(width / 100);
  const yAxis = d3
    .axisLeft(yScale)
    .ticks(12)
    .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');

  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${usable.bottom})`)
    .call(xAxis);

  svg.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${usable.left}, 0)`)
    .call(yAxis);

  // dots
  svg.append('g')
    .attr('class', 'dots')
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', 3.5)
    .attr('opacity', 0.8)
    // simple night→day color scale (blue → orange)
    .attr('fill', d => d3.interpolateRgb('#2c6cf6', '#ff8a00')(d.hourFrac / 24))
    .append('title')
    .text(d => `${d.author}\n${d.datetime.toLocaleString()}\n${d.totalLines} lines`);
}


// ---- call everything (keep your existing calls) ----
const data = await loadData();
const commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
