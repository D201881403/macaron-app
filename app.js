/* ============================================
   马卡龙空间 — 应用核心逻辑
   ============================================ */

// ---- 数据存储层 ----
const Store = {
  prefix: 'macaron_',

  get(key, def) {
    const v = localStorage.getItem(this.prefix + key);
    if (v === null) return def;
    try { return JSON.parse(v); } catch { return def; }
  },

  set(key, val) {
    localStorage.setItem(this.prefix + key, JSON.stringify(val));
  },

  remove(key) {
    localStorage.removeItem(this.prefix + key);
  }
};

// ---- 应用状态 ----
const App = {
  currentPage: 'home',
  tabs: [
    { id: 'home', icon: '🏠', label: '首页' },
    { id: 'todo', icon: '✅', label: '效率' },
    { id: 'life', icon: '📖', label: '生活' },
    { id: 'health', icon: '💪', label: '健康' },
    { id: 'settings', icon: '⚙️', label: '我的' }
  ],

  // 用户配置
  profile: {},
  // 各模块数据
  todos: [],
  habits: [],
  schedules: [],
  diaries: [],
  expenses: [],
  notes: [],
  health: {},

  init() {
    this.loadProfile();
    this.loadAllData();
    this.renderTabbar();
    this.checkAndGenerateDailyPlan();
    this.navigate(this.profile.lastPage || 'home');

    // iOS: 检测是否为独立模式（已添加到主屏幕）
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || navigator.standalone
      || window.location.search.includes('standalone');

    // PWA 安装提示（Android/Chrome）
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });

    // 如果非独立模式且是 iOS Safari，首次使用时显示添加到桌面引导
    if (!this.isStandalone && this._isIOS() && !Store.get('hideIosTip')) {
      setTimeout(() => this.showIosInstallTip(), 1500);
    }
  },

  _isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  },

  showIosInstallTip() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(74,59,71,0.7); z-index: 9999;
      display: flex; flex-direction: column; align-items: center;
      justify-content: flex-start; padding: 20px;
      animation: fadeInBg 0.3s ease;
    `;
    overlay.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; margin-top:8px;
        background: white; border-radius: 20px; padding: 16px 24px; max-width: 320px;">
        <span style="font-size:28px;">📱</span>
        <div style="font-size:14px; line-height:1.6; color:var(--text);">
          <strong>添加到主屏幕</strong><br>
          点击底部 <span style="color:var(--primary-dark);">⬆️ 分享按钮</span> → 选择 <span style="color:var(--primary-dark);">「添加到主屏幕」</span>
        </div>
      </div>
      <button style="margin-top:16px; background:rgba(255,255,255,0.9); border:none;
        padding:10px 24px; border-radius:20px; font-size:14px; font-weight:600;
        color:var(--text); cursor:pointer;"
        onclick="this.parentElement.remove(); Store.set('hideIosTip', true);">
        知道了 ✓
      </button>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.remove(); Store.set('hideIosTip', true); }
    });
  },

  // ---- 加载配置 ----
  loadProfile() {
    this.profile = Store.get('profile', {
      name: '小可爱',
      avatar: '🌸',
      bio: '记录生活中的每一个美好瞬间',
      theme: 'sakura',
      modules: {
        home: true, todo: true, life: true, health: true, settings: true
      },
      customModules: [],
      lastPage: 'home'
    });
    this.applyTheme(this.profile.theme);
  },

  saveProfile() {
    Store.set('profile', this.profile);
  },

  applyTheme(theme) {
    const root = document.documentElement;
    root.removeAttribute('data-theme');
    if (theme && theme !== 'sakura') {
      root.setAttribute('data-theme', theme);
    }
    // 更新 theme-color
    const colors = { sakura: '#FFB5BA', mint: '#95C9C0', lavender: '#C5A8E0', peach: '#FFD3B5', sky: '#A5C9F5' };
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors[theme] || '#FFB5BA');
  },

  // ---- 加载数据 ----
  loadAllData() {
    this.todos = Store.get('todos', []);
    this.habits = Store.get('habits', [
      { id: 1, name: '喝水', emoji: '💧', done: {} },
      { id: 2, name: '阅读', emoji: '📚', done: {} },
      { id: 3, name: '运动', emoji: '🏃', done: {} }
    ]);
    this.schedules = (Store.get('schedules', []) || []).map(s => ({
      ...s,
      date: s.date || null,
      repeat: s.repeat || 'daily'
    }));
    this.diaries = Store.get('diaries', []);
    this.expenses = Store.get('expenses', []);
    this.notes = Store.get('notes', []);
    this.health = Store.get('health', {
      water: 0, waterGoal: 8,
      steps: 0, stepsGoal: 8000,
      sleep: 7, sleepGoal: 8,
      calories: 0, caloriesGoal: 2000,
      records: []
    });
    this.customModuleData = Store.get('customModuleData', {});
    this.dailyPlans = Store.get('dailyPlans', {});
    this.weeklyReports = Store.get('weeklyReports', {});
    this.aiRules = Store.get('aiRules', { habitAnalysis: null, scheduleDensity: null, lastUpdated: null });
  },

  saveTodos() { Store.set('todos', this.todos); },
  saveHabits() { Store.set('habits', this.habits); },
  saveSchedules() { Store.set('schedules', this.schedules); },
  saveDiaries() { Store.set('diaries', this.diaries); },
  saveExpenses() { Store.set('expenses', this.expenses); },
  saveNotes() { Store.set('notes', this.notes); },
  saveHealth() { Store.set('health', this.health); },
  saveCustomModuleData() { Store.set('customModuleData', this.customModuleData); },
  saveDailyPlans() { Store.set('dailyPlans', this.dailyPlans); },
  saveWeeklyReports() { Store.set('weeklyReports', this.weeklyReports); },
  saveAiRules() { Store.set('aiRules', this.aiRules); },

  // ---- 导航 ----
  navigate(pageId) {
    this.currentPage = pageId;
    this.profile.lastPage = pageId;
    this.saveProfile();

    // 更新tab栏
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.page === pageId);
    });

    // 渲染页面
    const content = document.getElementById('content');
    content.innerHTML = '';
    const page = this.renderPage(pageId);
    if (page) content.appendChild(page);
    content.scrollTop = 0;
  },

  renderPage(pageId) {
    const wrap = document.createElement('div');
    wrap.className = 'page';
    const renderers = {
      home: () => this.renderHome(wrap),
      todo: () => this.renderTodo(wrap),
      life: () => this.renderLife(wrap),
      health: () => this.renderHealth(wrap),
      settings: () => this.renderSettings(wrap)
    };
    // 自定义模块
    const customMod = (this.profile.customModules || []).find(m => m.id === pageId);
    if (customMod) {
      this.renderCustomModule(wrap, customMod);
    } else if (renderers[pageId]) {
      renderers[pageId]();
    } else {
      renderers.home();
    }
    return wrap;
  },

  // ---- 渲染底部导航 ----
  renderTabbar() {
    const nav = document.getElementById('tabbar');
    nav.innerHTML = '';
    // 系统模块
    this.tabs.forEach(tab => {
      if (!this.profile.modules[tab.id] && tab.id !== 'settings') return;
      const el = document.createElement('div');
      el.className = 'tab' + (this.currentPage === tab.id ? ' active' : '');
      el.dataset.page = tab.id;
      el.innerHTML = `<div class="tab-icon">${tab.icon}</div><div class="tab-label">${tab.label}</div>`;
      el.addEventListener('click', () => this.navigate(tab.id));
      nav.appendChild(el);
    });
    // 自定义模块
    (this.profile.customModules || []).forEach((mod, idx) => {
      const el = document.createElement('div');
      el.className = 'tab' + (this.currentPage === mod.id ? ' active' : '');
      el.dataset.page = mod.id;
      el.innerHTML = `<div class="tab-icon">${mod.icon}</div><div class="tab-label">${mod.name}</div>`;
      el.addEventListener('click', () => this.navigate(mod.id));
      nav.appendChild(el);
    });
  },

  // ============================================
  // 首页
  // ============================================
  renderHome(wrap) {
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const greeting = this.getGreeting();

    wrap.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">${greeting}，${this.profile.name} ${this.profile.avatar}</div>
          <div class="page-subtitle">${dateStr} · 星期${weekDays[today.getDay()]}</div>
        </div>
      </div>

      <!-- 今日概览 -->
      <div class="card">
        <div class="card-title"><span class="card-icon">📊</span>今日概览</div>
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-value">${this.todos.filter(t => !t.done).length}</div>
            <div class="stat-label">待办任务</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.getHabitDoneToday()}</div>
            <div class="stat-label">习惯打卡</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">¥${this.getTodayExpense()}</div>
            <div class="stat-label">今日支出</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.health.water}/${this.health.waterGoal}</div>
            <div class="stat-label">喝水(杯)</div>
          </div>
        </div>
      </div>

      <!-- 今日计划 -->
      ${this.renderTodayPlanCard()}

      <!-- 周总结 -->
      ${this.renderWeeklyReportCard()}

      <!-- 名片预览 -->
      <div class="card" style="text-align:center; padding: 24px 16px;">
        <div class="avatar avatar-lg" style="margin: 0 auto 12px;">${this.profile.avatar}</div>
        <div style="font-size: 20px; font-weight: 700; margin-bottom: 4px;">${this.profile.name}</div>
        <div style="font-size: 13px; color: var(--text-light); margin-bottom: 16px;">${this.profile.bio}</div>
        <button class="btn btn-primary" onclick="App.navigate('settings')">编辑个人资料</button>
      </div>

      <!-- 快捷入口 -->
      <div class="card">
        <div class="card-title"><span class="card-icon">⚡</span>快捷入口</div>
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 8px; text-align:center;">
          <div onclick="App.navigate('todo')" style="cursor:pointer; padding: 12px 4px; border-radius: 12px; background: var(--primary-light); transition: transform 0.15s;" onaction="transform:scale(0.95)">
            <div style="font-size: 28px; margin-bottom: 4px;">📝</div>
            <div style="font-size: 11px; color: var(--text-light);">待办</div>
          </div>
          <div onclick="App.goToLife('diary')" style="cursor:pointer; padding: 12px 4px; border-radius: 12px; background: var(--secondary-light); transition: transform 0.15s;">
            <div style="font-size: 28px; margin-bottom: 4px;">📔</div>
            <div style="font-size: 11px; color: var(--text-light);">日记</div>
          </div>
          <div onclick="App.goToLife('expense')" style="cursor:pointer; padding: 12px 4px; border-radius: 12px; background: var(--primary-light); transition: transform 0.15s;">
            <div style="font-size: 28px; margin-bottom: 4px;">💰</div>
            <div style="font-size: 11px; color: var(--text-light);">记账</div>
          </div>
          <div onclick="App.navigate('health')" style="cursor:pointer; padding: 12px 4px; border-radius: 12px; background: var(--secondary-light); transition: transform 0.15s;">
            <div style="font-size: 28px; margin-bottom: 4px;">💧</div>
            <div style="font-size: 11px; color: var(--text-light);">健康</div>
          </div>
        </div>
      </div>

      <!-- 今日待办预览 -->
      ${this.todos.filter(t => !t.done).length > 0 ? `
      <div class="card">
        <div class="card-title"><span class="card-icon">📌</span>今日待办</div>
        ${this.todos.filter(t => !t.done).slice(0, 3).map(t => `
          <div class="list-item">
            <div class="checkbox" onclick="App.toggleTodo(${t.id})"></div>
            <span class="item-text">${t.text}</span>
          </div>
        `).join('')}
        ${this.todos.filter(t => !t.done).length > 3 ? `<div style="text-align:center; padding-top:8px;"><span class="chip" onclick="App.navigate('todo')">查看全部</span></div>` : ''}
      </div>` : ''}
    `;
    // 首页不需要浮动按钮
    document.querySelectorAll('.fab').forEach(f => f.remove());
  },

  getGreeting() {
    const h = new Date().getHours();
    if (h < 6) return '夜深了';
    if (h < 11) return '早上好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  },

  getHabitDoneToday() {
    const today = new Date().toDateString();
    return this.habits.filter(h => h.done[today]).length;
  },

  getTodayExpense() {
    const today = new Date().toDateString();
    return this.expenses
      .filter(e => new Date(e.date).toDateString() === today && e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0)
      .toFixed(1);
  },

  // 生活页子导航
  lifeSubPage: 'diary',

  goToLife(sub) {
    this.lifeSubPage = sub;
    this.navigate('life');
  },

  // ============================================
  // 效率模块 — 待办/习惯/日程
  // ============================================
  renderTodo(wrap) {
    const activeTab = this._todoTab || 'tasks';
    wrap.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">效率空间</div>
          <div class="page-subtitle">管理任务、习惯与日程</div>
        </div>
      </div>

      <div style="display:flex; gap:8px; margin-bottom:16px; overflow-x:auto;">
        <div class="chip ${activeTab==='tasks'?'active':''}" onclick="App.switchTodoTab('tasks')">📝 待办</div>
        <div class="chip ${activeTab==='habits'?'active':''}" onclick="App.switchTodoTab('habits')">🌱 习惯</div>
        <div class="chip ${activeTab==='schedule'?'active':''}" onclick="App.switchTodoTab('schedule')">📅 日程</div>
        <div class="chip ${activeTab==='calendar'?'active':''}" onclick="App.switchTodoTab('calendar')">🗓️ 月历</div>
      </div>
      <div id="todoContent">${this.getTodoContentHtml(activeTab)}</div>
    `;
    this.renderFab('➕', () => {
      if (activeTab === 'tasks') this.showAddTodoModal();
      else if (activeTab === 'habits') this.showAddHabitModal();
      else this.showAddScheduleModal();
    });
  },

  getTodoContentHtml(tab) {
    if (tab === 'tasks') {
      return `
        ${this.todos.length === 0 ? this.emptyHTML('📝', '还没有任务，点击 + 添加') : ''}
        <div class="card">
          ${this.todos.filter(t => !t.done).map(t => `
            <div class="list-item">
              <div class="checkbox" onclick="App.toggleTodo(${t.id})"></div>
              <span class="item-text" style="flex:1;">${t.text}</span>
              <button class="delete-btn" onclick="App.deleteTodo(${t.id})">✕</button>
            </div>
          `).join('')}
        </div>
        ${this.todos.some(t => t.done) ? `
          <div class="section-title">已完成</div>
          <div class="card">
            ${this.todos.filter(t => t.done).map(t => `
              <div class="list-item completed">
                <div class="checkbox checked" onclick="App.toggleTodo(${t.id})"></div>
                <span class="item-text" style="flex:1;">${t.text}</span>
                <button class="delete-btn" onclick="App.deleteTodo(${t.id})">✕</button>
              </div>
            `).join('')}
          </div>` : ''}
      `;
    } else if (tab === 'habits') {
      return this.habits.map(h => this.renderHabitCard(h)).join('') +
        (this.habits.length === 0 ? this.emptyHTML('🌱', '添加一个习惯开始打卡') : '');
    } else if (tab === 'schedule') {
      const repeatLabel = { daily: '每天', weekly: '每周', once: '单次' };
      return (this.schedules.length === 0 ? this.emptyHTML('📅', '添加日程安排') : '') +
        this.schedules.sort((a,b)=>a.time.localeCompare(b.time)).map(s => `
          <div class="card">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:56px; text-align:center; flex-shrink:0;">
                <div style="font-size:20px; font-weight:700; color:var(--primary-dark);">${s.time.split(':')[0]}</div>
                <div style="font-size:11px; color:var(--text-light);">: ${s.time.split(':')[1]||'00'}</div>
              </div>
              <div style="flex:1;">
                <div style="font-weight:600; font-size:15px;">${s.title}</div>
                <div style="font-size:11px; color:var(--text-light); margin-top:2px;">
                  ${repeatLabel[s.repeat] || '每天'}${s.date ? ' · ' + s.date : ''}${s.note ? ' · ' + s.note : ''}
                </div>
              </div>
              <button class="delete-btn" onclick="App.deleteSchedule(${s.id})">✕</button>
            </div>
          </div>
        `).join('') + `
        <div class="card" style="text-align:center;">
          <button class="btn btn-ghost" onclick="App.showCalendarExportModal()">📱 同步到系统日历</button>
        </div>`;
    } else if (tab === 'calendar') {
      return this.renderCalendarMonth();
    }
    return '';
  },

  switchTodoTab(tab) {
    this._todoTab = tab;
    const el = document.getElementById('todoContent');
    if (el) el.innerHTML = this.getTodoContentHtml(tab);
    if (tab !== 'calendar') {
      this.renderFab('➕', () => {
        if (tab === 'tasks') this.showAddTodoModal();
        else if (tab === 'habits') this.showAddHabitModal();
        else this.showAddScheduleModal();
      });
    } else {
      document.querySelectorAll('.fab').forEach(f => f.remove());
    }
    // 更新 chip active 状态
    document.querySelectorAll('.chip').forEach(c => {
      const t = c.textContent;
      if (t.includes('待办')) c.classList.toggle('active', tab === 'tasks');
      else if (t.includes('习惯')) c.classList.toggle('active', tab === 'habits');
      else if (t.includes('日程')) c.classList.toggle('active', tab === 'schedule');
      else if (t.includes('月历')) c.classList.toggle('active', tab === 'calendar');
    });
  },

  renderTodoContent() {
    const el = document.getElementById('todoContent');
    if (el) el.innerHTML = this.getTodoContentHtml(this._todoTab || 'tasks');
  },

  renderHabitCard(h) {
    const today = new Date().toDateString();
    const done = !!h.done[today];
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      last7.push({ date: ds, done: !!h.done[ds], day: d.getDate(), isToday: ds === today });
    }
    return `
      <div class="card">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
          <div style="font-size:28px;">${h.emoji}</div>
          <div style="flex:1;">
            <div style="font-weight:700; font-size:16px;">${h.name}</div>
            <div style="font-size:12px; color:var(--text-light);">连续 ${this.getStreak(h)} 天</div>
          </div>
          <button class="delete-btn" onclick="App.deleteHabit(${h.id})">✕</button>
        </div>
        <div style="display:flex; gap:6px; justify-content:space-between;">
          ${last7.map(d => `
            <div style="text-align:center; flex:1;">
              <div style="width:32px; height:32px; border-radius:10px; margin:0 auto 4px;
                background:${d.done?'var(--primary)':'var(--primary-light)'};
                color:${d.done?'white':'var(--text-light)'};
                display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:600;
                ${d.isToday?'border:2px solid var(--secondary);':''}"
                onclick="App.toggleHabit(${h.id}, '${d.date}')">
                ${d.done?'✓':d.day}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  getStreak(habit) {
    let streak = 0;
    const d = new Date();
    while (habit.done[d.toDateString()]) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  },

  toggleTodo(id) {
    const t = this.todos.find(t => t.id === id);
    if (t) {
      t.done = !t.done;
      this.saveTodos();
      this.renderTodoContent();
    }
  },

  deleteTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id);
    this.saveTodos();
    this.renderTodoContent();
  },

  toggleHabit(id, dateStr) {
    const h = this.habits.find(h => h.id === id);
    if (h) {
      if (h.done[dateStr]) {
        delete h.done[dateStr];
      } else {
        h.done[dateStr] = true;
      }
      this.saveHabits();
      this.renderTodoContent();
    }
  },

  deleteHabit(id) {
    this.habits = this.habits.filter(h => h.id !== id);
    this.saveHabits();
    this.renderTodoContent();
  },

  deleteSchedule(id) {
    this.schedules = this.schedules.filter(s => s.id !== id);
    this.saveSchedules();
    this.renderTodoContent();
  },

  // ---- 添加任务弹窗 ----
  showAddTodoModal() {
    this.showModal('添加任务', `
      <div class="field-label">任务内容</div>
      <input class="input" id="todoInput" placeholder="想做什么？" maxlength="50">
    `, () => {
      const text = document.getElementById('todoInput').value.trim();
      if (!text) return;
      this.todos.push({ id: Date.now(), text, done: false });
      this.saveTodos();
      this.renderTodoContent();
    });
  },

  showAddHabitModal() {
    this.showModal('添加习惯', `
      <div class="field-label">习惯名称</div>
      <input class="input" id="habitName" placeholder="如：早起、跑步..." maxlength="12">
      <div class="field-label">选择图标</div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${['💧','📚','🏃','🧘','🎯','✍️','🌱','☕','🛏️','🦷','💊','🎨'].map((e,i) => `
          <div class="mood-option habit-emoji ${i===0?'selected':''}" onclick="App.selectHabitEmoji(this,'${e}')">${e}</div>
        `).join('')}
      </div>
    `, () => {
      const name = document.getElementById('habitName').value.trim();
      if (!name) return;
      const emoji = document.querySelector('.habit-emoji.selected')?.textContent || '🌱';
      this.habits.push({ id: Date.now(), name, emoji, done: {} });
      this.saveHabits();
      this.renderTodoContent();
    });
  },

  selectHabitEmoji(el, emoji) {
    document.querySelectorAll('.habit-emoji').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
  },

  showAddScheduleModal() {
    this.showModal('添加日程', `
      <div class="field-label">标题</div>
      <input class="input" id="schedTitle" placeholder="如：团队会议、约朋友..." maxlength="20">
      <div class="field-label">时间</div>
      <input class="input" id="schedTime" type="time" value="09:00">
      <div class="field-label">重复方式</div>
      <div style="display:flex; gap:8px;">
        <div class="chip cm-type active" onclick="App.selectSchedRepeat(this)" data-repeat="daily">📅 每天</div>
        <div class="chip cm-type" onclick="App.selectSchedRepeat(this)" data-repeat="weekly">📆 每周</div>
        <div class="chip cm-type" onclick="App.selectSchedRepeat(this)" data-repeat="once">📌 仅一次</div>
      </div>
      <div class="field-label" id="schedDateLabel" style="display:none;">选择日期</div>
      <input class="input" id="schedDate" type="date" style="display:none;">
      <div class="field-label">备注（可选）</div>
      <textarea class="input" id="schedNote" placeholder="附加信息..." maxlength="100"></textarea>
    `, () => {
      const title = document.getElementById('schedTitle').value.trim();
      const time = document.getElementById('schedTime').value;
      const note = document.getElementById('schedNote').value.trim();
      const repeatEl = document.querySelector('.cm-type.active[data-repeat]');
      const repeat = repeatEl ? repeatEl.dataset.repeat : 'daily';
      let date = null;
      if (repeat !== 'daily') {
        date = document.getElementById('schedDate').value || this._dateToISO(new Date());
      }
      if (!title) return;
      this.schedules.push({ id: Date.now(), title, time, note, date, repeat });
      this.saveSchedules();
      this.renderTodoContent();
    });
    // 动态显示/隐藏日期选择
    setTimeout(() => {
      const dateLabel = document.getElementById('schedDateLabel');
      const dateInput = document.getElementById('schedDate');
      if (!dateLabel || !dateInput) return;
      document.querySelectorAll('.cm-type[data-repeat]').forEach(el => {
        el.addEventListener('click', () => {
          const r = el.dataset.repeat;
          if (r !== 'daily') {
            dateLabel.style.display = 'block';
            dateInput.style.display = 'block';
            if (!dateInput.value) dateInput.value = this._dateToISO(new Date());
          } else {
            dateLabel.style.display = 'none';
            dateInput.style.display = 'none';
          }
        });
      });
    }, 100);
  },

  selectSchedRepeat(el) {
    document.querySelectorAll('.cm-type[data-repeat]').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
  },

  // ============================================
  // 生活模块 — 日记/记账/笔记
  // ============================================
  renderLife(wrap) {
    const sub = this.lifeSubPage || 'diary';

    // 预渲染子页面内容，避免二次 DOM 写入导致渲染失败
    let contentHtml = '';
    if (sub === 'diary') {
      contentHtml = `
        ${this.diaries.length === 0 ? this.emptyHTML('📔', '写下今天的故事') : ''}
        ${this.diaries.sort((a,b)=>b.id-a.id).map(d => `
          <div class="card">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
              <div style="font-size:13px; font-weight:600; color:var(--text-light);">${d.dateStr}</div>
              <div style="font-size:24px;">${d.mood}</div>
            </div>
            <div style="font-size:14px; line-height:1.6; color:var(--text);">${d.content}</div>
            <div style="margin-top:8px; text-align:right;">
              <button class="delete-btn" onclick="App.deleteDiary(${d.id})">🗑️</button>
            </div>
          </div>
        `).join('')}
      `;
    } else if (sub === 'expense') {
      const monthExp = this.expenses.filter(e => e.type === 'expense').reduce((s,e)=>s+e.amount,0);
      const monthInc = this.expenses.filter(e => e.type === 'income').reduce((s,e)=>s+e.amount,0);
      contentHtml = `
        <div class="card" style="text-align:center; padding: 24px 16px;">
          <div style="font-size: 12px; color: var(--text-light); margin-bottom: 4px;">本月结余</div>
          <div style="font-size: 36px; font-weight: 700; color: var(--primary-dark);">¥${(monthInc - monthExp).toFixed(1)}</div>
          <div style="display:flex; justify-content: center; gap: 24px; margin-top: 12px;">
            <div><span style="color:var(--success); font-weight:600;">+¥${monthInc.toFixed(1)}</span> <span style="font-size:11px; color:var(--text-light);">收入</span></div>
            <div><span style="color:var(--danger); font-weight:600;">-¥${monthExp.toFixed(1)}</span> <span style="font-size:11px; color:var(--text-light);">支出</span></div>
          </div>
        </div>
        ${this.expenses.length === 0 ? this.emptyHTML('💰', '记一笔收支') : `
          <div class="section-title">收支明细</div>
          <div class="card">
            ${this.expenses.sort((a,b)=>b.id-a.id).map(e => `
              <div class="expense-row">
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:24px;">${e.icon}</span>
                  <div>
                    <div style="font-weight:600; font-size:14px;">${e.category}</div>
                    <div style="font-size:11px; color:var(--text-light);">${e.dateStr}</div>
                  </div>
                </div>
                <span class="expense-amount ${e.type}">${e.type==='income'?'+':'-'}¥${e.amount}</span>
              </div>
            `).join('')}
          </div>
        `}
      `;
    } else if (sub === 'note') {
      contentHtml = `
        ${this.notes.length === 0 ? this.emptyHTML('📝', '创建第一条笔记') : ''}
        ${this.notes.sort((a,b)=>b.id-a.id).map(n => `
          <div class="card">
            <div style="font-weight:700; font-size:15px; margin-bottom:6px;">${n.title}</div>
            <div style="font-size:13px; line-height:1.6; color:var(--text-light); white-space:pre-wrap;">${n.content}</div>
            <div style="margin-top:8px; text-align:right;">
              <button class="delete-btn" onclick="App.deleteNote(${n.id})">🗑️</button>
            </div>
          </div>
        `).join('')}
      `;
    }

    wrap.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">生活手账</div>
          <div class="page-subtitle">记录生活的点滴</div>
        </div>
      </div>

      <div style="display:flex; gap:8px; margin-bottom:16px; overflow-x:auto;">
        <div class="chip ${sub==='diary'?'active':''}" onclick="App.goToLife('diary')">📔 日记</div>
        <div class="chip ${sub==='expense'?'active':''}" onclick="App.goToLife('expense')">💰 记账</div>
        <div class="chip ${sub==='note'?'active':''}" onclick="App.goToLife('note')">📝 笔记</div>
      </div>
      <div id="lifeContent">${contentHtml}</div>
    `;

    this.renderFab('➕', () => {
      if (sub === 'diary') this.showAddDiaryModal();
      else if (sub === 'expense') this.showAddExpenseModal();
      else this.showAddNoteModal();
    });
  },

  // 保留 renderLifeContent 用于局部刷新（删除/添加后）
  renderLifeContent() {
    const el = document.getElementById('lifeContent');
    if (!el) return;
    const sub = this.lifeSubPage;

    if (sub === 'diary') {
      el.innerHTML = `
        ${this.diaries.length === 0 ? this.emptyHTML('📔', '写下今天的故事') : ''}
        ${this.diaries.sort((a,b)=>b.id-a.id).map(d => `
          <div class="card">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
              <div style="font-size:13px; font-weight:600; color:var(--text-light);">${d.dateStr}</div>
              <div style="font-size:24px;">${d.mood}</div>
            </div>
            <div style="font-size:14px; line-height:1.6; color:var(--text);">${d.content}</div>
            <div style="margin-top:8px; text-align:right;">
              <button class="delete-btn" onclick="App.deleteDiary(${d.id})">🗑️</button>
            </div>
          </div>
        `).join('')}
      `;
    } else if (sub === 'expense') {
      const monthExp = this.expenses.filter(e => e.type === 'expense').reduce((s,e)=>s+e.amount,0);
      const monthInc = this.expenses.filter(e => e.type === 'income').reduce((s,e)=>s+e.amount,0);
      el.innerHTML = `
        <div class="card" style="text-align:center; padding: 24px 16px;">
          <div style="font-size: 12px; color: var(--text-light); margin-bottom: 4px;">本月结余</div>
          <div style="font-size: 36px; font-weight: 700; color: var(--primary-dark);">¥${(monthInc - monthExp).toFixed(1)}</div>
          <div style="display:flex; justify-content: center; gap: 24px; margin-top: 12px;">
            <div><span style="color:var(--success); font-weight:600;">+¥${monthInc.toFixed(1)}</span> <span style="font-size:11px; color:var(--text-light);">收入</span></div>
            <div><span style="color:var(--danger); font-weight:600;">-¥${monthExp.toFixed(1)}</span> <span style="font-size:11px; color:var(--text-light);">支出</span></div>
          </div>
        </div>

        ${this.expenses.length === 0 ? this.emptyHTML('💰', '记一笔收支') : `
          <div class="section-title">收支明细</div>
          <div class="card">
            ${this.expenses.sort((a,b)=>b.id-a.id).map(e => `
              <div class="expense-row">
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:24px;">${e.icon}</span>
                  <div>
                    <div style="font-weight:600; font-size:14px;">${e.category}</div>
                    <div style="font-size:11px; color:var(--text-light);">${e.dateStr}</div>
                  </div>
                </div>
                <span class="expense-amount ${e.type}">${e.type==='income'?'+':'-'}¥${e.amount}</span>
              </div>
            `).join('')}
          </div>
        `}
      `;
    } else if (sub === 'note') {
      el.innerHTML = `
        ${this.notes.length === 0 ? this.emptyHTML('📝', '创建第一条笔记') : ''}
        ${this.notes.sort((a,b)=>b.id-a.id).map(n => `
          <div class="card">
            <div style="font-weight:700; font-size:15px; margin-bottom:6px;">${n.title}</div>
            <div style="font-size:13px; line-height:1.6; color:var(--text-light); white-space:pre-wrap;">${n.content}</div>
            <div style="margin-top:8px; text-align:right;">
              <button class="delete-btn" onclick="App.deleteNote(${n.id})">🗑️</button>
            </div>
          </div>
        `).join('')}
      `;
    }
  },

  deleteDiary(id) {
    this.diaries = this.diaries.filter(d => d.id !== id);
    this.saveDiaries();
    this.renderLifeContent();
  },

  deleteNote(id) {
    this.notes = this.notes.filter(n => n.id !== id);
    this.saveNotes();
    this.renderLifeContent();
  },

  showAddDiaryModal() {
    const moods = ['😊','😴','😢','😡','🥰','😎','🤔','😭'];
    const today = new Date();
    const dateStr = `${today.getMonth()+1}月${today.getDate()}日`;
    this.showModal('写日记', `
      <div class="field-label">日期</div>
      <div style="font-size:14px; font-weight:600; color:var(--text);">${dateStr}</div>
      <div class="field-label">今天的心情</div>
      <div class="mood-selector" id="moodSelector">
        ${moods.map((m,i) => `<div class="mood-option ${i===0?'selected':''}" onclick="App.selectMood(this)">${m}</div>`).join('')}
      </div>
      <div class="field-label">日记内容</div>
      <textarea class="input" id="diaryContent" placeholder="今天发生了什么..." rows="6" maxlength="500"></textarea>
    `, () => {
      const content = document.getElementById('diaryContent').value.trim();
      if (!content) return;
      const mood = document.querySelector('.mood-option.selected')?.textContent || '😊';
      this.diaries.push({ id: Date.now(), dateStr, mood, content });
      this.saveDiaries();
      this.renderLifeContent();
    });
  },

  selectMood(el) {
    document.querySelectorAll('.mood-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
  },

  showAddExpenseModal() {
    const cats = [
      { name: '餐饮', icon: '🍔', type: 'expense' },
      { name: '交通', icon: '🚇', type: 'expense' },
      { name: '购物', icon: '🛍️', type: 'expense' },
      { name: '娱乐', icon: '🎬', type: 'expense' },
      { name: '医疗', icon: '💊', type: 'expense' },
      { name: '住房', icon: '🏠', type: 'expense' },
      { name: '其他', icon: '📦', type: 'expense' },
      { name: '工资', icon: '💰', type: 'income' },
      { name: '副业', icon: '💻', type: 'income' },
    ];
    const today = new Date();
    const dateStr = `${today.getMonth()+1}月${today.getDate()}日`;
    this.showModal('记一笔', `
      <div class="field-label">选择分类</div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${cats.map((c,i) => `
          <div class="chip exp-cat ${i===0?'active':''}" onclick="App.selectCategory(this)" data-icon="${c.icon}" data-type="${c.type}">${c.icon} ${c.name}</div>
        `).join('')}
      </div>
      <div class="field-label">金额</div>
      <input class="input" id="expAmount" type="number" placeholder="0.0" inputmode="decimal">
      <div class="field-label">备注（可选）</div>
      <input class="input" id="expNote" placeholder="写点什么..." maxlength="30">
    `, () => {
      const cat = document.querySelector('.exp-cat.active');
      if (!cat) return;
      const amount = parseFloat(document.getElementById('expAmount').value);
      if (!amount || amount <= 0) return;
      const category = cat.textContent.trim().split(' ').slice(1).join(' ');
      const icon = cat.dataset.icon;
      const type = cat.dataset.type;
      this.expenses.push({ id: Date.now(), category, icon, type, amount, dateStr, note: document.getElementById('expNote').value.trim() });
      this.saveExpenses();
      this.renderLifeContent();
    });
  },

  selectCategory(el) {
    document.querySelectorAll('.exp-cat').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
  },

  showAddNoteModal() {
    this.showModal('写笔记', `
      <div class="field-label">标题</div>
      <input class="input" id="noteTitle" placeholder="笔记标题" maxlength="30">
      <div class="field-label">内容</div>
      <textarea class="input" id="noteContent" placeholder="写下你的想法..." rows="6" maxlength="500"></textarea>
    `, () => {
      const title = document.getElementById('noteTitle').value.trim();
      const content = document.getElementById('noteContent').value.trim();
      if (!title) return;
      this.notes.push({ id: Date.now(), title, content });
      this.saveNotes();
      this.renderLifeContent();
    });
  },

  // ============================================
  // 健康模块
  // ============================================
  renderHealth(wrap) {
    const h = this.health;
    wrap.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">健康空间</div>
          <div class="page-subtitle">关爱每一天的自己</div>
        </div>
      </div>

      <!-- 喝水 -->
      <div class="card" style="text-align:center;">
        <div class="card-title"><span class="card-icon">💧</span>喝水打卡</div>
        <div class="ring-progress">
          <svg width="120" height="120">
            <circle class="ring-bg" cx="60" cy="60" r="50"></circle>
            <circle class="ring-fg" cx="60" cy="60" r="50"
              stroke-dasharray="${2*Math.PI*50}"
              stroke-dashoffset="${2*Math.PI*50*(1 - Math.min(h.water/h.waterGoal,1))}"></circle>
          </svg>
          <div class="ring-text">
            <div class="ring-value">${h.water}</div>
            <div class="ring-label">/ ${h.waterGoal} 杯</div>
          </div>
        </div>
        <div style="display:flex; gap:12px; justify-content:center; margin-top:16px;">
          <button class="btn btn-ghost" onclick="App.addWater(-1)">- 1</button>
          <button class="btn btn-primary" onclick="App.addWater(1)">+ 1 杯</button>
        </div>
      </div>

      <!-- 步数 -->
      <div class="card" style="text-align:center;">
        <div class="card-title"><span class="card-icon">👣</span>步数</div>
        <div class="ring-progress">
          <svg width="120" height="120">
            <circle class="ring-bg" cx="60" cy="60" r="50"></circle>
            <circle class="ring-fg" cx="60" cy="60" r="50"
              stroke-dasharray="${2*Math.PI*50}"
              stroke-dashoffset="${2*Math.PI*50*(1 - Math.min(h.steps/h.stepsGoal,1))}"></circle>
          </svg>
          <div class="ring-text">
            <div class="ring-value">${h.steps}</div>
            <div class="ring-label">/ ${h.stepsGoal} 步</div>
          </div>
        </div>
        <div style="display:flex; gap:8px; justify-content:center; margin-top:16px; flex-wrap:wrap;">
          ${[500,1000,2000,5000].map(n => `<button class="chip" onclick="App.addSteps(${n})">+${n}</button>`).join('')}
        </div>
      </div>

      <!-- 睡眠 & 热量 -->
      <div class="stat-grid">
        <div class="stat-card">
          <div style="font-size:28px; margin-bottom:4px;">😴</div>
          <div class="stat-value">${h.sleep}h</div>
          <div class="stat-label">睡眠 (目标 ${h.sleepGoal}h)</div>
          <div style="margin-top:8px; display:flex; gap:4px; justify-content:center;">
            <button class="chip" onclick="App.adjustSleep(-0.5)">-0.5h</button>
            <button class="chip" onclick="App.adjustSleep(0.5)">+0.5h</button>
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size:28px; margin-bottom:4px;">🍎</div>
          <div class="stat-value">${h.calories}</div>
          <div class="stat-label">热量/千卡 (目标${h.caloriesGoal})</div>
          <div style="margin-top:8px; display:flex; gap:4px; justify-content:center;">
            <button class="chip" onclick="App.addCalories(-100)">-100</button>
            <button class="chip" onclick="App.addCalories(100)">+100</button>
          </div>
        </div>
      </div>

      <!-- 今日建议 -->
      <div class="card" style="background: linear-gradient(135deg, var(--primary-light), var(--secondary-light)); border:none;">
        <div style="font-weight:700; margin-bottom:8px;">💡 今日健康建议</div>
        <div style="font-size:13px; line-height:1.8; color:var(--text);">
          ${this.getHealthTip()}
        </div>
      </div>
    `;
    // 健康页不需要浮动按钮
    document.querySelectorAll('.fab').forEach(f => f.remove());
  },

  getHealthTip() {
    const tips = [];
    if (this.health.water < this.health.waterGoal * 0.5) tips.push('💧 今天水喝少了，记得多喝水哦');
    if (this.health.steps < this.health.stepsGoal * 0.5) tips.push('👣 步数还不够，起来走动走动');
    if (this.health.sleep < 6) tips.push('😴 睡眠不足，今晚早点休息');
    if (this.health.calories > this.health.caloriesGoal) tips.push('🍎 热量摄入超标了，注意饮食');
    if (tips.length === 0) tips.push('🌟 状态不错，继续保持！');
    return tips.join('<br>');
  },

  addWater(n) {
    this.health.water = Math.max(0, this.health.water + n);
    this.saveHealth();
    this.navigate('health');
  },

  addSteps(n) {
    this.health.steps = Math.max(0, this.health.steps + n);
    this.saveHealth();
    this.navigate('health');
  },

  adjustSleep(n) {
    this.health.sleep = Math.max(0, Math.min(24, this.health.sleep + n));
    this.saveHealth();
    this.navigate('health');
  },

  addCalories(n) {
    this.health.calories = Math.max(0, this.health.calories + n);
    this.saveHealth();
    this.navigate('health');
  },

  // ============================================
  // 设置页 — 个人资料/主题/模块管理
  // ============================================
  renderSettings(wrap) {
    const themes = [
      { id: 'sakura', name: '樱花粉', color: '#FFB5BA' },
      { id: 'mint', name: '薄荷绿', color: '#95C9C0' },
      { id: 'lavender', name: '薰衣草', color: '#C5A8E0' },
      { id: 'peach', name: '蜜桃橙', color: '#FFD3B5' },
      { id: 'sky', name: '天空蓝', color: '#A5C9F5' }
    ];

    const avatars = ['🌸','🐱','🐰','🐻','🦊','🐼','🐨','🦄','🌺','🌻','🌙','⭐','🦋','🍀','🌈','🍰'];

    wrap.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">我的空间</div>
          <div class="page-subtitle">个性化你的专属App</div>
        </div>
      </div>

      <!-- 个人资料卡 -->
      <div class="card" style="text-align:center; padding: 24px 16px;">
        <div class="avatar avatar-lg" style="margin: 0 auto 12px;">${this.profile.avatar}</div>
        <div style="font-size: 20px; font-weight: 700;">${this.profile.name}</div>
        <div style="font-size: 13px; color: var(--text-light); margin-top: 4px;">${this.profile.bio}</div>
        <button class="btn btn-primary" style="margin-top: 16px;" onclick="App.showEditProfileModal()">编辑资料</button>
      </div>

      <!-- 主题选择 -->
      <div class="card">
        <div class="card-title"><span class="card-icon">🎨</span>主题色彩</div>
        <div class="theme-picker">
          ${themes.map(t => `
            <div class="theme-option" onclick="App.changeTheme('${t.id}')">
              <div class="theme-swatch ${this.profile.theme===t.id?'active':''}"
                style="background: linear-gradient(135deg, ${t.color}, ${t.color}cc);"></div>
              <div class="theme-name">${t.name}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 模块管理 -->
      <div class="card">
        <div class="card-title"><span class="card-icon">🧩</span>功能模块</div>
        ${[
          { id: 'home', name: '首页概览', icon: '🏠' },
          { id: 'todo', name: '效率空间', icon: '✅' },
          { id: 'life', name: '生活手账', icon: '📖' },
          { id: 'health', name: '健康空间', icon: '💪' }
        ].map(m => `
          <div class="module-toggle">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:22px;">${m.icon}</span>
              <span style="font-weight:600;">${m.name}</span>
            </div>
            <div class="switch ${this.profile.modules[m.id]?'on':''}" onclick="App.toggleModule('${m.id}')"></div>
          </div>
        `).join('')}
      </div>

      <!-- 自定义模块 -->
      <div class="card">
        <div class="card-title"><span class="card-icon">🔧</span>自定义模块</div>
        <div style="font-size:12px; color:var(--text-light); margin-bottom:12px;">创建属于你自己的专属功能模块</div>
        ${(this.profile.customModules || []).length === 0 ? this.emptyHTML('🔧', '还没有自定义模块，点击下方添加') : ''}
        ${(this.profile.customModules || []).map((mod, idx) => `
          <div class="module-toggle">
            <div style="display:flex; align-items:center; gap:10px; flex:1;">
              <span style="font-size:22px;">${mod.icon}</span>
              <div>
                <span style="font-weight:600;">${mod.name}</span>
                <div style="font-size:11px; color:var(--text-light);">${mod.type==='checklist'?'清单型':mod.type==='counter'?'计数型':'笔记型'}</div>
              </div>
            </div>
            <button class="delete-btn" onclick="App.deleteCustomModule('${mod.id}')" style="margin-right:4px;">🗑️</button>
          </div>
        `).join('')}
        <button class="btn btn-primary" style="width:100%; margin-top:12px;" onclick="App.showAddCustomModuleModal()">➕ 添加自定义模块</button>
      </div>

      <!-- 数据统计 -->
      <div class="card">
        <div class="card-title"><span class="card-icon">📈</span>数据统计</div>
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-value">${this.todos.length}</div>
            <div class="stat-label">总任务</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.habits.length}</div>
            <div class="stat-label">习惯数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.diaries.length}</div>
            <div class="stat-label">日记篇</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.expenses.length}</div>
            <div class="stat-label">记账笔</div>
          </div>
        </div>
      </div>

      <!-- 数据管理 -->
      <div class="card">
        <div class="card-title"><span class="card-icon">💾</span>数据管理</div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          <button class="btn btn-ghost" onclick="App.exportData()">📤 导出数据</button>
          <button class="btn btn-ghost" style="color:var(--danger);" onclick="App.clearData()">🗑️ 清空所有数据</button>
        </div>
      </div>

      <div style="text-align:center; padding: 16px; color: var(--text-muted); font-size: 12px;">
        马卡龙空间 v1.0<br>🌿 让生活更美好
      </div>
    `;
    // 设置页不需要浮动按钮
    document.querySelectorAll('.fab').forEach(f => f.remove());
  },

  showEditProfileModal() {
    const avatars = ['🌸','🐱','🐰','🐻','🦊','🐼','🐨','🦄','🌺','🌻','🌙','⭐','🦋','🍀','🌈','🍰','🎈','🍮'];
    this.showModal('编辑资料', `
      <div class="field-label">选择头像</div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
        ${avatars.map(a => `<div class="mood-option profile-avatar ${a===this.profile.avatar?'selected':''}" onclick="App.selectAvatar(this)">${a}</div>`).join('')}
      </div>
      <div class="field-label">昵称</div>
      <input class="input" id="profileName" value="${this.profile.name}" placeholder="你的名字" maxlength="12">
      <div class="field-label">个性签名</div>
      <textarea class="input" id="profileBio" placeholder="说点什么..." maxlength="60">${this.profile.bio}</textarea>
    `, () => {
      const name = document.getElementById('profileName').value.trim();
      const bio = document.getElementById('profileBio').value.trim();
      const avatar = document.querySelector('.profile-avatar.selected')?.textContent || this.profile.avatar;
      if (name) this.profile.name = name;
      if (bio) this.profile.bio = bio;
      this.profile.avatar = avatar;
      this.saveProfile();
      this.renderTabbar();
      this.navigate('settings');
    });
  },

  selectAvatar(el) {
    document.querySelectorAll('.profile-avatar').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
  },

  changeTheme(themeId) {
    this.profile.theme = themeId;
    this.applyTheme(themeId);
    this.saveProfile();
    this.navigate('settings');
  },

  toggleModule(id) {
    this.profile.modules[id] = !this.profile.modules[id];
    if (!this.profile.modules[id] && this.currentPage === id) {
      this.currentPage = 'settings';
    }
    this.saveProfile();
    this.renderTabbar();
    this.navigate(this.currentPage);
  },

  // ---- 自定义模块 ----
  showAddCustomModuleModal() {
    const icons = ['📋','📌','🎯','💼','🏃','🎵','📺','🎮','🍳','🌍','📚','✈️','💡','🎨','🐾','🌸','🌟','🔥'];
    this.showModal('添加自定义模块', `
      <div class="field-label">模块名称</div>
      <input class="input" id="cmName" placeholder="如：追剧清单、健身计划..." maxlength="10">
      <div class="field-label">选择图标</div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${icons.map((e,i) => `
          <div class="mood-option cm-icon ${i===0?'selected':''}" onclick="App.selectCustomIcon(this)">${e}</div>
        `).join('')}
      </div>
      <div class="field-label">模块类型</div>
      <div style="display:flex; gap:8px;">
        <div class="chip cm-type active" onclick="App.selectCmType(this)" data-type="checklist">☑️ 清单型</div>
        <div class="chip cm-type" onclick="App.selectCmType(this)" data-type="counter">🔢 计数型</div>
        <div class="chip cm-type" onclick="App.selectCmType(this)" data-type="note">📝 笔记型</div>
      </div>
    `, () => {
      const name = document.getElementById('cmName').value.trim();
      if (!name) return;
      const icon = document.querySelector('.cm-icon.selected')?.textContent || '📋';
      const type = document.querySelector('.cm-type.active')?.dataset.type || 'checklist';
      const id = 'cm_' + Date.now();
      if (!this.profile.customModules) this.profile.customModules = [];
      this.profile.customModules.push({ id, name, icon, type });
      if (!this.customModuleData) this.customModuleData = {};
      this.customModuleData[id] = { items: [], count: 0, notes: '' };
      this.saveProfile();
      this.saveCustomModuleData();
      this.renderTabbar();
      this.navigate('settings');
    });
  },

  selectCustomIcon(el) {
    document.querySelectorAll('.cm-icon').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
  },

  selectCmType(el) {
    document.querySelectorAll('.cm-type').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
  },

  deleteCustomModule(id) {
    if (!confirm('确定删除这个模块吗？')) return;
    this.profile.customModules = (this.profile.customModules || []).filter(m => m.id !== id);
    delete (this.customModuleData || {})[id];
    if (this.currentPage === id) this.currentPage = 'settings';
    this.saveProfile();
    this.saveCustomModuleData();
    this.renderTabbar();
    this.navigate(this.currentPage);
  },

  renderCustomModule(wrap, mod) {
    const data = this.customModuleData?.[mod.id] || { items: [], count: 0, notes: '' };

    let contentHtml = '';
    if (mod.type === 'checklist') {
      contentHtml = `
        ${(data.items || []).length === 0 ? this.emptyHTML('📋', '点击 + 添加清单项') : ''}
        <div class="card">
          ${(data.items || []).map((item, idx) => `
            <div class="list-item ${item.done?'completed':''}">
              <div class="checkbox ${item.done?'checked':''}" onclick="App.toggleCustomItem('${mod.id}',${idx})"></div>
              <span class="item-text" style="flex:1;">${item.text}</span>
              <button class="delete-btn" onclick="App.deleteCustomItem('${mod.id}',${idx})">✕</button>
            </div>
          `).join('')}
        </div>
      `;
    } else if (mod.type === 'counter') {
      contentHtml = `
        <div class="card" style="text-align:center; padding: 32px 16px;">
          <div style="font-size: 64px; font-weight: 700; color: var(--primary-dark);">${data.count || 0}</div>
          <div style="font-size: 14px; color: var(--text-light); margin: 8px 0 20px;">${mod.name} 计数</div>
          <div style="display:flex; gap:12px; justify-content:center;">
            <button class="btn btn-ghost" onclick="App.adjustCustomCounter('${mod.id}',-1)" style="font-size:20px; width:56px; height:56px; border-radius:50%;">−</button>
            <button class="btn btn-primary" onclick="App.adjustCustomCounter('${mod.id}',1)" style="font-size:20px; width:56px; height:56px; border-radius:50%;">+</button>
          </div>
          <div style="display:flex; gap:8px; justify-content:center; margin-top:12px; flex-wrap:wrap;">
            ${[5,10,50,100].map(n => `<button class="chip" onclick="App.adjustCustomCounter('${mod.id}',${n})">+${n}</button>`).join('')}
          </div>
        </div>
      `;
    } else if (mod.type === 'note') {
      contentHtml = `
        <div class="card">
          <textarea class="input" id="cmNote_${mod.id}" placeholder="在这里写下你的想法..." 
            style="min-height:200px; font-size:14px; line-height:1.8;"
            oninput="App.saveCustomNote('${mod.id}', this.value)">${data.notes || ''}</textarea>
        </div>
      `;
    }

    wrap.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">${mod.icon} ${mod.name}</div>
          <div class="page-subtitle">${mod.type==='checklist'?'清单管理':mod.type==='counter'?'计数追踪':'自由笔记'}</div>
        </div>
      </div>
      ${contentHtml}
    `;

    if (mod.type === 'checklist') {
      this.renderFab('➕', () => this.showAddCustomItemModal(mod.id));
    } else {
      document.querySelectorAll('.fab').forEach(f => f.remove());
    }
  },

  toggleCustomItem(modId, idx) {
    const data = this.customModuleData?.[modId];
    if (!data?.items) return;
    data.items[idx].done = !data.items[idx].done;
    this.saveCustomModuleData();
    this.navigate(modId);
  },

  deleteCustomItem(modId, idx) {
    const data = this.customModuleData?.[modId];
    if (!data?.items) return;
    data.items.splice(idx, 1);
    this.saveCustomModuleData();
    this.navigate(modId);
  },

  showAddCustomItemModal(modId) {
    this.showModal('添加清单项', `
      <div class="field-label">内容</div>
      <input class="input" id="cmItemText" placeholder="要做的事..." maxlength="50">
    `, () => {
      const text = document.getElementById('cmItemText').value.trim();
      if (!text) return;
      const data = this.customModuleData?.[modId];
      if (!data) return;
      if (!data.items) data.items = [];
      data.items.push({ text, done: false });
      this.saveCustomModuleData();
      this.navigate(modId);
    });
  },

  adjustCustomCounter(modId, n) {
    const data = this.customModuleData?.[modId];
    if (!data) return;
    data.count = Math.max(0, (data.count || 0) + n);
    this.saveCustomModuleData();
    this.navigate(modId);
  },

  saveCustomNote(modId, text) {
    const data = this.customModuleData?.[modId];
    if (!data) return;
    data.notes = text;
    this.saveCustomModuleData();
  },

  exportData() {
    const data = {
      profile: this.profile,
      todos: this.todos,
      habits: this.habits,
      schedules: this.schedules,
      diaries: this.diaries,
      expenses: this.expenses,
      notes: this.notes,
      health: this.health,
      customModules: this.profile.customModules,
      customModuleData: this.customModuleData,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macaron-space-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast('数据已导出');
  },

  clearData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
      ['profile','todos','habits','schedules','diaries','expenses','notes','health','customModuleData','dailyPlans','weeklyReports','aiRules','focusGuided'].forEach(k => Store.remove(k));
      this.loadProfile();
      this.loadAllData();
      this.renderTabbar();
      this.navigate('settings');
      this.toast('数据已清空');
    }
  },

  // ============================================
  // 通用组件 — 弹窗/浮动按钮/Toast
  // ============================================
  showModal(title, bodyHTML, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${title}</div>
          <button class="modal-close" id="modalClose">✕</button>
        </div>
        <div class="modal-body">${bodyHTML}
          <div style="display:flex; gap:10px; margin-top:8px;">
            <button class="btn btn-ghost" style="flex:1;" id="modalCancel">取消</button>
            <button class="btn btn-primary" style="flex:1;" id="modalConfirm">确定</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#modalClose').onclick = close;
    overlay.querySelector('#modalCancel').onclick = close;
    overlay.querySelector('#modalConfirm').onclick = () => {
      if (onConfirm) onConfirm();
      close();
    };
    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    // 自动聚焦第一个输入框
    setTimeout(() => overlay.querySelector('.input')?.focus(), 300);
  },

  renderFab(icon, onClick) {
    // 移除已有fab
    document.querySelectorAll('.fab').forEach(f => f.remove());
    const fab = document.createElement('button');
    fab.className = 'fab';
    fab.textContent = icon;
    fab.onclick = onClick;
    document.body.appendChild(fab);
  },

  toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  },

  emptyHTML(emoji, text) {
    return `<div class="empty-state"><div class="emoji">${emoji}</div><div class="text">${text}</div></div>`;
  },

  // ============================================
  // 工具方法
  // ============================================
  _dateToISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  _priorityWeight(priority) {
    return { high: 3, medium: 2, low: 1 }[priority] || 2;
  },

  _inferTodoPriority(todo) {
    const text = (todo.text || '').toLowerCase();
    const highKeywords = ['紧急','重要','马上','今天','deadline','开会','面试','截止'];
    const lowKeywords = ['以后','随便','有空','考虑','想想'];
    if (highKeywords.some(k => text.includes(k))) return 'high';
    if (lowKeywords.some(k => text.includes(k))) return 'low';
    return 'medium';
  },

  getWeekRange(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    monday.setHours(0,0,0,0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);
    return { start: monday, end: sunday };
  },

  getWeekKey(date) {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${d.getFullYear()}-W${weekNum}`;
  },

  // ============================================
  // 月历模式
  // ============================================
  _calendarYear: null,
  _calendarMonth: null,

  changeCalendarMonth(delta) {
    this._calendarMonth += delta;
    if (this._calendarMonth < 0) { this._calendarMonth = 11; this._calendarYear--; }
    if (this._calendarMonth > 11) { this._calendarMonth = 0; this._calendarYear++; }
    this.renderTodoContent();
  },

  renderCalendarMonth() {
    const now = new Date();
    if (!this._calendarYear) this._calendarYear = now.getFullYear();
    if (this._calendarMonth === null || this._calendarMonth === undefined) this._calendarMonth = now.getMonth();

    const year = this._calendarYear;
    const month = this._calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = (year === today.getFullYear() && month === today.getMonth());

    const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    const weekHeaders = ['日','一','二','三','四','五','六'];

    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += '<div class="cal-cell empty"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = dateObj.toDateString();
      const isoDate = this._dateToISO(dateObj);
      const isToday = isCurrentMonth && d === today.getDate();

      const dayTodos = this.todos.filter(t => !t.done).length;
      const dayHabits = this.habits.filter(h => h.done[dateStr]).length;
      const daySchedules = this.schedules.filter(s =>
        s.repeat === 'daily' ||
        (s.repeat === 'once' && s.date === isoDate) ||
        (s.repeat === 'weekly' && s.date && new Date(s.date).getDay() === dateObj.getDay())
      ).length;
      const monthDay = `${month+1}月${d}日`;
      const dayDiaries = this.diaries.filter(dd => dd.dateStr === monthDay).length;

      let dots = '';
      if (dayTodos) dots += '<span class="cal-dot dot-todo"></span>';
      if (dayHabits) dots += '<span class="cal-dot dot-habit"></span>';
      if (daySchedules) dots += '<span class="cal-dot dot-schedule"></span>';
      if (dayDiaries) dots += '<span class="cal-dot dot-diary"></span>';

      cells += `<div class="cal-cell${isToday?' today':''}" onclick="App.showDayDetail('${isoDate}')">
        <div class="cal-day-num">${d}</div>
        <div class="cal-dots">${dots}</div>
      </div>`;
    }

    return `
      <div class="card">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
          <button class="chip" onclick="App.changeCalendarMonth(-1)">‹</button>
          <div style="font-size:18px; font-weight:700;">${year}年 ${monthNames[month]}</div>
          <button class="chip" onclick="App.changeCalendarMonth(1)">›</button>
        </div>
        <div class="cal-grid cal-week-header">
          ${weekHeaders.map(w => `<div class="cal-cell-header">${w}</div>`).join('')}
        </div>
        <div class="cal-grid">${cells}</div>
        <div style="display:flex; gap:14px; justify-content:center; margin-top:14px; flex-wrap:wrap; font-size:11px; color:var(--text-light);">
          <span><span class="cal-dot dot-todo"></span> 待办</span>
          <span><span class="cal-dot dot-habit"></span> 习惯</span>
          <span><span class="cal-dot dot-schedule"></span> 日程</span>
          <span><span class="cal-dot dot-diary"></span> 日记</span>
        </div>
      </div>`;
  },

  showDayDetail(isoDate) {
    const dateObj = new Date(isoDate + 'T00:00:00');
    const dateStr = dateObj.toDateString();
    const monthDay = `${dateObj.getMonth()+1}月${dateObj.getDate()}日`;
    const weekDay = '日一二三四五六'[dateObj.getDay()];

    const todos = this.todos.filter(t => !t.done);
    const habitsDone = this.habits.filter(h => h.done[dateStr]);
    const habitsUndone = this.habits.filter(h => !h.done[dateStr]);
    const schedules = this.schedules.filter(s =>
      s.repeat === 'daily' ||
      (s.repeat === 'once' && s.date === isoDate) ||
      (s.repeat === 'weekly' && s.date && new Date(s.date).getDay() === dateObj.getDay())
    ).sort((a,b) => a.time.localeCompare(b.time));
    const diaries = this.diaries.filter(d => d.dateStr === monthDay);

    let html = `<div style="text-align:center; margin-bottom:12px;">
      <div style="font-size:16px; font-weight:700;">📅 ${monthDay} 星期${weekDay}</div>
    </div>`;

    if (schedules.length) {
      html += '<div class="field-label">日程安排</div>';
      html += schedules.map(s => `
        <div class="day-detail-item">
          <span class="detail-time">${s.time}</span>
          <span style="flex:1">${s.title}</span>
        </div>`).join('');
    }
    if (todos.length) {
      html += `<div class="field-label">待办任务 (${todos.length})</div>`;
      html += todos.slice(0,6).map(t => `
        <div class="day-detail-item">
          <span>📝</span><span style="flex:1">${t.text}</span>
        </div>`).join('');
    }
    if (habitsDone.length || habitsUndone.length) {
      html += `<div class="field-label">习惯打卡 (${habitsDone.length}/${this.habits.length})</div>`;
      html += this.habits.map(h => `
        <div class="day-detail-item">
          <span>${h.emoji}</span><span style="flex:1">${h.name}</span>
          <span style="color:${h.done[dateStr]?'var(--success)':'var(--text-muted)'}; font-weight:600;">
            ${h.done[dateStr]?'✓':'○'}
          </span>
        </div>`).join('');
    }
    if (diaries.length) {
      html += '<div class="field-label">日记</div>';
      html += diaries.map(d => `
        <div class="day-detail-item">
          <span>${d.mood}</span><span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${d.content}</span>
        </div>`).join('');
    }
    if (!schedules.length && !todos.length && !this.habits.length && !diaries.length) {
      html = this.emptyHTML('🌿', '这一天没有记录');
    }

    this.showModal(monthDay + ' 事项', html, null);
    setTimeout(() => {
      const confirmBtn = document.getElementById('modalConfirm');
      const cancelBtn = document.getElementById('modalCancel');
      if (confirmBtn) confirmBtn.style.display = 'none';
      if (cancelBtn) { cancelBtn.textContent = '关闭'; cancelBtn.style.flex = '1'; }
    }, 50);
  },

  // ============================================
  // 日历同步 (.ics导出)
  // ============================================
  showCalendarExportModal() {
    this.showModal('同步到系统日历', `
      <div style="font-size:13px; line-height:1.8; color:var(--text);">
        <div class="field-label">📋 导出内容</div>
        <div>将你的 <strong>日程安排</strong> 和 <strong>习惯提醒</strong> 导出为 .ics 文件，可导入 iPhone 系统日历。</div>
        <div class="field-label">📱 iPhone 导入方法</div>
        <div style="font-size:12px; color:var(--text-light);">
          1. 点击下方「导出 .ics 文件」<br>
          2. 下载完成后点击文件<br>
          3. 系统会自动打开日历 →「添加全部」
        </div>
      </div>
      <button class="btn btn-primary" style="width:100%;" onclick="App.exportICS()">📥 导出 .ics 文件</button>
    `, null);
    setTimeout(() => {
      const confirmBtn = document.getElementById('modalConfirm');
      const cancelBtn = document.getElementById('modalCancel');
      if (confirmBtn) confirmBtn.style.display = 'none';
      if (cancelBtn) { cancelBtn.textContent = '关闭'; cancelBtn.style.flex = '1'; }
    }, 50);
  },

  exportICS() {
    const ics = this.generateICS();
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'macaron-space-calendar.ics';
    a.click();
    URL.revokeObjectURL(url);
    this.toast('日历文件已导出，可导入 iPhone 日历');
  },

  generateICS() {
    const formatICSDate = (date, time) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const [hh, mm] = (time || '09:00').split(':');
      return `${y}${m}${d}T${hh}${mm}00`;
    };
    const now = new Date();
    const dtstamp = formatICSDate(now, `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
    let events = [];

    this.schedules.forEach(s => {
      const [hh, mm] = s.time.split(':');
      const duration = 60;
      const endDate = new Date();
      endDate.setHours(parseInt(hh), parseInt(mm) + duration, 0, 0);

      if (s.repeat === 'daily' || !s.date) {
        events.push(`BEGIN:VEVENT
UID:macaron-sched-${s.id}@macaron-space
DTSTAMP:${dtstamp}
DTSTART:${formatICSDate(now, s.time)}
DTEND:${formatICSDate(endDate, String(endDate.getHours()).padStart(2,'0')+':'+String(endDate.getMinutes()).padStart(2,'0'))}
RRULE:FREQ=DAILY
SUMMARY:${s.title}
${s.note ? 'DESCRIPTION:'+s.note : ''}
END:VEVENT`);
      } else if (s.repeat === 'once') {
        const sd = new Date(s.date + 'T00:00:00');
        events.push(`BEGIN:VEVENT
UID:macaron-sched-${s.id}@macaron-space
DTSTAMP:${dtstamp}
DTSTART:${formatICSDate(sd, s.time)}
DTEND:${formatICSDate(new Date(sd.getTime()+duration*60000), s.time)}
SUMMARY:${s.title}
${s.note ? 'DESCRIPTION:'+s.note : ''}
END:VEVENT`);
      } else if (s.repeat === 'weekly') {
        const sd = new Date(s.date + 'T00:00:00');
        const byday = ['SU','MO','TU','WE','TH','FR','SA'][sd.getDay()];
        events.push(`BEGIN:VEVENT
UID:macaron-sched-${s.id}@macaron-space
DTSTAMP:${dtstamp}
DTSTART:${formatICSDate(sd, s.time)}
DTEND:${formatICSDate(new Date(sd.getTime()+duration*60000), s.time)}
RRULE:FREQ=WEEKLY;BYDAY=${byday}
SUMMARY:${s.title}
${s.note ? 'DESCRIPTION:'+s.note : ''}
END:VEVENT`);
      }
    });

    this.habits.forEach(h => {
      events.push(`BEGIN:VEVENT
UID:macaron-habit-${h.id}@macaron-space
DTSTAMP:${dtstamp}
DTSTART:${formatICSDate(now, '20:00')}
DTEND:${formatICSDate(now, '20:00')}
RRULE:FREQ=DAILY
SUMMARY:${h.emoji} ${h.name} - 习惯打卡
DESCRIPTION:别忘了完成今日「${h.name}」习惯打卡！
BEGIN:VALARM
TRIGGER:-PT0M
ACTION:DISPLAY
DESCRIPTION:${h.emoji} ${h.name} 打卡提醒
END:VALARM
END:VEVENT`);
    });

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Macaron Space//Macaron Calendar//CN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:马卡龙空间
X-WR-TIMEZONE:Asia/Shanghai
${events.join('\n')}
END:VCALENDAR`;
  },

  // ============================================
  // 每日计划
  // ============================================
  checkAndGenerateDailyPlan() {
    const isoDate = this._dateToISO(new Date());
    if (!this.dailyPlans[isoDate]) {
      this.dailyPlans[isoDate] = this.generateDailyPlan(new Date());
      this.saveDailyPlans();
    }
    if (!this.dailyPlans[isoDate].focus && !Store.get('focusGuided')) {
      setTimeout(() => {
        Store.set('focusGuided', true);
        this.showTodayFocusModal();
      }, 2500);
    }
  },

  generateDailyPlan(date) {
    const targetDate = date || new Date();
    const isoDate = this._dateToISO(targetDate);
    const dateStr = targetDate.toDateString();

    const todos = this.todos.filter(t => !t.done).map(t => ({
      type: 'todo', refId: t.id, text: t.text, emoji: '📝',
      done: t.done, priority: this._inferTodoPriority(t)
    }));
    const habits = this.habits.map(h => ({
      type: 'habit', refId: h.id, text: h.name, emoji: h.emoji,
      done: !!h.done[dateStr], priority: 'medium'
    }));
    const schedules = this.schedules.filter(s =>
      s.repeat === 'daily' ||
      (s.repeat === 'once' && s.date === isoDate) ||
      (s.repeat === 'weekly' && s.date && new Date(s.date).getDay() === targetDate.getDay())
    ).sort((a,b) => a.time.localeCompare(b.time)).map(s => ({
      type: 'schedule', refId: s.id, text: `${s.time} ${s.title}`, emoji: '📅',
      done: false, priority: 'high', time: s.time
    }));

    const items = [
      ...schedules,
      ...todos.sort((a,b) => this._priorityWeight(b.priority) - this._priorityWeight(a.priority)),
      ...habits.sort((a,b) => (a.done?1:0) - (b.done?1:0))
    ];

    return {
      focus: this.dailyPlans[isoDate]?.focus || '',
      generatedAt: Date.now(),
      items
    };
  },

  renderTodayPlanCard() {
    const today = new Date();
    const isoDate = this._dateToISO(today);
    let plan = this.dailyPlans[isoDate];
    if (!plan) {
      plan = this.generateDailyPlan(today);
      this.dailyPlans[isoDate] = plan;
      this.saveDailyPlans();
    }
    const totalItems = plan.items.length;
    const doneItems = plan.items.filter(i => i.done).length;
    const progress = totalItems > 0 ? Math.round(doneItems / totalItems * 100) : 0;

    if (totalItems === 0 && !plan.focus) {
      return `
        <div class="card" style="background: linear-gradient(135deg, var(--primary-light), var(--secondary-light)); border:none;">
          <div style="font-weight:700; margin-bottom:8px;">📋 今日计划</div>
          <div style="font-size:13px; color:var(--text-light); margin-bottom:12px;">还没有今日计划，来生成一个吧！</div>
          <button class="btn btn-primary" style="width:100%;" onclick="App.showTodayFocusModal()">✨ 生成今日计划</button>
        </div>`;
    }

    return `
      <div class="card" style="background: linear-gradient(135deg, var(--primary-light), var(--secondary-light)); border:none;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="font-weight:700;">📋 今日计划</div>
          <div style="font-size:12px; color:var(--text-light);">${doneItems}/${totalItems} · ${progress}%</div>
        </div>
        ${plan.focus ? `<div style="font-size:13px; color:var(--primary-dark); margin-bottom:10px; font-weight:600;">🎯 ${plan.focus}</div>` : ''}
        <div class="progress-bar" style="margin-bottom:12px;">
          <div class="progress-fill" style="width:${progress}%;"></div>
        </div>
        <div style="max-height:200px; overflow-y:auto;">
          ${plan.items.slice(0, 6).map((item, idx) => `
            <div class="list-item" style="padding:8px 0;">
              <div class="checkbox ${item.done?'checked':''}" onclick="App.togglePlanItem('${isoDate}', ${idx})"></div>
              <span style="font-size:13px; ${item.done?'text-decoration:line-through; color:var(--text-muted);':''}">
                ${item.emoji} ${item.text}
              </span>
            </div>
          `).join('')}
        </div>
        ${plan.items.length > 6 ? `<div style="text-align:center; margin-top:8px;"><span class="chip" onclick="App.showFullPlan()">查看全部 ${plan.items.length} 项</span></div>` : ''}
        <div style="display:flex; gap:8px; margin-top:12px;">
          <button class="chip" onclick="App.showTodayFocusModal()">✏️ 编辑重点</button>
          <button class="chip" onclick="App.regenerateTodayPlan()">🔄 重新生成</button>
        </div>
      </div>`;
  },

  showTodayFocusModal() {
    const today = new Date();
    const isoDate = this._dateToISO(today);
    const existingFocus = this.dailyPlans[isoDate]?.focus || '';
    this.showModal('今日重点', `
      <div style="font-size:13px; color:var(--text-light); margin-bottom:12px;">
        今天最重要的一件事是什么？写下你的专注目标 ✨
      </div>
      <input class="input" id="focusInput" placeholder="如：完成项目报告、读完一本书..." maxlength="30" value="${existingFocus}">
    `, () => {
      const focus = document.getElementById('focusInput').value.trim();
      if (!this.dailyPlans[isoDate]) {
        this.dailyPlans[isoDate] = this.generateDailyPlan(today);
      }
      this.dailyPlans[isoDate].focus = focus;
      this.dailyPlans[isoDate].generatedAt = Date.now();
      this.saveDailyPlans();
      this.navigate('home');
    });
  },

  togglePlanItem(isoDate, idx) {
    const plan = this.dailyPlans[isoDate];
    if (!plan || !plan.items[idx]) return;
    plan.items[idx].done = !plan.items[idx].done;
    const item = plan.items[idx];
    if (item.type === 'todo') {
      const todo = this.todos.find(t => t.id === item.refId);
      if (todo) { todo.done = item.done; this.saveTodos(); }
    } else if (item.type === 'habit') {
      const habit = this.habits.find(h => h.id === item.refId);
      const dateStr = new Date(isoDate + 'T00:00:00').toDateString();
      if (habit) {
        if (item.done) habit.done[dateStr] = true;
        else delete habit.done[dateStr];
        this.saveHabits();
      }
    }
    this.saveDailyPlans();
    this.navigate('home');
  },

  regenerateTodayPlan() {
    const isoDate = this._dateToISO(new Date());
    const oldFocus = this.dailyPlans[isoDate]?.focus || '';
    const newPlan = this.generateDailyPlan(new Date());
    newPlan.focus = oldFocus;
    this.dailyPlans[isoDate] = newPlan;
    this.saveDailyPlans();
    this.navigate('home');
    this.toast('今日计划已更新');
  },

  showFullPlan() {
    const isoDate = this._dateToISO(new Date());
    const plan = this.dailyPlans[isoDate];
    if (!plan) return;
    let html = plan.items.map((item, idx) => `
      <div class="list-item">
        <div class="checkbox ${item.done?'checked':''}" onclick="App.togglePlanItem('${isoDate}', ${idx})"></div>
        <span style="flex:1; font-size:13px; ${item.done?'text-decoration:line-through; color:var(--text-muted);':''}">
          ${item.emoji} ${item.text}
        </span>
      </div>
    `).join('');
    this.showModal('今日完整计划', html, null);
    setTimeout(() => {
      const confirmBtn = document.getElementById('modalConfirm');
      const cancelBtn = document.getElementById('modalCancel');
      if (confirmBtn) confirmBtn.style.display = 'none';
      if (cancelBtn) { cancelBtn.textContent = '关闭'; cancelBtn.style.flex = '1'; }
    }, 50);
  },

  // ============================================
  // 周总结
  // ============================================
  generateWeeklyReport() {
    const today = new Date();
    const { start, end } = this.getWeekRange(today);
    const weekDates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      weekDates.push(new Date(d));
    }

    const todoTotal = this.todos.length;
    const todoDone = this.todos.filter(t => t.done).length;

    const habitRates = this.habits.map(h => {
      let done = 0;
      weekDates.forEach(d => { if (h.done[d.toDateString()]) done++; });
      return { name: h.name, emoji: h.emoji, done, total: weekDates.length,
        rate: weekDates.length > 0 ? Math.round(done / weekDates.length * 100) : 0 };
    });

    const scheduleCount = this.schedules.filter(s => {
      if (s.repeat === 'daily') return true;
      if (s.repeat === 'once' && s.date) {
        const sd = new Date(s.date + 'T00:00:00');
        return sd >= start && sd <= end;
      }
      return false;
    }).length;

    const weekDiaries = this.diaries.filter(d => {
      return weekDates.some(wd => d.dateStr === `${wd.getMonth()+1}月${wd.getDate()}日`);
    });
    const moodTrend = weekDiaries.map(d => ({ mood: d.mood, dateStr: d.dateStr }));
    const suggestions = this.generateAISuggestions(habitRates, todoDone, todoTotal, scheduleCount, moodTrend);

    const report = {
      weekStart: this._dateToISO(start), weekEnd: this._dateToISO(end),
      weekKey: this.getWeekKey(today),
      stats: { todoTotal, todoDone, todoRate: todoTotal > 0 ? Math.round(todoDone / todoTotal * 100) : 0,
        habitRates, scheduleCount, diaryCount: weekDiaries.length },
      moodTrend, suggestions, generatedAt: Date.now()
    };
    this.weeklyReports[report.weekKey] = report;
    this.saveWeeklyReports();
    return report;
  },

  renderWeeklyReportCard() {
    const weekKey = this.getWeekKey(new Date());
    let report = this.weeklyReports[weekKey];
    const today = new Date();
    const dayOfWeek = today.getDay();
    if (!report && (dayOfWeek === 6 || dayOfWeek === 0)) {
      report = this.generateWeeklyReport();
    }
    if (!report) {
      return `
        <div class="card" onclick="App.generateWeeklyReport(); App.showWeeklyReport();" style="cursor:pointer;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="font-size:28px;">📊</div>
            <div style="flex:1;">
              <div style="font-weight:700; font-size:15px;">本周总结</div>
              <div style="font-size:12px; color:var(--text-light);">点击生成本周回顾</div>
            </div>
            <div style="color:var(--text-muted);">›</div>
          </div>
        </div>`;
    }
    return `
      <div class="card" onclick="App.showWeeklyReport()" style="cursor:pointer;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="font-size:28px;">📊</div>
          <div style="flex:1;">
            <div style="font-weight:700; font-size:15px;">本周总结</div>
            <div style="font-size:12px; color:var(--text-light);">
              待办完成率 ${report.stats.todoRate}% · 习惯 ${report.stats.habitRates.length}项
            </div>
          </div>
          <div style="color:var(--text-muted);">›</div>
        </div>
      </div>`;
  },

  showWeeklyReport() {
    const weekKey = this.getWeekKey(new Date());
    let report = this.weeklyReports[weekKey];
    if (!report) report = this.generateWeeklyReport();
    const { start, end } = this.getWeekRange(new Date());
    const dateRange = `${start.getMonth()+1}月${start.getDate()}日 - ${end.getMonth()+1}月${end.getDate()}日`;

    let html = `
      <div style="text-align:center; margin-bottom:16px;">
        <div style="font-size:13px; color:var(--text-light);">${dateRange}</div>
      </div>
      <div class="stat-grid" style="margin-bottom:16px;">
        <div class="stat-card"><div class="stat-value">${report.stats.todoDone}/${report.stats.todoTotal}</div><div class="stat-label">待办完成</div></div>
        <div class="stat-card"><div class="stat-value">${report.stats.todoRate}%</div><div class="stat-label">完成率</div></div>
        <div class="stat-card"><div class="stat-value">${report.stats.scheduleCount}</div><div class="stat-label">日程数</div></div>
        <div class="stat-card"><div class="stat-value">${report.stats.diaryCount}</div><div class="stat-label">日记篇</div></div>
      </div>`;

    if (report.stats.habitRates.length > 0) {
      html += '<div class="field-label">🌱 习惯完成率</div>';
      html += report.stats.habitRates.map(h => `
        <div style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
            <span>${h.emoji} ${h.name}</span>
            <span style="color:${h.rate>=80?'var(--success)':h.rate>=50?'var(--warning)':'var(--danger)'}; font-weight:600;">${h.rate}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${h.rate}%;"></div></div>
        </div>`).join('');
    }
    if (report.moodTrend.length > 0) {
      html += '<div class="field-label">😊 本周心情</div>';
      html += `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;">${report.moodTrend.map(m => `<span style="font-size:24px;" title="${m.dateStr}">${m.mood}</span>`).join('')}</div>`;
    }
    if (report.suggestions.length > 0) {
      html += '<div class="field-label">💡 下周建议</div>';
      html += `<div style="background: linear-gradient(135deg, var(--primary-light), var(--secondary-light)); border-radius: var(--radius-sm); padding: 16px;">${report.suggestions.map(s => `<div style="font-size:13px; line-height:1.8; margin-bottom:6px;">${s}</div>`).join('')}</div>`;
    }
    this.showModal('本周总结', html, null);
    setTimeout(() => {
      const confirmBtn = document.getElementById('modalConfirm');
      const cancelBtn = document.getElementById('modalCancel');
      if (confirmBtn) confirmBtn.style.display = 'none';
      if (cancelBtn) { cancelBtn.textContent = '关闭'; cancelBtn.style.flex = '1'; }
    }, 50);
  },

  // ============================================
  // 本地AI规则引擎
  // ============================================
  generateAISuggestions(habitRates, todoDone, todoTotal, scheduleCount, moodTrend) {
    const suggestions = [];
    if (habitRates.length > 0) {
      const avgRate = habitRates.reduce((s, h) => s + h.rate, 0) / habitRates.length;
      const bestHabit = habitRates.reduce((a, b) => a.rate > b.rate ? a : b);
      const worstHabit = habitRates.reduce((a, b) => a.rate < b.rate ? a : b);
      if (avgRate >= 80) {
        suggestions.push(`🌟 本周习惯完成率 ${Math.round(avgRate)}%，表现优秀！特别是「${bestHabit.emoji} ${bestHabit.name}」完成率最高，继续保持！`);
      } else if (avgRate >= 50) {
        suggestions.push(`💪 本周习惯完成率 ${Math.round(avgRate)}%，还有提升空间。「${worstHabit.emoji} ${worstHabit.name}」完成率较低，下周可以优先关注。`);
      } else {
        suggestions.push(`📌 本周习惯完成率仅 ${Math.round(avgRate)}%，建议下周从最容易坚持的习惯开始，逐步恢复节奏。`);
      }
      const brokenHabits = habitRates.filter(h => h.done < h.total && h.done >= Math.floor(h.total / 2));
      if (brokenHabits.length > 0) {
        suggestions.push(`⚠️ 「${brokenHabits.map(h => h.emoji+' '+h.name).join('、')}」本周有中断，尝试设置固定时间提醒来保持连续性。`);
      }
    }
    if (todoTotal > 0) {
      const todoRate = Math.round(todoDone / todoTotal * 100);
      if (todoRate >= 80) suggestions.push(`✅ 本周待办完成率 ${todoRate}%，执行力很强！下周可以尝试挑战更多目标。`);
      else if (todoRate >= 50) suggestions.push(`📝 本周待办完成率 ${todoRate}%，建议下周将大任务拆分为小步骤，提高完成率。`);
      else suggestions.push(`🎯 本周待办完成率 ${todoRate}%，积压较多。建议下周初先清理重要紧急的任务，再安排新的。`);
    }
    if (scheduleCount > 0) {
      if (scheduleCount >= 10) suggestions.push(`📅 本周日程安排较密集（${scheduleCount}项），注意预留休息时间，避免过度疲劳。`);
      else if (scheduleCount <= 3 && todoTotal > 5) suggestions.push(`🕐 本周日程较少但待办较多，建议将待办安排到具体时间段，提高执行效率。`);
      else suggestions.push(`📅 本周日程安排合理（${scheduleCount}项），节奏适中。`);
    }
    if (moodTrend.length >= 2) {
      const goodMoods = ['😊','🥰','😎'];
      const badMoods = ['😢','😡','😭'];
      const goodCount = moodTrend.filter(m => goodMoods.includes(m.mood)).length;
      const badCount = moodTrend.filter(m => badMoods.includes(m.mood)).length;
      if (badCount > goodCount) suggestions.push('💚 本周心情波动较大，建议下周多安排一些让自己放松的活动，注意情绪调节。');
      else if (goodCount > 0) suggestions.push('😊 本周心情整体不错！继续保持积极的心态，享受每一天。');
    }
    if (suggestions.length === 0) suggestions.push('🌟 继续记录你的生活，数据越多，建议越精准！');
    if (habitRates.length > 0) {
      const target = habitRates.find(h => h.rate < 50 && h.rate > 0);
      if (target) suggestions.push(`🎯 下周建议：将「${target.emoji} ${target.name}」的完成目标设为每周4天，循序渐进。`);
    }
    return suggestions;
  },

  getHabitEncouragement(habit) {
    const streak = this.getStreak(habit);
    const today = new Date().toDateString();
    const doneToday = !!habit.done[today];
    let done7 = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (habit.done[d.toDateString()]) done7++;
    }
    const rate7 = Math.round(done7 / 7 * 100);
    if (!doneToday && streak === 0) return { type: 'remind', text: '今天还没打卡，开始吧！', color: 'var(--danger)' };
    if (doneToday && streak >= 7) return { type: 'praise', text: `连续${streak}天！太棒了！🎉`, color: 'var(--success)' };
    if (doneToday && streak >= 3) return { type: 'praise', text: `连续${streak}天，保持住！`, color: 'var(--success)' };
    if (!doneToday && streak >= 3) return { type: 'remind', text: `已连续${streak}天，今天别断了！`, color: 'var(--warning)' };
    if (rate7 >= 80) return { type: 'praise', text: `7天完成率${rate7}%，优秀！`, color: 'var(--success)' };
    if (rate7 < 30) return { type: 'remind', text: `7天仅完成${rate7}%，加油！`, color: 'var(--warning)' };
    return null;
  },

  getScheduleDensityAdvice() {
    const today = new Date();
    const isoDate = this._dateToISO(today);
    const daySchedules = this.schedules.filter(s =>
      s.repeat === 'daily' || (s.repeat === 'once' && s.date === isoDate) ||
      (s.repeat === 'weekly' && s.date && new Date(s.date).getDay() === today.getDay())
    );
    const count = daySchedules.length;
    if (count === 0) return '今天没有日程安排，适合处理积压的待办任务。';
    if (count <= 3) return `今天有${count}个日程，时间比较充裕，可以安排一些重要任务。`;
    if (count <= 6) return `今天有${count}个日程，节奏适中，注意合理安排间隙时间。`;
    return `今天有${count}个日程，安排较满，建议优先处理最重要的1-2个任务。`;
  },

};

// ---- 启动 ----
document.addEventListener('DOMContentLoaded', () => App.init());
