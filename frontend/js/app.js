const API = '/api';
const CAT_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const HEAT_LEVELS = ['var(--heat-0)', '#c7d2fe', '#818cf8', '#6366f1', '#4338ca'];
const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ===================== Theme =====================
function getPreferredTheme() {
    const stored = localStorage.getItem('skillpulse-theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('skillpulse-theme', theme);
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('skillpulse-theme')) applyTheme(e.matches ? 'dark' : 'light');
});

// ===================== State =====================
let skills = [];
let dashboard = {};
let analytics = {};
let activity = [];
let weeklyGoal = 10;
let trendRange = 30;
let filters = { search: '', category: 'All', status: 'all', sort: 'recent' };

// ===================== DOM =====================
const statsContainer = document.getElementById('stats');
const skillsGrid = document.getElementById('skills-grid');
const skillModal = document.getElementById('skill-modal');
const logModal = document.getElementById('log-modal');
const detailModal = document.getElementById('detail-modal');
const skillForm = document.getElementById('skill-form');
const logForm = document.getElementById('log-form');

// ===================== Init =====================
document.addEventListener('DOMContentLoaded', async () => {
    applyTheme(getPreferredTheme());
    setupNav();
    setupTheme();
    setupControls();
    await refreshAll();
});

async function refreshAll() {
    await loadSettings();
    loadDashboard();
    loadAnalytics();
    loadSkills();
    loadActivity();
}

// ===================== Navigation =====================
const VIEW_META = {
    dashboard: { title: 'Dashboard', subtitle: 'Your learning at a glance' },
    skills: { title: 'My Skills', subtitle: 'Everything you are tracking' },
};
function setupNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
}
function switchView(view) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.view === view));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');
    document.getElementById('view-title').textContent = VIEW_META[view].title;
    document.getElementById('view-subtitle').textContent = VIEW_META[view].subtitle;
    document.getElementById('sidebar').classList.remove('open');
}
function setupTheme() {
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
        renderAllCharts();
    });
}
function setupControls() {
    const search = document.getElementById('search-input');
    search.addEventListener('input', () => { filters.search = search.value.trim().toLowerCase(); renderSkills(); });
    document.getElementById('sort-select').addEventListener('change', (e) => { filters.sort = e.target.value; renderSkills(); });
    document.getElementById('status-select').addEventListener('change', (e) => { filters.status = e.target.value; renderSkills(); });

    // Trend range toggle
    document.getElementById('range-toggle').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-range]');
        if (!btn) return;
        trendRange = btn.dataset.range === 'all' ? 'all' : parseInt(btn.dataset.range);
        document.querySelectorAll('#range-toggle button').forEach(b => b.classList.toggle('active', b === btn));
        renderTrend();
    });

    // Editable weekly goal
    document.getElementById('edit-goal-btn').addEventListener('click', editWeeklyGoal);

    // Export dropdown
    const exportBtn = document.getElementById('export-btn');
    const dropdown = document.getElementById('export-dropdown');
    exportBtn.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('open'); });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
}

