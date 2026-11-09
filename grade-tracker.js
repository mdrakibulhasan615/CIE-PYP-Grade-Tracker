// Scriptable A-Level Past Paper Tracker (Medium Widget)

let fm = FileManager.local();
let savePath = fm.joinPath(fm.documentsDirectory(), "alevel_grades.json");

// Load existing data or fallback to default sample data if empty
let savedData = "[]";
let logs = [];
if (fm.fileExists(savePath)) {
  savedData = fm.readString(savePath);
  try { logs = JSON.parse(savedData); } catch (e) { logs = []; }
}

// If no saved data exists yet, seed with initial dataset
if (logs.length === 0) {
  logs = [
    {"id":"1785077649874","timestamp":"2026-07-26T14:54:09.874Z","subject":"Physics","year":2025,"series":"Winter (w)","paper":"P43","score":63},
    {"id":"1785077693403","timestamp":"2026-07-26T14:54:53.403Z","subject":"Physics","year":2021,"series":"Winter (w)","paper":"P43","score":52},
    {"id":"1785077840244","timestamp":"2026-07-26T14:57:20.244Z","subject":"Math","year":2025,"series":"Winter (w)","paper":"P33","score":55},
    {"id":"1785130041096","timestamp":"2026-07-27T05:27:21.096Z","subject":"Physics","year":2024,"series":"Winter (w)","paper":"P43","score":59},
    {"id":"1785161595871","timestamp":"2026-07-27T14:13:15.871Z","subject":"Physics","year":2023,"series":"Winter (w)","paper":"P43","score":59},
  ];
  fm.writeString(savePath, JSON.stringify(logs));
}

// WIDGET LOGIC (Runs when placed on Home Screen)
if (config.runsInWidget) {
  let widget = await createMediumWidget(logs);
  Script.setWidget(widget);
  Script.complete();
} 

