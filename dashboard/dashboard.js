// ============================================
// Wijha Analytics Dashboard
// Uses shared config from /js/config.js
// ============================================

const sb = supabaseClient;

let currentPage = 0;
const PAGE_SIZE = 20;
let charts = {};
let realtimeChannel = null;

// ---- Chart.js Defaults ----
Chart.defaults.font.family = "'Tajawal', sans-serif";
Chart.defaults.color = '#64748b';
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.padding = 16;

const COLORS = {
  blue: '#2563eb',
  green: '#16a34a',
  purple: '#7c3aed',
  orange: '#d97706',
  red: '#dc2626',
  cyan: '#0891b2',
  pink: '#db2777',
  teal: '#0d9488',
};

const COLOR_ARRAY = Object.values(COLORS);

// ---- Auth ----
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  const errorEl = document.getElementById('login-error');

  btn.querySelector('.btn-text').style.display = 'none';
  btn.querySelector('.btn-loader').style.display = 'block';
  errorEl.textContent = '';

  const { error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.textContent = 'خطأ في البريد أو كلمة المرور';
    btn.querySelector('.btn-text').style.display = 'inline';
    btn.querySelector('.btn-loader').style.display = 'none';
    return;
  }

  showDashboard();
}

async function checkAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    showDashboard();
  }
}

function showDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';
  loadAllData();
  setupRealtime();
}

async function handleLogout() {
  await sb.auth.signOut();
  if (realtimeChannel) sb.removeChannel(realtimeChannel);
  window.location.reload();
}

// ---- Date Range ----
function getDateRange() {
  const val = document.getElementById('date-range').value;
  if (val === 'all') return null;
  const d = new Date();
  d.setDate(d.getDate() - parseInt(val));
  return d.toISOString();
}

// ---- Data Loading ----
async function loadAllData() {
  const btn = document.getElementById('refresh-btn');
  btn.classList.add('spinning');

  try {
    await Promise.all([
      loadKPIs(),
      loadTimelineChart(),
      loadSourcesChart(),
      loadDevicesChart(),
      loadScrollChart(),
      loadHourlyChart(),
      loadGeoChart(),
      loadExperienceChart(),
      loadRegistrationsTable(),
      loadUTMTable(),
      loadReferrerTable(),
      loadBrowsersChart(),
      loadOSChart(),
      loadFunnel(),
      loadFieldInteractions(),
      loadRageClicks(),
      loadRealtimeStats(),
    ]);
  } catch (err) {
    console.error('Data load error:', err);
  }

  btn.classList.remove('spinning');
}

