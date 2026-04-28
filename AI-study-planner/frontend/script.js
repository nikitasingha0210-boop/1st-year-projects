/* ═══════════════════════════════════════════════
   AI STUDY PLANNER — script.js
   (No changes required for typography update)
═══════════════════════════════════════════════ */

let state = {
  user: null,
  subjects: [],
  tasks: [],
  plannerTasks: [],
  goals: [],
};

function loadState() {
  const saved = localStorage.getItem('studyai_state');
  if (saved) state = JSON.parse(saved);
}
function saveState() {
  localStorage.setItem('studyai_state', JSON.stringify(state));
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + id);
  if (target) target.classList.add('active');
  if (id === 'app') initApp();
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('form-' + tab).classList.add('active');
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value.trim();
  if (!email || !pass) return alert('Please enter email and password.');
  if (!state.user) {
    state.user = { name: email.split('@')[0], email, hoursGoal: 4 };
    saveState();
  }
  showPage('app');
}

function doSignup() {
  const name  = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass  = document.getElementById('signup-pass').value.trim();
  if (!name || !email || !pass) return alert('Please fill all fields.');
  state.user = { name, email, hoursGoal: 4 };
  saveState();
  showPage('setup');
  renderSetupTags();
}

function doLogout() { showPage('landing'); }

function setupAddSubject() {
  const input = document.getElementById('setup-subject-input');
  const val   = input.value.trim();
  if (!val) return;
  if (state.subjects.map(s => s.toLowerCase()).includes(val.toLowerCase())) {
    input.value = ''; return alert('That subject is already added!');
  }
  state.subjects.push(val);
  saveState();
  input.value = '';
  renderSetupTags();
  updateSetupContinueBtn();
}

function renderSetupTags() {
  const container = document.getElementById('setup-tags');
  const emptyHint = document.getElementById('setup-empty-hint');
  if (!container) return;
  if (state.subjects.length === 0) {
    container.innerHTML = '';
    if (emptyHint) emptyHint.style.display = 'block';
  } else {
    if (emptyHint) emptyHint.style.display = 'none';
    container.innerHTML = state.subjects.map(s => `
      <span class="subject-tag">
        ${escHtml(s)}
        <button class="subject-tag-del" onclick="setupRemoveSubject('${escHtml(s)}')" title="Remove">✕</button>
      </span>`).join('');
  }
  updateSetupContinueBtn();
}

function setupRemoveSubject(name) {
  state.subjects = state.subjects.filter(s => s !== name);
  saveState();
  renderSetupTags();
}

function updateSetupContinueBtn() {
  const btn = document.getElementById('setup-continue-btn');
  if (btn) btn.disabled = state.subjects.length === 0;
}

function finishSetup() { showPage('app'); }
function skipSetup()   { showPage('app'); }

function initApp() {
  updateTopbar();
  renderDashboard();
  renderSubjectTags();
  renderSubjectDropdowns();
  renderPlanner();
  renderTasks();
  renderGoals();
  renderProgress();
  renderAISubjectPreview();
  checkSubjectWarnings();
}

function updateTopbar() {
  if (!state.user) return;
  const initial = (state.user.name || 'U')[0].toUpperCase();
  document.getElementById('topbar-avatar').textContent = initial;
  document.getElementById('dash-welcome').textContent  = `Hi, ${state.user.name} 👋`;
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('active');
}

const SECTION_LABELS = {
  dashboard:'Dashboard', planner:'Planner', 'ai-planner':'AI Planner',
  tasks:'Tasks', progress:'Progress', goals:'Goals', profile:'Profile'
};

function switchSection(id) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.section === id));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('section-' + id);
  if (target) target.classList.add('active');
  document.getElementById('topbar-title').textContent = SECTION_LABELS[id] || id;
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
  if (id === 'dashboard')  renderDashboard();
  if (id === 'planner')    { renderPlanner(); checkSubjectWarnings(); }
  if (id === 'ai-planner') { renderAISubjectPreview(); checkSubjectWarnings(); }
  if (id === 'tasks')      { renderTasks(); checkSubjectWarnings(); }
  if (id === 'progress')   renderProgress();
  if (id === 'goals')      renderGoals();
  if (id === 'profile')    renderProfile();
}

function checkSubjectWarnings() {
  const noSubs = state.subjects.length === 0;
  const t = id => { const el = document.getElementById(id); if (el) el.classList.toggle('hidden', !noSubs); };
  t('dash-no-subjects-banner');
  t('planner-no-subject-warn');
  t('ai-no-subject-warn');
  t('tasks-no-subject-warn');
}