// APP LOGIC (Runs when you open the script normally)
else {
  const htmlContent = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>A-Level Grade Tracker</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      :root {
        --bg-primary: #0f0f13; --bg-secondary: #181824; --bg-card: #222232;
        --accent-purple: #8b5cf6; --accent-hover: #7c3aed;
        --text-main: #f3f4f6; --text-muted: #9ca3af; --border: #374151;
        --danger: #ef4444; --green: #34d399;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, sans-serif; }
      body { background: var(--bg-primary); color: var(--text-main); padding: 16px; padding-bottom: 40px; }
      .header { margin-bottom: 18px; }
      h1 { font-size: 1.4rem; font-weight: 700; color: #fff; }
      .subtitle { font-size: 0.82rem; color: var(--text-muted); margin-top: 2px; }
      
      .tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 12px; scrollbar-width: none; }
      .tab { background: var(--bg-secondary); border: 1px solid var(--border); color: var(--text-muted); padding: 8px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: 0.2s; white-space: nowrap; }
      .tab.active { background: var(--accent-purple); color: #fff; border-color: var(--accent-purple); }
      
      .sub-tabs { margin-bottom: 16px; margin-top: -4px; }
      .sub-tabs .tab { font-size: 0.75rem; padding: 6px 12px; background: var(--bg-card); border-style: dashed; }
      .sub-tabs .tab.active { background: rgba(139, 92, 246, 0.2); color: #a78bfa; border-color: var(--accent-purple); border-style: solid; }

      .card { background: var(--bg-card); border-radius: 14px; padding: 16px; margin-bottom: 18px; border: 1px solid rgba(255,255,255,0.06); }
      .card-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
      .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .form-group { display: flex; flex-direction: column; gap: 4px; }
      .form-group.full { grid-column: span 2; }
      label { font-size: 0.72rem; color: var(--text-muted); font-weight: 700; }
      select, input { background: var(--bg-secondary); border: 1px solid var(--border); color: #fff; padding: 10px; border-radius: 8px; font-size: 0.92rem; outline: none; }
      .btn-primary { background: var(--accent-purple); color: #fff; border: none; padding: 12px; border-radius: 10px; font-weight: 600; width: 100%; margin-top: 12px; cursor: pointer; }
      .avg-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .avg-item { background: var(--bg-secondary); padding: 10px 6px; border-radius: 10px; text-align: center; }
      .avg-year { font-size: 0.72rem; color: var(--text-muted); font-weight: 700; }
      .avg-score { font-size: 1.05rem; font-weight: 700; color: #a78bfa; }
      
      .chart-container { 
        position: relative; 
        width: 100%; 
        height: 240px; 
        min-height: 150px; 
        max-height: 600px; 
        overflow: hidden; 
      }
      .size-controls { display: flex; align-items: center; gap: 6px; }
      .size-btn { background: var(--bg-secondary); border: 1px solid var(--border); color: #fff; border-radius: 6px; width: 26px; height: 26px; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; }

      .history-list { display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto; }
      .history-item { background: var(--bg-secondary); padding: 10px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid var(--accent-purple); }
      .history-tag { font-size: 0.85rem; font-weight: 700; color: #fff; }
      .history-meta { font-size: 0.72rem; color: var(--text-muted); }
      .history-score { font-size: 1.1rem; font-weight: 800; color: var(--green); margin-right: 10px; }
      .delete-btn { background: none; border: none; color: var(--danger); font-size: 1.1rem; cursor: pointer; padding: 4px; }
      .empty-state { text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 16px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>A-Level Grade Tracker</h1>
      <div class="subtitle">Physics (9702) • Math (9709) • CS (9618)</div>
    </div>

    <div class="tabs" id="mainTabs">
      <div class="tab active" onclick="setSubjectFilter('All', this)">All</div>
      <div class="tab" onclick="setSubjectFilter('Physics', this)">Physics</div>
      <div class="tab" onclick="setSubjectFilter('Math', this)">Math</div>
      <div class="tab" onclick="setSubjectFilter('CS', this)">CS</div>
    </div>

    <div class="tabs sub-tabs" id="subTabs" style="display: none;"></div>

    <div class="card">
      <div class="card-title">Log New Paper</div>
      <div class="form-grid">
        <div class="form-group full">
          <label>Subject</label>
          <select id="inputSubject">
            <option value="Physics">Physics (9702)</option>
            <option value="Math">Mathematics (9709)</option>
            <option value="CS">Computer Science (9618)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Year</label>
          <select id="inputYear">
            <option value="2026">2026</option><option value="2025">2025</option>
            <option value="2024">2024</option><option value="2023">2023</option>
            <option value="2022">2022</option><option value="2021">2021</option>
          </select>
        </div>
        <div class="form-group">
          <label>Series</label>
          <select id="inputSeries">
            <option value="Summer (s)">Summer</option>
            <option value="Winter (w)">Winter</option>
            <option value="Spring (m)">Spring</option>
          </select>
        </div>
        <div class="form-group">
          <label>Variant (e.g. P43 -> P4)</label>
          <input type="text" id="inputPaper" placeholder="e.g. P43">
        </div>
        <div class="form-group">
          <label>Score (%)</label>
          <input type="number" id="inputScore" placeholder="e.g. 60">
        </div>
      </div>
      <button type="button" class="btn-primary" onclick="addEntry()">Save Score Log</button>
    </div>

    <div class="card">
      <div class="card-title">
        <span>Progress & Best Fit <span id="overallAvgLabel" style="font-size:0.8rem; color:#8b5cf6; margin-left:6px;">Avg: --%</span></span>
        <div class="size-controls">
          <button class="size-btn" onclick="adjustChartHeight(-50)">-</button>
          <button class="size-btn" onclick="adjustChartHeight(50)">+</button>
        </div>
      </div>
      <div class="chart-container" id="chartBox"><canvas id="scoreChart"></canvas></div>
    </div>

    <div class="card">
      <div class="card-title">Yearly Averages</div>
      <div class="avg-grid" id="yearlyAvgGrid"></div>
    </div>

    <div class="card">
      <div class="card-title">History</div>
      <div class="history-list" id="historyList"></div>
    </div>

    <script>
      let logs = /*INJECT_DATA*/;
      let currentSubjectFilter = 'All';
      let currentPaperFilter = 'All';
      let chartInstance = null;

      // Normalize logs so that paper filters only look at the first 2 characters (e.g. P43 -> P4)
      logs.forEach(item => {
        if (item.paper) {
          item.normPaper = item.paper.substring(0, 2).toUpperCase();
        } else {
          item.normPaper = "UNKNOWN";
        }
      });

      const subsections = {
        'Physics': ['P4', 'P5'],
        'Math': ['P3', 'P4'],
        'CS': ['P3', 'P4']
      };

      function saveToDevice() {
        const dataString = encodeURIComponent(JSON.stringify(logs));
        let iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = "scriptable-bridge://" + dataString;
        document.body.appendChild(iframe);
        setTimeout(() => iframe.remove(), 500);
      }

      function setSubjectFilter(subj, el) {
        currentSubjectFilter = subj;
        currentPaperFilter = 'All';

        document.querySelectorAll('#mainTabs .tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');

        const subContainer = document.getElementById('subTabs');
        if (subj !== 'All' && subsections[subj]) {
          let subHTML = '<div class="tab active" onclick="setPaperFilter(\\'All\\', this)">All Papers</div>';
          subsections[subj].forEach(paper => {
            subHTML += '<div class="tab" onclick="setPaperFilter(\\'' + paper + '\\', this)">' + paper + '</div>';
          });
          subContainer.innerHTML = subHTML;
          subContainer.style.display = 'flex';
        } else {
          subContainer.style.display = 'none';
        }

        renderApp();
      }

      function setPaperFilter(paper, el) {
        currentPaperFilter = paper;
        document.querySelectorAll('#subTabs .tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        renderApp();
      }

      function adjustChartHeight(delta) {
        const box = document.getElementById('chartBox');
        let currentH = box.clientHeight;
        let newH = Math.min(Math.max(currentH + delta, 150), 600);
        box.style.height = newH + 'px';
        if (chartInstance) chartInstance.resize();
      }

      function addEntry() {
        const subject = document.getElementById('inputSubject').value;
        const year = parseInt(document.getElementById('inputYear').value);
        const series = document.getElementById('inputSeries').value;
        const paperInput = document.getElementById('inputPaper').value.trim().toUpperCase();
        const score = parseFloat(document.getElementById('inputScore').value);

        if (!paperInput || isNaN(score)) { alert("Please enter both a paper variant and a score."); return; }

        let normP = paperInput.substring(0, 2);

        logs.push({
          id: Date.now().toString(), 
          timestamp: new Date().toISOString(),
          subject: subject, 
          year: year, 
          series: series, 
          paper: paperInput, 
          normPaper: normP,
          score: score
        });

        saveToDevice();
        document.getElementById('inputPaper').value = '';
        document.getElementById('inputScore').value = '';
        renderApp();
      }

      function deleteEntry(id) {
        logs = logs.filter(item => item.id !== String(id));
        saveToDevice();
        renderApp();
      }

      function getFilteredLogs() {
        let filtered = logs || [];
        
        if (currentSubjectFilter !== 'All') {
          filtered = filtered.filter(l => l.subject === currentSubjectFilter);
        }
        
        if (currentPaperFilter !== 'All') {
          filtered = filtered.filter(l => l.normPaper === currentPaperFilter);
        }
        
        return filtered;
      }

      function calculateBestFit(xyPoints) {
        let n = xyPoints.length;
        if (n === 0) return [];
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let i = 0; i < n; i++) {
            sumX += xyPoints[i].x;
            sumY += xyPoints[i].y;
            sumXY += (xyPoints[i].x * xyPoints[i].y);
            sumXX += (xyPoints[i].x * xyPoints[i].x);
        }
        let slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        let intercept = (sumY - slope * sumX) / n;
        if (isNaN(slope)) slope = 0;
        if (isNaN(intercept)) intercept = sumY / n || 0;

        return xyPoints.map(p => ({
            x: p.xLabel,
            y: Number((slope * p.x + intercept).toFixed(2))
        }));
      }

      function renderYearlyAverages() {
        const grid = document.getElementById('yearlyAvgGrid');
        grid.innerHTML = '';
        const filtered = getFilteredLogs();
        [2021, 2022, 2023, 2024, 2025, 2026].forEach(yr => {
          const yrLogs = filtered.filter(l => l.year === yr);
          let avgText = yrLogs.length > 0 ? Math.round(yrLogs.reduce((a, b) => a + b.score, 0) / yrLogs.length) + '%' : '--';
          grid.innerHTML += '<div class="avg-item"><div class="avg-year">' + yr + '</div><div class="avg-score">' + avgText + '</div></div>';
        });
      }

      function renderHistory() {
        const container = document.getElementById('historyList');
        const filtered = getFilteredLogs().slice().sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (filtered.length === 0) { container.innerHTML = '<div class="empty-state">No papers logged yet.</div>'; return; }
        container.innerHTML = filtered.map(item => {
          let dateStr = new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          return '<div class="history-item"><div>' +
                   '<div class="history-tag">' + item.subject + ' ' + item.year + ' ' + item.series + ' ' + item.paper + '</div>' +
                   '<div class="history-meta">Logged: ' + dateStr + '</div>' +
                 '</div><div style="display:flex; align-items:center;">' +
                   '<div class="history-score">' + item.score + '%</div>' +
                   '<button class="delete-btn" onclick="deleteEntry(\\'' + item.id + '\\')">✕</button>' +
                 '</div></div>';
        }).join('');
      }

      function renderChart() {
        const filtered = getFilteredLogs().slice().sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
        const avgLabel = document.getElementById('overallAvgLabel');
        if (typeof Chart === 'undefined') { avgLabel.innerText = "Chart requires internet to load"; return; }
        if (filtered.length > 0) {
          avgLabel.innerText = 'Avg: ' + Math.round(filtered.reduce((a, b) => a + b.score, 0) / filtered.length) + '%';
        } else { avgLabel.innerText = 'Avg: --%'; }

        const labels = filtered.map(l => {
          let dt = new Date(l.timestamp);
          return (dt.getMonth()+1) + '/' + dt.getDate() + ' (' + l.paper + ')';
        });

        const scores = filtered.map(l => l.score);

        // Calculate Best Fit Line Data
        const xyPoints = filtered.map((l, index) => ({
            x: index,
            y: l.score,
            xLabel: labels[index]
        }));
        const trendData = calculateBestFit(xyPoints).map(p => p.y);

        const ctx = document.getElementById('scoreChart').getContext('2d');
        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Score',
                data: scores,
                borderColor: '#8b5cf6', 
                backgroundColor: 'rgba(139, 92, 246, 0.15)', 
                borderWidth: 2.5,
                fill: true, 
                tension: 0.3, 
                pointBackgroundColor: '#34d399', 
                pointRadius: 4
              },
              {
                label: 'Best Fit Line',
                data: trendData,
                borderColor: '#ef4444',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
              }
            ]
          },
          options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            scales: { 
              y: { min: 0, max: 100, grid: { color: '#374151' }, ticks: { color: '#9ca3af' } }, 
              x: { display: false } 
            }, 
            plugins: { 
              legend: { labels: { color: '#f3f4f6', font: { size: 10 } } } 
            } 
          }
        });
      }

      function renderApp() { renderChart(); renderYearlyAverages(); renderHistory(); }
      window.onload = renderApp;
    </script>
  </body>
  </html>`.replace("/*INJECT_DATA*/", JSON.stringify(logs));

  let webView = new WebView();
  webView.shouldAllowRequest = (req) => {
    if (req.url.startsWith("scriptable-bridge://")) {
      let jsonString = decodeURIComponent(req.url.split("scriptable-bridge://")[1]);
      fm.writeString(savePath, jsonString);
      return false; 
    }
    return true;
  };

  await webView.loadHTML(htmlContent);
  await webView.present(true);
}

// WIDGET UI BUILDER
async function createMediumWidget(logs) {
  let w = new ListWidget();
  w.backgroundColor = new Color("#0f0f13"); // Matches dark app background
  w.setPadding(16, 16, 16, 16);

  // Top Header Row
  let headerStack = w.addStack();
  headerStack.centerAlignContent();
  let title = headerStack.addText("A-LEVEL TRACKER");
  title.font = Font.boldSystemFont(12);
  title.textColor = new Color("#9ca3af");
  headerStack.addSpacer();
  let icon = headerStack.addText("📈");
  icon.font = Font.systemFont(14);
  
  w.addSpacer(12);

  // Handle empty state
  if (logs.length === 0) {
    let empty = w.addText("No papers logged yet. Open app to add scores.");
    empty.textColor = new Color("#9ca3af");
    empty.font = Font.systemFont(13);
    w.addSpacer();
    return w;
  }

  // Calculate Overall Averages
  let overallAvg = Math.round(logs.reduce((sum, l) => sum + l.score, 0) / logs.length);
  
  // Calculate Today's Papers
  let todayDateStr = new Date().toDateString();
  let completedTodayCount = logs.filter(l => new Date(l.timestamp).toDateString() === todayDateStr).length;

  // Middle Row: Main Stats
  let mainStack = w.addStack();
  mainStack.centerAlignContent();
  
  let avgStack = mainStack.addStack();
  avgStack.layoutVertically();
  let avgLabel = avgStack.addText("OVERALL AVG");
  avgLabel.font = Font.boldSystemFont(10);
  avgLabel.textColor = new Color("#8b5cf6"); // Purple
  let avgValue = avgStack.addText(overallAvg + "%");
  avgValue.font = Font.heavySystemFont(28);
  avgValue.textColor = Color.white();
  
  mainStack.addSpacer();
  
  let countStack = mainStack.addStack();
  countStack.layoutVertically();
  let countLabel = countStack.addText("DONE TODAY");
  countLabel.font = Font.boldSystemFont(10);
  countLabel.textColor = new Color("#34d399"); // Green
  let countValue = countStack.addText(completedTodayCount.toString());
  countValue.font = Font.heavySystemFont(28);
  countValue.textColor = Color.white();
  
  w.addSpacer();

  // Helper to calculate subject specific average
  function getSubjAvg(subj) {
    let subLogs = logs.filter(l => l.subject === subj);
    if (subLogs.length === 0) return "--%";
    return Math.round(subLogs.reduce((s, l) => s + l.score, 0) / subLogs.length) + "%";
  }

  // Bottom Row: Subject Breakdowns
  let botStack = w.addStack();
  botStack.spacing = 8;
  
  let subjects = ["Physics", "Math", "CS"];
  let labels = ["PHY", "MAT", "CS"];
  
  for (let i = 0; i < subjects.length; i++) {
    let sStack = botStack.addStack();
    sStack.backgroundColor = new Color("#181824");
    sStack.cornerRadius = 8;
    sStack.setPadding(6, 0, 6, 0);
    sStack.layoutVertically();
    sStack.centerAlignContent();
    
    sStack.size = new Size(0, 42);
    
    let sTitle = sStack.addText(labels[i]);
    sTitle.font = Font.boldSystemFont(10);
    sTitle.textColor = new Color("#9ca3af");
    sTitle.centerAlignText();
    
    let sVal = sStack.addText(getSubjAvg(subjects[i]));
    sVal.font = Font.boldSystemFont(14);
    sVal.textColor = Color.white();
    sVal.centerAlignText();
  }
  
  return w;
}