// ===================== API =====================
async function loadSettings() {
    try {
        const res = await fetch(`${API}/settings`);
        const s = await res.json();
        if (s && s.weekly_goal) weeklyGoal = parseFloat(s.weekly_goal) || 10;
    } catch (err) { console.error('settings:', err); }
}
async function loadDashboard() {
    try { dashboard = await (await fetch(`${API}/dashboard`)).json(); renderStats(); renderInsight(); }
    catch (err) { console.error('dashboard:', err); }
}
async function loadAnalytics() {
    try {
        analytics = await (await fetch(`${API}/analytics`)).json();
        renderStats(); renderInsight(); renderMomentum(); renderAllCharts(); renderBadges();
    } catch (err) { console.error('analytics:', err); }
}
async function loadSkills() {
    try {
        skills = await (await fetch(`${API}/skills`)).json() || [];
        renderChips(); renderSkills(); renderAttention(); renderBadges();
    } catch (err) { console.error('skills:', err); }
}
async function loadActivity() {
    try { activity = await (await fetch(`${API}/activity?limit=8`)).json() || []; renderActivity(); }
    catch (err) { console.error('activity:', err); }
}
async function apiSend(url, method, body) {
    const opts = { method };
    if (body) { opts.headers = { 'Content-Type': 'application/json' }; opts.body = JSON.stringify(body); }
    const res = await fetch(url, opts);
    if (!res.ok) {
        let msg = 'Request failed';
        try { const j = await res.json(); msg = j.error || msg; } catch (_) {}
        throw new Error(msg);
    }
    return res.json();
}
const createSkill = (d) => apiSend(`${API}/skills`, 'POST', d);
const updateSkill = (id, d) => apiSend(`${API}/skills/${id}`, 'PUT', d);
const deleteSkill = (id) => apiSend(`${API}/skills/${id}`, 'DELETE');
const logSession = (id, d) => apiSend(`${API}/skills/${id}/log`, 'POST', d);
const updateLog = (id, d) => apiSend(`${API}/logs/${id}`, 'PUT', d);
const deleteLog = (id) => apiSend(`${API}/logs/${id}`, 'DELETE');
const saveSettings = (d) => apiSend(`${API}/settings`, 'PUT', d);
const getSkillDetail = (id) => fetch(`${API}/skills/${id}`).then(r => r.json());

function renderAllCharts() { renderTrend(); renderDonut(); renderWeekly(); renderDow(); renderHeatmap(); }

// ===================== Stats + insight =====================
const ICONS = {
    skills: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>',
    hours: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    sessions: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    top: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 4H4v2a3 3 0 0 0 3 3M17 4h3v2a3 3 0 0 1-3 3"/></svg>',
};

function renderStats() {
    const tw = weekStats(0), lw = weekStats(1);
    const cards = [
        { label: 'Total Skills', value: dashboard.total_skills || 0, ico: ICONS.skills },
        { label: 'Hours Logged', value: (dashboard.total_hours || 0).toFixed(1), ico: ICONS.hours, delta: deltaTag(tw.hours, lw.hours, 1) },
        { label: 'Sessions', value: dashboard.total_logs || 0, ico: ICONS.sessions, delta: deltaTag(tw.sessions, lw.sessions, 0) },
        { label: 'Top Skill', value: dashboard.top_skill || 'N/A', ico: ICONS.top, text: true },
    ];
    statsContainer.innerHTML = cards.map(c => `
        <div class="stat-card">
            <div class="stat-top">
                <div class="label">${c.label}</div>
                <div class="stat-ico">${c.ico}</div>
            </div>
            <div class="value ${c.text ? 'text' : ''}">${escapeHtml(String(c.value))}</div>
            ${c.delta || ''}
        </div>`).join('');
}

function deltaTag(cur, prev, dp) {
    if (!analytics.daily) return '';
    const d = cur - prev;
    if (Math.abs(d) < (dp ? 0.05 : 0.5)) return `<div class="delta flat">— same as last week</div>`;
    const up = d > 0;
    return `<div class="delta ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(d).toFixed(dp)} vs last week</div>`;
}

function renderInsight() {
    const el = document.getElementById('insight-text');
    if (!el) return;
    const parts = [];
    const streak = analytics.current_streak || 0;
    if (streak > 0) parts.push(`🔥 You're on a <strong>${streak}-day</strong> streak`);
    const tw = weekStats(0).hours;
    const remaining = weeklyGoal - tw;
    if (remaining > 0.05) parts.push(`<strong>${remaining.toFixed(1)} hrs</strong> to hit your weekly goal`);
    else if ((analytics.daily || []).length) parts.push(`weekly goal <strong>smashed</strong> 🎉`);
    if (dashboard.top_skill && dashboard.top_skill !== 'N/A') parts.push(`top focus is <strong>${escapeHtml(dashboard.top_skill)}</strong>`);
    el.innerHTML = parts.length ? parts.join(' · ') : 'Log your first session to start building momentum.';
}

