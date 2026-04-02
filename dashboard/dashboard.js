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
      loadPaymentMethodsChart(),
      loadFunnel(),
      loadUTMTable(),
      loadReferrerTable(),
      loadTopPagesTable(),
      loadRegistrationsTable(),
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

  let pvQ = sb.from('events').select('session_id').eq('event_type', 'page_view');
  if (since) pvQ = pvQ.gte('created_at', since);
  const { data: pvData } = await pvQ;
  const visitorsFromEvents = new Set((pvData || []).map(e => e.session_id).filter(Boolean)).size;
  const visitorsFromSessions = sessionsRes.count || 0;
  const visitors = Math.max(visitorsFromSessions, visitorsFromEvents);
  const registrations = regsRes.count || 0;
  const conversion = visitors > 0 ? ((registrations / visitors) * 100).toFixed(1) : 0;

  document.getElementById('kpi-visitors').textContent = formatNumber(visitors);
  document.getElementById('kpi-registrations').textContent = formatNumber(registrations);
  document.getElementById('kpi-conversion').textContent = conversion + '%';

  let formEvQ = sb.from('events').select('event_type, session_id').in('event_type', [
    'form_start', 'form_submit_success', 'form_submit_attempt', 'form_validation_error',
  ]);
  if (since) formEvQ = formEvQ.gte('created_at', since);
  const { data: formEvs } = await formEvQ;

  const formStarts = new Set();
  const formSuccessSessions = new Set();
  let attemptCount = 0;
  let validationErrorCount = 0;
  (formEvs || []).forEach((e) => {
    if (e.event_type === 'form_start' && e.session_id) formStarts.add(e.session_id);
    if (e.event_type === 'form_submit_success' && e.session_id) formSuccessSessions.add(e.session_id);
    if (e.event_type === 'form_submit_attempt') attemptCount += 1;
    if (e.event_type === 'form_validation_error') validationErrorCount += 1;
  });

  document.getElementById('kpi-form-starts').textContent = formatNumber(formStarts.size);
  document.getElementById('kpi-form-success-events').textContent = formatNumber(formSuccessSessions.size);
  document.getElementById('kpi-form-attempts-errors').textContent =
    `${formatNumber(attemptCount)} / ${formatNumber(validationErrorCount)}`;

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

  // Bounce: among page_view sessions, share with no scroll_25 (fallback to sessions rows if no page_view data)
  let scrollQ = sb.from('events').select('session_id').eq('event_type', 'scroll_25');
  if (since) scrollQ = scrollQ.gte('created_at', since);
  const { data: scrolled } = await scrollQ;
  const scrolledSet = new Set((scrolled || []).map(e => e.session_id).filter(Boolean));

  const pageViewSet = new Set((pvData || []).map(e => e.session_id).filter(Boolean));
  let bounceRate = '0';
  if (pageViewSet.size > 0) {
    const bouncedPv = [...pageViewSet].filter(sid => !scrolledSet.has(sid)).length;
    bounceRate = ((bouncedPv / pageViewSet.size) * 100).toFixed(1);
  } else {
    let allSessionsQ = sb.from('sessions').select('session_id');
    if (since) allSessionsQ = allSessionsQ.gte('started_at', since);
    const { data: allSessions } = await allSessionsQ;
    const bounced = (allSessions || []).filter(s => !scrolledSet.has(s.session_id)).length;
    bounceRate = allSessions?.length > 0 ? ((bounced / allSessions.length) * 100).toFixed(1) : '0';
  }
  document.getElementById('kpi-bounce').textContent = bounceRate + '%';

  // Change indicators (compare with previous period)
  const range = document.getElementById('date-range').value;
  if (range !== 'all') {
    document.getElementById('kpi-visitors-change').style.display = '';
    document.getElementById('kpi-registrations-change').style.display = '';
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
  } else {
    const vc = document.getElementById('kpi-visitors-change');
    const rc = document.getElementById('kpi-registrations-change');
    if (vc) { vc.textContent = '--'; vc.className = 'kpi-change'; }
    if (rc) { rc.textContent = '--'; rc.className = 'kpi-change'; }
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
  let q = sb.from('events').select('session_id, created_at').eq('event_type', 'page_view');
  if (since) q = q.gte('created_at', since);
  const { data: pageViews } = await q;

  let rq = sb.from('registrations').select('created_at');
  if (since) rq = rq.gte('created_at', since);
  const { data: regs } = await rq;

  const sessionsByDay = groupUniqueSessionsByDay(pageViews || [], 'created_at');
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

  let sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!sorted.length) sorted = [['لا بيانات جلسات', 1]];

  renderChart('chart-sources', 'doughnut', {
    labels: sorted.map(([k]) => k),
    datasets: [{
      data: sorted.map(([, v]) => v),
      backgroundColor: sorted.length === 1 && sorted[0][0] === 'لا بيانات جلسات' ? ['#e2e8f0'] : COLOR_ARRAY,
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
  const devicesEmpty = !Object.keys(devices).length;
  if (devicesEmpty) devices.unknown = 1;

  renderChart('chart-devices', 'doughnut', {
    labels: Object.keys(devices).map(k => labels[k] || k),
    datasets: [{
      data: Object.values(devices),
      backgroundColor: devicesEmpty ? ['#e2e8f0'] : [COLORS.blue, COLORS.purple, COLORS.orange, COLORS.teal],
      borderWidth: 0,
    }]
  }, {
    cutout: '65%',
    plugins: { legend: { position: 'bottom' } },
  });
}

// ---- Payment methods (registrations) ----
async function loadPaymentMethodsChart() {
  const since = getDateRange();
  let q = sb.from('registrations').select('payment_method');
  if (since) q = q.gte('created_at', since);
  const { data } = await q;

  const methods = {};
  const labelMap = {
    d17: 'D17',
    flouci: 'Flouci',
    bank_transfer: 'تحويل بنكي',
    cash: 'نقدي',
    '': 'غير محدد',
    null: 'غير محدد',
  };

  (data || []).forEach(r => {
    const method = r.payment_method || 'غير محدد';
    const label = labelMap[method] || method;
    methods[label] = (methods[label] || 0) + 1;
  });

  const labels = Object.keys(methods);
  const values = Object.values(methods);
  const empty = !labels.length;
  renderChart('chart-payment', 'doughnut', {
    labels: empty ? ['لا توجد تسجيلات في الفترة'] : labels,
    datasets: [{
      data: empty ? [1] : values,
      backgroundColor: empty ? ['#e2e8f0'] : COLOR_ARRAY,
      borderWidth: 0,
    }]
  }, {
    cutout: '58%',
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
      <td><span class="tag">${esc(r.payment_method || '--')}</span></td>
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

// ---- Top pages (page_view URLs) ----
async function loadTopPagesTable() {
  const since = getDateRange();
  let q = sb.from('events').select('page_url').eq('event_type', 'page_view');
  if (since) q = q.gte('created_at', since);
  const { data } = await q;

  const counts = {};
  (data || []).forEach((e) => {
    const u = (e.page_url || '').trim() || '(بدون رابط)';
    counts[u] = (counts[u] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const tbody = document.getElementById('top-pages-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!sorted.length) {
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;color:var(--text-muted);padding:24px">لا توجد بيانات</td></tr>';
    return;
  }

  sorted.forEach(([url, n]) => {
    const tr = document.createElement('tr');
    const short = url.length > 72 ? url.slice(0, 70) + '…' : url;
    tr.innerHTML = `<td dir="ltr" style="font-size:12px;max-width:280px;overflow:hidden;text-overflow:ellipsis">${esc(short)}</td><td>${n}</td>`;
    tbody.appendChild(tr);
  });
}

// ---- Funnel ----
async function loadFunnel() {
  const since = getDateRange();
  const steps = [
    { type: 'page_view', label: 'زيارة الصفحة' },
    { type: 'scroll_25', label: 'تمرير 25٪+' },
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

// ---- Realtime ----
async function loadRealtimeStats() {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: activeEventsRes } = await sb.from('events')
    .select('session_id')
    .gte('created_at', fiveMinAgo);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayPageViewsRes, todayRegs] = await Promise.all([
    sb.from('events').select('session_id')
      .eq('event_type', 'page_view')
      .gte('created_at', todayStart.toISOString()),
    sb.from('registrations').select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString()),
  ]);

  // activeEventsRes is the rows array from { data: activeEventsRes }.
  const activeEvents = new Set((activeEventsRes || []).map(e => e.session_id).filter(Boolean)).size;
  const todayVisitors = new Set((todayPageViewsRes.data || []).map(e => e.session_id).filter(Boolean)).size;

  document.getElementById('rt-active').textContent = activeEvents || 0;
  document.getElementById('rt-today-visitors').textContent = todayVisitors || 0;
  document.getElementById('rt-today-registrations').textContent = todayRegs.count || 0;

  // Recent events
  const { data: recentEvents } = await sb.from('events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(120);

  const feed = document.getElementById('events-feed');
  feed.innerHTML = '';

  const feedTypes = new Set([
    'page_view', 'form_impression', 'form_start', 'form_submit_attempt', 'form_submit_success',
    'form_validation_error', 'form_submit_error', 'cta_click',
  ]);
  const filtered = (recentEvents || []).filter((e) => feedTypes.has(e.event_type)).slice(0, 40);

  if (!filtered.length) {
    feed.innerHTML = '<div class="event-placeholder">لا توجد أحداث مهمة حديثة (أو البيانات قديمة)</div>';
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
    form_submit_error: '❌ فشل إرسال',
    cta_click: '🖱 نقر CTA',
    page_leave: '🚪 مغادرة',
    rage_click: '😤 نقرات غاضبة',
    field_focus: '📝 تعبئة حقل',
    time_on_page: '⏱ وقت الصفحة',
    heartbeat: '💓 نشاط (نبض)',
    page_hidden: '👻 إخفاء التبويب',
    page_visible: '👀 عودة للتبويب',
    section_visible: '👁 قسم ظهر',
  };

  const dotClass = {
    page_view: 'view', scroll_25: 'scroll', scroll_50: 'scroll', scroll_75: 'scroll', scroll_100: 'scroll',
    form_impression: 'form', form_start: 'form', form_submit_success: 'submit',
    form_validation_error: 'leave', form_submit_error: 'leave',
    cta_click: 'click', page_leave: 'leave', rage_click: 'leave',
  };

  filtered.forEach(e => {
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

  setInterval(loadRealtimeStats, 10000);
}

// ---- CSV Export ----
function exportCSV() {
  const since = getDateRange();
  let q = sb.from('registrations').select('*').order('created_at', { ascending: false });
  if (since) q = q.gte('created_at', since);

  q.then(({ data }) => {
    if (!data?.length) return alert('لا توجد بيانات للتصدير');

    const headers = ['الاسم', 'الهاتف', 'طريقة الدفع', 'الجهاز', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'التاريخ'];
    const rows = data.map(r => [
      r.full_name, r.phone, r.payment_method || '', r.device_type || '',
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

function groupUniqueSessionsByDay(items, field) {
  const groups = {};
  items.forEach(item => {
    const day = item[field]?.slice(0, 10);
    const sid = item.session_id;
    if (!day || !sid) return;
    if (!groups[day]) groups[day] = new Set();
    groups[day].add(sid);
  });
  const counts = {};
  Object.entries(groups).forEach(([day, set]) => {
    counts[day] = set.size;
  });
  return counts;
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

// ---- Event Listeners ----
document.getElementById('login-form').addEventListener('submit', handleLogin);
document.getElementById('logout-btn').addEventListener('click', handleLogout);
document.getElementById('refresh-btn').addEventListener('click', loadAllData);
document.getElementById('date-range').addEventListener('change', loadAllData);
document.getElementById('export-csv').addEventListener('click', exportCSV);
const exportTop = document.getElementById('export-csv-top');
if (exportTop) exportTop.addEventListener('click', exportCSV);
document.getElementById('prev-page').addEventListener('click', () => loadRegistrationsTable(currentPage - 1));
document.getElementById('next-page').addEventListener('click', () => loadRegistrationsTable(currentPage + 1));

// Refresh realtime when returning to the tab (avoids stale "مباشر" until next poll).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && document.getElementById('dashboard').style.display !== 'none') {
    loadRealtimeStats();
  }
});

// ---- Init ----
checkAuth();
