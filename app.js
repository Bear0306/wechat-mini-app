// app.js
const { api } = require('./utils/api');

function resolveApiBase() {
  try {
    const { miniProgram } = wx.getAccountInfoSync?.() || {};
    const env = miniProgram?.envVersion || 'develop';
    // Backend user APIs are under /api/user/* (wechat-mini-backend)
    return 'https://yd.qiaq.online/api/user';
    // if (env === 'release')  return 'https://yd.qiaq.online/api/user';
    // if (env === 'trial')    return 'https://hwls1.qiaq.online/api/user';
    // return 'http://localhost:8080/api/user';
  } catch (e) {
    console.warn('resolveApiBase failed, fallback to dev:', e);
    // return 'http://localhost:8080/api/user';
    return 'https://yd.qiaq.online/api/user';
  }
}

function getReferralFromEnterOptions() {
  try {
    const enter = wx.getEnterOptionsSync?.();
    const raw = enter?.query?.ref || '';
    return raw ? decodeURIComponent(String(raw)).trim() : '';
  } catch {
    return '';
  }
}

async function acceptReferralOnce(code) {
  if (!code) return;

  try {
    const res = await api('/referral/accept', 'POST', { code });

    if (res?.ok) {
      wx.removeStorageSync('pendingRef');
    } else {
      wx.setStorageSync('pendingRef', code);
      console.warn('accept referral not ok:', res);
    }
  } catch (e) {
    wx.setStorageSync('pendingRef', code);
    console.warn('accept referral error:', e);
  }
}

App({
  globalData: {
    token: '',
    userId: '',
    joinCount: 0,
    prizeMultiplier: 1,
    apiBase: resolveApiBase(),
    serverAddress: 'https://yd.qiaq.online',
    // serverAddress: 'http://192.168.1.7:8080',
    cashed_assets: {
      share: null
    }
  },

  onLaunch() {
    // 1️⃣ Capture referral
    const refFromEntry = getReferralFromEnterOptions();
    const readyToUse = refFromEntry || wx.getStorageSync('pendingRef') || '';

    if (readyToUse) {
      wx.setStorageSync('pendingRef', readyToUse);
    }

    // 2️⃣ Restore cached credentials
    const token = wx.getStorageSync('token');
    const userId = wx.getStorageSync('userId');
    const joinCount = wx.getStorageSync('joinCount');
    const prizeMultiplier = wx.getStorageSync('prizeMultiplier');

    if (token) this.globalData.token = token;
    if (userId) this.globalData.userId = userId;
    if (joinCount) this.globalData.joinCount = joinCount;
    if (prizeMultiplier) this.globalData.prizeMultiplier = prizeMultiplier;

    // 3️⃣ Ensure login (NO profile request here)
    this.ensureLogin({ forceFreshLogin: !!refFromEntry }).catch(err => {
      console.warn('Initial ensureLogin failed:', err);
    });
  },

  /**
   * Login only
   * No profile permission here (must be user triggered)
   */
  ensureLogin(opts = {}) {
    const { forceFreshLogin = false } = opts;

    if (!forceFreshLogin && this.globalData.token) {
      return Promise.resolve(this.globalData.token);
    }

    return new Promise((resolve, reject) => {
      wx.login({
        success: async ({ code }) => {
          try {
            const res = await api('/auth/login', 'POST', { code });

            const token = res?.token || '';
            const userId = res?.userId || '';
            const joinCount = res?.joinCount || 3;
            const prizeMultiplier = res?.prizeMultiplier || 1;

            if (!token) throw new Error('No token returned');

            // Save to global
            this.globalData.token = token;
            this.globalData.userId = userId;
            this.globalData.joinCount = joinCount;
            this.globalData.prizeMultiplier = prizeMultiplier;

            // Persist
            wx.setStorageSync('token', token);
            if (userId) wx.setStorageSync('userId', userId);
            wx.setStorageSync('joinCount', joinCount);
            wx.setStorageSync('prizeMultiplier', prizeMultiplier);

            // Accept referral AFTER login success
            const refCode = wx.getStorageSync('pendingRef') || '';
            if (refCode) {
              await acceptReferralOnce(refCode);
            }

            resolve(token);
          } catch (e) {
            console.error('Login exchange failed:', e);
            wx.showToast({ title: '登录失败', icon: 'none' });
            reject(e);
          }
        },
        fail: (e) => {
          console.error('wx.login failed:', e);
          wx.showToast({ title: '登录失败', icon: 'none' });
          reject(e);
        }
      });
    });
  },


  async afterLogin(fn) {
    try {
      await this.ensureLogin();
      typeof fn === 'function' && fn();
    } catch (e) {
      console.warn('afterLogin failed:', e);
    }
  },

  logout() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('userId');
    wx.removeStorageSync('joinCount');
    wx.removeStorageSync('prizeMultiplier');

    this.globalData.token = '';
    this.globalData.userId = '';
    this.globalData.joinCount = 3;
    this.globalData.prizeMultiplier = 1;
  }
});