// ===================== Momentum =====================
function renderMomentum() {
    document.getElementById('current-streak').textContent = analytics.current_streak || 0;
    document.getElementById('longest-streak').textContent = analytics.longest_streak || 0;
    const wk = weekStats(0).hours;
    document.getElementById('week-hours').textContent = wk.toFixed(1);
    document.getElementById('week-goal').textContent = weeklyGoal;
    document.getElementById('week-fill').style.width = Math.min((wk / weeklyGoal) * 100, 100) + '%';
}

async function editWeeklyGoal() {
    const next = prompt('Set your weekly hours goal:', weeklyGoal);
    if (next === null) return;
    const val = parseFloat(next);
    if (isNaN(val) || val <= 0) { showToast('Enter a positive number', 'error'); return; }
    try {
        await saveSettings({ weekly_goal: String(val) });
        weeklyGoal = val;
        renderMomentum(); renderInsight();
        showToast('Weekly goal updated!');
    } catch (err) { showToast('Failed to update goal', 'error'); }
}

// ===================== Trend chart =====================
function renderTrend() {
    const wrap = document.getElementById('trend-chart');
    const days = trendRange === 'all' ? allDays() : lastNDays(trendRange);
    const map = dailyMap();
    const data = days.map(d => map[d] || 0);
    if (!days.length || data.every(v => v === 0)) { wrap.innerHTML = emptyMini('No sessions in this range'); return; }

    const max = Math.max(1, ...data);
    const W = 600, H = 200, padY = 10;
    const step = data.length > 1 ? W / (data.length - 1) : W;
    const y = (v) => H - padY - (v / max) * (H - padY * 2);
    const pts = data.map((v, i) => [data.length > 1 ? i * step : W / 2, y(v)]);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area = `${line} L${W},${H} L0,${H} Z`;
    const accent = '#6366f1';

    // gridlines + hover hit areas
    const grid = [0, 0.5, 1].map(f => {
        const gy = padY + f * (H - padY * 2);
        return `<line x1="0" y1="${gy}" x2="${W}" y2="${gy}" stroke="var(--grid-line)" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
    }).join('');
    const hits = data.map((v, i) => {
        const x = (data.length > 1 ? i * step : W / 2) - step / 2;
        return `<rect class="chart-hit" x="${x.toFixed(1)}" y="0" width="${step.toFixed(1)}" height="${H}"><title>${days[i]} — ${v.toFixed(1)}h</title></rect>`;
    }).join('');

    wrap.innerHTML = `
        <div class="chart-ymax">${(max).toFixed(max % 1 ? 1 : 0)}h</div>
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
            <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
            </linearGradient></defs>
            ${grid}
            <path d="${area}" fill="url(#trendFill)"/>
            <path d="${line}" fill="none" stroke="${accent}" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>
            ${hits}
        </svg>
        <div class="chart-x"><span>${formatShort(days[0])}</span><span>${formatShort(days[days.length - 1])}</span></div>`;
}

// ===================== Donut =====================
function renderDonut() {
    const wrap = document.getElementById('donut-chart');
    const cats = analytics.categories || [];
    if (!cats.length) { wrap.innerHTML = emptyMini('Log sessions to see a breakdown'); return; }
    const total = cats.reduce((s, c) => s + c.hours, 0);
    const r = 60, cx = 70, cy = 70, circ = 2 * Math.PI * r;
    let offset = 0;
    const segments = cats.map((c, i) => {
        const frac = c.hours / total;
        const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${CAT_COLORS[i % CAT_COLORS.length]}" stroke-width="18"
            stroke-dasharray="${(frac * circ).toFixed(2)} ${circ.toFixed(2)}" stroke-dashoffset="${(-offset * circ).toFixed(2)}"
            transform="rotate(-90 ${cx} ${cy})"><title>${escapeHtml(c.category)}: ${c.hours.toFixed(1)}h</title></circle>`;
        offset += frac; return seg;
    }).join('');
    const legend = cats.map((c, i) => `
        <div class="legend-item">
            <span class="legend-dot" style="background:${CAT_COLORS[i % CAT_COLORS.length]}"></span>
            <span>${escapeHtml(c.category)}</span>
            <span class="legend-hrs">${c.hours.toFixed(1)}h</span>
        </div>`).join('');
    wrap.innerHTML = `
        <svg class="donut-svg" viewBox="0 0 140 140">${segments}
            <text x="70" y="66" text-anchor="middle" font-size="22" font-weight="800" fill="var(--text)">${total.toFixed(0)}</text>
            <text x="70" y="84" text-anchor="middle" font-size="10" fill="var(--text-muted)">hours</text>
        </svg>
        <div class="legend">${legend}</div>`;
}

