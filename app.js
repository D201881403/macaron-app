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
    this.schedules = Store.get('schedules', []);
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
  },

  saveTodos() { Store.set('todos', this.todos); },
  saveHabits() { Store.set('habits', this.habits); },
  saveSchedules() { Store.set('schedules', this.schedules); },
  saveDiaries() { Store.set('diaries', this.diaries); },
  saveExpenses() { Store.set('expenses', this.expenses); },
  saveNotes() { Store.set('notes', this.notes); },
  saveHealth() { Store.set('health', this.health); },

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
    (renderers[pageId] || renderers.home)();
    return wrap;
  },

  // ---- 渲染底部导航 ----
  renderTabbar() {
    const nav = document.getElementById('tabbar');
    nav.innerHTML = '';
    this.tabs.forEach(tab => {
      if (!this.profile.modules[tab.id] && tab.id !== 'settings') return;
      const el = document.createElement('div');
      el.className = 'tab' + (this.currentPage === tab.id ? ' active' : '');
      el.dataset.page = tab.id;
      el.innerHTML = `<div class="tab-icon">${tab.icon}</div><div class="tab-label">${tab.label}</div>`;
      el.addEventListener('click', () => this.navigate(tab.id));
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
                ${s.note ? `<div style="font-size:12px; color:var(--text-light); margin-top:2px;">${s.note}</div>` : ''}
              </div>
              <button class="delete-btn" onclick="App.deleteSchedule(${s.id})">✕</button>
            </div>
          </div>
        `).join('');
    }
    return '';
  },

  switchTodoTab(tab) {
    this._todoTab = tab;
    const el = document.getElementById('todoContent');
    if (el) el.innerHTML = this.getTodoContentHtml(tab);
    this.renderFab('➕', () => {
      if (tab === 'tasks') this.showAddTodoModal();
      else if (tab === 'habits') this.showAddHabitModal();
      else this.showAddScheduleModal();
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
      <div class="field-label">备注（可选）</div>
      <textarea class="input" id="schedNote" placeholder="附加信息..." maxlength="100"></textarea>
    `, () => {
      const title = document.getElementById('schedTitle').value.trim();
      const time = document.getElementById('schedTime').value;
      const note = document.getElementById('schedNote').value.trim();
      if (!title) return;
      this.schedules.push({ id: Date.now(), title, time, note });
      this.saveSchedules();
      this.renderTodoContent();
    });
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
      ['profile','todos','habits','schedules','diaries','expenses','notes','health'].forEach(k => Store.remove(k));
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
  }
};

// ---- 启动 ----
document.addEventListener('DOMContentLoaded', () => App.init());
