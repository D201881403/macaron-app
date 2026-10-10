/* ============================================
   马卡龙空间 — 应用核心逻辑
   ============================================ */

// ============================================
// 农历日历引擎 — 节气/节假日/农历转换
// ============================================
const LunarCalendar = {
  // 农历 1900-2099 编码表（16位/年：bits15-4=12月大小月, bits3-0=闰月月份）
  lunarInfo: [
    0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
    0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
    0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
    0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
    0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
    0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
    0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b53,0x056a0,
    0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
    0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
    0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
    0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
    0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
    0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
    0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
    0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
    0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
    0x0a2e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
    0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
    0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e0,0x0d160,
    0x0e968,0x0d520,0x0daa0,0x056d0,0x04af0,0x0a9b4,0x0a4d0,0x0a4b0,0x0aa50,0x1b255
  ],
  lunarMonthNames: ['正','二','三','四','五','六','七','八','九','十','冬','腊'],
  lunarDayNames: ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'],
  tianGan: ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
  diZhi: ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],
  zodiac: ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'],

  // 二十四节气 (2025-2027)
  solarTerms: {
    '2025-01-05':'小寒','2025-01-20':'大寒','2025-02-03':'立春','2025-02-18':'雨水','2025-03-05':'惊蛰','2025-03-20':'春分','2025-04-04':'清明','2025-04-20':'谷雨','2025-05-05':'立夏','2025-05-21':'小满','2025-06-05':'芒种','2025-06-21':'夏至','2025-07-07':'小暑','2025-07-22':'大暑','2025-08-07':'立秋','2025-08-23':'处暑','2025-09-07':'白露','2025-09-23':'秋分','2025-10-08':'寒露','2025-10-23':'霜降','2025-11-07':'立冬','2025-11-22':'小雪','2025-12-07':'大雪','2025-12-21':'冬至',
    '2026-01-05':'小寒','2026-01-20':'大寒','2026-02-04':'立春','2026-02-18':'雨水','2026-03-05':'惊蛰','2026-03-20':'春分','2026-04-05':'清明','2026-04-20':'谷雨','2026-05-05':'立夏','2026-05-21':'小满','2026-06-05':'芒种','2026-06-21':'夏至','2026-07-07':'小暑','2026-07-23':'大暑','2026-08-07':'立秋','2026-08-23':'处暑','2026-09-07':'白露','2026-09-23':'秋分','2026-10-08':'寒露','2026-10-23':'霜降','2026-11-07':'立冬','2026-11-22':'小雪','2026-12-07':'大雪','2026-12-22':'冬至',
    '2027-01-05':'小寒','2027-01-20':'大寒','2027-02-04':'立春','2027-02-19':'雨水','2027-03-06':'惊蛰','2027-03-21':'春分','2027-04-05':'清明','2027-04-20':'谷雨','2027-05-06':'立夏','2027-05-21':'小满','2027-06-06':'芒种','2027-06-21':'夏至','2027-07-07':'小暑','2027-07-23':'大暑','2027-08-08':'立秋','2027-08-23':'处暑','2027-09-08':'白露','2027-09-23':'秋分','2027-10-08':'寒露','2027-10-23':'霜降','2027-11-07':'立冬','2027-11-22':'小雪','2027-12-07':'大雪','2027-12-22':'冬至'
  },

  // 法定节假日 (2025-2027)
  holidays: {
    '2025-01-01':{name:'元旦',type:'holiday'},'2025-01-28':{name:'除夕',type:'holiday'},'2025-01-29':{name:'春节',type:'holiday'},'2025-01-30':{name:'春节',type:'holiday'},'2025-01-31':{name:'春节',type:'holiday'},'2025-02-01':{name:'春节',type:'holiday'},'2025-02-02':{name:'春节',type:'holiday'},'2025-02-03':{name:'春节',type:'holiday'},'2025-02-04':{name:'春节',type:'holiday'},'2025-04-04':{name:'清明节',type:'holiday'},'2025-04-05':{name:'清明节',type:'holiday'},'2025-04-06':{name:'清明节',type:'holiday'},'2025-05-01':{name:'劳动节',type:'holiday'},'2025-05-02':{name:'劳动节',type:'holiday'},'2025-05-03':{name:'劳动节',type:'holiday'},'2025-05-04':{name:'劳动节',type:'holiday'},'2025-05-05':{name:'劳动节',type:'holiday'},'2025-05-31':{name:'端午节',type:'holiday'},'2025-06-01':{name:'端午节',type:'holiday'},'2025-06-02':{name:'端午节',type:'holiday'},'2025-10-01':{name:'国庆节',type:'holiday'},'2025-10-02':{name:'国庆节',type:'holiday'},'2025-10-03':{name:'国庆节',type:'holiday'},'2025-10-04':{name:'中秋节',type:'holiday'},'2025-10-05':{name:'国庆节',type:'holiday'},'2025-10-06':{name:'国庆节',type:'holiday'},'2025-10-07':{name:'国庆节',type:'holiday'},'2025-10-08':{name:'国庆节',type:'holiday'},
    '2025-01-26':{name:'补班',type:'workday'},'2025-02-08':{name:'补班',type:'workday'},'2025-04-27':{name:'补班',type:'workday'},'2025-09-28':{name:'补班',type:'workday'},'2025-10-11':{name:'补班',type:'workday'},
    '2026-01-01':{name:'元旦',type:'holiday'},'2026-01-02':{name:'元旦',type:'holiday'},'2026-01-03':{name:'元旦',type:'holiday'},'2026-02-16':{name:'除夕',type:'holiday'},'2026-02-17':{name:'春节',type:'holiday'},'2026-02-18':{name:'春节',type:'holiday'},'2026-02-19':{name:'春节',type:'holiday'},'2026-02-20':{name:'春节',type:'holiday'},'2026-02-21':{name:'春节',type:'holiday'},'2026-02-22':{name:'春节',type:'holiday'},'2026-02-23':{name:'春节',type:'holiday'},'2026-04-04':{name:'清明节',type:'holiday'},'2026-04-05':{name:'清明节',type:'holiday'},'2026-04-06':{name:'清明节',type:'holiday'},'2026-05-01':{name:'劳动节',type:'holiday'},'2026-05-02':{name:'劳动节',type:'holiday'},'2026-05-03':{name:'劳动节',type:'holiday'},'2026-05-04':{name:'劳动节',type:'holiday'},'2026-05-05':{name:'劳动节',type:'holiday'},'2026-06-19':{name:'端午节',type:'holiday'},'2026-06-20':{name:'端午节',type:'holiday'},'2026-06-21':{name:'端午节',type:'holiday'},'2026-09-25':{name:'中秋节',type:'holiday'},'2026-09-26':{name:'中秋节',type:'holiday'},'2026-09-27':{name:'中秋节',type:'holiday'},'2026-10-01':{name:'国庆节',type:'holiday'},'2026-10-02':{name:'国庆节',type:'holiday'},'2026-10-03':{name:'国庆节',type:'holiday'},'2026-10-04':{name:'国庆节',type:'holiday'},'2026-10-05':{name:'国庆节',type:'holiday'},'2026-10-06':{name:'国庆节',type:'holiday'},'2026-10-07':{name:'国庆节',type:'holiday'},
    '2026-02-15':{name:'补班',type:'workday'},'2026-02-28':{name:'补班',type:'workday'},'2026-04-26':{name:'补班',type:'workday'},'2026-10-10':{name:'补班',type:'workday'},
    '2027-01-01':{name:'元旦',type:'holiday'},'2027-01-02':{name:'元旦',type:'holiday'},'2027-01-03':{name:'元旦',type:'holiday'},'2027-02-05':{name:'除夕',type:'holiday'},'2027-02-06':{name:'春节',type:'holiday'},'2027-02-07':{name:'春节',type:'holiday'},'2027-02-08':{name:'春节',type:'holiday'},'2027-02-09':{name:'春节',type:'holiday'},'2027-02-10':{name:'春节',type:'holiday'},'2027-02-11':{name:'春节',type:'holiday'},'2027-02-12':{name:'春节',type:'holiday'},'2027-04-05':{name:'清明节',type:'holiday'},'2027-04-06':{name:'清明节',type:'holiday'},'2027-04-07':{name:'清明节',type:'holiday'},'2027-05-01':{name:'劳动节',type:'holiday'},'2027-05-02':{name:'劳动节',type:'holiday'},'2027-05-03':{name:'劳动节',type:'holiday'},'2027-05-04':{name:'劳动节',type:'holiday'},'2027-05-05':{name:'劳动节',type:'holiday'},'2027-06-09':{name:'端午节',type:'holiday'},'2027-06-10':{name:'端午节',type:'holiday'},'2027-06-11':{name:'端午节',type:'holiday'},'2027-09-15':{name:'中秋节',type:'holiday'},'2027-09-16':{name:'中秋节',type:'holiday'},'2027-09-17':{name:'中秋节',type:'holiday'},'2027-10-01':{name:'国庆节',type:'holiday'},'2027-10-02':{name:'国庆节',type:'holiday'},'2027-10-03':{name:'国庆节',type:'holiday'},'2027-10-04':{name:'国庆节',type:'holiday'},'2027-10-05':{name:'国庆节',type:'holiday'},'2027-10-06':{name:'国庆节',type:'holiday'},'2027-10-07':{name:'国庆节',type:'holiday'}
  },

  // 农历传统节日
  lunarFestivals: { '1-1':'春节','1-15':'元宵节','5-5':'端午节','7-7':'七夕节','8-15':'中秋节','9-9':'重阳节','12-8':'腊八节' },

  lunarYearDays(y) {
    let sum = 348;
    for (let i = 0x8000; i > 0x8; i >>= 1) sum += (this.lunarInfo[y - 1900] & i) ? 1 : 0;
    return sum + this.leapDays(y);
  },
  leapDays(y) { if (this.leapMonth(y)) return (this.lunarInfo[y - 1900] & 0x10000) ? 30 : 29; return 0; },
  leapMonth(y) { return this.lunarInfo[y - 1900] & 0xf; },
  monthDays(y, m) { return (this.lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29; },

  solarToLunar(date) {
    const base = new Date(1900, 0, 31);
    let offset = Math.floor((date - base) / 86400000);
    let year = 1900, temp = 0;
    for (; year < 2100 && offset > 0; year++) { temp = this.lunarYearDays(year); offset -= temp; }
    if (offset < 0) { offset += temp; year--; }
    let month = 1, isLeap = false;
    const leap = this.leapMonth(year);
    for (; month < 13 && offset > 0; month++) {
      if (leap > 0 && month === leap + 1 && !isLeap) { --month; isLeap = true; temp = this.leapDays(year); }
      else { temp = this.monthDays(year, month); }
      if (isLeap && month === leap + 1) isLeap = false;
      offset -= temp;
    }
    if (offset === 0 && leap > 0 && month === leap + 1) { if (isLeap) isLeap = false; else { isLeap = true; --month; } }
    if (offset < 0) { offset += temp; --month; }
    const day = offset + 1;
    const monthName = (isLeap ? '闰' : '') + this.lunarMonthNames[month - 1] + '月';
    const dayName = this.lunarDayNames[day - 1];
    const zodiacAnimal = this.zodiac[(year - 4) % 12];
    const ganZhi = this.tianGan[(year - 4) % 10] + this.diZhi[(year - 4) % 12];
    let festival = this.lunarFestivals[month + '-' + day] || '';
    if (!festival && month === 12 && day === this.monthDays(year, 12)) festival = '除夕';
    return { year, month, day, isLeap, monthName, dayName, zodiac: zodiacAnimal, ganZhi, festival };
  },

  getDayInfo(dateOrIso) {
    const dateObj = typeof dateOrIso === 'string' ? new Date(dateOrIso + 'T00:00:00') : dateOrIso;
    const isoDate = typeof dateOrIso === 'string' ? dateOrIso : dateObj.getFullYear() + '-' + String(dateObj.getMonth()+1).padStart(2,'0') + '-' + String(dateObj.getDate()).padStart(2,'0');
    const lunar = this.solarToLunar(dateObj);
    const solarTerm = this.solarTerms[isoDate] || '';
    const holiday = this.holidays[isoDate] || null;
    let specialLabel = '', specialType = '';
    if (holiday && holiday.type === 'holiday') { specialLabel = holiday.name; specialType = 'holiday'; }
    else if (lunar.festival) { specialLabel = lunar.festival; specialType = 'lunar-festival'; }
    else if (solarTerm) { specialLabel = solarTerm; specialType = 'solar-term'; }
    else if (holiday && holiday.type === 'workday') { specialLabel = holiday.name; specialType = 'workday'; }
    return { lunar, solarTerm, holiday, specialLabel, specialType,
      shortLabel: specialLabel || lunar.dayName };
  }
};


// ---- 数据存储层 ----

// ============================================
// 账号同步模块 — 纯本地实现的账号系统
// 数据按账号存储在 localStorage，同一账号密码在同一浏览器可恢复数据
// ============================================

// 简单字符串哈希函数（非加密安全，仅用于本地存储隔离）
function _hashStr(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
    h = h & h; // 转 32 位整数
  }
  return 'h' + (h >>> 0).toString(36);
}