// ===================== Weekly bars =====================
function renderWeekly() {
    const wrap = document.getElementById('weekly-chart');
    const weeks = 8, map = dailyMap();
    const mon = mondayOf(new Date());
    const bars = [];
    for (let i = weeks - 1; i >= 0; i--) {
        const start = new Date(mon); start.setDate(mon.getDate() - 7 * i);
        let sum = 0;
        for (let d = 0; d < 7; d++) { const c = new Date(start); c.setDate(start.getDate() + d); sum += map[dateKey(c)] || 0; }
        bars.push({ label: `${start.getMonth() + 1}/${start.getDate()}`, hours: sum });
    }
    if (bars.every(b => b.hours === 0)) { wrap.innerHTML = emptyMini('No weekly data yet'); return; }
    const max = Math.max(1, ...bars.map(b => b.hours));
    wrap.innerHTML = `<div class="bars">${bars.map(b => `
        <div class="bar-col" title="Week of ${b.label}: ${b.hours.toFixed(1)}h">
            <div class="bar" style="height:${(b.hours / max) * 100}%"></div>
            <span class="bar-lbl">${b.label}</span>
        </div>`).join('')}</div>`;
}

// ===================== Day of week =====================
function renderDow() {
    const wrap = document.getElementById('dow-chart');
    const totals = [0, 0, 0, 0, 0, 0, 0]; // Mon..Sun
    (analytics.daily || []).forEach(d => {
        const wd = (new Date(d.date + 'T00:00:00').getDay() + 6) % 7;
        totals[wd] += d.hours;
    });
    if (totals.every(t => t === 0)) { wrap.innerHTML = emptyMini('No data yet'); document.getElementById('dow-best').textContent = ''; return; }
    const max = Math.max(1, ...totals);
    const bestIdx = totals.indexOf(Math.max(...totals));
    document.getElementById('dow-best').textContent = `best: ${DOW_LABELS[bestIdx]}`;
    wrap.innerHTML = `<div class="bars">${totals.map((t, i) => `
        <div class="bar-col" title="${DOW_LABELS[i]}: ${t.toFixed(1)}h">
            <div class="bar ${i === bestIdx ? 'bar-best' : ''}" style="height:${(t / max) * 100}%"></div>
            <span class="bar-lbl">${DOW_LABELS[i][0]}</span>
        </div>`).join('')}</div>`;
}

// ===================== Heatmap =====================
function renderHeatmap() {
    const wrap = document.getElementById('heatmap');
    const weeks = 17, map = dailyMap();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() - (weeks - 1) * 7);
    let html = '';
    for (let w = 0; w < weeks; w++) {
        html += '<div class="heat-col">';
        for (let d = 0; d < 7; d++) {
            const cell = new Date(start); cell.setDate(start.getDate() + w * 7 + d);
            if (cell > today) { html += '<div class="heat-cell" style="visibility:hidden"></div>'; continue; }
            const hrs = map[dateKey(cell)] || 0;
            const lvl = hrs === 0 ? 0 : hrs < 1 ? 1 : hrs < 2 ? 2 : hrs < 4 ? 3 : 4;
            html += `<div class="heat-cell" style="background:${HEAT_LEVELS[lvl]}" title="${dateKey(cell)} — ${hrs.toFixed(1)}h"></div>`;
        }
        html += '</div>';
    }
    wrap.innerHTML = html;
}