function quickAddSubject(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const val = input.value.trim();
  if (!val) return alert('Please type a subject name.');
  if (state.subjects.map(s => s.toLowerCase()).includes(val.toLowerCase())) {
    input.value = ''; return alert('That subject already exists!');
  }
  state.subjects.push(val);
  saveState();
  input.value = '';
  renderSubjectTags();
  renderSubjectDropdowns();
  renderAISubjectPreview();
  checkSubjectWarnings();
}

function addSubject() {
  const input = document.getElementById('subject-input');
  const val   = input.value.trim();
  if (!val) return;
  if (state.subjects.map(s => s.toLowerCase()).includes(val.toLowerCase())) {
    input.value = ''; return alert('That subject is already added!');
  }
  state.subjects.push(val);
  saveState();
  input.value = '';
  renderSubjectTags();
  renderSubjectDropdowns();
  renderAISubjectPreview();
  checkSubjectWarnings();
}

function removeSubject(name) {
  state.subjects = state.subjects.filter(s => s !== name);
  saveState();
  renderSubjectTags();
  renderSubjectDropdowns();
  renderAISubjectPreview();
  checkSubjectWarnings();
}

function clearAllSubjects() {
  if (!confirm('Remove ALL subjects? This cannot be undone.')) return;
  state.subjects = [];
  saveState();
  renderSubjectTags();
  renderSubjectDropdowns();
  renderAISubjectPreview();
  checkSubjectWarnings();
}

function renderSubjectTags() {
  const container  = document.getElementById('subject-tags');
  const countLabel = document.getElementById('subject-count-label');
  const clearBtn   = document.getElementById('clear-all-btn');
  if (!container) return;
  const count = state.subjects.length;
  if (countLabel) countLabel.textContent = `${count} subject${count !== 1 ? 's' : ''} added`;
  if (clearBtn) clearBtn.style.display = count > 0 ? 'inline-block' : 'none';
  if (count === 0) {
    container.innerHTML = `<div class="empty-state" style="width:100%;padding:16px">
      No subjects yet. Type one above and click "+ Add Subject"!</div>`;
    return;
  }
  container.innerHTML = state.subjects.map(s => `
    <span class="subject-tag">
      ${escHtml(s)}
      <button class="subject-tag-del" onclick="removeSubject('${escHtml(s)}')" title="Remove">✕</button>
    </span>`).join('');
}

function renderSubjectDropdowns() {
  ['plan-subject','task-subject'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = state.subjects.length
      ? state.subjects.map(s => `<option value="${escHtml(s)}">${escHtml(s)}</option>`).join('')
      : '<option value="">— No subjects yet —</option>';
  });
}

function renderDashboard() {
  const total = state.tasks.length;
  const done  = state.tasks.filter(t => t.done).length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('stat-done').textContent    = done;
  document.getElementById('stat-pending').textContent = total - done;
  document.getElementById('stat-goals').textContent   = state.goals.filter(g => !g.done).length;
  document.getElementById('stat-hours').textContent   = (state.user?.hoursGoal || 0) + 'h';
  document.getElementById('dash-pct').textContent           = pct + '%';
  document.getElementById('dash-progress-bar').style.width  = pct + '%';
  const today      = new Date().toISOString().slice(0,10);
  const todayTasks = state.tasks.filter(t => t.due === today);
  const dashList   = document.getElementById('dash-tasks-list');
  dashList.innerHTML = todayTasks.length
    ? todayTasks.map(t => `
        <div class="dash-task-item ${t.done ? 'done' : ''}">
          <div class="dash-task-dot" style="${t.done ? 'background:var(--success)' : ''}"></div>
          <span>${escHtml(t.name)}</span>
          <span class="task-tag">${escHtml(t.subject)}</span>
        </div>`).join('')
    : '<div class="empty-state" style="padding:14px">No tasks due today 🎉</div>';
  document.getElementById('dash-subject-progress').innerHTML = state.subjects.map(s => {
    const st = state.tasks.filter(t => t.subject === s);
    const sd = st.filter(t => t.done).length;
    const sp = st.length ? Math.round((sd / st.length) * 100) : 0;
    return `<div class="subj-progress-item">
      <div class="subj-prog-label"><span>${escHtml(s)}</span><span>${sp}%</span></div>
      <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${sp}%"></div></div>
    </div>`;
  }).join('');
  checkSubjectWarnings();
}

function addPlannerTask() {
  const name    = document.getElementById('plan-task').value.trim();
  const subject = document.getElementById('plan-subject').value;
  const date    = document.getElementById('plan-date').value;
  if (!name || !date) return alert('Enter task name and date.');
  if (!subject || subject === '— No subjects yet —') return alert('Add a subject first!');
  state.plannerTasks.push({ id: uid(), name, subject, date });
  saveState();
  document.getElementById('plan-task').value = '';
  renderPlanner();
}

function deletePlannerTask(id) {
  state.plannerTasks = state.plannerTasks.filter(t => t.id !== id);
  saveState(); renderPlanner();
}