const AuthSync = {
  TOKEN_KEY: 'macaron_auth_token',
  USER_KEY: 'macaron_auth_user',
  ACCOUNTS_KEY: 'macaron_accounts', // { [email]: { passwordHash, data: {...}, updatedAt } }
  SERVER_URL_KEY: 'macaron_server_url',

  // ---- 服务器地址管理 ----
  getServerUrl() {
    return Store.get('serverUrl', '');
  },
  setServerUrl(url) {
    Store.set('serverUrl', url || '');
  },
  isRemoteMode() {
    return !!this.getServerUrl();
  },

  // ---- 远程 API 调用 ----
  async _api(path, opts = {}) {
    const base = this.getServerUrl().replace(/\/+$/, '');
    const url = base + path;
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const resp = await fetch(url, { ...opts, headers });
    const data = await resp.json();
    if (!resp.ok || data.error) throw new Error(data.error || ('HTTP ' + resp.status));
    return data;
  },

  // ---- Token 管理 ----
  saveAuth(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY) || '';
  },
  getUser() {
    try { return JSON.parse(localStorage.getItem(this.USER_KEY) || 'null'); } catch(e) { return null; }
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  // ---- 读取所有账号字典 ----
  _getAccounts() {
    try { return JSON.parse(localStorage.getItem(this.ACCOUNTS_KEY) || '{}'); }
    catch(e) { return {}; }
  },
  _saveAccounts(accounts) {
    localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
  },
  _getAccount(email) {
    const accounts = this._getAccounts();
    return accounts[email] || null;
  },

  // ---- 注册 ----
  // 返回 { token, user }；失败抛 Error
  async signUp(email, password) {
    email = (email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) throw new Error('请输入有效邮箱');
    if (!password || password.length < 6) throw new Error('密码至少需要6位');

    // 远程模式
    if (this.isRemoteMode()) {
      const resp = await this._api('/api/register', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      // 注册成功后自动登录
      return await this.signIn(email, password);
    }

    // 本地模式
    const accounts = this._getAccounts();
    if (accounts[email]) throw new Error('该邮箱已注册，请直接登录');
    const passwordHash = _hashStr(password);
    accounts[email] = {
      passwordHash,
      data: null, // 首次注册无数据
      updatedAt: new Date().toISOString()
    };
    this._saveAccounts(accounts);
    const token = _hashStr(email + ':' + password + ':' + Date.now());
    const user = { email };
    this.saveAuth(token, user);
    return { token, user };
  },

  // ---- 登录 ----
  // 返回 { token, user }；失败抛 Error
  async signIn(email, password) {
    email = (email || '').trim().toLowerCase();
    if (!email || !password) throw new Error('请输入邮箱和密码');

    // 远程模式
    if (this.isRemoteMode()) {
      const resp = await this._api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      this.saveAuth(resp.token, resp.user);
      return { token: resp.token, user: resp.user };
    }

    // 本地模式
    const accounts = this._getAccounts();
    const account = accounts[email];
    if (!account) throw new Error('账号不存在，请先注册');
    if (account.passwordHash !== _hashStr(password)) throw new Error('密码错误');
    const token = _hashStr(email + ':' + password + ':' + Date.now());
    const user = { email };
    this.saveAuth(token, user);
    return { token, user };
  },

  // ---- 上传数据（保存到该账号的快照） ----
  // ---- 上传数据（保存到该账号的快照） ----
  async upload(appData, deepseekKey) {
    if (!this.isLoggedIn()) throw new Error('未登录');
    const user = this.getUser();
    if (!user || !user.email) throw new Error('账号信息异常');

    // 远程模式
    if (this.isRemoteMode()) {
      const resp = await this._api('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ data: appData, deepseekKey })
      });
      return { ok: true, updated_at: resp.updated_at };
    }

    // 本地模式
    const accounts = this._getAccounts();
    const account = accounts[user.email];
    if (!account) throw new Error('账号不存在');
    account.data = appData || {};
    account.deepseekKey = deepseekKey || '';
    account.updatedAt = new Date().toISOString();
    accounts[user.email] = account;
    this._saveAccounts(accounts);
    return { ok: true, updated_at: account.updatedAt };
  },

  // ---- 下载数据（读取该账号的快照） ----
  // 返回 { data, updated_at, deepseek_key } 或抛错
  async download() {
    if (!this.isLoggedIn()) throw new Error('未登录');
    const user = this.getUser();
    if (!user || !user.email) throw new Error('账号信息异常');

    // 远程模式
    if (this.isRemoteMode()) {
      return await this._api('/api/download', { method: 'GET' });
    }

    // 本地模式
    const accounts = this._getAccounts();
    const account = accounts[user.email];
    if (!account) throw new Error('账号不存在');
    return {
      data: account.data || null,
      updated_at: account.updatedAt || null,
      deepseek_key: account.deepseekKey || ''
    };
  },

  // ---- 修改密码 ----
  async changePassword(oldPassword, newPassword) {
    if (!this.isLoggedIn()) throw new Error('未登录');
    if (!newPassword || newPassword.length < 6) throw new Error('新密码至少需要6位');
    const user = this.getUser();
    if (!user || !user.email) throw new Error('账号信息异常');

    // 远程模式
    if (this.isRemoteMode()) {
      await this._api('/api/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword })
      });
      return { ok: true };
    }

    // 本地模式
    const accounts = this._getAccounts();
    const account = accounts[user.email];
    if (!account) throw new Error('账号不存在');
    if (account.passwordHash !== _hashStr(oldPassword)) throw new Error('当前密码错误');
    account.passwordHash = _hashStr(newPassword);
    accounts[user.email] = account;
    this._saveAccounts(accounts);
    // 更新 token
    const token = _hashStr(user.email + ':' + newPassword + ':' + Date.now());
    this.saveAuth(token, user);
    return { ok: true };
  },

  // ---- 验证 token 是否有效 ----
  verifyToken() {
    if (!this.isLoggedIn()) return false;
    const user = this.getUser();
    if (!user || !user.email) { this.logout(); return false; }
    // 远程模式：只检查 token 存在即可（实际有效性由 API 调用时验证）
    if (this.isRemoteMode()) return true;
    // 本地模式：检查账号是否存在
    const account = this._getAccount(user.email);
    if (!account) { this.logout(); return false; }
    return true;
  }
};


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
  reminders: [],
  _reminderCheckTimer: null,
  _syncInProgress: false,
  _lastSyncTime: null,

  init() {
    this.loadProfile();
    this.loadAllData();
    this.renderTabbar();
    this.navigate(this.profile.lastPage || 'home');
    this.startReminderChecker();
    // 初始化 AudioContext（在用户交互后恢复）
    this._audioCtx = null;
    document.addEventListener('click', () => {
      if (!this._audioCtx) {
        try { this._audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
      }
      if (this._audioCtx && this._audioCtx.state === 'suspended') {
        this._audioCtx.resume();
      }
    }, { once: false });

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

    // 尝试从云端恢复数据
    if (AuthSync.isLoggedIn()) {
      setTimeout(() => this.restoreFromCloud(), 500);
    }
    // 页面可见性变化时自动同步
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && AuthSync.isLoggedIn()) {
        setTimeout(() => this.restoreFromCloud(false), 1000);
      } else if (document.visibilityState === 'hidden' && AuthSync.isLoggedIn()) {
        this.backupToCloud(true);
      }
    });

    // PWA 数据迁移检测：如果独立模式下数据为空，尝试从非独立模式恢复
    if (this.isStandalone && this._isIOS()) {
      const hasData = this.todos.length > 0 || this.habits.length > 1 || this.diaries.length > 0;
      if (!hasData && !Store.get('pwaDataChecked')) {
        Store.set('pwaDataChecked', true);
        // 在独立模式下，数据应该已经通过 localStorage 共享
        // 如果确实为空，显示提示
        setTimeout(() => {
          if (this.todos.length === 0 && this.habits.length <= 1 && this.diaries.length === 0) {
            this.showModal('📱 欢迎使用马卡龙空间', `
              <div style="font-size:13px; line-height:1.8; color:var(--text);">
                <p>这是你第一次从主屏幕打开 App！</p>
                <p style="color:var(--text-light);">如果在 Safari 中已有数据但这里看不到，请：</p>
                <p>1. 回到 Safari 打开 App</p>
                <p>2. 进入「我的」→「导出数据」</p>
                <p>3. 再从主屏幕打开 → 「我的」→「导入」</p>
                <p style="margin-top:8px; color:var(--primary-dark);">或者直接从这里开始记录新数据 📝</p>
              </div>
            `, null);
            setTimeout(() => {
              const btn = document.getElementById('modalConfirm');
              if (btn) { btn.textContent = '开始使用'; btn.style.flex = '1'; }
              const cancelBtn = document.getElementById('modalCancel');
              if (cancelBtn) cancelBtn.style.display = 'none';
            }, 50);
          }
        }, 1000);
      }
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
    Store.set('_lastLocalSave', Date.now());
    // 自动云端备份（静默）
    if (AuthSync.isLoggedIn()) {
      setTimeout(() => this.backupToCloud(true), 2000);
    }
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
      sleep: 7, sleepGoal: 8,
      calories: 0, caloriesGoal: 2000,
      records: []
    });
    this.customModuleData = Store.get('customModuleData', {});
    this.reminders = Store.get('reminders', []);
    this.readings = Store.get('readings', []);
    this.fitnessLog = Store.get('fitnessLog', { weights: [], measurements: [], meals: [], sleepLog: [] });
    this.weeklyReports = Store.get('weeklyReports', {});
    this.aiRules = Store.get('aiRules', { habitAnalysis: null, scheduleDensity: null, lastUpdated: null });
    // v6 新增：上下班打卡 & 每日案例
    // 上下班时间以打卡月历中每天手动输入的时间为准，无需另外设置
    this.attendance = Store.get('attendance', {
      records: {} // { 'YYYY-MM-DD': { checkIn: '09:02', checkOut: '18:10', note: '' } }
    });
    // 兼容旧版本数据：移除单独设置的上下班时间字段
    delete this.attendance.workTime;
    delete this.attendance.offTime;
    this.dailyCases = Store.get('dailyCases', []); // [{id, date, caseNo, caseName, project, caseRecorded, consentForm, deductions:{a,b,c}, note}]
  },

  saveTodos() { Store.set('todos', this.todos); },
  saveHabits() { Store.set('habits', this.habits); },
  saveSchedules() { Store.set('schedules', this.schedules); },
  saveDiaries() { Store.set('diaries', this.diaries); },
  saveExpenses() { Store.set('expenses', this.expenses); },
  saveNotes() { Store.set('notes', this.notes); },
  saveHealth() { Store.set('health', this.health); },
  saveCustomModuleData() { Store.set('customModuleData', this.customModuleData); },
  saveReminders() { Store.set('reminders', this.reminders); },
  saveReadings() { Store.set('readings', this.readings); },
  saveFitnessLog() { Store.set('fitnessLog', this.fitnessLog); },
  saveWeeklyReports() { Store.set('weeklyReports', this.weeklyReports); },
  saveAiRules() { Store.set('aiRules', this.aiRules); },
  saveAttendance() { Store.set('attendance', this.attendance); },
  saveDailyCases() { Store.set('dailyCases', this.dailyCases); },

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

      <!-- 快捷入口 -->
      <div class="card">
        <div class="card-title"><span class="card-icon">⚡</span>快捷入口</div>
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 8px; text-align:center;">
          <div onclick="App.navigate('todo')" style="cursor:pointer; padding: 12px 4px; border-radius: 12px; background: var(--primary-light); transition: transform 0.15s;">
            <div style="font-size: 28px; margin-bottom: 4px;">📝</div>
            <div style="font-size: 11px; color: var(--text-light);">待办</div>
          </div>
          <div onclick="App._goAttendance()" style="cursor:pointer; padding: 12px 4px; border-radius: 12px; background: var(--primary-light); transition: transform 0.15s;">
            <div style="font-size: 28px; margin-bottom: 4px;">⏰</div>
            <div style="font-size: 11px; color: var(--text-light);">打卡</div>
          </div>
          <div onclick="App.goToLife('diary')" style="cursor:pointer; padding: 12px 4px; border-radius: 12px; background: var(--secondary-light); transition: transform 0.15s;">
            <div style="font-size: 28px; margin-bottom: 4px;">📔</div>
            <div style="font-size: 11px; color: var(--text-light);">日记</div>
          </div>
          <div onclick="App.goToLife('note')" style="cursor:pointer; padding: 12px 4px; border-radius: 12px; background: var(--primary-light); transition: transform 0.15s;">
            <div style="font-size: 28px; margin-bottom: 4px;">📝</div>
            <div style="font-size: 11px; color: var(--text-light);">笔记</div>
          </div>
          <div onclick="App.goToLife('case')" style="cursor:pointer; padding: 12px 4px; border-radius: 12px; background: var(--secondary-light); transition: transform 0.15s;">
            <div style="font-size: 28px; margin-bottom: 4px;">📋</div>
            <div style="font-size: 11px; color: var(--text-light);">案例</div>
          </div>
          <div onclick="App.navigate('health')" style="cursor:pointer; padding: 12px 4px; border-radius: 12px; background: var(--secondary-light); transition: transform 0.15s;">
            <div style="font-size: 28px; margin-bottom: 4px;">💧</div>
            <div style="font-size: 11px; color: var(--text-light);">健康</div>
          </div>
          <div onclick="App.navigate('settings')" style="cursor:pointer; padding: 12px 4px; border-radius: 12px; background: var(--primary-light); transition: transform 0.15s;">
            <div style="font-size: 28px; margin-bottom: 4px;">⚙️</div>
            <div style="font-size: 11px; color: var(--text-light);">我的</div>
          </div>
        </div>
      </div>

      <!-- 今日打卡 -->
      ${this._renderTodayAttendanceCard()}

      <!-- 今日概览（紧凑版） -->
      <div class="card">
        <div class="card-title"><span class="card-icon">📊</span>今日概览</div>
        <div style="display:flex; justify-content:space-around; text-align:center; gap:8px;">
          <div style="flex:1;">
            <div style="font-size:20px; font-weight:700; color:var(--primary-dark);">${this.todos.filter(t => !t.done).length}</div>
            <div style="font-size:10px; color:var(--text-light);">待办</div>
          </div>
          <div style="flex:1;">
            <div style="font-size:20px; font-weight:700; color:var(--success);">${this.getHabitDoneToday()}</div>
            <div style="font-size:10px; color:var(--text-light);">习惯</div>
          </div>
          <div style="flex:1;">
            <div style="font-size:20px; font-weight:700; color:var(--danger);">${this.notes.length}</div>
            <div style="font-size:10px; color:var(--text-light);">笔记</div>
          </div>
          <div style="flex:1;">
            <div style="font-size:20px; font-weight:700; color:var(--secondary);">${(this._getTodayActivity() || {}).steps || '—'}</div>
            <div style="font-size:10px; color:var(--text-light);">步数</div>
          </div>
        </div>
      </div>

      <!-- 本周总结 -->
      ${this.renderWeeklyReportCard()}

      <!-- 个人资料 -->
      <div class="card" style="text-align:center; padding: 24px 16px;">
        <div class="avatar avatar-lg" style="margin: 0 auto 12px;">${this.profile.avatar}</div>
        <div style="font-size: 20px; font-weight: 700; margin-bottom: 4px;">${this.profile.name}</div>
        <div style="font-size: 13px; color: var(--text-light); margin-bottom: 16px;">${this.profile.bio}</div>
        <button class="btn btn-primary" onclick="App.navigate('settings')">编辑个人资料</button>
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

  _renderTodayAttendanceCard() {
    const isoDate = this._dateToISO(new Date());
    const r = (this.attendance.records || {})[isoDate] || {};
    const todayCase = (this.dailyCases || []).find(c => c.date === isoDate);
    const checkInStatus = r.checkIn
      ? `<span style="color:var(--success);">${r.checkIn}</span>`
      : `<span style="color:var(--text-muted);">未打卡</span>`;
    const checkOutStatus = r.checkOut
      ? `<span style="color:var(--success);">${r.checkOut}</span>`
      : `<span style="color:var(--text-muted);">未打卡</span>`;
    return `
      <div class="card" onclick="App._goAttendance()" style="cursor:pointer;">
        <div class="card-title"><span class="card-icon">⏰</span>今日打卡</div>
        <div style="display:flex; justify-content:space-around; text-align:center;">
          <div>
            <div style="font-size:11px; color:var(--text-light);">上班</div>
            <div style="font-size:16px; font-weight:700;">${checkInStatus}</div>
          </div>
          <div>
            <div style="font-size:11px; color:var(--text-light);">下班</div>
            <div style="font-size:16px; font-weight:700;">${checkOutStatus}</div>
          </div>
          <div>
            <div style="font-size:11px; color:var(--text-light);">今日案例</div>
            <div style="font-size:16px; font-weight:700; color:${todayCase?'var(--success)':'var(--text-muted)'};">${todayCase?'✓':'—'}</div>
          </div>
        </div>
      </div>
    `;
  },

  _goAttendance() {
    this._todoTab = 'attendance';
    this.navigate('todo');
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
        <div class="chip ${activeTab==='schedule'?'active':''}" onclick="App.switchTodoTab('schedule')">📅 日程</div>
        <div class="chip ${activeTab==='attendance'?'active':''}" onclick="App.switchTodoTab('attendance')">⏰ 打卡</div>
        <div class="chip ${activeTab==='calendar'?'active':''}" onclick="App.switchTodoTab('calendar')">🗓️ 月历</div>
      </div>
      <div id="todoContent">${this.getTodoContentHtml(activeTab)}</div>
    `;
    this.renderFab('➕', () => {
      if (activeTab === 'tasks') this.showAddTodoModal();
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
    } else if (tab === 'attendance') {
      return this.renderAttendanceMonth();
    }
    return '';
  },

  switchTodoTab(tab) {
    this._todoTab = tab;
    const el = document.getElementById('todoContent');
    if (el) el.innerHTML = this.getTodoContentHtml(tab);
    if (tab === 'calendar') {
      document.querySelectorAll('.fab').forEach(f => f.remove());
    } else if (tab === 'attendance') {
      document.querySelectorAll('.fab').forEach(f => f.remove());
    } else {
      this.renderFab('➕', () => {
        if (tab === 'tasks') this.showAddTodoModal();
        else this.showAddScheduleModal();
      });
    }
    // 更新 chip active 状态
    document.querySelectorAll('.chip').forEach(c => {
      const t = c.textContent;
      if (t.includes('待办')) c.classList.toggle('active', tab === 'tasks');
      else if (t.includes('日程')) c.classList.toggle('active', tab === 'schedule');
      else if (t.includes('月历')) c.classList.toggle('active', tab === 'calendar');
      else if (t.includes('打卡')) c.classList.toggle('active', tab === 'attendance');
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
    const icons = ['💧','📚','🏃','🧘','🎯','✍️','🌱','☕','🛏️','🦷','💊','🎨'];
    this.showModal('添加习惯', `
      <div class="field-label">习惯名称</div>
      <input class="input" id="habitName" placeholder="如：早起、跑步..." maxlength="12">
      <div class="field-label">选择图标</div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${icons.map((e,i) => `
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
  // 生活模块 — 日记/笔记
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
    } else if (sub === 'note') {
      contentHtml = `
        ${this.notes.length === 0 ? this.emptyHTML('📝', '创建第一条笔记') : ''}
        ${this.notes.sort((a,b)=>b.id-a.id).map(n => `
          <div class="card">
            <div style="font-weight:700; font-size:15px; margin-bottom:6px;">${n.title}</div>
            <div style="font-size:13px; line-height:1.6; color:var(--text-light); white-space:pre-wrap;">${n.content}</div>
            <div style="margin-top:8px; text-align:right;">
              <button class="delete-btn" onclick="App.editNote(${n.id})">✏️</button>
              <button class="delete-btn" onclick="App.deleteNote(${n.id})">🗑️</button>
            </div>
          </div>
        `).join('')}
      `;
    } else if (sub === 'reading') {
      const appLinks = [{ name: 'Apple Books', icon: '📕', url: 'itms-books://' },{ name: '微信读书', icon: '📗', url: 'weread://' },{ name: '喜马拉雅', icon: '🎧', url: 'iting://' }];
      const activeBooks = (this.readings||[]).filter(r => r.status==='reading');
      const doneBooks = (this.readings||[]).filter(r => r.status==='done');
      const totalMin = (this.readings||[]).reduce((s,r)=>s+(r.totalMinutes||0),0);
      contentHtml = '<div class="card" style="text-align:center;padding:20px 16px;"><div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">阅读统计</div><div style="display:flex;justify-content:center;gap:20px;margin-top:8px;"><div><span style="font-size:24px;font-weight:700;color:var(--primary-dark);">'+activeBooks.length+'</span> <span style="font-size:11px;color:var(--text-light);">在读</span></div><div><span style="font-size:24px;font-weight:700;color:var(--success);">'+doneBooks.length+'</span> <span style="font-size:11px;color:var(--text-light);">已读完</span></div><div><span style="font-size:24px;font-weight:700;color:var(--secondary-dark);">'+totalMin+'\'</span> <span style="font-size:11px;color:var(--text-light);">总时长</span></div></div></div><div class="section-title">📲 快捷打开</div><div class="card" style="display:flex;justify-content:space-around;padding:16px 8px;">'+appLinks.map(a=>'<div onclick="App.openReadingApp(\''+a.url+'\')" style="text-align:center;cursor:pointer;padding:8px 12px;border-radius:12px;background:var(--secondary-light);"><div style="font-size:28px;">'+a.icon+'</div><div style="font-size:11px;color:var(--text);margin-top:4px;font-weight:600;">'+a.name+'</div></div>').join('')+'</div>'+(this.readings.length===0?this.emptyHTML('📚','添加一本在读的书'):'<div class="section-title">📖 我的书架</div>'+(this.readings||[]).sort((a,b)=>b.id-a.id).map(r=>{const p=r.totalPages>0?Math.round(r.currentPage/r.totalPages*100):0;const sb=r.status==='done'?'✅ 已读完':'📖 在读';return '<div class="card"><div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;"><div style="flex:1;"><div style="font-weight:700;font-size:15px;">'+(r.emoji||'📘')+' '+r.title+'</div><div style="font-size:12px;color:var(--text-light);margin-top:2px;">'+(r.author||'未知作者')+' · '+(r.type==='audio'?'🎧 听书':'📖 阅读')+'</div></div><span style="font-size:11px;padding:3px 8px;border-radius:8px;background:var(--primary-light);color:var(--primary-dark);font-weight:600;flex-shrink:0;">'+sb+'</span></div>'+(r.status==='reading'?'<div style="margin:8px 0;"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="color:var(--text-light);">进度 '+r.currentPage+'/'+r.totalPages+'页</span><span style="font-weight:600;color:var(--primary-dark);">'+p+'%</span></div><div class="progress-bar"><div class="progress-fill" style="width:'+p+'%;"></div></div></div><div style="display:flex;gap:8px;margin-top:8px;"><button class="chip" style="font-size:12px;padding:6px 12px;" onclick="App.updateReadingProgress('+r.id+')">📊 更新进度</button><button class="chip" style="font-size:12px;padding:6px 12px;" onclick="App.finishReading('+r.id+')">✅ 标记读完</button><button class="delete-btn" onclick="App.deleteReading('+r.id+')">🗑️</button></div>':'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;"><span style="font-size:12px;color:var(--text-light);">'+(r.finishedDate||'')+' '+(r.totalMinutes>0?'· 用时'+r.totalMinutes+'分钟':'')+'</span><button class="delete-btn" onclick="App.deleteReading('+r.id+')">🗑️</button></div>')+(r.note?'<div style="margin-top:6px;font-size:12px;color:var(--text-light);background:var(--bg-card);padding:8px;border-radius:8px;line-height:1.5;white-space:pre-wrap;">💭 '+this._escapeHtml(r.note)+'</div>':'<div style="margin-top:6px;font-size:12px;color:var(--text-muted);background:var(--bg-card);padding:8px;border-radius:8px;">💭 暂无笔记</div>')+'<div style="margin-top:6px;"><button class="chip" style="font-size:12px;padding:5px 10px;" onclick="App.editReadingNote('+r.id+')">✏️ '+(r.note?'编辑笔记':'添加笔记')+'</button></div></div>';}).join(''))+'</div>';
    } else if (sub === 'case') {
      contentHtml = this.renderCaseList();
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
        <div class="chip ${sub==='note'?'active':''}" onclick="App.goToLife('note')">📝 笔记</div>
        <div class="chip ${sub==='reading'?'active':''}" onclick="App.goToLife('reading')">📚 阅读</div>
        <div class="chip ${sub==='case'?'active':''}" onclick="App.goToLife('case')">📋 案例</div>
      </div>
      <div id="lifeContent">${contentHtml}</div>
    `;

    this.renderFab('➕', () => {
      if (sub === 'diary') this.showAddDiaryModal();
      else if (sub === 'reading') this.showAddReadingModal();
      else if (sub === 'case') this.showAddCaseModal();
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
    } else if (sub === 'note') {
      el.innerHTML = `
        ${this.notes.length === 0 ? this.emptyHTML('📝', '创建第一条笔记') : ''}
        ${this.notes.sort((a,b)=>b.id-a.id).map(n => `
          <div class="card">
            <div style="font-weight:700; font-size:15px; margin-bottom:6px;">${n.title}</div>
            <div style="font-size:13px; line-height:1.6; color:var(--text-light); white-space:pre-wrap;">${n.content}</div>
            <div style="margin-top:8px; text-align:right;">
              <button class="delete-btn" onclick="App.editNote(${n.id})">✏️</button>
              <button class="delete-btn" onclick="App.deleteNote(${n.id})">🗑️</button>
            </div>
          </div>
        `).join('')}
      `;
    } else if (sub === 'case') {
      el.innerHTML = this.renderCaseList();
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

  editNote(id) {
    const n = this.notes.find(x => x.id === id);
    if (n) this.showAddNoteModal(n);
  },

  openReadingApp(url) { try { window.location.href = url; setTimeout(() => { this.toast('如果App没有打开，可能未安装该应用'); }, 3000); } catch(e) { this.toast('无法打开应用'); } },
  showAddReadingModal(existing) {
    const r = existing || {}; const isEdit = !!existing;
    this.showModal(isEdit?'编辑书目':'添加书目', '<div class="field-label">书名</div><input class="input" id="readingTitle" placeholder="如：三体" maxlength="30" value="'+(r.title||'')+'"><div class="field-label">作者（可选）</div><input class="input" id="readingAuthor" maxlength="20" value="'+(r.author||'')+'"><div class="field-label">类型</div><div style="display:flex;gap:8px;margin-bottom:12px;"><div class="chip '+((!r.type||r.type==='book')?'active':'')+'" data-type="book" onclick="document.querySelectorAll(\'[data-type]\').forEach(e=>e.classList.remove(\'active\'));this.classList.add(\'active\');">📖 阅读</div><div class="chip '+(r.type==='audio'?'active':'')+'" data-type="audio" onclick="document.querySelectorAll(\'[data-type]\').forEach(e=>e.classList.remove(\'active\'));this.classList.add(\'active\');">🎧 听书</div></div><div class="field-label">总页数</div><input class="input" id="readingTotalPages" type="number" placeholder="如：300" value="'+(r.totalPages||'')+'"><div class="field-label">当前进度</div><input class="input" id="readingCurrentPage" type="number" placeholder="如：50" value="'+(r.currentPage||'')+'"><div class="field-label">本次时长（分钟）</div><input class="input" id="readingMinutes" type="number" placeholder="如：30" value="'+(r.minutes||'')+'"><div class="field-label">笔记</div><textarea class="input" id="readingNote" style="min-height:60px;">'+(r.note||'')+'</textarea>', () => {
      const title = document.getElementById('readingTitle').value.trim(); if (!title) { this.toast('请输入书名'); return; }
      const author = document.getElementById('readingAuthor').value.trim();
      const typeEl = document.querySelector('[data-type].active'); const type = typeEl ? typeEl.dataset.type : 'book';
      const totalPages = parseInt(document.getElementById('readingTotalPages').value) || 0;
      const currentPage = parseInt(document.getElementById('readingCurrentPage').value) || 0;
      const minutes = parseInt(document.getElementById('readingMinutes').value) || 0;
      const note = document.getElementById('readingNote').value.trim();
      if (isEdit) { const idx = this.readings.findIndex(b => b.id === r.id); if (idx >= 0) { this.readings[idx] = {...this.readings[idx], title, author, type, totalPages, currentPage, note, totalMinutes: (this.readings[idx].totalMinutes||0)+minutes, updatedAt: Date.now()}; if (totalPages>0 && currentPage>=totalPages) { this.readings[idx].status='done'; this.readings[idx].finishedDate=new Date().toLocaleDateString('zh-CN'); } } }
      else { this.readings.push({id:Date.now(), title, author, type, totalPages, currentPage, note, status:(totalPages>0&&currentPage>=totalPages)?'done':'reading', totalMinutes:minutes, startDate:new Date().toLocaleDateString('zh-CN'), finishedDate:(totalPages>0&&currentPage>=totalPages)?new Date().toLocaleDateString('zh-CN'):null, createdAt:Date.now()}); }
      this.saveReadings(); this.navigate('life'); this.toast(isEdit?'✅ 已更新':'✅ 已添加');
    });
  },
  updateReadingProgress(id) { const r = this.readings.find(b => b.id === id); if (!r) return; this.showModal('更新进度 · '+r.title, '<div style="font-size:14px;color:var(--text-light);margin-bottom:8px;">当前：'+r.currentPage+'/'+r.totalPages+'页 · '+(r.totalPages>0?Math.round(r.currentPage/r.totalPages*100):0)+'%</div><div class="field-label">新的已读页数</div><input class="input" id="newProgress" type="number" value="'+r.currentPage+'"><div class="field-label">本次时长（分钟）</div><input class="input" id="newMinutes" type="number" placeholder="如：30"><div class="field-label">笔记</div><textarea class="input" id="progressNote" style="min-height:60px;" placeholder="记录读书笔记、摘录、想法...">'+this._escapeHtml(r.note||'')+'</textarea>', () => { const np = parseInt(document.getElementById('newProgress').value) || 0; const nm = parseInt(document.getElementById('newMinutes').value) || 0; r.currentPage = np; r.totalMinutes = (r.totalMinutes||0)+nm; r.note = document.getElementById('progressNote').value.trim(); r.updatedAt = Date.now(); if (r.totalPages>0 && np>=r.totalPages) { r.status='done'; r.finishedDate=new Date().toLocaleDateString('zh-CN'); } this.saveReadings(); this.navigate('life'); this.toast('✅ 已更新'); }); },
  finishReading(id) { const r = this.readings.find(b => b.id === id); if (!r) return; r.status='done'; r.finishedDate=new Date().toLocaleDateString('zh-CN'); if (r.totalPages>0 && r.currentPage<r.totalPages) r.currentPage=r.totalPages; r.updatedAt=Date.now(); this.saveReadings(); this.navigate('life'); this.toast('🎉 恭喜读完《'+r.title+'》！'); },
  deleteReading(id) { if (confirm('确定删除？')) { this.readings = this.readings.filter(r => r.id !== id); this.saveReadings(); this.navigate('life'); } },
  editReadingNote(id) {
    const r = this.readings.find(b => b.id === id);
    if (!r) return;
    this.showModal('💭 读书笔记 · '+r.title, '<div class="field-label">笔记</div><textarea class="input" id="readingNoteEdit" style="min-height:110px;" placeholder="写下读书笔记、摘录、想法...">'+this._escapeHtml(r.note||'')+'</textarea>', () => {
      r.note = document.getElementById('readingNoteEdit').value.trim();
      r.updatedAt = Date.now();
      this.saveReadings();
      this.navigate('life');
      this.toast('✅ 笔记已保存');
    });
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

  showAddNoteModal(existing) {
    const isEdit = !!existing;
    const n = existing || {};
    this.showModal(isEdit ? '编辑笔记' : '写笔记', `
      <div class="field-label">标题</div>
      <input class="input" id="noteTitle" placeholder="笔记标题" maxlength="30" value="${n.title || ''}">
      <div class="field-label">内容</div>
      <textarea class="input" id="noteContent" placeholder="写下你的想法..." rows="6">${n.content || ''}</textarea>
    `, () => {
      const title = document.getElementById('noteTitle').value.trim();
      const content = document.getElementById('noteContent').value.trim();
      if (!title) return;
      if (isEdit) {
        const idx = this.notes.findIndex(x => x.id === n.id);
        if (idx >= 0) {
          this.notes[idx].title = title;
          this.notes[idx].content = content;
          this.notes[idx].updatedAt = Date.now();
        }
      } else {
        this.notes.push({ id: Date.now(), title, content, createdAt: Date.now() });
      }
      this.saveNotes();
      this.renderLifeContent();
    });
  },

  // ============================================
  // 每日案例输入模块
  // ============================================
  renderCaseList() {
    const cases = (this.dailyCases || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id - a.id);
    if (cases.length === 0) {
      return this.emptyHTML('📋', '点击 + 添加每日案例');
    }

    const totalDeduction = cases.reduce((s, c) => {
      const d = c.deductions || {};
      return s + ((d.a || d.b || d.c) ? 1 : 0);
    }, 0);
    const recordedCount = cases.filter(c => c.caseRecorded).length;

    // 按案例编号分组：同一编号、不同时间的记录自动归类折叠
    const groups = {};
    cases.forEach(c => {
      const no = (c.caseNo || '').trim();
      // 有编号 → 同编号归为一组；无编号 → 各自独立展示，不参与折叠
      const key = no || ('__none__' + c.id);
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });
    // 分组排序：按组内最新日期倒序，未编号的单条案例排在最后
    const groupKeys = Object.keys(groups).sort((a, b) => {
      const aNone = a.startsWith('__none__'), bNone = b.startsWith('__none__');
      if (aNone && bNone) return (groups[b][0].date || '').localeCompare(groups[a][0].date || '');
      if (aNone) return 1;
      if (bNone) return -1;
      return (groups[b][0].date || '').localeCompare(groups[a][0].date || '');
    });

    const listHtml = groupKeys.map(key => {
      const items = groups[key];
      // 只有 1 条记录的组直接展示
      if (items.length === 1) return this._renderCaseItem(items[0]);
      // 同一编号多条记录 → 折叠卡片，点击展开
      const no = key;
      const latest = items[0];
      const oldest = items[items.length - 1];
      const dateRange = oldest.date === latest.date ? (latest.date || '') : (oldest.date || '') + ' ~ ' + (latest.date || '');
      const recordedCnt = items.filter(c => c.caseRecorded).length;
      const deductedCnt = items.filter(c => { const d = c.deductions || {}; return !!(d.a || d.b || d.c); }).length;
      return `
        <details class="case-group">
          <summary class="case-group-header">
            <div class="case-group-info">
              <div class="case-group-title"><span class="case-no">${this._escapeHtml(no)}</span> ${this._escapeHtml(latest.caseName || '未命名案例')}</div>
              <div class="case-group-meta">${items.length} 条记录 · ${dateRange} · 病例 ${recordedCnt}/${items.length} · 划扣 ${deductedCnt}/${items.length}</div>
            </div>
            <span class="case-group-arrow">▾</span>
          </summary>
          <div class="case-group-body">
            ${items.map(c => this._renderCaseItem(c)).join('')}
          </div>
        </details>
      `;
    }).join('');

    return `
      <div class="stat-grid" style="margin-bottom:12px;">
        <div class="stat-card">
          <div class="stat-value">${cases.length}</div>
          <div class="stat-label">案例总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--success);">${recordedCount}</div>
          <div class="stat-label">已录入病例</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--primary-dark);">${totalDeduction}</div>
          <div class="stat-label">已划扣案例</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${cases.filter(c => c.consentForm).length}</div>
          <div class="stat-label">知情同意书</div>
        </div>
      </div>
      ${listHtml}
    `;
  },

  _renderCaseItem(c) {
    const d = c.deductions || {a: false, b: false, c: false};
    const deducted = !!(d.a || d.b || d.c);
    return `
      <div class="case-item" onclick="App.editCase(${c.id})" style="cursor:pointer;">
        <div class="case-item-header">
          <div class="case-item-title">${c.caseNo ? `<span class="case-no">${this._escapeHtml(c.caseNo)}</span> ` : ''}${this._escapeHtml(c.caseName || '未命名案例')}</div>
          <button class="delete-btn" onclick="event.stopPropagation();App.deleteCase(${c.id})">🗑️</button>
        </div>
        <div class="case-item-date">${c.date || ''}</div>
        ${c.project ? `<div class="case-row"><strong>项目：</strong>${this._escapeHtml(c.project)}</div>` : ''}
        <div style="margin-top:6px;">
          <span class="case-tag ${c.caseRecorded ? 'yes' : 'no'}">${c.caseRecorded ? '✓ 病例已录入' : '✗ 病例未录入'}</span>
          <span class="case-tag ${c.consentForm ? 'yes' : 'no'}">${c.consentForm ? '✓ 知情同意书' : '✗ 知情同意书'}</span>
        </div>
        <div style="margin-top:6px; display:flex; gap:8px; flex-wrap:wrap; font-size:12px;">
          <span class="case-tag ${deducted ? 'yes' : 'no'}">划扣：${deducted ? '✓ 已划扣' : '✗ 未划扣'}</span>
        </div>
        ${c.note ? `<div class="case-row" style="margin-top:6px;"><strong>备注：</strong>${this._escapeHtml(c.note)}</div>` : ''}
      </div>
    `;
  },

  _escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  },

  showAddCaseModal(existing) {
    const isEdit = !!existing;
    const c = existing || { date: this._dateToISO(new Date()), caseNo: '', caseName: '', project: '', caseRecorded: false, consentForm: false, deductions: {a:false}, note: '' };
    const d = c.deductions || {a:false};
    const deducted = !!(d.a || d.b || d.c);

    this.showModal(isEdit ? '编辑案例' : '添加每日案例', `
      <div class="field-label">日期</div>
      <input class="input" id="caseDate" type="date" value="${c.date}">
      <div class="field-label">案例编号（同一编号的案例自动归类折叠）</div>
      <input class="input" id="caseNo" placeholder="如：A001" maxlength="20" value="${this._escapeHtml(c.caseNo || '')}">
      <div class="field-label">案例名称</div>
      <input class="input" id="caseName" placeholder="如：黄褐斑激光治疗..." maxlength="50" value="${this._escapeHtml(c.caseName)}">
      <div class="field-label">项目</div>
      <input class="input" id="caseProject" placeholder="如：皮秒激光 / IPL / 外用药物..." maxlength="60" value="${this._escapeHtml(c.project)}">

      <div class="field-label">病例录入</div>
      <div style="display:flex; gap:8px;">
        <div class="chip ${c.caseRecorded?'active':''}" data-caserecorded="1" onclick="App._toggleCaseFlag(this,'caseRecorded')">✅ 已录入</div>
        <div class="chip ${!c.caseRecorded?'active':''}" data-caserecorded="0" onclick="App._toggleCaseFlag(this,'caseRecorded')">❌ 未录入</div>
      </div>

      <div class="field-label">知情同意书书写</div>
      <div style="display:flex; gap:8px;">
        <div class="chip ${c.consentForm?'active':''}" data-consentform="1" onclick="App._toggleCaseFlag(this,'consentForm')">✅ 已书写</div>
        <div class="chip ${!c.consentForm?'active':''}" data-consentform="0" onclick="App._toggleCaseFlag(this,'consentForm')">❌ 未书写</div>
      </div>

      <div class="field-label">划扣状态</div>
      <div style="display:flex; gap:8px; margin-bottom:12px;">
        <div class="chip ${deducted?'active':''}" data-deduct="a" onclick="App._toggleDeductFlag(this)">${deducted?'✅ 已划扣':'划扣'}</div>
      </div>

      <div class="field-label">备注（可选）</div>
      <textarea class="input" id="caseNote" placeholder="治疗细节、随访安排..." rows="3" maxlength="200">${this._escapeHtml(c.note)}</textarea>
    `, () => {
      const caseName = document.getElementById('caseName').value.trim();
      if (!caseName) { this.toast('请输入案例名称'); return; }
      const caseNo = document.getElementById('caseNo').value.trim();
      const date = document.getElementById('caseDate').value || this._dateToISO(new Date());
      const project = document.getElementById('caseProject').value.trim();
      const caseRecorded = document.querySelector('[data-caserecorded].active')?.dataset.caserecorded === '1';
      const consentForm = document.querySelector('[data-consentform].active')?.dataset.consentform === '1';
      const a = document.querySelector('[data-deduct="a"]')?.classList.contains('active') || false;
      const note = document.getElementById('caseNote').value.trim();

      if (isEdit) {
        existing.caseName = caseName;
        existing.caseNo = caseNo;
        existing.date = date;
        existing.project = project;
        existing.caseRecorded = caseRecorded;
        existing.consentForm = consentForm;
        existing.deductions = { a };
        existing.note = note;
        existing.updatedAt = Date.now();
      } else {
        this.dailyCases.push({
          id: Date.now(),
          date, caseNo, caseName, project,
          caseRecorded, consentForm,
          deductions: { a },
          note,
          createdAt: Date.now()
        });
      }
      this.saveDailyCases();
      this.renderLifeContent();
      this.toast(isEdit ? '✅ 案例已更新' : '✅ 案例已添加');
    });
  },

  _toggleDeductFlag(el) {
    el.classList.toggle('active');
  },

  _toggleCaseFlag(el, group) {
    document.querySelectorAll('[data-' + group + ']').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
  },

  editCase(id) {
    const c = this.dailyCases.find(c => c.id === id);
    if (c) this.showAddCaseModal(c);
  },

  deleteCase(id) {
    if (!confirm('确定删除这条案例？')) return;
    this.dailyCases = this.dailyCases.filter(c => c.id !== id);
    this.saveDailyCases();
    this.renderLifeContent();
    this.toast('🗑️ 已删除');
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

      <!-- 小米运动健康 -->
      <div class="card">
        <div class="card-title"><span class="card-icon">🏃</span>小米运动健康</div>
        ${this._renderMiActivitySummary()}
        <div style="display:flex; gap:8px; margin-top:12px; position:relative; z-index:1;">
          <button class="btn btn-primary" style="flex:1; pointer-events:auto;" onclick="App.showMiSyncModal();return false;">🔄 同步今日数据</button>
          <button class="btn btn-ghost" style="flex:1; pointer-events:auto;" onclick="App.showMiHistory();return false;">📈 历史记录</button>
        </div>
        <div style="font-size:11px; color:var(--text-muted); margin-top:10px; line-height:1.6;">打开「小米运动健康」App，对照首页的步数、运动和体重数据填写，即可完成同步（同一天重复同步会覆盖）</div>
      </div>

      <!-- 睡眠 & 热量 -->
      <div class="stat-grid">
        <div class="stat-card">
          <div style="font-size:28px; margin-bottom:4px;">😴</div>
          <div class="stat-value">${h.sleep}h</div>
          <div class="stat-label">睡眠 (目标 ${h.sleepGoal}h)</div>
          <div style="margin-top:8px; display:flex; gap:4px; justify-content:center;">
            <button class="chip" onclick="App.adjustSleep(-0.5);return false;" style="pointer-events:auto;">-0.5h</button>
            <button class="chip" onclick="App.adjustSleep(0.5);return false;" style="pointer-events:auto;">+0.5h</button>
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size:28px; margin-bottom:4px;">🍎</div>
          <div class="stat-value">${h.calories}</div>
          <div class="stat-label">热量/千卡 (目标${h.caloriesGoal})</div>
          <div style="margin-top:8px; display:flex; gap:4px; justify-content:center;">
            <button class="chip" onclick="App.addCalories(-100);return false;" style="pointer-events:auto;">-100</button>
            <button class="chip" onclick="App.addCalories(100);return false;" style="pointer-events:auto;">+100</button>
          </div>
        </div>
      </div>

      <!-- 减脂模块 -->
      <div class="card">
        <div class="card-title"><span class="card-icon">⚖️</span>减脂追踪</div>
        ${this._renderFitnessSummary()}
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; position:relative; z-index:1;">
          <button class="chip" style="flex:1; justify-content:center; min-width:80px; pointer-events:auto;" onclick="App.showFitnessModal('weight');return false;">⚖️ 体重</button>
          <button class="chip" style="flex:1; justify-content:center; min-width:80px; pointer-events:auto;" onclick="App.showFitnessModal('measurement');return false;">📐 围度</button>
          <button class="chip" style="flex:1; justify-content:center; min-width:80px; pointer-events:auto;" onclick="App.showFitnessModal('meal');return false;">🍽️ 饮食</button>
          <button class="chip" style="flex:1; justify-content:center; min-width:80px; pointer-events:auto;" onclick="App.showFitnessModal('sleepLog');return false;">😴 作息</button>
        </div>
        <button class="btn btn-ghost" style="width:100%; margin-top:8px; font-size:13px; pointer-events:auto;" onclick="App.showFitnessDetail();return false;">📊 查看详细记录</button>
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
    const act = this._getTodayActivity();
    if (act && act.steps > 0 && act.steps < 5000) tips.push('👣 今天步数还不多，起来走动走动');
    if (act && (act.exerciseMin || 0) >= 30) tips.push('🏃 今日已运动 ' + act.exerciseMin + ' 分钟，很棒！');
    if (this.health.sleep < 6) tips.push('😴 睡眠不足，今晚早点休息');
    if (this.health.calories > this.health.caloriesGoal) tips.push('🍎 热量摄入超标了，注意饮食');
    if (tips.length === 0) tips.push('🌟 状态不错，继续保持！');
    return tips.join('<br>');
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

  // ---- 小米运动健康数据（步数/运动量/体重）----
  _getMiActivities() {
    if (!this.fitnessLog) this.fitnessLog = { weights: [], measurements: [], meals: [], sleepLog: [], activities: [] };
    if (!this.fitnessLog.activities) this.fitnessLog.activities = [];
    return this.fitnessLog.activities;
  },

  _getTodayActivity() {
    const today = this._dateToISO(new Date());
    return this._getMiActivities().find(a => a.date === today) || null;
  },

  _renderMiActivitySummary() {
    const act = this._getTodayActivity() || {};
    const lw = (this.fitnessLog.weights || []).slice().sort((a, b) => b.date.localeCompare(a.date))[0];
    const cell = (val, label, color) => `
      <div style="flex:1;">
        <div style="font-size:20px; font-weight:700; color:${color};">${(val || val === 0) ? val : '--'}</div>
        <div style="font-size:10px; color:var(--text-light);">${label}</div>
      </div>`;
    return `
      <div style="display:flex; justify-content:space-around; text-align:center; gap:8px;">
        ${cell(act.steps, '今日步数', 'var(--primary-dark)')}
        ${cell(act.exerciseMin, '运动时长(分)', 'var(--secondary-dark)')}
        ${cell(act.exerciseKcal, '运动消耗(kcal)', 'var(--warning)')}
        ${cell(lw ? lw.value : null, lw ? ('体重kg · ' + lw.date.slice(5)) : '体重kg', 'var(--success)')}
      </div>
      ${act.ts
        ? `<div style="font-size:10px; color:var(--text-muted); text-align:center; margin-top:6px;">✓ 已同步 ${act.date} 的数据</div>`
        : `<div style="font-size:10px; color:var(--text-muted); text-align:center; margin-top:6px;">今天还未同步，点击下方按钮录入</div>`}
    `;
  },

  showMiSyncModal() {
    const ds = this._dateToISO(new Date());
    const act = this._getTodayActivity() || {};
    const lw = (this.fitnessLog.weights || []).slice().sort((a, b) => b.date.localeCompare(a.date))[0];
    this.showModal('🔄 同步小米运动健康', `
      <div style="font-size:12px; color:var(--text-light); margin-bottom:10px; line-height:1.6;">
        打开「小米运动健康」App，把首页显示的数据填到这里即可同步
      </div>
      <div class="field-label">日期</div>
      <input class="input" id="miDate" type="date" value="${ds}">
      <div class="field-label">步数</div>
      <input class="input" id="miSteps" type="number" placeholder="如：8321" value="${act.steps ?? ''}">
      <div class="field-label">运动时长（分钟）</div>
      <input class="input" id="miExerciseMin" type="number" placeholder="如：45" value="${act.exerciseMin ?? ''}">
      <div class="field-label">运动消耗（千卡）</div>
      <input class="input" id="miExerciseKcal" type="number" placeholder="如：320" value="${act.exerciseKcal ?? ''}">
      <div class="field-label">体重（kg，可选）</div>
      <input class="input" id="miWeight" type="number" step="0.1" placeholder="如：65.5" value="${lw ? lw.value : ''}">
    `, () => {
      const date = document.getElementById('miDate').value || ds;
      const steps = parseInt(document.getElementById('miSteps').value) || 0;
      const exerciseMin = parseInt(document.getElementById('miExerciseMin').value) || 0;
      const exerciseKcal = parseInt(document.getElementById('miExerciseKcal').value) || 0;
      const weight = parseFloat(document.getElementById('miWeight').value) || null;
      const list = this._getMiActivities().filter(a => a.date !== date);
      list.push({ date, steps, exerciseMin, exerciseKcal, source: 'mi-fitness', ts: Date.now() });
      this.fitnessLog.activities = list;
      if (weight) {
        this.fitnessLog.weights = (this.fitnessLog.weights || []).filter(w => w.date !== date);
        this.fitnessLog.weights.push({ date, value: weight, note: '小米运动健康', ts: Date.now() });
      }
      this.saveFitnessLog();
      this.navigate('health');
      this.toast('✅ 已同步 ' + date + ' 的数据');
    });
  },

  showMiHistory() {
    const list = this._getMiActivities().slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
    let html = '';
    if (list.length === 0) {
      html = '<div style="text-align:center; padding:20px; color:var(--text-light);">暂无同步记录</div>';
    } else {
      html = '<div class="card" style="padding:8px 12px;">' + list.map(a => `
        <div style="padding:8px 0; border-bottom:1px solid var(--border); font-size:13px;">
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--text-light);">${a.date}</span>
            <span style="font-weight:700;">${a.steps || 0} 步</span>
          </div>
          <div style="font-size:11px; color:var(--text-light); margin-top:2px;">运动 ${a.exerciseMin || 0} 分钟 · 消耗 ${a.exerciseKcal || 0} kcal</div>
        </div>`).join('') + '</div>';
    }
    this.showModal('📈 小米运动健康 · 最近记录', html, null);
    setTimeout(() => {
      const c = document.getElementById('modalConfirm');
      const cl = document.getElementById('modalCancel');
      if (c) c.style.display = 'none';
      if (cl) { cl.textContent = '关闭'; cl.style.flex = '1'; }
    }, 50);
  },

  _renderFitnessSummary() {
    const f = this.fitnessLog; const today = this._dateToISO(new Date());
    const tm = (f.meals||[]).filter(m => m.date === today);
    const tc = tm.reduce((s,m) => s+(m.calories||0), 0);
    const ws = (f.weights||[]).sort((a,b) => b.date.localeCompare(a.date));
    const lw = ws[0]; const pw = ws[1];
    const wc = lw && pw ? (lw.value - pw.value).toFixed(1) : null;
    let h = '<div style="display:flex;justify-content:space-around;text-align:center;margin-bottom:8px;">';
    if (lw) { const cs = wc ? (parseFloat(wc)>0 ? '↑'+Math.abs(wc) : '↓'+Math.abs(wc)) : ''; const cc = wc ? (parseFloat(wc)>0 ? 'var(--danger)' : 'var(--success)') : 'var(--text-light)'; h += '<div><div style="font-size:20px;font-weight:700;color:var(--primary-dark);">'+lw.value+'</div><div style="font-size:10px;color:var(--text-light);">体重kg</div>'+(cs?'<div style="font-size:11px;color:'+cc+';font-weight:600;">'+cs+'kg</div>':'')+'</div>'; } else { h += '<div><div style="font-size:20px;font-weight:700;color:var(--text-muted);">--</div><div style="font-size:10px;color:var(--text-light);">体重kg</div></div>'; }
    h += '<div><div style="font-size:20px;font-weight:700;color:var(--secondary-dark);">'+tc+'</div><div style="font-size:10px;color:var(--text-light);">今日卡路里</div></div><div><div style="font-size:20px;font-weight:700;color:var(--warning);">'+tm.length+'</div><div style="font-size:10px;color:var(--text-light);">今日记录</div></div></div>';
    const lm = (f.measurements||[]).sort((a,b) => b.date.localeCompare(a.date))[0];
    if (lm) h += '<div style="font-size:11px;color:var(--text-light);text-align:center;margin-top:4px;">📐 腰围 '+(lm.waist||'-')+'cm · '+lm.date+'</div>';
    return h;
  },
  showFitnessModal(type) {
    const ds = this._dateToISO(new Date());
    const titles = { weight: '⚖️ 记录体重', measurement: '📐 记录围度', meal: '🍽️ 记录饮食', sleepLog: '😴 记录作息' };
    if (type === 'weight') {
      const lw = (this.fitnessLog.weights||[]).sort((a,b) => b.date.localeCompare(a.date))[0];
      this.showModal(titles.weight, '<div class="field-label">日期</div><input class="input" id="fitDate" type="date" value="'+ds+'"><div class="field-label">体重 (kg)</div><input class="input" id="fitWeight" type="number" step="0.1" placeholder="65.5" value="'+(lw?lw.value:'')+'"><div class="field-label">体脂率(%)可选</div><input class="input" id="fitBodyFat" type="number" step="0.1"><div class="field-label">备注</div><input class="input" id="fitNote" placeholder="早起空腹">', () => { const d=document.getElementById('fitDate').value,v=parseFloat(document.getElementById('fitWeight').value);if(!d||!v){this.toast('请填写');return;}const bf=parseFloat(document.getElementById('fitBodyFat').value)||null,n=document.getElementById('fitNote').value.trim();this.fitnessLog.weights=(this.fitnessLog.weights||[]).filter(w=>w.date!==d);this.fitnessLog.weights.push({date:d,value:v,bodyFat:bf,note:n,ts:Date.now()});this.saveFitnessLog();this.navigate('health');this.toast('✅ 已记录'); });
    } else if (type === 'measurement') {
      const lm = (this.fitnessLog.measurements||[]).sort((a,b) => b.date.localeCompare(a.date))[0];
      this.showModal(titles.measurement, '<div class="field-label">日期</div><input class="input" id="fitDate" type="date" value="'+ds+'"><div class="field-label">胸围(cm)</div><input class="input" id="fitChest" type="number" step="0.1" value="'+(lm?lm.chest||'':'')+'"><div class="field-label">腰围(cm)</div><input class="input" id="fitWaist" type="number" step="0.1" value="'+(lm?lm.waist||'':'')+'"><div class="field-label">臀围(cm)</div><input class="input" id="fitHip" type="number" step="0.1" value="'+(lm?lm.hip||'':'')+'"><div class="field-label">大腿围(cm)可选</div><input class="input" id="fitThigh" type="number" step="0.1" value="'+(lm?lm.thigh||'':'')+'">', () => { const d=document.getElementById('fitDate').value;if(!d){this.toast('请选日期');return;}this.fitnessLog.measurements=(this.fitnessLog.measurements||[]).filter(m=>m.date!==d);this.fitnessLog.measurements.push({date:d,chest:parseFloat(document.getElementById('fitChest').value)||null,waist:parseFloat(document.getElementById('fitWaist').value)||null,hip:parseFloat(document.getElementById('fitHip').value)||null,thigh:parseFloat(document.getElementById('fitThigh').value)||null,ts:Date.now()});this.saveFitnessLog();this.navigate('health');this.toast('✅ 已记录'); });
    } else if (type === 'meal') {
      const mt = [{id:'breakfast',name:'🌅 早餐'},{id:'lunch',name:'☀️ 午餐'},{id:'dinner',name:'🌙 晚餐'},{id:'snack',name:'🍪 加餐'}];
      this.showModal(titles.meal, '<div class="field-label">日期</div><input class="input" id="fitDate" type="date" value="'+ds+'"><div class="field-label">餐次</div><div style="display:flex;gap:8px;flex-wrap:wrap;">'+mt.map(m=>'<div class="chip" data-meal="'+m.id+'" onclick="document.querySelectorAll(\'[data-meal]\').forEach(e=>e.classList.remove(\'active\'));this.classList.add(\'active\');">'+m.name+'</div>').join('')+'</div><div class="field-label">食物内容</div><textarea class="input" id="fitFood" style="min-height:50px;" placeholder="鸡蛋2个+全麦面包"></textarea><div class="field-label">热量(kcal)可选</div><input class="input" id="fitCalories" type="number" placeholder="350">', () => { const d=document.getElementById('fitDate').value;const te=document.querySelector('[data-meal].active');if(!te){this.toast('请选餐次');return;}const mt=te.dataset.meal;const fd=document.getElementById('fitFood').value.trim();const cl=parseInt(document.getElementById('fitCalories').value)||0;if(!fd){this.toast('请输入食物');return;}this.fitnessLog.meals=this.fitnessLog.meals||[];this.fitnessLog.meals.push({date:d,type:mt,food:fd,calories:cl,ts:Date.now()});this.saveFitnessLog();this.navigate('health');this.toast('✅ 已记录'); });
    } else if (type === 'sleepLog') {
      this.showModal(titles.sleepLog, '<div class="field-label">日期</div><input class="input" id="fitDate" type="date" value="'+ds+'"><div class="field-label">入睡时间</div><input class="input" id="fitSleepTime" type="time" value="23:00"><div class="field-label">起床时间</div><input class="input" id="fitWakeTime" type="time" value="07:00"><div class="field-label">睡眠质量</div><div style="display:flex;gap:8px;flex-wrap:wrap;">'+['😴 很差','😪 一般','😊 良好','😄 很好'].map((q,i)=>'<div class="chip" data-quality="'+(i+1)+'" onclick="document.querySelectorAll(\'[data-quality]\').forEach(e=>e.classList.remove(\'active\'));this.classList.add(\'active\');">'+q+'</div>').join('')+'</div><div class="field-label">备注</div><input class="input" id="fitSleepNote" placeholder="做梦多">', () => { const d=document.getElementById('fitDate').value;const st=document.getElementById('fitSleepTime').value;const wt=document.getElementById('fitWakeTime').value;const qe=document.querySelector('[data-quality].active');const q=qe?parseInt(qe.dataset.quality):3;const n=document.getElementById('fitSleepNote').value.trim();const[sh,sm]=st.split(':').map(Number);const[wh,wm]=wt.split(':').map(Number);let h=(wh*60+wm-sh*60-sm)/60;if(h<0)h+=24;this.fitnessLog.sleepLog=(this.fitnessLog.sleepLog||[]).filter(s=>s.date!==d);this.fitnessLog.sleepLog.push({date:d,sleepTime:st,wakeTime:wt,hours:Math.round(h*10)/10,quality:q,note:n,ts:Date.now()});this.saveFitnessLog();this.navigate('health');this.toast('✅ 已记录'); });
    }
  },
  showFitnessDetail() {
    const f = this.fitnessLog; const today = this._dateToISO(new Date()); const wa = new Date(); wa.setDate(wa.getDate()-7);
    const ws = (f.weights||[]).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10);
    const ms = (f.measurements||[]).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10);
    const wm = (f.meals||[]).filter(m => m.date >= this._dateToISO(wa) && m.date <= today).sort((a,b)=>b.date.localeCompare(a.date));
    const wsl = (f.sleepLog||[]).filter(s => s.date >= this._dateToISO(wa) && s.date <= today).sort((a,b)=>b.date.localeCompare(a.date));
    let h = (ws.length+ms.length+wm.length+wsl.length) ? '<div style="font-size:11px;color:var(--text-light);margin-bottom:10px;text-align:center;">👆 点击任意记录可查看完整详情</div>' : '';
    if (ws.length>0) { h += '<div class="field-label">⚖️ 体重记录</div><div class="card" style="padding:8px 12px;">'+ws.map((w,wi)=>'<div onclick="App.showFitnessRecordDetail(\'weight\','+wi+')" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;cursor:pointer;"><span style="color:var(--text-light);">'+w.date+'</span><span style="font-weight:700;">'+w.value+'kg'+(w.bodyFat?' · 体脂'+w.bodyFat+'%':'')+'</span></div>').join('')+'</div>'; }
    if (ms.length>0) { h += '<div class="field-label">📐 围度记录</div><div class="card" style="padding:8px 12px;">'+ms.map((m,mi)=>'<div onclick="App.showFitnessRecordDetail(\'measurement\','+mi+')" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;cursor:pointer;"><span style="color:var(--text-light);">'+m.date+'</span><span>胸'+(m.chest||'-')+' 腰'+(m.waist||'-')+' 臀'+(m.hip||'-')+'</span></div>').join('')+'</div>'; }
    if (wm.length>0) { h += '<div class="field-label">🍽️ 本周饮食</div><div class="card" style="padding:8px 12px;">';const mn={breakfast:'🌅早',lunch:'☀️午',dinner:'🌙晚',snack:'🍪加'};h+=wm.map((m,mi)=>'<div onclick="App.showFitnessRecordDetail(\'meal\','+mi+')" style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;cursor:pointer;"><div style="display:flex;justify-content:space-between;"><span style="color:var(--text-light);">'+m.date+' '+(mn[m.type]||'')+'</span><span style="font-weight:600;">'+(m.calories||'?')+'kcal</span></div><div style="margin-top:2px;">'+m.food+'</div></div>').join('');h+='</div>'; }
    if (wsl.length>0) { h += '<div class="field-label">😴 本周作息</div><div class="card" style="padding:8px 12px;">';const qn=['😴','😪','😊','😄'];h+=wsl.map((s,si)=>'<div onclick="App.showFitnessRecordDetail(\'sleepLog\','+si+')" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;cursor:pointer;"><span style="color:var(--text-light);">'+s.date+'</span><span>'+s.sleepTime+'-'+s.wakeTime+' ('+s.hours+'h) '+qn[s.quality-1]+'</span></div>').join('');h+='</div>'; }
    if (h==='') h = '<div style="text-align:center;padding:20px;color:var(--text-light);">暂无记录</div>';
    this.showModal('📊 减脂详细记录', h, null);
    setTimeout(() => { const c=document.getElementById('modalConfirm');const cl=document.getElementById('modalCancel');if(c)c.style.display='none';if(cl){cl.textContent='关闭';cl.style.flex='1';} }, 50);
  },

  showFitnessRecordDetail(type, idx) {
    const f = this.fitnessLog; const today = this._dateToISO(new Date()); const wa = new Date(); wa.setDate(wa.getDate()-7);
    let rec = null, title = '', rows = [];
    if (type === 'weight') {
      rec = (f.weights||[]).slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10)[idx];
      title = '⚖️ 体重详情';
      if (rec) rows = [['📅 日期', rec.date], ['⚖️ 体重', rec.value+' kg'], ['📊 体脂率', rec.bodyFat?rec.bodyFat+' %':'未记录'], ['💭 备注', rec.note||'无']];
    } else if (type === 'measurement') {
      rec = (f.measurements||[]).slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10)[idx];
      title = '📐 围度详情';
      if (rec) rows = [['📅 日期', rec.date], ['📏 胸围', rec.chest||'-'], ['📏 腰围', rec.waist||'-'], ['📏 臀围', rec.hip||'-'], ['📏 大腿围', rec.thigh||'-']];
    } else if (type === 'meal') {
      rec = (f.meals||[]).filter(m => m.date >= this._dateToISO(wa) && m.date <= today).sort((a,b)=>b.date.localeCompare(a.date))[idx];
      const mn = {breakfast:'🌅 早餐', lunch:'☀️ 午餐', dinner:'🌙 晚餐', snack:'🍪 加餐'};
      title = '🍽️ 饮食详情';
      if (rec) rows = [['📅 日期', rec.date], ['🍽️ 餐次', mn[rec.type]||rec.type||'未知'], ['🥗 食物', rec.food||'无'], ['🔥 热量', (rec.calories||0)+' kcal']];
    } else if (type === 'sleepLog') {
      rec = (f.sleepLog||[]).filter(s => s.date >= this._dateToISO(wa) && s.date <= today).sort((a,b)=>b.date.localeCompare(a.date))[idx];
      const qn = ['😴 很差','😪 一般','😊 良好','😄 很好'];
      title = '😴 作息详情';
      if (rec) rows = [['📅 日期', rec.date], ['🛏️ 入睡', rec.sleepTime], ['⏰ 起床', rec.wakeTime], ['⏱️ 时长', rec.hours+' 小时'], ['🌟 质量', qn[rec.quality-1]||'未知'], ['💭 备注', rec.note||'无']];
    }
    if (!rec) { this.toast('记录不存在'); return; }
    const html = '<div class="card" style="padding:12px 16px;">'+rows.map(r=>'<div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);font-size:14px;"><span style="color:var(--text-light);flex-shrink:0;">'+r[0]+'</span><span style="font-weight:600;text-align:right;word-break:break-all;">'+this._escapeHtml(String(r[1]))+'</span></div>').join('')+'</div>';
    this.showModal(title, html, null);
    setTimeout(() => { const c=document.getElementById('modalConfirm');const cl=document.getElementById('modalCancel');if(c)c.style.display='none';if(cl){cl.textContent='关闭';cl.style.flex='1';} }, 50);
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

      <!-- 定时提醒 -->
      <div class="card">
        <div class="card-title"><span class="card-icon">🔔</span>定时提醒</div>
        <div class="reminder-permission-row" onclick="App.requestNotificationPermission()">
          <span style="font-size:13px; flex:1;">
            ${'Notification' in window && Notification.permission === 'granted'
              ? '✅ 通知权限已开启'
              : '⚠️ 点击开启通知权限'}
          </span>
          <span class="chip">设置</span>
        </div>
        ${(this.reminders || []).length === 0
          ? this.emptyHTML('🔔', '还没有提醒，点击下方添加')
          : (this.reminders || []).map(r => {
            const repeatLabel = { daily: '每天', once: '仅一次', weekday: '工作日', weekend: '周末', custom: '自选星期' }[r.repeat] || '每天';
            const repeatDetail = r.repeat === 'custom' && r.customDays && r.customDays.length
              ? r.customDays.map(d => '日一二三四五六'[d]).join('·')
              : repeatLabel;
            return `
              <div class="module-toggle reminder-item">
                <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
                  <span style="font-size:20px; flex-shrink:0;">${r.enabled ? '🔔' : '🔕'}</span>
                  <div style="flex:1; min-width:0;">
                    <div style="font-weight:600; ${r.enabled ? '' : 'color:var(--text-muted);'}">${r.name}</div>
                    <div style="font-size:11px; color:var(--text-light);">${r.time} · ${repeatDetail}</div>
                  </div>
                  <span class="chip" style="font-size:10px; padding:4px 10px; flex-shrink:0;" onclick="event.stopPropagation();App.showReminderModal_editById(${r.id})">编辑</span>
                  <button class="delete-btn" onclick="event.stopPropagation();App.deleteReminder(${r.id})" style="flex-shrink:0;">🗑️</button>
                </div>
                <div class="switch ${r.enabled?'on':''}" onclick="App.toggleReminder(${r.id})"></div>
              </div>
            `;
          }).join('')}
        ${this._getReminderSyncHTML()}
        <button class="btn btn-primary" style="width:100%; margin-top:12px;" onclick="App.showReminderModal_edit()">➕ 添加提醒</button>
      </div>

            <!-- 云同步 -->
      ${this._getCloudSyncHTML()}
      ${this._getDeepSeekHTML()}

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
            <div class="stat-value">${this.notes.length}</div>
            <div class="stat-label">笔记数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Object.keys(this.attendance.records || {}).length}</div>
            <div class="stat-label">打卡天数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${(this.dailyCases||[]).length}</div>
            <div class="stat-label">案例数</div>
          </div>
        </div>
      </div>

      <!-- 数据管理 -->
      <div class="card">
        <div class="card-title"><span class="card-icon">💾</span>数据管理</div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          <button class="btn btn-ghost" onclick="App.exportData()">📤 导出数据</button>
          <button class="btn btn-ghost" onclick="App.importData()">📥 导入数据</button>
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
      weeklyReports: this.weeklyReports,
      aiRules: this.aiRules,
      reminders: this.reminders,
      readings: this.readings,
      fitnessLog: this.fitnessLog,
      attendance: this.attendance,
      dailyCases: this.dailyCases,
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

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data || typeof data !== 'object') {
          this.toast('❌ 文件格式错误');
          return;
        }
        if (!confirm('⚠️ 导入将覆盖当前所有本地数据，确定继续？')) return;
        
        const keys = [
          'profile', 'todos', 'habits', 'schedules', 'diaries', 
          'expenses', 'notes', 'health', 'customModuleData',
          'weeklyReports', 'aiRules', 'reminders',
          'readings', 'fitnessLog',
          'attendance', 'dailyCases'
        ];
        keys.forEach(key => {
          if (data[key] !== undefined) {
            Store.set(key, data[key]);
          }
        });
        
        this.loadAllData();
        this.loadProfile();
        this.applyTheme(this.profile.theme);
        this.renderTabbar();
        this.navigate('settings');
        this.toast('✅ 数据导入成功，共恢复 ' + keys.filter(k => data[k] !== undefined).length + ' 项');
      } catch (err) {
        this.toast('❌ 导入失败：' + (err.message || '未知错误'));
      }
    };
    document.body.appendChild(input);
    input.click();
    setTimeout(() => input.remove(), 1000);
  },


  clearData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
      ['profile','todos','habits','schedules','diaries','expenses','notes','health','customModuleData','weeklyReports','aiRules','focusGuided','reminders','readings','fitnessLog','pwaDataChecked','attendance','dailyCases'].forEach(k => Store.remove(k));
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
    // 支持 async onConfirm：返回 Promise 时，等其 resolve 再关闭；reject 则保持弹窗打开
    overlay.querySelector('#modalConfirm').onclick = async () => {
      if (!onConfirm) { close(); return; }
      try {
        const result = onConfirm();
        if (result && typeof result.then === 'function') {
          await result;
        }
        close();
      } catch(e) {
        // 异步失败，保持弹窗打开，让用户看到错误
      }
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
  // 上下班打卡模块
  // ============================================
  _attendanceYear: null,
  _attendanceMonth: null,

  changeAttendanceMonth(delta) {
    this._attendanceMonth += delta;
    if (this._attendanceMonth < 0) { this._attendanceMonth = 11; this._attendanceYear--; }
    if (this._attendanceMonth > 11) { this._attendanceMonth = 0; this._attendanceYear++; }
    this.renderTodoContent();
  },

  renderAttendanceMonth() {
    const now = new Date();
    if (!this._attendanceYear) this._attendanceYear = now.getFullYear();
    if (this._attendanceMonth === null || this._attendanceMonth === undefined) this._attendanceMonth = now.getMonth();

    const year = this._attendanceYear;
    const month = this._attendanceMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = (year === today.getFullYear() && month === today.getMonth());

    const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    const weekHeaders = ['日','一','二','三','四','五','六'];

    const records = this.attendance.records || {};

    // 统计本月出勤
    let presentCount = 0, checkInCount = 0, checkOutCount = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const isoDate = this._dateToISO(new Date(year, month, d));
      const r = records[isoDate];
      if (!r) continue;
      if (r.checkIn || r.checkOut) presentCount++;
      if (r.checkIn) checkInCount++;
      if (r.checkOut) checkOutCount++;
    }

    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += '<div class="cal-cell empty"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const isoDate = this._dateToISO(dateObj);
      const isToday = isCurrentMonth && d === today.getDate();
      const r = records[isoDate];

      let statusDots = '';
      let cellClass = 'cal-cell';
      if (r) {
        if (r.checkIn && r.checkOut) {
          cellClass += ' att-both';
        } else if (r.checkIn) {
          cellClass += ' att-in';
        } else if (r.checkOut) {
          cellClass += ' att-out';
        }
      } else if (isToday) {
        // 未打卡
      }

      const dayInfo = LunarCalendar.getDayInfo(isoDate);
      let lunarClass = 'cal-lunar';
      if (dayInfo.specialType === 'holiday' || dayInfo.specialType === 'lunar-festival') lunarClass += ' cal-lunar-holiday';
      else if (dayInfo.specialType === 'solar-term') lunarClass += ' cal-lunar-term';
      else if (dayInfo.specialType === 'workday') lunarClass += ' cal-lunar-workday';

      cells += `<div class="${cellClass}${isToday?' today':''}" onclick="App.showAttendanceDayDetail('${isoDate}')">
        <div class="cal-day-num">${d}</div>
        <div class="${lunarClass}">${r ? (r.checkIn || '—') + '·' + (r.checkOut || '—') : dayInfo.shortLabel}</div>
        <div class="cal-dots">${statusDots}</div>
      </div>`;
    }

    return `
      <div class="card" style="text-align:center; padding: 16px;">
        <div class="card-title" style="justify-content:center;"><span class="card-icon">⏰</span>上下班打卡</div>
        <div style="display:flex; gap:8px; justify-content:center;">
          <button class="btn btn-primary" onclick="App.doCheckIn()">📍 上班打卡</button>
          <button class="btn btn-ghost" onclick="App.doCheckOut()">🏠 下班打卡</button>
        </div>
        <div style="font-size:11px; color:var(--text-muted); margin-top:6px;">点击月历中某天，可手动输入/修改当天的上下班时间</div>
      </div>

      <div class="card">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
          <button class="chip" onclick="App.changeAttendanceMonth(-1)">‹</button>
          <div style="font-size:18px; font-weight:700;">${year}年 ${monthNames[month]}</div>
          <button class="chip" onclick="App.changeAttendanceMonth(1)">›</button>
        </div>
        <div class="cal-grid cal-week-header">
          ${weekHeaders.map(w => `<div class="cal-cell-header">${w}</div>`).join('')}
        </div>
        <div class="cal-grid">${cells}</div>
        <div style="display:flex; gap:14px; justify-content:center; margin-top:14px; flex-wrap:wrap; font-size:11px; color:var(--text-light);">
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:rgba(129,199,181,0.35);"></span> 已打卡</span>
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:rgba(255,209,128,0.45);"></span> 仅上班卡</span>
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:rgba(255,138,128,0.35);"></span> 仅下班卡</span>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">${presentCount}</div>
          <div class="stat-label">本月出勤</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--warning);">${checkInCount}</div>
          <div class="stat-label">上班卡</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--secondary);">${checkOutCount}</div>
          <div class="stat-label">下班卡</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${daysInMonth - presentCount}</div>
          <div class="stat-label">未打卡</div>
        </div>
      </div>
    `;
  },

  doCheckIn() {
    const isoDate = this._dateToISO(new Date());
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const time = hh + ':' + mm;
    if (!this.attendance.records) this.attendance.records = {};
    if (!this.attendance.records[isoDate]) this.attendance.records[isoDate] = {};
    this.attendance.records[isoDate].checkIn = time;
    this.saveAttendance();
    this.toast('✅ ' + time + ' 上班打卡成功');
    this.renderTodoContent();
  },

  doCheckOut() {
    const isoDate = this._dateToISO(new Date());
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const time = hh + ':' + mm;
    if (!this.attendance.records) this.attendance.records = {};
    if (!this.attendance.records[isoDate]) this.attendance.records[isoDate] = {};
    this.attendance.records[isoDate].checkOut = time;
    this.saveAttendance();
    this.toast('✅ ' + time + ' 下班打卡成功');
    this.renderTodoContent();
  },

  showAttendanceDayDetail(isoDate) {
    const dateObj = new Date(isoDate + 'T00:00:00');
    const monthDay = `${dateObj.getMonth()+1}月${dateObj.getDate()}日`;
    const weekDay = '日一二三四五六'[dateObj.getDay()];
    const r = (this.attendance.records || {})[isoDate] || {};

    const dayInfo = LunarCalendar.getDayInfo(isoDate);
    const lunar = dayInfo.lunar;

    let html = `<div style="text-align:center; margin-bottom:12px;">
      <div style="font-size:16px; font-weight:700;">⏰ ${monthDay} 星期${weekDay}</div>
      <div style="font-size:13px; color:var(--text-light); margin-top:4px;">
        ${lunar.ganZhi}年 · ${lunar.monthName}${lunar.dayName}
      </div>
    </div>`;

    html += `
      <div class="field-label">上班打卡时间</div>
      <input class="input" id="attCheckIn" type="time" value="${r.checkIn || ''}">
      <div class="field-label">下班打卡时间</div>
      <input class="input" id="attCheckOut" type="time" value="${r.checkOut || ''}">
      <div class="field-label">备注（可选）</div>
      <input class="input" id="attNote" placeholder="如：外勤、请假..." value="${r.note || ''}">
    `;

    this.showModal(monthDay + ' 打卡详情', html, () => {
      const checkIn = document.getElementById('attCheckIn').value;
      const checkOut = document.getElementById('attCheckOut').value;
      const note = document.getElementById('attNote').value.trim();
      if (!this.attendance.records) this.attendance.records = {};
      this.attendance.records[isoDate] = { checkIn, checkOut, note };
      this.saveAttendance();
      this.renderTodoContent();
      this.toast('✅ 已保存');
    });

    // 如果已有记录，增加删除按钮
    if (r.checkIn || r.checkOut) {
      setTimeout(() => {
        const confirmBtn = document.getElementById('modalConfirm');
        if (confirmBtn) {
          const delBtn = document.createElement('button');
          delBtn.className = 'btn btn-ghost';
          delBtn.style.cssText = 'flex:1; color:var(--danger);';
          delBtn.textContent = '🗑️ 删除';
          delBtn.onclick = () => {
            delete this.attendance.records[isoDate];
            this.saveAttendance();
            this.renderTodoContent();
            document.querySelector('.modal-overlay')?.remove();
            this.toast('已删除打卡记录');
          };
          confirmBtn.parentNode.insertBefore(delBtn, confirmBtn);
        }
      }, 50);
    }
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

      const dayInfo = LunarCalendar.getDayInfo(isoDate);

      let dots = '';
      if (dayTodos) dots += '<span class="cal-dot dot-todo"></span>';
      if (dayHabits) dots += '<span class="cal-dot dot-habit"></span>';
      if (daySchedules) dots += '<span class="cal-dot dot-schedule"></span>';
      if (dayDiaries) dots += '<span class="cal-dot dot-diary"></span>';

      let lunarClass = 'cal-lunar';
      if (dayInfo.specialType === 'holiday' || dayInfo.specialType === 'lunar-festival') {
        lunarClass += ' cal-lunar-holiday';
      } else if (dayInfo.specialType === 'solar-term') {
        lunarClass += ' cal-lunar-term';
      } else if (dayInfo.specialType === 'workday') {
        lunarClass += ' cal-lunar-workday';
      }

      cells += `<div class="cal-cell${isToday?' today':''}" onclick="App.showDayDetail('${isoDate}')">
        <div class="cal-day-num">${d}</div>
        <div class="${lunarClass}">${dayInfo.shortLabel}</div>
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

    // 获取农历信息
    const dayInfo = LunarCalendar.getDayInfo(isoDate);
    const lunar = dayInfo.lunar;

    let lunarInfoHTML = `<div style="text-align:center; margin-bottom:12px;">
      <div style="font-size:16px; font-weight:700;">📅 ${monthDay} 星期${weekDay}</div>
      <div style="font-size:13px; color:var(--text-light); margin-top:4px;">
        ${lunar.ganZhi}年 · ${lunar.monthName}${lunar.dayName}
      </div>`;

    if (dayInfo.solarTerm) {
      lunarInfoHTML += `<div style="font-size:12px; color:var(--success); margin-top:2px;">🌿 ${dayInfo.solarTerm}</div>`;
    }
    if (dayInfo.holiday) {
      const holidayColor = dayInfo.holiday.type === 'holiday' ? 'var(--danger)' : 'var(--warning)';
      const holidayIcon = dayInfo.holiday.type === 'holiday' ? '🎉' : '💼';
      lunarInfoHTML += `<div style="font-size:12px; color:${holidayColor}; margin-top:2px;">${holidayIcon} ${dayInfo.holiday.name}</div>`;
    }
    if (lunar.festival) {
      lunarInfoHTML += `<div style="font-size:12px; color:var(--danger); margin-top:2px;">🏮 ${lunar.festival}</div>`;
    }
    lunarInfoHTML += `</div>`;

    let html = lunarInfoHTML;

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
    // 打卡记录
    const attRecord = (this.attendance.records || {})[isoDate];
    if (attRecord && (attRecord.checkIn || attRecord.checkOut)) {
      html += '<div class="field-label">⏰ 上下班打卡</div>';
      html += '<div class="day-detail-item"><span class="detail-time">' + (attRecord.checkIn || '—') + '</span><span style="flex:1">上班打卡</span></div>';
      html += '<div class="day-detail-item"><span class="detail-time">' + (attRecord.checkOut || '—') + '</span><span style="flex:1">下班打卡</span></div>';
      if (attRecord.note) html += '<div class="day-detail-item"><span>📝</span><span style="flex:1">' + this._escapeHtml(attRecord.note) + '</span></div>';
    }
    // 案例记录
    const dayCases = (this.dailyCases || []).filter(c => c.date === isoDate);
    if (dayCases.length) {
      html += '<div class="field-label">📋 每日案例</div>';
      dayCases.forEach(c => {
        const d = c.deductions || {};
        const deducted = !!(d.a || d.b || d.c);
        html += '<div class="day-detail-item"><span>📋</span><span style="flex:1">' + (c.caseNo ? '<span class="case-no">' + this._escapeHtml(c.caseNo) + '</span> ' : '') + this._escapeHtml(c.caseName) + (c.project ? ' · ' + this._escapeHtml(c.project) : '') + '</span><span style="font-weight:600;color:var(--primary-dark);">' + (deducted ? '已划扣' : '未划扣') + '</span></div>';
      });
    }
    if (!schedules.length && !todos.length && !this.habits.length && !diaries.length && !attRecord && !dayCases.length) {
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
      <button class="btn btn-primary" style="width:100%;" onclick="App.exportICS()">📥 导出日程到日历</button>
      <button class="btn btn-primary" style="width:100%; margin-top:8px; background:#FF9800;" onclick="App.syncRemindersToCalendar()">🔔 同步提醒到系统日历（轻提醒）</button>
      <button class="btn btn-primary" style="width:100%; margin-top:8px; background:#7B1FA2;" onclick="App.exportAlarmsToShortcuts()">⏰ 导出闹钟到快捷指令（持续响铃）</button>
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

  // 生成提醒专用的 .ics 文件（多重 VALARM + 强铃声）
  generateReminderICS() {
    const now = new Date();
    const dtstamp = now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + 'T' + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0') + String(now.getSeconds()).padStart(2,'0');
    let events = [];

    (this.reminders || []).forEach(r => {
      if (!r.enabled) return;
      const [hh, mm] = r.time.split(':');
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hh), parseInt(mm), 0);
      const endDate = new Date(startDate.getTime() + 60000);
      const fmt = (d) => d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + 'T' + String(d.getHours()).padStart(2,'0') + String(d.getMinutes()).padStart(2,'0') + '00';

      let rrule = '';
      if (r.repeat === 'daily') rrule = 'RRULE:FREQ=DAILY';
      else if (r.repeat === 'weekday') rrule = 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
      else if (r.repeat === 'weekend') rrule = 'RRULE:FREQ=WEEKLY;BYDAY=SA,SU';
      else if (r.repeat === 'custom' && r.customDays && r.customDays.length) {
        const days = ['SU','MO','TU','WE','TH','FR','SA'];
        rrule = 'RRULE:FREQ=WEEKLY;BYDAY=' + r.customDays.map(d => days[d]).join(',');
      }
      // once 不设 RRULE

      // 多重 VALARM：到点响 + 1分钟后再响 + 提前5分钟预告
      events.push(`BEGIN:VEVENT
UID:macaron-reminder-${r.id}@macaron-space
DTSTAMP:${dtstamp}
DTSTART:${fmt(startDate)}
DTEND:${fmt(endDate)}
SUMMARY:⏰ ${r.name}
DESCRIPTION:马卡龙空间提醒 —— ${r.name}（${r.time}）
${rrule}
BEGIN:VALARM
TRIGGER:-PT0M
ACTION:AUDIO
ATTACH;VALUE=URI:Chord
REPEAT:3
DURATION:PT30S
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1M
ACTION:AUDIO
ATTACH;VALUE=URI:Alarm
END:VALARM
BEGIN:VALARM
TRIGGER:-PT5M
ACTION:DISPLAY
DESCRIPTION:即将提醒：${r.name}（5分钟后）
END:VALARM
END:VEVENT`);
    });

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Macaron Space//Reminders//CN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:马卡龙空间·提醒
X-WR-TIMEZONE:Asia/Shanghai
${events.join('\n')}
END:VCALENDAR`;
  },

  // 一键同步提醒到系统日历
  syncRemindersToCalendar() {
    const ics = this.generateReminderICS();
    if (!ics.includes('VEVENT')) {
      this.toast('⚠️ 没有启用的提醒，请先添加并开启提醒');
      return;
    }
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'macaron-reminders.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.toast('📅 .ics 已下载！点击文件→添加全部→到点响铃+震动');
  },

  // 生成快捷指令导入说明页（帮用户把提醒变成系统闹钟）
  exportAlarmsToShortcuts() {
    const enabled = (this.reminders || []).filter(r => r.enabled);
    if (enabled.length === 0) {
      this.toast('⚠️ 请先添加并开启提醒');
      return;
    }

    // 为每个提醒生成一个 shortcuts:// URL（打开快捷指令App创建闹钟）
    // iOS Clock app 没有 URL scheme 直接创建闹钟，但可以用快捷指令的「添加闹钟」动作
    let cards = enabled.map((r, i) => {
      const [hh, mm] = r.time.split(':');
      const hour = parseInt(hh);
      const minute = parseInt(mm);
      const time12h = hour < 12 ? `${hour === 0 ? 12 : hour}:${String(minute).padStart(2,'0')} 上午` : `${hour === 12 ? 12 : hour - 12}:${String(minute).padStart(2,'0')} 下午`;
      const label = r.name;
      // 生成一个 data: URL 包含快捷指令的 JSON 配置
      // 由于直接创建 .shortcut 文件格式复杂，我们提供一个可复制的快捷指令创建步骤
      return `
        <div style="background:linear-gradient(135deg,#FFF3E0,#FFE0B2); border-radius:14px; padding:14px; margin-bottom:10px; text-align:left;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <span style="font-size:24px;">⏰</span>
            <div>
              <div style="font-weight:700; font-size:15px;">${label}</div>
              <div style="font-size:12px; color:#E65100;">${time12h} · ${r.repeat === 'daily' ? '每天' : r.repeat === 'weekday' ? '工作日' : r.repeat === 'weekend' ? '周末' : r.repeat === 'once' ? '仅一次' : '自选星期'}</div>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.8); border-radius:8px; padding:8px 10px; font-size:12px; color:#333; line-height:1.6;">
            <strong>操作步骤：</strong><br>
            1. 打开「<strong>快捷指令</strong>」App<br>
            2. 点右上角「+」创建新指令<br>
            3. 添加动作「<strong>添加闹钟</strong>」（搜索"闹钟"）<br>
            4. 设置时间为 <strong>${time12h}</strong><br>
            5. 重复设为「${r.repeat === 'daily' ? '每天' : r.repeat === 'weekday' ? '工作日' : r.repeat === 'weekend' ? '周末' : '自选'}」<br>
            6. 保存并命名「${label}」
          </div>
        </div>`;
    }).join('');

    const html = `
      <div style="text-align:left; padding:4px 0;">
        <div style="background:linear-gradient(135deg,#E3F2FD,#BBDEFB); border-radius:14px; padding:14px; margin-bottom:14px;">
          <div style="font-size:16px; font-weight:700; color:#1565C0; margin-bottom:6px;">📲 把提醒变成 iPhone 系统闹钟</div>
          <div style="font-size:12px; color:#1976D2; line-height:1.6;">
            iPhone 网页无法直接写入系统闹钟App，但你可以用<strong>快捷指令</strong>手动创建——<br>
            闹钟会像系统闹钟一样<strong>持续响铃</strong>，必须手动关闭！
          </div>
        </div>
        ${cards}
        <div style="background:#F3E5F5; border-radius:14px; padding:14px; margin-top:10px;">
          <div style="font-size:13px; font-weight:700; color:#7B1FA2; margin-bottom:6px;">💡 一次性批量创建技巧</div>
          <div style="font-size:12px; color:#6A1B9A; line-height:1.6;">
            在快捷指令中创建一个指令，对每个提醒重复添加「添加闹钟」动作，<br>
            一次设好所有闹钟时间，以后就不用再管了。
          </div>
        </div>
      </div>
    `;
    this.showModal('⏰ 导出闹钟到快捷指令', html, null);
    setTimeout(() => {
      const confirmBtn = document.getElementById('modalConfirm');
      const cancelBtn = document.getElementById('modalCancel');
      if (confirmBtn) confirmBtn.style.display = 'none';
      if (cancelBtn) { cancelBtn.textContent = '关闭'; cancelBtn.style.flex = '1'; }
    }, 50);
  },

  // 在提醒设置卡片中显示同步按钮的HTML片段
  _getReminderSyncHTML() {
    const count = (this.reminders || []).filter(r => r.enabled).length;
    if (count === 0) {
      return `
        <div style="margin-top:12px; padding:12px; background:#E8F5E9; border-radius:12px; text-align:left;">
          <div style="font-size:12px; color:#2E7D32; margin-bottom:6px;">
            💡 先添加上面的提醒，再同步到系统
          </div>
          <div style="font-size:11px; color:#666;">
            两种同步方式：日历同步（轻提醒）或快捷指令（像闹钟一样持续响铃）
          </div>
        </div>`;
    }
    return `
      <div style="margin-top:12px; padding:12px; background:#FFF3E0; border-radius:12px; text-align:left;">
        <div style="font-size:12px; color:#E65100; margin-bottom:8px; font-weight:600;">
          📲 两种同步方式任选：
        </div>
        <button class="btn btn-primary" style="width:100%; background:#FF9800; font-size:15px; margin-bottom:8px;" onclick="App.syncRemindersToCalendar()">
          📅 方式一：同步到 iPhone 日历（轻提醒）
        </button>
        <button class="btn btn-primary" style="width:100%; background:#7B1FA2; font-size:15px;" onclick="App.exportAlarmsToShortcuts()">
          ⏰ 方式二：导出到快捷指令（像闹钟一样响铃）
        </button>
        <div style="font-size:11px; color:#999; margin-top:8px; line-height:1.5;">
          <strong>方式一</strong>：下载.ics→点击文件→自动导入→到点震动提醒<br>
          <strong>方式二</strong>：按步骤在快捷指令App创建闹钟→持续响铃+震动
        </div>
      </div>`;
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
    const weekReadings = (this.readings || []).filter(r => { if (!r.updatedAt && !r.createdAt) return false; const d = new Date(r.updatedAt || r.createdAt); return d >= start && d <= end; });
    const weekReadingStats = { count: weekReadings.length, minutes: weekReadings.reduce((s,r)=>s+(r.totalMinutes||0),0), finished: weekReadings.filter(r=>r.status==='done').length, reading: weekReadings.filter(r=>r.status==='reading').length, titles: weekReadings.map(r=>r.title) };
    const ff = this.fitnessLog; const isoS = this._dateToISO(start), isoE = this._dateToISO(end);
    const wW = (ff.weights||[]).filter(w => w.date >= isoS && w.date <= isoE).sort((a,b)=>a.date.localeCompare(b.date));
    const wM = (ff.meals||[]).filter(m => m.date >= isoS && m.date <= isoE);
    const wS = (ff.sleepLog||[]).filter(s => s.date >= isoS && s.date <= isoE);
    const weekFitness = { weightCount: wW.length, weightStart: wW[0]?wW[0].value:null, weightEnd: wW[wW.length-1]?wW[wW.length-1].value:null, weightChange: (wW.length>=2)?Math.round((wW[wW.length-1].value-wW[0].value)*10)/10:null, mealCount: wM.length, avgDailyCalories: wM.length>0?Math.round(wM.reduce((s,m)=>s+(m.calories||0),0)/7):0, sleepCount: wS.length, avgSleepHours: wS.length>0?Math.round(wS.reduce((s,sl)=>s+sl.hours,0)/wS.length*10)/10:null };
    const suggestions = this.generateAISuggestions(habitRates, todoDone, todoTotal, scheduleCount, moodTrend, weekReadingStats, weekFitness);

    const report = {
      weekStart: this._dateToISO(start), weekEnd: this._dateToISO(end),
      weekKey: this.getWeekKey(today),
      stats: { todoTotal, todoDone, todoRate: todoTotal > 0 ? Math.round(todoDone / todoTotal * 100) : 0,
        habitRates, scheduleCount, diaryCount: weekDiaries.length,
        reading: weekReadingStats, fitness: weekFitness },
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
    const hasDS = !!Store.get("deepseekKey", "");
    if (hasDS && !report.aiAnalysis) html += '<button class="btn btn-primary" style="width:100%;margin-top:12px;background:#6C5CE7;" onclick="App.runAIAnalysis()">🤖 AI 深度分析本周</button>';
    if (report.aiAnalysis) {
      html += '<div class="field-label">🤖 AI 深度分析</div><div style="background:linear-gradient(135deg,#E8EAF6,#EDE7F6);border-radius:var(--radius-sm);padding:16px;">';
      if (report.aiAnalysis.summary) html += '<div style="font-size:13px;line-height:1.8;margin-bottom:8px;">📝 '+report.aiAnalysis.summary+'</div>';
      if (report.aiAnalysis.suggestions&&report.aiAnalysis.suggestions.length>0) html += report.aiAnalysis.suggestions.map(function(s){return '<div style="font-size:13px;line-height:1.8;margin-bottom:4px;">💡 '+s+'</div>'}).join("");
      if (report.aiAnalysis.nextWeekPlan) html += '<div style="font-size:13px;line-height:1.8;margin-top:8px;padding-top:8px;border-top:1px solid rgba(0,0,0,0.1);">📅 '+report.aiAnalysis.nextWeekPlan+'</div>';
      html += '</div>';
    }
    // 阅读统计
    if (report.stats.reading && report.stats.reading.count > 0) {
      html += '<div class="field-label">📚 本周阅读</div>'; const rs = report.stats.reading;
      html += '<div class="card" style="padding:14px;"><div style="display:flex;justify-content:space-around;text-align:center;margin-bottom:8px;"><div><div style="font-size:20px;font-weight:700;color:var(--primary-dark);">'+rs.reading+'</div><div style="font-size:11px;color:var(--text-light);">在读</div></div><div><div style="font-size:20px;font-weight:700;color:var(--success);">'+rs.finished+'</div><div style="font-size:11px;color:var(--text-light);">读完</div></div><div><div style="font-size:20px;font-weight:700;color:var(--secondary-dark);">'+rs.minutes+'\'</div><div style="font-size:11px;color:var(--text-light);">时长</div></div></div>'+(rs.titles.length>0?'<div style="font-size:12px;color:var(--text-light);">📖 '+rs.titles.join('、')+'</div>':'')+'</div>';
    }
    if (report.stats.fitness && (report.stats.fitness.weightCount > 0 || report.stats.fitness.mealCount > 0)) {
      html += '<div class="field-label">⚖️ 本周减脂</div>'; const fs = report.stats.fitness;
      html += '<div class="card" style="padding:14px;"><div style="display:flex;justify-content:space-around;text-align:center;margin-bottom:8px;">';
      if (fs.weightChange !== null) { const wc=fs.weightChange; const wcC=wc<0?'var(--success)':wc>0?'var(--danger)':'var(--text-light)'; html += '<div><div style="font-size:20px;font-weight:700;color:'+wcC+';">'+(wc>0?'+':'')+wc+'kg</div><div style="font-size:11px;color:var(--text-light);">体重变化</div></div>'; }
      if (fs.avgDailyCalories > 0) html += '<div><div style="font-size:20px;font-weight:700;color:var(--secondary-dark);">'+fs.avgDailyCalories+'</div><div style="font-size:11px;color:var(--text-light);">日均卡路里</div></div>';
      if (fs.avgSleepHours !== null) html += '<div><div style="font-size:20px;font-weight:700;color:var(--primary-dark);">'+fs.avgSleepHours+'h</div><div style="font-size:11px;color:var(--text-light);">平均睡眠</div></div>';
      html += '</div>'+(fs.weightStart&&fs.weightEnd?'<div style="font-size:12px;color:var(--text-light);text-align:center;">'+fs.weightStart+'kg→'+fs.weightEnd+'kg · 记录'+fs.weightCount+'次 · 饮食'+fs.mealCount+'餐</div>':'')+'</div>';
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
  // 定时提醒系统（重写版 - 精确到秒 + 声音 + 更可靠）
  // ============================================
  startReminderChecker() {
    if (this._reminderCheckTimer) clearInterval(this._reminderCheckTimer);
    // 每10秒检查一次（更精确）
    this._reminderCheckTimer = setInterval(() => this.checkReminders(), 10000);
    // 计算到下一分钟的剩余秒数，对齐整分钟检查
    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000;
    setTimeout(() => {
      this.checkReminders();
      // 对齐后改为每60秒检查一次，减少资源消耗
      if (this._reminderCheckTimer) clearInterval(this._reminderCheckTimer);
      this._reminderCheckTimer = setInterval(() => this.checkReminders(), 60000);
    }, msToNextMinute);
  },

  checkReminders() {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    const currentTime = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    const todayISO = this._dateToISO(now);
    const dayOfWeek = now.getDay();

    (this.reminders || []).forEach(r => {
      if (!r.enabled) return;
      if (r.time !== currentTime) return;
      const triggerKey = todayISO + 'T' + currentTime;
      if (r.lastTriggered === triggerKey) return;
      if (!this._shouldReminderFire(r, dayOfWeek)) return;
      r.lastTriggered = triggerKey;
      this.saveReminders();
      this.fireReminder(r);
    });
  },

  _shouldReminderFire(r, dayOfWeek) {
    switch (r.repeat) {
      case 'daily': return true;
      case 'once': {
        const today = this._dateToISO(new Date());
        const triggerKey = today + 'T' + r.time;
        return r.lastTriggered !== triggerKey;
      }
      case 'weekday': return dayOfWeek >= 1 && dayOfWeek <= 5;
      case 'weekend': return dayOfWeek === 0 || dayOfWeek === 6;
      case 'custom': return (r.customDays || []).includes(dayOfWeek);
      default: return true;
    }
  },

  // 播放持续响铃（循环直到停止）
  _playAlertSound() {
    try {
      if (!this._audioCtx) {
        this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = this._audioCtx;
      if (ctx.state === 'suspended') ctx.resume();

      // 先停止之前的响铃
      this._stopAlertSound();

      // 创建持续循环的闹铃声
      const playBeep = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.5, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
        this._alarmOscillators = this._alarmOscillators || [];
        this._alarmOscillators.push(osc);
      };

      // 循环播放：每1.5秒一组叮咚，最多响30秒
      this._alarmInterval = setInterval(() => {
        const now = ctx.currentTime;
        playBeep(880, now, 0.15);
        playBeep(1100, now + 0.2, 0.15);
        playBeep(1320, now + 0.4, 0.3);
      }, 1500);

      // 立即播放第一组
      const now = ctx.currentTime;
      playBeep(880, now, 0.15);
      playBeep(1100, now + 0.2, 0.15);
      playBeep(1320, now + 0.4, 0.3);

      // 30秒后自动停止
      this._alarmTimeout = setTimeout(() => this._stopAlertSound(), 30000);
    } catch(e) {}
  },

  // 停止响铃
  _stopAlertSound() {
    if (this._alarmInterval) { clearInterval(this._alarmInterval); this._alarmInterval = null; }
    if (this._alarmTimeout) { clearTimeout(this._alarmTimeout); this._alarmTimeout = null; }
    if (this._alarmOscillators) {
      this._alarmOscillators.forEach(o => { try { o.stop(); } catch(e){} });
      this._alarmOscillators = [];
    }
  },

  fireReminder(r) {
    // 1. 播放持续响铃（循环直到用户关闭）
    this._playAlertSound();

    // 2. 全屏弹窗（始终可见，带停止按钮）
    this.showReminderAlert(r);

    // 3. Web Notification（后台也能看到）
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('⏰ ' + r.name, {
          body: '提醒时间：' + r.time,
          tag: 'reminder-' + r.id,
          requireInteraction: true,
          vibrate: [300, 200, 300, 200, 300]
        });
      } catch(e) {}
    }

    // 4. 持续振动（Android 支持，iOS不支持）
    if (navigator.vibrate) {
      navigator.vibrate([300, 200, 300, 200, 300, 200, 300, 200, 300, 200, 300, 200, 300]);
    }
  },

  showReminderAlert(r) {
    // 先移除已有的提醒弹窗
    document.querySelectorAll('.reminder-overlay').forEach(o => o.remove());

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay reminder-overlay';
    overlay.innerHTML = `
      <div class="modal reminder-modal" style="animation: slideUp 0.3s cubic-bezier(0.32,0.72,0,1), alarmPulse 1s ease infinite;">
        <div style="text-align:center; padding: 24px 0 16px;">
          <div style="font-size: 64px; margin-bottom: 16px; animation: bellShake 0.4s ease infinite;">🔔</div>
          <div style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #E65100;">${r.name}</div>
          <div style="font-size: 18px; color: var(--primary-dark); font-weight:600; margin-bottom: 4px;">⏰ ${r.time}</div>
          <div style="font-size: 13px; color: #999; margin-top: 8px;">马卡龙空间 · 提醒</div>
        </div>
        <button class="btn btn-primary" style="width:100%; font-size:17px; padding:16px; background:#E65100; font-weight:700;" onclick="App._stopAlertSound(); this.closest('.modal-overlay').remove();">🛑 停止响铃</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // 点击遮罩也可关闭（并停止响铃）
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        App._stopAlertSound();
        overlay.remove();
      }
    });
  },

  requestNotificationPermission() {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(p => {
          if (p === 'granted') {
            this.toast('✅ 通知权限已开启，后台也能收到提醒');
            // 发一条测试通知
            new Notification('马卡龙空间', { body: '通知功能正常！到时间会提醒你', vibrate: [200] });
          } else {
            this.toast('⚠️ 未开启通知，将使用页面弹窗+声音提醒');
          }
        });
      } else if (Notification.permission === 'granted') {
        this.toast('✅ 通知权限已开启');
        new Notification('马卡龙空间', { body: '通知功能正常！', vibrate: [200] });
      } else {
        this.toast('❌ 通知被拒绝，请在系统设置中开启');
      }
    } else {
      this.toast('当前浏览器不支持通知，将使用页面弹窗+声音');
    }
  },

  showReminderModal_edit(existing) {
    const r = existing || {};
    const isEdit = !!existing;
    this.showModal(isEdit ? '编辑提醒' : '添加提醒', `
      <div class="field-label">提醒名称</div>
      <input class="input" id="reminderName" placeholder="如：睡觉提醒、喝水提醒..." maxlength="20" value="${r.name || ''}">
      <div class="field-label">提醒时间</div>
      <input class="input" id="reminderTime" type="time" value="${r.time || '08:00'}">
      <div class="field-label">重复模式</div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <div class="chip reminder-repeat ${(!r.repeat || r.repeat==='daily')?'active':''}" data-repeat="daily" onclick="App.selectReminderRepeat(this)">📅 每天</div>
        <div class="chip reminder-repeat ${r.repeat==='weekday'?'active':''}" data-repeat="weekday" onclick="App.selectReminderRepeat(this)">💼 工作日</div>
        <div class="chip reminder-repeat ${r.repeat==='weekend'?'active':''}" data-repeat="weekend" onclick="App.selectReminderRepeat(this)">🎉 周末</div>
        <div class="chip reminder-repeat ${r.repeat==='once'?'active':''}" data-repeat="once" onclick="App.selectReminderRepeat(this)">1️⃣ 仅一次</div>
        <div class="chip reminder-repeat ${r.repeat==='custom'?'active':''}" data-repeat="custom" onclick="App.selectReminderRepeat(this)">📆 自选星期</div>
      </div>
      <div class="field-label" id="customDaysLabel" style="display:${r.repeat==='custom'?'block':'none'};">
        选择要提醒的星期（可多选）
      </div>
      <div style="display:${r.repeat==='custom'?'flex':'none'}; gap:6px; flex-wrap:wrap;" id="customDaysContainer">
        ${['日','一','二','三','四','五','六'].map((d, i) => `
          <div class="chip reminder-custom-day ${(r.customDays||[]).includes(i)?'active':''}" data-day="${i}" onclick="App.toggleCustomDay(this)">周${d}</div>
        `).join('')}
      </div>
    `, () => {
      const name = document.getElementById('reminderName').value.trim();
      const time = document.getElementById('reminderTime').value;
      const repeatEl = document.querySelector('.reminder-repeat.active');
      const repeat = repeatEl ? repeatEl.dataset.repeat : 'daily';
      if (!name) return;
      if (!time) return;
      const customDays = Array.from(document.querySelectorAll('.reminder-custom-day.active')).map(el => parseInt(el.dataset.day));
      if (isEdit) {
        r.name = name; r.time = time; r.repeat = repeat;
        r.customDays = repeat === 'custom' ? customDays : [];
        r.lastTriggered = null;
      } else {
        this.reminders.push({
          id: Date.now(), name, time, repeat,
          customDays: repeat === 'custom' ? customDays : [],
          enabled: true, lastTriggered: null
        });
      }
      this.saveReminders();
      this.navigate('settings');
    });
  },

  selectReminderRepeat(el) {
    document.querySelectorAll('.reminder-repeat').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
    const isCustom = el.dataset.repeat === 'custom';
    const lbl = document.getElementById('customDaysLabel');
    const container = document.getElementById('customDaysContainer');
    if (lbl) lbl.style.display = isCustom ? 'block' : 'none';
    if (container) container.style.display = isCustom ? 'flex' : 'none';
  },

  toggleCustomDay(el) { el.classList.toggle('active'); },

  toggleReminder(id) {
    const r = this.reminders.find(r => r.id === id);
    if (r) { r.enabled = !r.enabled; r.lastTriggered = null; this.saveReminders(); this.navigate('settings'); }
  },

  deleteReminder(id) {
    this.reminders = this.reminders.filter(r => r.id !== id);
    this.saveReminders();
    this.navigate('settings');
  },

  showReminderModal_editById(id) {
    const r = this.reminders.find(r => r.id === id);
    if (r) this.showReminderModal_edit(r);
  },


  // ============================================
  // 本地AI规则引擎
  // ============================================
  generateAISuggestions(habitRates, todoDone, todoTotal, scheduleCount, moodTrend, readingStats, fitnessStats) {
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
    // 阅读相关建议
    if (readingStats && readingStats.count > 0) {
      if (readingStats.finished > 0) {
        suggestions.push(`📚 本周读完 ${readingStats.finished} 本书${readingStats.titles.length > 0 ? '（'+readingStats.titles.slice(0,2).join('、')+'）' : ''}，阅读量不错！下周可以挑选同类型或同作者的书籍继续深入。`);
      }
      if (readingStats.reading > 0 && readingStats.finished === 0) {
        suggestions.push(`📖 本周有 ${readingStats.reading} 本在读书目，但没有读完。下周建议每天固定30分钟阅读时间，加快推进进度。`);
      }
      if (readingStats.minutes >= 150) {
        suggestions.push(`🌟 本周阅读时长 ${readingStats.minutes} 分钟，坚持得很好！下周可以尝试做些读书笔记，加深理解。`);
      } else if (readingStats.minutes > 0 && readingStats.minutes < 60) {
        suggestions.push(`⏰ 本周阅读时长仅 ${readingStats.minutes} 分钟，下周建议每天至少阅读20分钟，积少成多。`);
      }
    } else if (readingStats) {
      suggestions.push('📚 本周没有阅读记录，下周建议每天抽出15分钟阅读，养成习惯。');
    }
    if (readingStats && readingStats.count > 0) {
      if (readingStats.finished > 0) suggestions.push(`📚 本周读完 ${readingStats.finished} 本书，阅读量不错！`);
      if (readingStats.reading > 0 && readingStats.finished === 0) suggestions.push(`📖 本周有 ${readingStats.reading} 本在读书目未完成，下周每天30分钟。`);
      if (readingStats.minutes >= 150) suggestions.push(`🌟 本周阅读 ${readingStats.minutes} 分钟，坚持得很好！`);
      else if (readingStats.minutes > 0 && readingStats.minutes < 60) suggestions.push(`⏰ 本周阅读仅 ${readingStats.minutes} 分钟，下周每天至少20分钟。`);
    } else if (readingStats) { suggestions.push('📚 本周无阅读记录，下周建议每天抽15分钟。'); }
    if (fitnessStats) {
      if (fitnessStats.weightChange !== null) {
        if (fitnessStats.weightChange < 0) suggestions.push(`⚖️ 本周体重下降 ${Math.abs(fitnessStats.weightChange)}kg，减脂顺利！`);
        else if (fitnessStats.weightChange > 0) suggestions.push(`⚠️ 本周体重上升 ${fitnessStats.weightChange}kg，建议控制热量+有氧。`);
        else suggestions.push('⚖️ 本周体重持平，可能进入平台期。');
      }
      if (fitnessStats.avgDailyCalories > 2000) suggestions.push(`🍽️ 日均 ${fitnessStats.avgDailyCalories} kcal偏高，建议1500-1800。`);
      else if (fitnessStats.avgDailyCalories > 0 && fitnessStats.avgDailyCalories < 1000) suggestions.push(`⚠️ 日均仅 ${fitnessStats.avgDailyCalories} kcal过低。`);
      else if (fitnessStats.avgDailyCalories > 0) suggestions.push(`✅ 日均 ${fitnessStats.avgDailyCalories} kcal，合理！`);
      if (fitnessStats.avgSleepHours !== null && fitnessStats.avgSleepHours < 6.5) suggestions.push(`😴 平均睡眠 ${fitnessStats.avgSleepHours}h不足。`);
      if (fitnessStats.weightCount === 0 && fitnessStats.mealCount === 0) suggestions.push('📊 本周无减脂记录，建议每天称重+记录饮食。');
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

  // ============================================
  // 云同步 — GitHub Gist
  // ============================================

  // 收集所有本地数据
  _collectAllData() {
    return {
      profile: this.profile,
      todos: this.todos,
      habits: this.habits,
      schedules: this.schedules,
      diaries: this.diaries,
      expenses: this.expenses,
      notes: this.notes,
      health: this.health,
      customModuleData: this.customModuleData,
      weeklyReports: this.weeklyReports,
      aiRules: this.aiRules,
      reminders: this.reminders,
      readings: this.readings,
      fitnessLog: this.fitnessLog,
      attendance: this.attendance,
      dailyCases: this.dailyCases
    };
  },

  // 从云端恢复数据
  async restoreFromCloud(isFreshLogin) {
    try {
      if (isFreshLogin) this.toast('☁️ 正在恢复账号数据...');
      const result = await AuthSync.download();
      if (!result || !result.data) {
        // 账号下暂无快照，把当前本地数据上传一份
        if (isFreshLogin) {
          setTimeout(() => this.backupToCloud(true), 300);
          this.toast('☁️ 账号暂无备份，已保存当前数据');
        }
        return;
      }
      const cloudData = result.data;
      // 全新登录时强制恢复；否则比较时间戳
      if (!isFreshLogin) {
        const localTime = Store.get('_lastLocalSave', 0);
        const cloudTime = result.updated_at ? new Date(result.updated_at).getTime() : 0;
        if (cloudTime <= localTime && localTime > 0) {
          return; // 本地已是最新，不提示
        }
      }
      // 恢复数据
      if (cloudData.profile) this.profile = cloudData.profile;
      if (cloudData.todos) this.todos = cloudData.todos;
      if (cloudData.habits) this.habits = cloudData.habits;
      if (cloudData.schedules) this.schedules = cloudData.schedules;
      if (cloudData.diaries) this.diaries = cloudData.diaries;
      if (cloudData.expenses) this.expenses = cloudData.expenses;
      if (cloudData.notes) this.notes = cloudData.notes;
      if (cloudData.health) this.health = cloudData.health;
      if (cloudData.customModuleData) this.customModuleData = cloudData.customModuleData;
      if (cloudData.weeklyReports) this.weeklyReports = cloudData.weeklyReports;
      if (cloudData.aiRules) this.aiRules = cloudData.aiRules;
      if (cloudData.reminders) this.reminders = cloudData.reminders;
      if (cloudData.readings) this.readings = cloudData.readings;
      if (cloudData.fitnessLog) this.fitnessLog = cloudData.fitnessLog;
      if (cloudData.attendance) this.attendance = cloudData.attendance;
      if (cloudData.dailyCases) this.dailyCases = cloudData.dailyCases;
      // 恢复 DeepSeek API Key
      if (result.deepseek_key) Store.set('deepseekKey', result.deepseek_key);
      // 保存到本地
      this.saveAllData();
      Store.set('_lastLocalSave', Date.now());
      this._lastSyncTime = new Date().toISOString();
      this.applyTheme(this.profile.theme);
      this.renderTabbar();
      if (isFreshLogin) {
        this.navigate('home');
        this.toast('✅ 数据已从账号恢复');
      } else {
        this.navigate(this.currentPage);
      }
    } catch(e) {
      console.error('账号恢复失败:', e);
      if (isFreshLogin) this.toast('⚠️ 账号恢复失败: ' + e.message);
    }
  },

  // 备份所有数据到账号快照
  async backupToCloud(silent) {
    if (this._syncInProgress) return;
    if (!AuthSync.isLoggedIn()) return;
    this._syncInProgress = true;
    try {
      const data = this._collectAllData();
      const deepseekKey = Store.get('deepseekKey', '');
      await AuthSync.upload(data, deepseekKey);
      Store.set('_lastLocalSave', Date.now());
      this._lastSyncTime = new Date().toISOString();
      if (!silent) this.toast('✅ 数据已备份到账号');
    } catch(e) {
      console.error('账号备份失败:', e);
      if (!silent) this.toast('⚠️ 备份失败: ' + e.message);
    } finally {
      this._syncInProgress = false;
    }
  },

  // 保存所有数据到本地并标记时间
  saveAllData() {
    Store.set('profile', this.profile);
    Store.set('todos', this.todos);
    Store.set('habits', this.habits);
    Store.set('schedules', this.schedules);
    Store.set('diaries', this.diaries);
    Store.set('expenses', this.expenses);
    Store.set('notes', this.notes);
    Store.set('health', this.health);
    Store.set('customModuleData', this.customModuleData);
    Store.set('weeklyReports', this.weeklyReports);
    Store.set('aiRules', this.aiRules);
    Store.set('reminders', this.reminders);
    Store.set('readings', this.readings);
    Store.set('fitnessLog', this.fitnessLog);
    Store.set('attendance', this.attendance);
    Store.set('dailyCases', this.dailyCases);
    Store.set('_lastLocalSave', Date.now());
  },

  // 显示注册弹窗
  showSignUpModal() {
    // 关闭其他弹窗，防止干扰
    document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
    this.showModal('📝 注册账号', `
      <div style="font-size:13px; line-height:1.8; color:var(--text);">
        <div class="field-label">邮箱</div>
        <input class="input" id="regEmail" type="email" placeholder="your@email.com" autocomplete="email">
        <div class="field-label" style="margin-top:10px;">设置密码（6位以上）</div>
        <input class="input" id="regPassword1" type="password" placeholder="输入密码" maxlength="64" autocomplete="new-password">
        <div class="field-label" style="margin-top:10px;">确认密码</div>
        <input class="input" id="regPassword2" type="password" placeholder="再次输入密码" maxlength="64" autocomplete="new-password">
        <div id="regError" style="font-size:12px; color:#E17055; margin-top:6px; display:none;"></div>
        <div style="font-size:11px; color:var(--text-muted); margin-top:8px; line-height:1.6;">
          💡 账号数据保存在本机浏览器中，同一设备登录同账号可恢复数据。换设备请用「导出/导入」迁移。
        </div>
      </div>
    `, () => {
      const email = document.getElementById('regEmail').value.trim();
      const p1 = document.getElementById('regPassword1').value;
      const p2 = document.getElementById('regPassword2').value;
      const errEl = document.getElementById('regError');
      if (!email || !email.includes('@')) { errEl.textContent = '请输入有效邮箱'; errEl.style.display = 'block'; throw new Error('验证失败'); }
      if (!p1 || p1.length < 6) { errEl.textContent = '密码至少需要6位'; errEl.style.display = 'block'; throw new Error('验证失败'); }
      if (p1 !== p2) { errEl.textContent = '两次密码不一致'; errEl.style.display = 'block'; throw new Error('验证失败'); }
      errEl.style.display = 'none';
      return this._doSignUp(email, p1);
    });
  },

  async _doSignUp(email, password) {
    const errEl = document.getElementById('regError');
    try {
      await AuthSync.signUp(email, password);
    } catch(e) {
      if (errEl) { errEl.textContent = e.message; errEl.style.display = 'block'; }
      throw e; // 让 showModal 保持打开
    }
    this.toast('✅ 注册成功！正在保存数据...');
    setTimeout(() => this.backupToCloud(true), 300);
    setTimeout(() => { this.navigate('settings'); this.toast('✅ 已登录：' + email); }, 800);
  },

  // 显示登录弹窗
  showLoginModal() {
    // 关闭其他弹窗，防止干扰
    document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
    this.showModal('🔐 登录账号', `
      <div style="font-size:13px; line-height:1.8; color:var(--text);">
        <div class="field-label">邮箱</div>
        <input class="input" id="loginEmail" type="email" placeholder="your@email.com" autocomplete="email">
        <div class="field-label" style="margin-top:10px;">密码</div>
        <input class="input" id="loginPassword" type="password" placeholder="输入密码" maxlength="64" autocomplete="current-password">
        <div id="loginError" style="font-size:12px; color:#E17055; margin-top:6px; display:none;"></div>
        <div style="margin-top:10px; text-align:center;">
          <span style="font-size:12px; color:var(--primary); text-decoration:underline;" onclick="App.showSignUpModal()">没有账号？去注册</span>
        </div>
      </div>
    `, () => {
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errEl = document.getElementById('loginError');
      if (!email || !password) { errEl.textContent = '请输入邮箱和密码'; errEl.style.display = 'block'; throw new Error('验证失败'); }
      errEl.style.display = 'none';
      return this._doSignIn(email, password);
    });
  },

  async _doSignIn(email, password) {
    const errEl = document.getElementById('loginError');
    try {
      await AuthSync.signIn(email, password);
    } catch(e) {
      if (errEl) { errEl.textContent = e.message; errEl.style.display = 'block'; }
      throw e; // 让 showModal 保持打开
    }
    this.toast('✅ 登录成功：' + email);
    // 登录后从账号快照恢复数据
    setTimeout(() => this.restoreFromCloud(true), 300);
  },

  // 修改密码
  showChangePasswordModal() {
    document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
    this.showModal('🔒 修改密码', `
      <div style="font-size:13px; line-height:1.8; color:var(--text);">
        <div class="field-label">当前密码</div>
        <input class="input" id="oldPassword" type="password" placeholder="输入当前密码" maxlength="64" autocomplete="current-password">
        <div class="field-label" style="margin-top:10px;">新密码（6位以上）</div>
        <input class="input" id="newPassword1" type="password" placeholder="输入新密码" maxlength="64" autocomplete="new-password">
        <div class="field-label" style="margin-top:10px;">确认新密码</div>
        <input class="input" id="newPassword2" type="password" placeholder="再次输入新密码" maxlength="64" autocomplete="new-password">
        <div id="chpwdError" style="font-size:12px; color:#E17055; margin-top:6px; display:none;"></div>
      </div>
    `, () => {
      const oldPwd = document.getElementById('oldPassword').value;
      const new1 = document.getElementById('newPassword1').value;
      const new2 = document.getElementById('newPassword2').value;
      const errEl = document.getElementById('chpwdError');
      if (!oldPwd) { errEl.textContent = '请输入当前密码'; errEl.style.display = 'block'; throw new Error('验证失败'); }
      if (!new1 || new1.length < 6) { errEl.textContent = '新密码至少需要6位'; errEl.style.display = 'block'; throw new Error('验证失败'); }
      if (new1 !== new2) { errEl.textContent = '两次密码不一致'; errEl.style.display = 'block'; throw new Error('验证失败'); }
      errEl.style.display = 'none';
      errEl.style.display = 'none';
      return this._doChangePassword(oldPwd, new1);
    });
  },

  async _doChangePassword(oldPassword, newPassword) {
    const errEl = document.getElementById('chpwdError');
    try {
      await AuthSync.changePassword(oldPassword, newPassword);
    } catch(e) {
      if (errEl) { errEl.textContent = e.message; errEl.style.display = 'block'; }
      throw e;
    }
    this.toast('✅ 密码已更新');
    setTimeout(() => this.navigate('settings'), 500);
  },

  // 显示云同步状态卡片 HTML
  _getCloudSyncHTML() {
    const user = AuthSync.getUser();
    const loggedIn = AuthSync.isLoggedIn();
    const lastSync = this._lastSyncTime ? new Date(this._lastSyncTime).toLocaleString('zh-CN') : '';
    const serverUrl = AuthSync.getServerUrl();
    const isRemote = AuthSync.isRemoteMode();
    const modeLabel = isRemote ? '☁️ 远程服务器' : '💾 本地存储';
    const modeDesc = isRemote ? `服务器: ${serverUrl}` : '数据保存在本机浏览器';

    const serverConfig = `
      <div style="margin-top:12px; padding-top:10px; border-top:1px solid var(--border);">
        <div style="font-size:11px; color:var(--text-light); margin-bottom:6px;">⚙️ 同步模式: <b>${modeLabel}</b></div>
        <div style="font-size:10px; color:var(--text-muted); margin-bottom:8px;">${modeDesc}</div>
        <button class="chip" style="width:100%; justify-content:center;" onclick="App.showServerConfigModal()">⚙️ 服务器设置</button>
      </div>`;

    if (!loggedIn) {
      return `
        <div class="card">
          <div class="card-title"><span class="card-icon">🔐</span>账号同步 <span style="font-size:10px; color:var(--text-muted);">[${modeLabel}]</span></div>
          <div style="font-size:13px; color:var(--text-light); margin-bottom:12px;">
            ${isRemote ? '远程模式：数据同步到服务器，跨设备恢复' : '注册/登录账号，数据将按账号保存'}<br>
            ${isRemote ? '换设备登录同账号即可恢复全部数据' : '同一设备登录同账号即可恢复全部数据'}
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-primary" style="flex:1;" onclick="App.showLoginModal()">🔐 登录</button>
            <button class="btn btn-ghost" style="flex:1;" onclick="App.showSignUpModal()">📝 注册</button>
          </div>
          ${serverConfig}
        </div>`;
    }

    return `
      <div class="card">
        <div class="card-title"><span class="card-icon">🔐</span>账号同步 <span style="font-size:11px;color:#27ae60;">✅ 已登录</span></div>
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
          <div style="font-size:28px;">👤</div>
          <div>
            <div style="font-weight:700;">${user ? user.email : '已登录'}</div>
            <div style="font-size:11px; color:var(--text-light);">${isRemote ? '数据同步到远程服务器' : '数据按账号保存在本机'}</div>
            ${lastSync ? `<div style="font-size:10px; color:var(--text-muted);">上次同步: ${lastSync}</div>` : ''}
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-ghost" style="flex:1;" onclick="App.backupToCloud()">🔄 保存到账号</button>
          <button class="btn btn-ghost" style="flex:1;" onclick="App.restoreFromCloud()">📥 从账号恢复</button>
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button class="chip" style="flex:1; justify-content:center;" onclick="App.showChangePasswordModal()">🔑 修改密码</button>
          <button class="chip" style="flex:1; justify-content:center; color:var(--danger);" onclick="App.logoutCloud()">🚪 退出登录</button>
        </div>
        ${serverConfig}
      </div>`;
  },

  // 退出登录
  logoutCloud() {
    if (confirm('退出登录后本地数据保留，账号快照不会删除。确定退出？')) {
      AuthSync.logout();
      this._lastSyncTime = null;
      this.navigate('settings');
      this.toast('👋 已退出登录');
    }
  },

  // 服务器设置弹窗
  showServerConfigModal() {
    document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
    const currentUrl = AuthSync.getServerUrl();
    this.showModal('⚙️ 服务器设置', `
      <div style="font-size:13px; line-height:1.8; color:var(--text);">
        <div style="background:#f5f5f5; border-radius:8px; padding:10px; margin-bottom:12px; font-size:12px; color:var(--text-light);">
          <b>💡 说明：</b><br>
          • <b>本地模式</b>（默认）：数据存在浏览器，删除主屏幕图标会丢失<br>
          • <b>远程模式</b>：填写服务器地址后，数据同步到云端，跨设备恢复<br>
          • 需自行部署 Docker 后端（见 server 目录）
        </div>
        <div class="field-label">服务器地址</div>
        <input class="input" id="serverUrlInput" type="text" placeholder="如 https://my-server.com" value="${currentUrl}" autocomplete="off">
        <div style="font-size:11px; color:var(--text-muted); margin-top:6px;">留空 = 本地存储模式；填写 = 远程服务器模式</div>
        <div id="serverTestResult" style="font-size:12px; margin-top:8px; display:none;"></div>
      </div>
    `, () => {
      const url = document.getElementById('serverUrlInput').value.trim();
      AuthSync.setServerUrl(url);
      if (url) {
        this.toast('✅ 已切换到远程模式：' + url);
      } else {
        this.toast('✅ 已切换到本地存储模式');
      }
      setTimeout(() => this.navigate('settings'), 500);
    });
    // 添加测试按钮
    setTimeout(() => {
      const modalBody = document.querySelector('.modal-overlay .modal-body');
      if (modalBody) {
        const testBtn = document.createElement('button');
        testBtn.className = 'chip';
        testBtn.style.cssText = 'width:100%; justify-content:center; margin-top:10px;';
        testBtn.textContent = '🔌 测试连接';
        testBtn.onclick = async () => {
          const url = document.getElementById('serverUrlInput').value.trim().replace(/\/+$/, '');
          const resultEl = document.getElementById('serverTestResult');
          if (!url) { resultEl.textContent = '⚠️ 请先填写地址'; resultEl.style.color = '#E17055'; resultEl.style.display = 'block'; return; }
          testBtn.textContent = '⏳ 测试中...';
          testBtn.disabled = true;
          try {
            const resp = await fetch(url + '/api/health');
            const data = await resp.json();
            if (data.ok) {
              resultEl.textContent = '✅ 连接成功！服务正常';
              resultEl.style.color = '#27ae60';
            } else {
              throw new Error('响应异常');
            }
          } catch (e) {
            resultEl.textContent = '❌ 连接失败: ' + e.message;
            resultEl.style.color = '#E17055';
          }
          resultEl.style.display = 'block';
          testBtn.textContent = '🔌 测试连接';
          testBtn.disabled = false;
        };
        modalBody.appendChild(testBtn);
      }
    }, 100);
  },

  // ============================================
  // DeepSeek AI 接入
  // ============================================
  _getDeepSeekHTML() {
    const k = Store.get('deepseekKey', '');
    if (!k) return '<div class="card"><div class="card-title"><span class="card-icon">🤖</span>AI 智能分析</div><div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">接入 DeepSeek API 后，周报将使用 AI 生成更智能的分析</div><button class="btn btn-primary" style="width:100%;background:#6C5CE7;" onclick="App.showDeepSeekModal()">🔑 接入 DeepSeek API</button></div>';
    return '<div class="card"><div class="card-title"><span class="card-icon">🤖</span>AI 智能分析</div><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><span style="font-size:24px;">✅</span><div><div style="font-weight:700;">DeepSeek 已连接</div><div style="font-size:11px;color:var(--text-light);">周报使用 AI 分析</div></div></div><div style="display:flex;gap:8px;"><button class="btn btn-ghost" style="flex:1;" onclick="App.testDeepSeek()">🧪 测试</button><button class="chip" style="flex:1;justify-content:center;color:var(--danger);" onclick="App.removeDeepSeek()">🗑️ 移除</button></div></div>';
  },
  showDeepSeekModal() { this.showModal('🤖 接入 DeepSeek API', '<div class="field-label">DeepSeek API Key</div><input class="input" id="dsKeyInput" type="password" placeholder="sk-xxx" autocomplete="off"><div style="font-size:11px;color:var(--text-light);margin-top:8px;">1. 打开 platform.deepseek.com<br>2. 注册→API Keys→Create<br>3. 复制 Key 粘贴到上方<br>新用户有免费额度</div>', () => { const key=document.getElementById('dsKeyInput').value.trim();if(!key){this.toast('请输入');return;}if(!key.startsWith('sk-')){this.toast('⚠️ 应以sk-开头');return;}Store.set('deepseekKey',key);this.toast('✅ 已保存');this.navigate('settings'); }); },
  removeDeepSeek() { if(confirm('确定移除？')){Store.remove('deepseekKey');this.navigate('settings');this.toast('已移除');} },
  async testDeepSeek() { const key=Store.get('deepseekKey','');if(!key){this.toast('请先设置');return;}this.toast('🧪 测试中...');try{const r=await fetch('https://api.deepseek.com/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify({model:'deepseek-chat',messages:[{role:'user',content:'回复连接成功'}],max_tokens:20})});if(!r.ok)throw new Error('HTTP '+r.status);const d=await r.json();this.toast('✅ '+d.choices[0].message.content);}catch(e){this.toast('❌ '+e.message);} },
  async generateAIWeeklyReport(rd) {
    const key=Store.get('deepseekKey','');if(!key)return null;const s=rd.stats;
    let p='你是贴心生活助手，根据本周数据生成周报分析。用中文回复JSON：{"summary":"总结","suggestions":["建议"],"nextWeekPlan":"下周计划"}\n\n待办：'+s.todoDone+'/'+s.todoTotal+'（'+s.todoRate+'%）\n习惯：'+s.habitRates.map(function(h){return h.emoji+h.name+':'+h.rate+'%'}).join('、')+'\n日程：'+s.scheduleCount+'\n日记：'+s.diaryCount+'篇\n心情：'+rd.moodTrend.map(function(m){return m.mood}).join('→');
    if(s.reading&&s.reading.count>0)p+='\n阅读：在读'+s.reading.reading+'本，读完'+s.reading.finished+'本，时长'+s.reading.minutes+'分钟';
    if(s.fitness)p+='\n减脂：体重'+s.fitness.weightCount+'次'+(s.fitness.weightChange!==null?'，变化'+s.fitness.weightChange+'kg':'')+'，日均'+s.fitness.avgDailyCalories+'kcal，睡眠'+s.fitness.avgSleepHours+'h';
    p+='\n\n请给出个性化分析。';
    try{const r=await fetch('https://api.deepseek.com/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify({model:'deepseek-chat',messages:[{role:'user',content:p}],max_tokens:800,temperature:0.7})});if(!r.ok)throw new Error('HTTP '+r.status);const d=await r.json();const c=d.choices[0].message.content;try{var m=c.match(/\{[\s\S]*\}/);if(m)return JSON.parse(m[0]);}catch(e2){}return{summary:c,suggestions:[],nextWeekPlan:''};}catch(e){console.error('DeepSeek error:',e);return null;}
  },
  async runAIAnalysis() { const wk=this.getWeekKey(new Date());let rp=this.weeklyReports[wk];if(!rp)rp=this.generateWeeklyReport();this.toast('🤖 AI 分析中...');try{const ar=await this.generateAIWeeklyReport(rp);if(ar){rp.aiAnalysis=ar;this.saveWeeklyReports();this.showWeeklyReport();this.toast('✅ AI 分析完成');}else{this.toast('⚠️ 分析失败');}}catch(e){this.toast('❌ '+e.message);} },
  // 重写 saveProfile 使其自动触发云备份
  _originalSaveProfile: null,

};

// ---- 启动 ----
document.addEventListener('DOMContentLoaded', () => App.init());