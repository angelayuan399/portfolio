import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const GITHUB_USER = 'angelayuan399';
const REPO_NAME   = 'portfolio';

// --- Global scales for brushing ---
let xScale, yScale;

async function loadData() {
  const data = await d3.csv('loc.csv', row => ({
    ...row,
    line:   +row.line,
    depth:  +row.depth,
    length: +row.length,
    date:     new Date(`${row.date}T00:00${row.timezone}`),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3.groups(data, d => d.commit).map(([commit, lines]) => {
    const first = lines[0];
    const { author, date, time, timezone, datetime } = first;
    const ret = {
      id: commit,
      url: `https://github.com/${GITHUB_USER}/${REPO_NAME}/commit/${commit}`,
      author, date, time, timezone, datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length,
    };
    Object.defineProperty(ret, 'lines', {
      value: lines, enumerable: false, writable: false, configurable: false
    });
    return ret;
  });
}

// ------- summary stats -------
function addStat(dl, label, valueHTML) {
  const card = dl.append('div').attr('class', 'stat-item');
  card.append('dt').html(label);
  card.append('dd').html(valueHTML);
}

function renderCommitInfo(data, commits) {
  // clear existing stats to avoid duplicates on slider changes
  const statsContainer = d3.select('#stats');
  statsContainer.selectAll('*').remove();

  const dl = statsContainer.append('dl').attr('class', 'stats');

  // compute the set of lines that belong to the provided commits
  const commitIds = new Set(commits.map(c => c.id));
  const linesForCommits = data.filter(d => commitIds.has(d.commit));

  // Total LOC is number of lines present in the filtered set
  addStat(dl, 'Total LOC', linesForCommits.length);
  addStat(dl, 'Total commits', commits.length);

  const fileCount = d3.group(linesForCommits, d => d.file).size;
  addStat(dl, 'Files', fileCount);

  const fileLengths = d3.rollups(linesForCommits, v => d3.max(v, d => d.line), d => d.file);
  const longest = d3.greatest(fileLengths, d => d[1]);
  addStat(dl, 'Longest file', longest ? `${longest[0]}<br>(${longest[1]} lines)` : '—');

  const workByPeriod = d3.rollups(
    commits, v => v.length,
    d => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
  );
  const peak = d3.greatest(workByPeriod, d => d[1])?.[0];
  addStat(dl, 'Peak time of day', peak ?? '—');
}

// ------- scatterplot -------
function createBrushSelector(svg, brushed) {
  svg.call(d3.brush().on('start brush end', brushed));
}

let commitProgress = 100;
let commitMaxTime;
let timeScale;
let filteredCommits = [];
let allCommits = [];
let allData = [];

// color scale for line types (technology)
const colors = d3.scaleOrdinal(d3.schemeTableau10);

function onTimeSliderChange() {
  const slider = document.getElementById('commit-progress');
  commitProgress = +slider.value;
  commitMaxTime = timeScale.invert(commitProgress);

  // Update <time> element
  document.getElementById('commit-time').textContent =
    commitMaxTime.toLocaleString('en', { dateStyle: 'long', timeStyle: 'short' });

  // Filter commits
  filteredCommits = allCommits.filter(d => d.datetime <= commitMaxTime);

  // Update stats and chart
  renderCommitInfo(allData, filteredCommits);
  updateScatterPlot(allData, filteredCommits);

  // Update file unit visualization
  updateFileDisplay(filteredCommits);
}

function renderScatterPlot(data, commits) {
  const container = d3.select('#chart');
  container.selectAll('*').remove();

  const width = 900, height = 420;
  const margin = { top: 16, right: 24, bottom: 40, left: 48 };
  const usable = {
    left: margin.left,
    right: width - margin.right,
    top: margin.top,
    bottom: height - margin.bottom,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = container.append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('overflow', 'visible');

  // --- Assign to global variables ---
  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usable.left, usable.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usable.bottom, usable.top]);

  // Step 4.1: Calculate min/max lines and create radius scale
  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  // Step 4.3: Sort commits by totalLines descending
  const sortedCommits = d3.sort(commits, d => -d.totalLines);

  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usable.left},0)`)
    .call(d3.axisLeft(yScale).tickSize(-usable.width).tickFormat(''));

  const xAxis = d3.axisBottom(xScale).ticks(width / 100);
  const yAxis = d3.axisLeft(yScale).ticks(12)
    .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');

  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${usable.bottom})`)
    .call(xAxis);

  svg.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${usable.left}, 0)`)
    .call(yAxis);

  // --- Dots group ---
  const dots = svg.append('g').attr('class', 'dots');

  dots.selectAll('circle')
    .data(sortedCommits, d => d.id)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', d => d3.interpolateRgb('#2c6cf6', '#ff8a00')(d.hourFrac / 24))
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, d) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // --- Brush setup ---
  createBrushSelector(svg, brushed);

  // Raise dots and axes above overlay
  svg.selectAll('.dots, .overlay ~ *').raise();

  // --- Brushed event handler ---
  function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', (d) =>
      isCommitSelected(selection, d)
    );
    renderSelectionCount(selection, commits);
    renderLanguageBreakdown(selection, commits);
  }
}

function updateScatterPlot(data, commits) {
  const width = 900, height = 420;
  const margin = { top: 16, right: 24, bottom: 40, left: 48 };
  const usable = {
    left: margin.left,
    right: width - margin.right,
    top: margin.top,
    bottom: height - margin.bottom,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');
  if (!svg.node()) return;

  xScale.domain(d3.extent(commits, d => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale).ticks(width / 100);

  // Update x-axis
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  // Update dots
  const dots = svg.select('g.dots');
  const sortedCommits = d3.sort(commits, d => -d.totalLines);

  dots.selectAll('circle')
    .data(sortedCommits, d => d.id)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', d => d3.interpolateRgb('#2c6cf6', '#ff8a00')(d.hourFrac / 24))
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, d) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

// --- Selection logic ---
function isCommitSelected(selection, commit) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

// --- Selection count display ---
function renderSelectionCount(selection, commits) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;
  return selectedCommits;
}

// --- Language breakdown display ---
function renderLanguageBreakdown(selection, commits) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }
}

// ------- single entry point -------
(async function init() {
  try {
    const data = await loadData();
    const commits = processCommits(data);

    allData = data;
    allCommits = commits;

    // Setup time scale for slider
    timeScale = d3.scaleTime()
      .domain([
        d3.min(commits, d => d.datetime),
        d3.max(commits, d => d.datetime)
      ])
      .range([0, 100]);
    commitMaxTime = timeScale.invert(commitProgress);

    filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

    // Initial UI
    renderCommitInfo(data, filteredCommits);
    renderScatterPlot(data, filteredCommits);

    // Populate file visualization
    updateFileDisplay(filteredCommits);

    // Setup slider event
    const slider = document.getElementById('commit-progress');
    slider.addEventListener('input', onTimeSliderChange);

    // Initialize time display
    document.getElementById('commit-time').textContent =
      commitMaxTime.toLocaleString('en', { dateStyle: 'long', timeStyle: 'short' });
  } catch (e) {
    console.error('Meta init failed:', e);
  }
})();


function renderTooltipContent(commit) {
  if (!commit) return;

  const link  = document.getElementById('commit-link');
  const date  = document.getElementById('commit-date');
  const time  = document.getElementById('commit-tooltip-time');
  const author= document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  link.href = commit.url;
  link.textContent = commit.id;

  date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' }) ?? '';
  time.textContent = commit.datetime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '';
  author.textContent = commit.author ?? '';
  lines.textContent = commit.totalLines ?? '';
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  const offset = 12;

  // place near cursor, clamp inside viewport
  let x = event.clientX + offset;
  let y = event.clientY + offset;

  const { innerWidth: ww, innerHeight: wh } = window;
  const rect = tooltip.getBoundingClientRect();
  if (x + rect.width + 8 > ww) x = ww - rect.width - 8;
  if (y + rect.height + 8 > wh) y = wh - rect.height - 8;

  tooltip.style.left = `${x}px`;
  tooltip.style.top  = `${y}px`;
}

function updateFileDisplay(commits) {
  // ensure #files exists
  const filesRoot = d3.select('#files');
  filesRoot.selectAll('*').remove();

  if (!commits || commits.length === 0) return;

  // lines belonging to the filtered commits
  const lines = commits.flatMap(d => d.lines);

  // group by filename and sort by size desc
  const files = d3.groups(lines, d => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  // bind files
  const fileDivs = filesRoot.selectAll('div.file')
    .data(files, d => d.name)
    .join(enter => enter.append('div').attr('class', 'file').call(div => {
      div.append('dt').append('code');
      div.append('small');
      div.append('dd');
    }));

  // update labels
  fileDivs.select('dt > code').text(d => d.name);
  fileDivs.select('small').text(d => `${d.lines.length} lines`).style('opacity', 0.6).style('display','block');

  // for each file's dd, append one .loc div per line and color by type
  fileDivs.select('dd')
    .selectAll('div.loc')
    .data(d => d.lines)
    .join('div')
    .attr('class', 'loc')
    .style('background', l => colors(l.type))
    .attr('title', l => `${l.type} — ${l.author}`);
}