function renderPlanner() {
  const grid = document.getElementById('calendar-grid');
  if (!grid) return;
  const today  = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  grid.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const d       = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso     = d.toISOString().slice(0,10);
    const isToday = iso === today.toISOString().slice(0,10);
    const dt      = state.plannerTasks.filter(t => t.date === iso);
    const cell    = document.createElement('div');
    cell.className = 'cal-day' + (isToday ? ' today' : '');
    cell.innerHTML = `
      <div class="cal-day-name">${days[i]}</div>
      <div class="cal-day-num">${d.getDate()}</div>
      ${dt.map(t => `
        <div class="cal-task">
          <span>${escHtml(t.name)} <span class="ai-tag">${escHtml(t.subject)}</span></span>
          <button class="cal-task-del" onclick="deletePlannerTask('${t.id}')">✕</button>
        </div>`).join('')}`;
    grid.appendChild(cell);
  }
}

function renderAISubjectPreview() {
  const el = document.getElementById('ai-subjects-preview');
  if (!el) return;
  el.innerHTML = state.subjects.length
    ? state.subjects.map(s => `<span class="subject-tag">${escHtml(s)}</span>`).join('')
    : '<span style="color:var(--text-muted);font-size:0.83rem">No subjects added yet.</span>';
}

function generateAIPlan() {
  const hours    = parseInt(document.getElementById('ai-hours').value) || 4;
  const examDate = document.getElementById('ai-exam-date').value;
  const subjects = state.subjects;
  if (!examDate)             return alert('Please select an exam date.');
  if (subjects.length === 0) return alert('Add at least one subject first!');
  const today    = new Date();
  const exam     = new Date(examDate);
  const daysLeft = Math.max(1, Math.ceil((exam - today) / 864e5));
  const perSubj  = Math.max(1, Math.floor((daysLeft * hours) / subjects.length));
  const rows = [];
  let cur = new Date(today), sIdx = 0, sHrsLeft = perSubj;
  for (let d = 0; d < Math.min(daysLeft, 30); d++) {
    const dateStr  = cur.toLocaleDateString('en-GB', { weekday:'short', month:'short', day:'numeric' });
    let remaining  = hours;
    const sessions = [];
    while (remaining > 0 && sIdx < subjects.length) {
      const chunk = Math.min(remaining, sHrsLeft, 2);
      sessions.push({ subject: subjects[sIdx], hours: chunk });
      remaining -= chunk; sHrsLeft -= chunk;
      if (sHrsLeft <= 0) { sIdx++; sHrsLeft = perSubj; }
    }
    rows.push({ date: dateStr, sessions });
    cur.setDate(cur.getDate() + 1);
  }
  const output = document.getElementById('ai-output');
  output.classList.remove('hidden');
  output.innerHTML = `
    <h2>📋 Your ${daysLeft}-Day Study Plan</h2>
    <p>${hours}h/day · ${subjects.length} subjects · Exam on ${new Date(examDate).toLocaleDateString()}</p>
    <div style="overflow-x:auto">
      <table class="ai-plan-table">
        <thead><tr><th>Date</th><th>Sessions</th><th>Total</th></tr></thead>
        <tbody>${rows.map(r => `
          <tr>
            <td>${r.date}</td>
            <td>${r.sessions.map(s => `<span class="ai-tag">${escHtml(s.subject)} (${s.hours}h)</span>`).join(' ')}</td>
            <td>${r.sessions.reduce((a,s) => a + s.hours, 0)}h</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function addTask() {
  const name    = document.getElementById('task-name').value.trim();
  const subject = document.getElementById('task-subject').value;
  const due     = document.getElementById('task-due').value;
  if (!name) return alert('Enter a task name.');
  if (!subject || subject === '— No subjects yet —') return alert('Add a subject first!');
  state.tasks.push({ id: uid(), name, subject, due, done: false });
  saveState();
  document.getElementById('task-name').value = '';
  renderTasks(); renderDashboard();
}

function toggleTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; saveState(); }
  renderTasks(); renderDashboard(); renderProgress();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState(); renderTasks(); renderDashboard(); renderProgress();
}

function renderTasks() {
  const list = document.getElementById('task-list');
  if (!list) return;
  if (state.tasks.length === 0) { list.innerHTML = '<div class="empty-state">No tasks yet. Add one above!</div>'; return; }
  list.innerHTML = state.tasks.map(t => `
    <div class="task-item ${t.done ? 'done' : ''}">
      <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask('${t.id}')" />
      <div class="task-info">
        <div class="task-name-text">${escHtml(t.name)}</div>
        <div class="task-meta">
          <span class="task-tag">${escHtml(t.subject)}</span>
          ${t.due ? `<span class="task-due">📅 ${t.due}</span>` : ''}
        </div>
      </div>
      <button class="btn-danger" onclick="deleteTask('${t.id}')">Delete</button>
    </div>`).join('');
}