// ===================== Achievements =====================
function renderBadges() {
    const el = document.getElementById('badges');
    if (!el) return;
    const hrs = dashboard.total_hours || 0, sk = dashboard.total_skills || 0, logs = dashboard.total_logs || 0;
    const longest = analytics.longest_streak || 0;
    const goalReached = skills.some(s => s.target_hours > 0 && s.total_hours >= s.target_hours);
    const badges = [
        { icon: '🌱', label: 'First Steps', desc: 'Log your first session', earned: logs >= 1 },
        { icon: '⏱️', label: '10 Hours', desc: 'Reach 10 total hours', earned: hrs >= 10 },
        { icon: '🎯', label: 'Goal Getter', desc: 'Hit a skill target', earned: goalReached },
        { icon: '🔥', label: 'Week Warrior', desc: '7-day streak', earned: longest >= 7 },
        { icon: '📚', label: 'Polyglot', desc: 'Track 5 skills', earned: sk >= 5 },
        { icon: '💪', label: '50 Hours', desc: 'Reach 50 total hours', earned: hrs >= 50 },
        { icon: '🏆', label: 'Century', desc: 'Reach 100 total hours', earned: hrs >= 100 },
        { icon: '🗓️', label: 'Consistent', desc: '30-day streak', earned: longest >= 30 },
    ];
    const earned = badges.filter(b => b.earned).length;
    document.getElementById('badge-count').textContent = `${earned} / ${badges.length} unlocked`;
    el.innerHTML = badges.map(b => `
        <div class="badge ${b.earned ? 'earned' : 'locked'}" title="${b.desc}">
            <span class="badge-ico">${b.icon}</span>
            <span class="badge-label">${b.label}</span>
        </div>`).join('');
}

// ===================== Recent activity =====================
function renderActivity() {
    const el = document.getElementById('activity-list');
    if (!activity.length) { el.innerHTML = emptyMini('No sessions logged yet'); return; }
    el.innerHTML = activity.map(a => `
        <div class="activity-item" onclick="openDetail(${a.skill_id})">
            <span class="activity-hrs">${a.hours.toFixed(1)}h</span>
            <div class="activity-body">
                <div class="activity-skill">${escapeHtml(a.skill_name)}</div>
                <div class="activity-meta">${formatShort(a.log_date)}${a.notes ? ' · ' + escapeHtml(a.notes) : ''}</div>
            </div>
        </div>`).join('');
}

// ===================== Needs attention =====================
function renderAttention() {
    const el = document.getElementById('attention-list');
    const stale = skills
        .filter(s => s.status !== 'completed')
        .map(s => ({ s, days: s.last_logged ? daysSince(s.last_logged) : Infinity }))
        .filter(x => x.days >= 14)
        .sort((a, b) => b.days - a.days)
        .slice(0, 6);
    if (!stale.length) { el.innerHTML = `<div class="all-good">✅ All caught up — nothing stale!</div>`; return; }
    el.innerHTML = stale.map(({ s, days }) => `
        <div class="attention-item">
            <div class="attention-body">
                <div class="activity-skill">${escapeHtml(s.name)}</div>
                <div class="activity-meta">${days === Infinity ? 'never logged' : days + ' days ago'}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="openLogModal(${s.id}, '${escapeAttr(s.name)}')">+ Log</button>
        </div>`).join('');
}