// ---- KPIs ----
async function loadKPIs() {
  const since = getDateRange();

  let sessionsQ = sb.from('sessions').select('session_id', { count: 'exact', head: true });
  let regsQ = sb.from('registrations').select('id', { count: 'exact', head: true });

  if (since) {
    sessionsQ = sessionsQ.gte('started_at', since);
    regsQ = regsQ.gte('created_at', since);
  }

  const [sessionsRes, regsRes] = await Promise.all([sessionsQ, regsQ]);

  const visitors = sessionsRes.count || 0;
  const registrations = regsRes.count || 0;
  const conversion = visitors > 0 ? ((registrations / visitors) * 100).toFixed(1) : 0;

  document.getElementById('kpi-visitors').textContent = formatNumber(visitors);
  document.getElementById('kpi-registrations').textContent = formatNumber(registrations);
  document.getElementById('kpi-conversion').textContent = conversion + '%';

  // Avg time on page
  let timeQ = sb.from('events')
    .select('event_data')
    .eq('event_type', 'page_leave');
  if (since) timeQ = timeQ.gte('created_at', since);
  const { data: timeData } = await timeQ;

  if (timeData?.length > 0) {
    const totalSeconds = timeData.reduce((sum, e) => sum + (e.event_data?.time_on_page || 0), 0);
    const avg = Math.round(totalSeconds / timeData.length);
    document.getElementById('kpi-avg-time').textContent = formatTime(avg);
  } else {
    document.getElementById('kpi-avg-time').textContent = '--';
  }

  // Bounce rate (visitors with no scroll_25 event)
  let allSessionsQ = sb.from('sessions').select('session_id');
  if (since) allSessionsQ = allSessionsQ.gte('started_at', since);
  const { data: allSessions } = await allSessionsQ;

  let scrollQ = sb.from('events').select('session_id').eq('event_type', 'scroll_25');
  if (since) scrollQ = scrollQ.gte('created_at', since);
  const { data: scrolled } = await scrollQ;

  const scrolledSet = new Set(scrolled?.map(e => e.session_id) || []);
  const bounced = (allSessions || []).filter(s => !scrolledSet.has(s.session_id)).length;
  const bounceRate = allSessions?.length > 0 ? ((bounced / allSessions.length) * 100).toFixed(1) : 0;
  document.getElementById('kpi-bounce').textContent = bounceRate + '%';

  // Change indicators (compare with previous period)
  const range = document.getElementById('date-range').value;
  if (range !== 'all') {
    const days = parseInt(range);
    const prevStart = new Date();
    prevStart.setDate(prevStart.getDate() - days * 2);
    const prevEnd = new Date();
    prevEnd.setDate(prevEnd.getDate() - days);

    const [prevSessions, prevRegs] = await Promise.all([
      sb.from('sessions').select('session_id', { count: 'exact', head: true })
        .gte('started_at', prevStart.toISOString())
        .lt('started_at', prevEnd.toISOString()),
      sb.from('registrations').select('id', { count: 'exact', head: true })
        .gte('created_at', prevStart.toISOString())
        .lt('created_at', prevEnd.toISOString()),
    ]);

    setChange('kpi-visitors-change', visitors, prevSessions.count || 0);
    setChange('kpi-registrations-change', registrations, prevRegs.count || 0);
  }
}

function setChange(elId, current, previous) {
  const el = document.getElementById(elId);
  if (previous === 0) {
    el.textContent = current > 0 ? '+100%' : '--';
    el.className = 'kpi-change ' + (current > 0 ? 'positive' : '');
    return;
  }
  const change = ((current - previous) / previous * 100).toFixed(0);
  el.textContent = (change > 0 ? '+' : '') + change + '%';
  el.className = 'kpi-change ' + (change >= 0 ? 'positive' : 'negative');
}

// ---- Timeline Chart ----
async function loadTimelineChart() {
  const since = getDateRange();
  let q = sb.from('sessions').select('started_at');
  if (since) q = q.gte('started_at', since);
  const { data: sessions } = await q;

  let rq = sb.from('registrations').select('created_at');
  if (since) rq = rq.gte('created_at', since);
  const { data: regs } = await rq;

  const sessionsByDay = groupByDay(sessions || [], 'started_at');
  const regsByDay = groupByDay(regs || [], 'created_at');

  const allDays = [...new Set([...Object.keys(sessionsByDay), ...Object.keys(regsByDay)])].sort();

  const data = {
    labels: allDays.map(d => formatDate(d)),
    datasets: [
      {
        label: 'الزوار',
        data: allDays.map(d => sessionsByDay[d] || 0),
        borderColor: COLORS.blue,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      },
      {
        label: 'التسجيلات',
        data: allDays.map(d => regsByDay[d] || 0),
        borderColor: COLORS.green,
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      }
    ]
  };

  renderChart('chart-timeline', 'line', data, {
    scales: {
      x: { grid: { color: 'rgba(59,130,246,0.06)' } },
      y: { grid: { color: 'rgba(59,130,246,0.06)' }, beginAtZero: true },
    }
  });
}

// ---- Sources Chart ----
async function loadSourcesChart() {
  const since = getDateRange();
  let q = sb.from('sessions').select('utm_source, referrer');
  if (since) q = q.gte('started_at', since);
  const { data } = await q;

  const sources = {};
  (data || []).forEach(s => {
    let src = s.utm_source || categorizeReferrer(s.referrer);
    sources[src] = (sources[src] || 0) + 1;
  });

  const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 8);

  renderChart('chart-sources', 'doughnut', {
    labels: sorted.map(([k]) => k),
    datasets: [{
      data: sorted.map(([, v]) => v),
      backgroundColor: COLOR_ARRAY,
      borderWidth: 0,
    }]
  }, {
    cutout: '65%',
    plugins: { legend: { position: 'bottom' } },
  });
}

