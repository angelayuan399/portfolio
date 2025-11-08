import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const GITHUB_USER = 'angelayuan399';
const REPO_NAME   = 'portfolio';

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
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  addStat(dl, 'Total LOC', data.length);
  addStat(dl, 'Total commits', commits.length);

  const fileCount = d3.group(data, d => d.file).size;
  addStat(dl, 'Files', fileCount);

  const fileLengths = d3.rollups(data, v => d3.max(v, d => d.line), d => d.file);
  const longest = d3.greatest(fileLengths, d => d[1]);
  addStat(dl, 'Longest file', `${longest[0]}<br>(${longest[1]} lines)`);

  const workByPeriod = d3.rollups(
    data, v => v.length,
    d => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
  );
  const peak = d3.greatest(workByPeriod, d => d[1])?.[0];
  addStat(dl, 'Peak time of day', peak);
}

// ------- scatterplot -------
function renderScatterPlot(_data, commits) {
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

  const xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usable.left, usable.right])
    .nice();

  const yScale = d3.scaleLinear()
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

  const dots = svg.append('g').attr('class', 'dots');

  dots.selectAll('circle')
    .data(sortedCommits)
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

// ------- single entry point -------
(async function init() {
  try {
    const data = await loadData();
    const commits = processCommits(data);
    renderCommitInfo(data, commits);
    renderScatterPlot(data, commits);
  } catch (e) {
    console.error('Meta init failed:', e);
  }
})();


function renderTooltipContent(commit) {
  if (!commit) return;

  const link  = document.getElementById('commit-link');
  const date  = document.getElementById('commit-date');
  const time  = document.getElementById('commit-time');
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