// ===================== Skills grid =====================
function renderChips() {
    const cats = Array.from(new Set(skills.map(s => s.category).filter(Boolean))).sort();
    const all = ['All', ...cats];
    const el = document.getElementById('category-chips');
    el.innerHTML = all.map(c =>
        `<button class="chip ${filters.category === c ? 'active' : ''}" data-cat="${escapeAttr(c)}">${escapeHtml(c)}</button>`
    ).join('');
    el.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            filters.category = chip.dataset.cat;
            el.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === chip));
            renderSkills();
        });
    });
}

function visibleSkills() {
    let list = skills.filter(s => {
        const matchCat = filters.category === 'All' || s.category === filters.category;
        const matchStatus = filters.status === 'all' || s.status === filters.status;
        const matchSearch = !filters.search ||
            s.name.toLowerCase().includes(filters.search) ||
            (s.category || '').toLowerCase().includes(filters.search);
        return matchCat && matchStatus && matchSearch;
    });
    const prog = (s) => s.target_hours > 0 ? s.total_hours / s.target_hours : -1;
    const sorters = {
        recent: (a, b) => b.id - a.id,
        hours: (a, b) => b.total_hours - a.total_hours,
        progress: (a, b) => prog(b) - prog(a),
        name: (a, b) => a.name.localeCompare(b.name),
    };
    return list.sort(sorters[filters.sort] || sorters.recent);
}

function renderSkills() {
    const list = visibleSkills();
    if (!list.length) {
        const blank = skills.length === 0;
        skillsGrid.innerHTML = `
            <div class="empty-state">
                <span class="empty-ico">${blank ? '🌱' : '🔍'}</span>
                <h3>${blank ? 'No skills yet' : 'Nothing matches'}</h3>
                <p>${blank ? 'Click "Add Skill" to start tracking your learning journey.' : 'Try a different search, status or category filter.'}</p>
            </div>`;
        return;
    }
    skillsGrid.innerHTML = list.map((skill, i) => {
        const progress = skill.target_hours > 0 ? Math.min((skill.total_hours / skill.target_hours) * 100, 100) : 0;
        return `
            <div class="skill-card" style="animation-delay:${i * 0.03}s" onclick="openDetail(${skill.id})">
                <div class="skill-header">
                    <span class="skill-name">${escapeHtml(skill.name)}</span>
                    <div class="skill-badges">
                        <span class="status-pill st-${skill.status || 'active'}">${skill.status || 'active'}</span>
                        ${skill.category ? `<span class="skill-category">${escapeHtml(skill.category)}</span>` : ''}
                    </div>
                </div>
                <div class="progress-bar"><div class="fill" style="width:${progress}%"></div></div>
                <div class="progress-text">
                    <span>${skill.total_hours.toFixed(1)} hrs logged</span>
                    <span>${skill.target_hours > 0 ? skill.target_hours + ' hrs goal' : 'No goal'}</span>
                </div>
                <div class="skill-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-primary btn-sm" onclick="openLogModal(${skill.id}, '${escapeAttr(skill.name)}')">+ Log</button>
                    <button class="btn btn-secondary btn-sm" onclick="openEditSkill(${skill.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="handleDeleteSkill(${skill.id})">Delete</button>
                </div>
            </div>`;
    }).join('');
}

// ===================== Skill modal =====================
function openAddModal() {
    skillForm.reset();
    document.getElementById('skill-id').value = '';
    document.getElementById('skill-status').value = 'active';
    document.getElementById('skill-modal-title').textContent = 'Add a New Skill';
    document.getElementById('skill-submit').textContent = 'Add Skill';
    skillModal.classList.add('active');
}
function openEditSkill(id) {
    const s = skills.find(x => x.id === id);
    if (!s) return;
    document.getElementById('skill-id').value = s.id;
    document.getElementById('skill-name').value = s.name;
    document.getElementById('skill-category').value = s.category || '';
    document.getElementById('skill-target').value = s.target_hours || '';
    document.getElementById('skill-status').value = s.status || 'active';
    document.getElementById('skill-modal-title').textContent = 'Edit Skill';
    document.getElementById('skill-submit').textContent = 'Save Changes';
    skillModal.classList.add('active');
}
function closeSkillModal() { skillModal.classList.remove('active'); }

skillForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('skill-id').value;
    const data = {
        name: document.getElementById('skill-name').value,
        category: document.getElementById('skill-category').value,
        target_hours: parseInt(document.getElementById('skill-target').value) || 0,
        status: document.getElementById('skill-status').value,
    };
    try {
        if (id) { await updateSkill(id, data); showToast('Skill updated!'); }
        else { await createSkill(data); showToast('Skill added!'); }
        closeSkillModal();
        refreshAll();
        if (detailModal.classList.contains('active') && currentDetailId) openDetail(currentDetailId);
    } catch (err) { showToast(err.message || 'Failed to save skill', 'error'); }
});

// ===================== Log modal =====================
let currentLogSkillId = null;
function openLogModal(skillId, skillName) {
    currentLogSkillId = skillId;
    logForm.reset();
    document.getElementById('log-id').value = '';
    document.getElementById('log-modal-title').innerHTML = 'Log Session: <span>' + escapeHtml(skillName) + '</span>';
    document.getElementById('log-date').value = todayKey();
    document.getElementById('log-submit').textContent = 'Log Session';
    logModal.classList.add('active');
}
function openEditLogById(logId) {
    const log = detailLogs.find(l => l.id === logId);
    if (log) openEditLog(log);
}
function openEditLog(log) {
    currentLogSkillId = null;
    document.getElementById('log-id').value = log.id;
    document.getElementById('log-modal-title').textContent = 'Edit Session';
    document.getElementById('log-hours').value = log.hours;
    document.getElementById('log-date').value = log.log_date;
    document.getElementById('log-notes').value = log.notes || '';
    document.getElementById('log-submit').textContent = 'Save Changes';
    logModal.classList.add('active');
}
function closeLogModal() { logModal.classList.remove('active'); currentLogSkillId = null; }

logForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const logId = document.getElementById('log-id').value;
    const data = {
        hours: parseFloat(document.getElementById('log-hours').value),
        notes: document.getElementById('log-notes').value,
        log_date: document.getElementById('log-date').value,
    };
    try {
        if (logId) { await updateLog(logId, data); showToast('Session updated!'); }
        else { await logSession(currentLogSkillId, data); showToast('Session logged!'); }
        closeLogModal();
        refreshAll();
        if (detailModal.classList.contains('active') && currentDetailId) openDetail(currentDetailId);
    } catch (err) { showToast(err.message || 'Failed to save session', 'error'); }
});

// ===================== Detail modal =====================
let currentDetailId = null;
let detailLogs = [];
async function openDetail(id) {
    currentDetailId = id;
    try {
        const { skill, logs } = await getSkillDetail(id);
        if (!skill) throw new Error('not found');
        detailLogs = logs || [];
        document.getElementById('detail-name').textContent = skill.name;
        const catEl = document.getElementById('detail-category');
        catEl.textContent = (skill.status || 'active') + (skill.category ? ' · ' + skill.category : '');
        const progress = skill.target_hours > 0 ? Math.min((skill.total_hours / skill.target_hours) * 100, 100) : 0;
        document.getElementById('detail-fill').style.width = progress + '%';
        document.getElementById('detail-hours').textContent = `${skill.total_hours.toFixed(1)} hrs logged`;
        document.getElementById('detail-goal').textContent = skill.target_hours > 0 ? `${skill.target_hours} hrs goal` : 'No goal set';
        document.getElementById('detail-add-log').onclick = () => openLogModal(skill.id, skill.name);
        document.getElementById('detail-edit-skill').onclick = () => openEditSkill(skill.id);

        const listEl = document.getElementById('detail-logs');
        if (!detailLogs.length) {
            listEl.innerHTML = `<div class="empty-state" style="padding:1.5rem"><p>No sessions yet. Log your first one!</p></div>`;
        } else {
            listEl.innerHTML = detailLogs.map(l => `
                <div class="log-item">
                    <div class="log-hours">${l.hours.toFixed(1)}h</div>
                    <div class="log-body">
                        <div class="log-date">${formatDate(l.log_date)}</div>
                        ${l.notes ? `<div class="log-notes">${escapeHtml(l.notes)}</div>` : ''}
                    </div>
                    <div class="log-ops">
                        <button class="btn btn-ghost btn-sm" title="Edit" onclick="openEditLogById(${l.id})">✏️</button>
                        <button class="btn btn-ghost btn-sm" title="Delete" onclick="handleDeleteLog(${l.id})">🗑️</button>
                    </div>
                </div>`).join('');
        }
        detailModal.classList.add('active');
    } catch (err) { showToast('Failed to load skill', 'error'); }
}
function closeDetailModal() { detailModal.classList.remove('active'); currentDetailId = null; }