// ---- Devices Chart ----
async function loadDevicesChart() {
  const since = getDateRange();
  let q = sb.from('sessions').select('device_type');
  if (since) q = q.gte('started_at', since);
  const { data } = await q;

  const devices = {};
  (data || []).forEach(s => {
    const d = s.device_type || 'unknown';
    devices[d] = (devices[d] || 0) + 1;
  });

  const labels = { mobile: 'موبايل', desktop: 'كمبيوتر', tablet: 'تابلت', unknown: 'غير معروف' };

  renderChart('chart-devices', 'doughnut', {
    labels: Object.keys(devices).map(k => labels[k] || k),
    datasets: [{
      data: Object.values(devices),
      backgroundColor: [COLORS.blue, COLORS.purple, COLORS.orange, COLORS.teal],
      borderWidth: 0,
    }]
  }, {
    cutout: '65%',
    plugins: { legend: { position: 'bottom' } },
  });
}

// ---- Scroll Depth Chart ----
async function loadScrollChart() {
  const since = getDateRange();
  const milestones = ['scroll_25', 'scroll_50', 'scroll_75', 'scroll_100'];
  const counts = [];

  for (const m of milestones) {
    let q = sb.from('events').select('session_id', { count: 'exact', head: true }).eq('event_type', m);
    if (since) q = q.gte('created_at', since);
    const { count } = await q;
    counts.push(count || 0);
  }

  renderChart('chart-scroll', 'bar', {
    labels: ['25%', '50%', '75%', '100%'],
    datasets: [{
      label: 'عدد الزوار',
      data: counts,
      backgroundColor: [
        'rgba(59, 130, 246, 0.7)',
        'rgba(167, 139, 250, 0.7)',
        'rgba(251, 191, 36, 0.7)',
        'rgba(74, 222, 128, 0.7)',
      ],
      borderRadius: 8,
      barThickness: 50,
    }]
  }, {
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(59,130,246,0.06)' }, beginAtZero: true },
    },
    plugins: { legend: { display: false } },
  });
}

// ---- Hourly Traffic ----
async function loadHourlyChart() {
  const since = getDateRange();
  let q = sb.from('sessions').select('started_at');
  if (since) q = q.gte('started_at', since);
  const { data } = await q;

  const hourly = new Array(24).fill(0);
  (data || []).forEach(s => {
    const h = new Date(s.started_at).getHours();
    hourly[h]++;
  });

  renderChart('chart-hourly', 'bar', {
    labels: hourly.map((_, i) => `${i}:00`),
    datasets: [{
      label: 'الزوار',
      data: hourly,
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: COLORS.blue,
      borderWidth: 1,
      borderRadius: 4,
    }]
  }, {
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(59,130,246,0.06)' }, beginAtZero: true },
    },
    plugins: { legend: { display: false } },
  });
}

// ---- Geographic Chart ----
async function loadGeoChart() {
  const since = getDateRange();
  let q = sb.from('sessions').select('country');
  if (since) q = q.gte('started_at', since);
  const { data } = await q;

  const countries = {};
  (data || []).forEach(s => {
    const c = s.country || 'Unknown';
    countries[c] = (countries[c] || 0) + 1;
  });

  const sorted = Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 10);

  renderChart('chart-geo', 'bar', {
    labels: sorted.map(([k]) => k),
    datasets: [{
      label: 'الزوار',
      data: sorted.map(([, v]) => v),
      backgroundColor: COLOR_ARRAY,
      borderRadius: 6,
    }]
  }, {
    indexAxis: 'y',
    scales: {
      x: { grid: { color: 'rgba(59,130,246,0.06)' }, beginAtZero: true },
      y: { grid: { display: false } },
    },
    plugins: { legend: { display: false } },
  });
}

