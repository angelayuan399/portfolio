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
function renderCommitInfo(data, commits) {
  const statsContainer = d3
    .select('#stats')
    .append('div')
    .attr('class', 'stats-grid');

  const filesCount = d3.group(data, d => d.file).size;

  const maxDepth = d3.max(data, d => d.depth);

  const longestLineLength = d3.max(data, d => d.length);

  // longest file
  const fileLengths = d3.rollups(
    data,
    v => d3.max(v, r => r.line),
    d => d.file
  );
  const longestFile = d3.greatest(fileLengths, d => d[1]);
  const longestFileName = longestFile[0];
  const longestFileLines = longestFile[1];

  // peak time of day
  const workByPeriod = d3.rollups(
    data,
    v => v.length,
    d => new Date(d.datetime)
          .toLocaleString('en', { dayPeriod: 'short' })
  );
  const peakPeriod = d3.greatest(workByPeriod, d => d[1])[0];

  const statsList = [
    { label: 'TOTAL LOC', value: data.length },
    { label: 'TOTAL COMMITS', value: commits.length },
    { label: 'FILES', value: filesCount },
    { label: 'LONGEST FILE', value: `${longestFileName} (${longestFileLines} lines)` },
    { label: 'PEAK TIME OF DAY', value: `in the ${peakPeriod}` }
  ];

  statsList.forEach(stat => {
    const item = statsContainer.append('div').attr('class', 'stat');

    item.append('dt').text(stat.label);
    item.append('dd').html(stat.value);
  });
}