async function handleDeleteLog(id) {
    if (!confirm('Delete this session?')) return;
    try { await deleteLog(id); showToast('Session deleted'); refreshAll(); if (currentDetailId) openDetail(currentDetailId); }
    catch (err) { showToast('Failed to delete session', 'error'); }
}
async function handleDeleteSkill(id) {
    if (!confirm('Delete this skill and all its logs?')) return;
    try { await deleteSkill(id); showToast('Skill deleted'); if (currentDetailId === id) closeDetailModal(); refreshAll(); }
    catch (err) { showToast('Failed to delete skill', 'error'); }
}

// ===================== Utilities =====================
function dateKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function todayKey() { return dateKey(new Date()); }
function lastNDays(n) {
    const out = [], today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = n - 1; i >= 0; i--) { const d = new Date(today); d.setDate(today.getDate() - i); out.push(dateKey(d)); }
    return out;
}
function allDays() {
    const daily = analytics.daily || [];
    if (!daily.length) return lastNDays(30);
    const first = new Date(daily[0].date + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const out = [];
    for (let d = new Date(first); d <= today; d.setDate(d.getDate() + 1)) out.push(dateKey(d));
    return out.length ? out : lastNDays(30);
}
function dailyMap() { const m = {}; (analytics.daily || []).forEach(d => { m[d.date] = d.hours; }); return m; }
function mondayOf(date) { const d = new Date(date); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }
function weekStats(weeksAgo) {
    const start = mondayOf(new Date()); start.setDate(start.getDate() - 7 * weeksAgo);
    const end = new Date(start); end.setDate(start.getDate() + 7);
    let hours = 0, sessions = 0;
    (analytics.daily || []).forEach(d => {
        const t = new Date(d.date + 'T00:00:00');
        if (t >= start && t < end) { hours += d.hours; sessions += d.sessions || 0; }
    });
    return { hours, sessions };
}
function daysSince(dateStr) {
    const d = new Date(dateStr + 'T00:00:00'), today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.floor((today - d) / 86400000);
}
function formatDate(s) {
    const d = new Date(s + 'T00:00:00');
    return isNaN(d) ? s : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatShort(s) {
    const d = new Date(s + 'T00:00:00');
    return isNaN(d) ? s : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function emptyMini(msg) {
    return `<div style="display:grid;place-items:center;height:100%;min-height:80px;color:var(--text-muted);font-size:0.85rem;text-align:center;">${msg}</div>`;
}
function escapeHtml(str) { const div = document.createElement('div'); div.textContent = str == null ? '' : str; return div.innerHTML; }
function escapeAttr(str) { return escapeHtml(str).replace(/'/g, '&#39;'); }
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Close modals on backdrop click / Escape
document.querySelectorAll('.modal-backdrop').forEach(el => {
    el.addEventListener('click', (e) => { if (e.target === el) el.classList.remove('active'); });
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
});