// ---- Experience Level Chart ----
async function loadExperienceChart() {
  const since = getDateRange();
  let q = sb.from('registrations').select('experience_level');
  if (since) q = q.gte('created_at', since);
  const { data } = await q;

  const levels = {};
  const labelMap = {
    beginner: 'مبتدئ', basic: 'أساسيات', intermediate: 'متوسط', advanced: 'متقدم', '': 'لم يحدد', null: 'لم يحدد'
  };

  (data || []).forEach(r => {
    const l = r.experience_level || 'لم يحدد';
    const label = labelMap[l] || l;
    levels[label] = (levels[label] || 0) + 1;
  });

  renderChart('chart-experience', 'pie', {
    labels: Object.keys(levels),
    datasets: [{
      data: Object.values(levels),
      backgroundColor: COLOR_ARRAY,
      borderWidth: 0,
    }]
  }, {
    plugins: { legend: { position: 'bottom' } },
  });
}

// ---- Registrations Table ----
async function loadRegistrationsTable(page = 0) {
  currentPage = page;
  const since = getDateRange();

  let q = sb.from('registrations')
    .select('*')
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  if (since) q = q.gte('created_at', since);

  const { data, error } = await q;
  const tbody = document.getElementById('registrations-body');
  tbody.innerHTML = '';

  if (!data?.length) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--text-muted);padding:40px">لا توجد تسجيلات بعد</td></tr>';
    return;
  }

  data.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${page * PAGE_SIZE + i + 1}</td>
      <td><strong>${esc(r.full_name)}</strong></td>
      <td dir="ltr" style="font-family: 'JetBrains Mono', monospace; font-size:13px">${esc(r.phone)}</td>
      <td dir="ltr" style="font-size:13px">${esc(r.email || '--')}</td>
      <td>${esc(r.city || '--')}</td>
      <td><span class="tag">${esc(r.experience_level || '--')}</span></td>
      <td>${esc(r.referral_source || '--')}</td>
      <td>${esc(r.device_type || '--')}</td>
      <td style="font-size:12px">${esc(r.utm_source || '--')} / ${esc(r.utm_medium || '--')}</td>
      <td style="font-size:12px;font-family:'JetBrains Mono',monospace">${formatDateTime(r.created_at)}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('page-info').textContent = `صفحة ${page + 1}`;
  document.getElementById('prev-page').disabled = page === 0;
  document.getElementById('next-page').disabled = data.length < PAGE_SIZE;
}