function renderProgress() {
  const total = state.tasks.length;
  const done  = state.tasks.filter(t => t.done).length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const el    = id => document.getElementById(id);
  if (el('prog-completion')) el('prog-completion').textContent = pct + '%';
  if (el('prog-bar'))        el('prog-bar').style.width        = pct + '%';
  if (el('prog-done-count')) el('prog-done-count').textContent = done + ' done';
  if (el('prog-pending-count')) el('prog-pending-count').textContent = (total - done) + ' pending';
  const chart = el('subject-progress-chart');
  if (!chart) return;
  if (state.subjects.length === 0) { chart.innerHTML = '<div class="empty-state" style="padding:14px">Add subjects in Profile to see breakdown</div>'; return; }
  chart.innerHTML = state.subjects.map(s => {
    const st = state.tasks.filter(t => t.subject === s);
    const sd = st.filter(t => t.done).length;
    const sp = st.length ? Math.round((sd / st.length) * 100) : 0;
    return `<div class="subj-bar-wrap">
      <div class="subj-bar-label"><span>${escHtml(s)}</span><span style="color:var(--accent2)">${sd}/${st.length}</span></div>
      <div class="subj-bar-track"><div class="subj-bar-fill" style="width:${sp}%"></div></div>
    </div>`;
  }).join('');
}

function addGoal() {
  const input = document.getElementById('goal-input');
  const text  = input.value.trim();
  if (!text) return;
  state.goals.push({ id: uid(), text, done: false });
  saveState(); input.value = '';
  renderGoals(); renderDashboard();
}

function toggleGoal(id) {
  const g = state.goals.find(g => g.id === id);
  if (g) { g.done = !g.done; saveState(); }
  renderGoals(); renderDashboard();
}

function deleteGoal(id) {
  state.goals = state.goals.filter(g => g.id !== id);
  saveState(); renderGoals(); renderDashboard();
}

function renderGoals() {
  const list = document.getElementById('goal-list');
  if (!list) return;
  if (state.goals.length === 0) { list.innerHTML = '<div class="empty-state">No goals yet. Set one above!</div>'; return; }
  list.innerHTML = state.goals.map(g => `
    <div class="goal-item ${g.done ? 'done' : ''}">
      <input type="checkbox" class="goal-check" ${g.done ? 'checked' : ''} onchange="toggleGoal('${g.id}')" />
      <span class="goal-text">${escHtml(g.text)}</span>
      <button class="btn-danger" onclick="deleteGoal('${g.id}')">Delete</button>
    </div>`).join('');
}

function renderProfile() {
  if (!state.user) return;
  document.getElementById('profile-name').value  = state.user.name  || '';
  document.getElementById('profile-email').value = state.user.email || '';
  document.getElementById('profile-hours').value = state.user.hoursGoal || 4;
  const av = document.getElementById('profile-avatar-big');
  if (av) av.textContent = (state.user.name || 'U')[0].toUpperCase();
  renderSubjectTags();
}

function saveProfile() {
  const name  = document.getElementById('profile-name').value.trim();
  const hours = parseInt(document.getElementById('profile-hours').value) || 4;
  if (!name) return alert('Name cannot be empty.');
  state.user.name = name; state.user.hoursGoal = hours;
  saveState(); updateTopbar();
  const btn = event.target;
  const orig = btn.textContent;
  btn.textContent = '✓ Saved!'; btn.style.background = 'var(--success)';
  setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 1800);
}

function uid() { return Math.random().toString(36).slice(2,9) + Date.now().toString(36); }
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function bindEnter(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });
}

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  if (state.user) showPage('app'); else showPage('landing');
  const todayISO = new Date().toISOString().slice(0,10);
  const in30days = new Date(Date.now() + 30 * 864e5).toISOString().slice(0,10);
  ['plan-date','task-due'].forEach(id => { const el = document.getElementById(id); if (el) el.value = todayISO; });
  const examEl = document.getElementById('ai-exam-date');
  if (examEl) examEl.value = in30days;
  bindEnter('subject-input',       addSubject);
  bindEnter('setup-subject-input', setupAddSubject);
  bindEnter('task-name',           addTask);
  bindEnter('goal-input',          addGoal);
  bindEnter('plan-task',           addPlannerTask);
  bindEnter('login-pass',          doLogin);
  bindEnter('signup-pass',         doSignup);
  bindEnter('planner-quick-sub',   () => quickAddSubject('planner-quick-sub'));
  bindEnter('tasks-quick-sub',     () => quickAddSubject('tasks-quick-sub'));
  bindEnter('ai-quick-sub',        () => quickAddSubject('ai-quick-sub'));
});