// ---- UTM Table ----
async function loadUTMTable() {
  const since = getDateRange();
  let q = sb.from('sessions').select('session_id, utm_source, utm_medium, utm_campaign');
  if (since) q = q.gte('started_at', since);
  const { data: sessions } = await q;

  let rq = sb.from('registrations').select('session_id');
  if (since) rq = rq.gte('created_at', since);
  const { data: regs } = await rq;

  const regSessions = new Set((regs || []).map(r => r.session_id));
  const utmGroups = {};

  (sessions || []).forEach(s => {
    if (!s.utm_source) return;
    const key = `${s.utm_source}|${s.utm_medium || ''}|${s.utm_campaign || ''}`;
    if (!utmGroups[key]) utmGroups[key] = { visitors: 0, conversions: 0 };
    utmGroups[key].visitors++;
    if (regSessions.has(s.session_id)) utmGroups[key].conversions++;
  });

  const sorted = Object.entries(utmGroups).sort((a, b) => b[1].visitors - a[1].visitors);
  const tbody = document.getElementById('utm-body');
  tbody.innerHTML = '';

  if (!sorted.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:30px">لا توجد بيانات UTM بعد</td></tr>';
    return;
  }

  sorted.slice(0, 15).forEach(([key, val]) => {
    const [source, medium, campaign] = key.split('|');
    const rate = val.visitors > 0 ? ((val.conversions / val.visitors) * 100).toFixed(1) : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${esc(source)}</td>
      <td>${esc(medium || '--')}</td>
      <td>${esc(campaign || '--')}</td>
      <td>${val.visitors}</td>
      <td>${val.conversions}</td>
      <td><span style="color:${rate > 5 ? 'var(--green)' : 'var(--text-muted)'}">${rate}%</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// ---- Referrer Table ----
async function loadReferrerTable() {
  const since = getDateRange();
  let q = sb.from('sessions').select('referrer');
  if (since) q = q.gte('started_at', since);
  const { data } = await q;

  const refs = {};
  (data || []).forEach(s => {
    if (!s.referrer) return;
    try {
      const host = new URL(s.referrer).hostname;
      refs[host] = (refs[host] || 0) + 1;
    } catch {
      refs[s.referrer] = (refs[s.referrer] || 0) + 1;
    }
  });

  const sorted = Object.entries(refs).sort((a, b) => b[1] - a[1]);
  const tbody = document.getElementById('referrer-body');
  tbody.innerHTML = '';

  if (!sorted.length) {
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;color:var(--text-muted);padding:30px">لا توجد بيانات</td></tr>';
    return;
  }

  sorted.slice(0, 10).forEach(([ref, count]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${esc(ref)}</td><td>${count}</td>`;
    tbody.appendChild(tr);
  });
}

// ---- Browsers Chart ----
async function loadBrowsersChart() {
  const since = getDateRange();
  let q = sb.from('sessions').select('browser');
  if (since) q = q.gte('started_at', since);
  const { data } = await q;

  const browsers = {};
  (data || []).forEach(s => {
    browsers[s.browser || 'Other'] = (browsers[s.browser || 'Other'] || 0) + 1;
  });

  renderChart('chart-browsers', 'doughnut', {
    labels: Object.keys(browsers),
    datasets: [{ data: Object.values(browsers), backgroundColor: COLOR_ARRAY, borderWidth: 0 }]
  }, { cutout: '60%', plugins: { legend: { position: 'bottom' } } });
}

// ---- OS Chart ----
async function loadOSChart() {
  const since = getDateRange();
  let q = sb.from('sessions').select('os');
  if (since) q = q.gte('started_at', since);
  const { data } = await q;

  const osMap = {};
  (data || []).forEach(s => {
    osMap[s.os || 'Other'] = (osMap[s.os || 'Other'] || 0) + 1;
  });

  renderChart('chart-os', 'doughnut', {
    labels: Object.keys(osMap),
    datasets: [{ data: Object.values(osMap), backgroundColor: COLOR_ARRAY, borderWidth: 0 }]
  }, { cutout: '60%', plugins: { legend: { position: 'bottom' } } });
}

// ---- Funnel ----
async function loadFunnel() {
  const since = getDateRange();
  const steps = [
    { type: 'page_view', label: 'زيارة الصفحة' },
    { type: 'scroll_50', label: 'تمرير 50%' },
    { type: 'form_impression', label: 'رؤية النموذج' },
    { type: 'form_start', label: 'بدء التعبئة' },
    { type: 'form_submit_success', label: 'إتمام التسجيل' },
  ];

  const counts = [];
  for (const step of steps) {
    let q = sb.from('events')
      .select('session_id')
      .eq('event_type', step.type);
    if (since) q = q.gte('created_at', since);
    const { data } = await q;
    const unique = new Set((data || []).map(e => e.session_id));
    counts.push(unique.size);
  }

  const container = document.getElementById('funnel-container');
  container.innerHTML = '';
  const maxCount = Math.max(...counts, 1);

  steps.forEach((step, i) => {
    const pct = (counts[i] / maxCount) * 100;
    const colors = [COLORS.blue, COLORS.purple, COLORS.orange, COLORS.cyan, COLORS.green];

    const stepEl = document.createElement('div');
    stepEl.className = 'funnel-step';
    stepEl.innerHTML = `
      <div class="funnel-label">${step.label}</div>
      <div class="funnel-bar-wrapper">
        <div class="funnel-bar" style="width:${Math.max(pct, 8)}%;background:${colors[i]}">
          <span>${counts[i]}</span>
        </div>
      </div>
    `;
    container.appendChild(stepEl);

    if (i < steps.length - 1 && counts[i] > 0) {
      const dropRate = ((1 - counts[i + 1] / counts[i]) * 100).toFixed(1);
      const dropEl = document.createElement('div');
      dropEl.className = 'funnel-drop';
      dropEl.textContent = `↓ -${dropRate}% انسحاب`;
      container.appendChild(dropEl);
    }
  });
}

// ---- Field Interactions ----
async function loadFieldInteractions() {
  const since = getDateRange();
  let q = sb.from('events')
    .select('event_data')
    .eq('event_type', 'field_focus');
  if (since) q = q.gte('created_at', since);
  const { data } = await q;

  const fields = {};
  const fieldLabels = {
    full_name: 'الاسم', phone: 'الهاتف', email: 'البريد',
    city: 'المدينة', experience: 'الخبرة', referral: 'المصدر'
  };

  (data || []).forEach(e => {
    const f = e.event_data?.field;
    if (f) fields[f] = (fields[f] || 0) + 1;
  });

  renderChart('chart-field-interactions', 'bar', {
    labels: Object.keys(fields).map(k => fieldLabels[k] || k),
    datasets: [{
      label: 'عدد التفاعلات',
      data: Object.values(fields),
      backgroundColor: COLOR_ARRAY,
      borderRadius: 6,
    }]
  }, {
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(59,130,246,0.06)' }, beginAtZero: true },
    },
    plugins: { legend: { display: false } },
  });
}

// ---- Rage Clicks ----
async function loadRageClicks() {
  const since = getDateRange();
  let q = sb.from('events')
    .select('created_at')
    .eq('event_type', 'rage_click');
  if (since) q = q.gte('created_at', since);
  const { data } = await q;

  const byDay = groupByDay(data || [], 'created_at');
  const days = Object.keys(byDay).sort();

  renderChart('chart-rage-clicks', 'bar', {
    labels: days.map(d => formatDate(d)),
    datasets: [{
      label: 'نقرات غاضبة',
      data: days.map(d => byDay[d] || 0),
      backgroundColor: 'rgba(248, 113, 113, 0.6)',
      borderColor: COLORS.red,
      borderWidth: 1,
      borderRadius: 4,
    }]
  }, {
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(59,130,246,0.06)' }, beginAtZero: true },
    },
    plugins: { legend: { display: false } },
  });
}

// ---- Realtime ----
async function loadRealtimeStats() {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count: active } = await sb.from('sessions')
    .select('session_id', { count: 'exact', head: true })
    .gte('last_seen_at', fiveMinAgo);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayVisitors, todayRegs] = await Promise.all([
    sb.from('sessions').select('session_id', { count: 'exact', head: true })
      .gte('started_at', todayStart.toISOString()),
    sb.from('registrations').select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString()),
  ]);

  document.getElementById('rt-active').textContent = active || 0;
  document.getElementById('rt-today-visitors').textContent = todayVisitors.count || 0;
  document.getElementById('rt-today-registrations').textContent = todayRegs.count || 0;

  // Recent events
  const { data: recentEvents } = await sb.from('events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const feed = document.getElementById('events-feed');
  feed.innerHTML = '';

  if (!recentEvents?.length) {
    feed.innerHTML = '<div class="event-placeholder">لا توجد أحداث بعد</div>';
    return;
  }

  const eventLabels = {
    page_view: '👁 زيارة صفحة',
    scroll_25: '📜 تمرير 25%',
    scroll_50: '📜 تمرير 50%',
    scroll_75: '📜 تمرير 75%',
    scroll_100: '📜 تمرير 100%',
    form_impression: '📋 رؤية النموذج',
    form_start: '✏️ بدء التعبئة',
    form_submit_success: '✅ تسجيل ناجح',
    form_submit_attempt: '🔄 محاولة إرسال',
    form_validation_error: '⚠️ خطأ تحقق',
    cta_click: '🖱 نقر CTA',
    page_leave: '🚪 مغادرة',
    rage_click: '😤 نقرات غاضبة',
    field_focus: '📝 تعبئة حقل',
    time_on_page: '⏱ وقت الصفحة',
    page_hidden: '👻 إخفاء التبويب',
    page_visible: '👀 عودة للتبويب',
  };

  const dotClass = {
    page_view: 'view', scroll_25: 'scroll', scroll_50: 'scroll', scroll_75: 'scroll', scroll_100: 'scroll',
    form_impression: 'form', form_start: 'form', form_submit_success: 'submit',
    cta_click: 'click', page_leave: 'leave', rage_click: 'leave',
  };

  recentEvents.forEach(e => {
    const div = document.createElement('div');
    div.className = 'event-item';
    div.innerHTML = `
      <div class="event-dot ${dotClass[e.event_type] || 'click'}"></div>
      <span class="event-text">${eventLabels[e.event_type] || e.event_type}</span>
      <span class="event-time">${formatTimeAgo(e.created_at)}</span>
    `;
    feed.appendChild(div);
  });
}

function setupRealtime() {
  realtimeChannel = sb
    .channel('dashboard-events')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload) => {
      loadRealtimeStats();
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registrations' }, () => {
      loadRealtimeStats();
      loadKPIs();
    })
    .subscribe();

  setInterval(loadRealtimeStats, 30000);
}

// ---- CSV Export ----
function exportCSV() {
  const since = getDateRange();
  let q = sb.from('registrations').select('*').order('created_at', { ascending: false });
  if (since) q = q.gte('created_at', since);

  q.then(({ data }) => {
    if (!data?.length) return alert('لا توجد بيانات للتصدير');

    const headers = ['الاسم', 'الهاتف', 'البريد', 'المدينة', 'الخبرة', 'المصدر', 'الجهاز', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'التاريخ'];
    const rows = data.map(r => [
      r.full_name, r.phone, r.email || '', r.city || '',
      r.experience_level || '', r.referral_source || '', r.device_type || '',
      r.utm_source || '', r.utm_medium || '', r.utm_campaign || '',
      new Date(r.created_at).toLocaleString('ar')
    ]);

    const bom = '\uFEFF';
    const csv = bom + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wijha-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ---- Chart Renderer ----
function renderChart(canvasId, type, data, options = {}) {
  if (charts[canvasId]) charts[canvasId].destroy();

  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  charts[canvasId] = new Chart(ctx, {
    type,
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeOutQuart' },
      ...options,
    }
  });
}

// ---- Helpers ----
function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatTime(seconds) {
  if (seconds < 60) return seconds + 'ث';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}د ${s}ث`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar', { month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatTimeAgo(dateStr) {
  const diff = Math.round((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}ث`;
  if (diff < 3600) return `${Math.floor(diff / 60)}د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}س`;
  return `${Math.floor(diff / 86400)}ي`;
}

function groupByDay(items, field) {
  const groups = {};
  items.forEach(item => {
    const day = item[field]?.slice(0, 10);
    if (day) groups[day] = (groups[day] || 0) + 1;
  });
  return groups;
}

function categorizeReferrer(ref) {
  if (!ref) return 'مباشر';
  ref = ref.toLowerCase();
  if (ref.includes('facebook') || ref.includes('fb.')) return 'Facebook';
  if (ref.includes('instagram')) return 'Instagram';
  if (ref.includes('youtube')) return 'YouTube';
  if (ref.includes('google')) return 'Google';
  if (ref.includes('tiktok')) return 'TikTok';
  if (ref.includes('twitter') || ref.includes('x.com')) return 'X/Twitter';
  return 'أخرى';
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ---- Navigation ----
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const section = item.dataset.section;

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}`).classList.add('active');

    const titles = {
      overview: ['نظرة عامة', 'إحصائيات شاملة لأداء صفحة التسجيل'],
      registrations: ['التسجيلات', 'قائمة جميع التسجيلات مع التفاصيل'],
      traffic: ['حركة المرور', 'تحليل مصادر الزيارات والمُحيلين'],
      funnel: ['القمع التحويلي', 'تتبع رحلة الزائر من الدخول إلى التسجيل'],
      realtime: ['الوقت الفعلي', 'مراقبة النشاط المباشر على الموقع'],
    };

    document.getElementById('page-title').textContent = titles[section]?.[0] || '';
    document.getElementById('page-subtitle').textContent = titles[section]?.[1] || '';
  });
});

// ---- Event Listeners ----
document.getElementById('login-form').addEventListener('submit', handleLogin);
document.getElementById('logout-btn').addEventListener('click', handleLogout);
document.getElementById('refresh-btn').addEventListener('click', loadAllData);
document.getElementById('date-range').addEventListener('change', loadAllData);
document.getElementById('export-csv').addEventListener('click', exportCSV);
document.getElementById('prev-page').addEventListener('click', () => loadRegistrationsTable(currentPage - 1));
document.getElementById('next-page').addEventListener('click', () => loadRegistrationsTable(currentPage + 1));

// ---- Init ----
checkAuth();
