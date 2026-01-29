// pages/leaderboard/leaderboard.js
const app = getApp();
const { api } = require('../../utils/api');
const { shareData, shareMethods, applyShareOnLoad } = require('../../utils/share');

Page({
  data: {
    ...shareData,
    seg: 'ongoing',        // ongoing | ended
    tab: 'day',            // day | week | month (only for ongoing)
    tabDisabled: { day: false, week: false, month: false },
    me: { 
      uid: app.globalData.userId, 
      nickname: '', 
      weekSteps: 0, 
      joinCount: app.globalData.joinCount, 
      prizeMultiplier: app.globalData.prizeMultiplier, 
      stats: {} 
    },
    claim: { show: false },
    modalHub: { joinCount: app.globalData.joinCount, viewShare: false },

    ongoing: {
      contestId: '',       // 当前进行中的赛事ID,
      contestType: '',
      page: 1,
      size: 30,
      hasMore: true,
      items: [],           // [{rank, userId, name, steps, avatar}]
      my: null,            // { rank, steps, name, avatar }
      showMyRow: false,    // 首屏未显示我的名次时，首页底部固定展示
      firstScreenCount: 0, // 首屏可见的行数（设备相关）
      loadingText: '加载中...'
    },

    ended: {
      page: 1, size: 10, hasMore: true,
      items: [],           // [{contestId,title,dateText,rewardTopN,myRank?,canClaim,claimed}]
      loadingText: '加载中...'
    },

    vip: {}
  },
  ...shareMethods, 

  onLoad() {
    applyShareOnLoad(this); // ⬅️ enables both share menus
    // ... keep your existing onLoad work here (if any)
  },

  onShow() {
    app.afterLogin(async () => {

      const handedRaw = wx.getStorageSync('contestIdForLeaderboard');
      const handed = handedRaw === '' || handedRaw == null ? null : Number(handedRaw);
      const gotoEnded = !!wx.getStorageSync('gotoEnded');
      const handedType = wx.getStorageSync('contestTypeForLeaderboard') || '';

      if (Number.isFinite(handed)) {
        wx.removeStorageSync('contestIdForLeaderboard');
        wx.removeStorageSync('gotoEnded');
        const changed = handed !== this.data.ongoing.contestId;

        const locks = this.computeTabLocks(handedType);
        this.setData({
          'ongoing.contestId': handed,
          seg: gotoEnded ? 'ended' : 'ongoing',
          tab: locks.defaultTab,
          tabDisabled: locks.disabled
        }, () => {
          if (changed) {
            if (gotoEnded) this.loadEnded(true);
            else this.loadOngoing(true);
          } else if (!this.data.ongoing.items.length) {
            if (gotoEnded) this.loadEnded(true);
            else this.loadOngoing(true);
          } else if (!gotoEnded) {
            // 数据已存在但切回 ongoing：也要应用首屏逻辑
            this.reapplyFirstScreenLogic();
          }
        });
      } else {
        if (!this.data.ongoing.items.length || !Number.isFinite(this.data.ongoing.contestId)) {
          this.bootstrap();
        } else if (this.data.seg === 'ongoing') {
          this.reapplyFirstScreenLogic();
        }
      }

      this.loadMeAndVip();
    });
  },

  computeTabLocks(contestType) {
    const type = String(contestType || '').toUpperCase(); // DAILY | WEEKLY | (empty)
    let disabled = { day: false, week: false, month: false };
    let defaultTab = 'day';
    if (type === 'DAILY') {
      disabled = { day: false, week: true, month: true };
      defaultTab = 'day';
    } else if (type === 'WEEKLY') {
      disabled = { day: true, week: false, month: true };
      defaultTab = 'week';
    } else if (type === 'MONTHLY') {
      disabled = { day: true, week: true, month: true };
      defaultTab = 'month';
    } 
    return { disabled, defaultTab };
  },

  async bootstrap() {
    if (!Number.isFinite(this.data.ongoing.contestId)) {
      try {
        const res = await api('/contest/list', 'GET');
        const items = res.items || [];
        if (items.length) {
          items.sort((a,b) => new Date(b.endAt) - new Date(a.endAt));
          this.setData({ 'ongoing.contestId': Number(items[0].id) });
        }
      } catch (e) { console.error(e); }
    }

    this.loadOngoing(true);
  },

  /* ---------------- 一级 / 二级切换 ---------------- */
  switchSeg(e) {
    const seg = e.currentTarget.dataset.k;
    if (seg === this.data.seg) return;

    this.setData({ seg }, () => {
      if (seg === 'ongoing') {
        if (this.data.ongoing.items.length === 0) {
          this.loadOngoing(true);                 // 完全首次加载
        } else {
          this.reapplyFirstScreenLogic();         // 与首次加载同样的首屏判断
        }
      } else if (seg === 'ended' && this.data.ended.items.length === 0) {
        this.loadEnded(true);
      }
    });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.k;       // 'day' | 'week' | 'month'
    if (this.data.tabDisabled?.[tab]) return;
    if (tab === this.data.tab) return;

    // 立即清除固定行，防止切换过程中闪烁
    this.setData({ tab, 'ongoing.showMyRow': false, 'ongoing.firstScreenCount': 0 });
    this.loadOngoing(true);                      // 重置并按首次加载逻辑处理
  },

  /* ---------------- 进行中榜单（日 / 周 / 月） ---------------- */
  async loadOngoing(reset = false) {
    const contestId = Number(
      wx.getStorageSync('contestIdForLeaderboard') || this.data.ongoing.contestId
    );
    const contestType = wx.getStorageSync('contestTypeForLeaderboard');

    if (!Number.isFinite(contestId)) {
      this.setData({ 'ongoing.loadingText': '缺少赛事ID' });
      return;
    }
    if (reset) {
      this.setData({
        'ongoing.page': 1,
        'ongoing.contestType': (wx.getStorageSync('contestTypeForLeaderboard') || '').toUpperCase(),
        'ongoing.items': [],
        'ongoing.hasMore': true,
        'ongoing.showMyRow': false,
        'ongoing.firstScreenCount': 0,
        'ongoing.loadingText': '加载中...'
      });
    }
    if (!this.data.ongoing.hasMore) return;

    const { page, size } = this.data.ongoing;
    const scope = this.data.tab; // 'day' | 'week' | 'month'

    try {
      const r = await api('/leaderboard/list', 'GET', { contestId, page, size, scope });
      const { list = [], hasMore = false } = r || {};

      this.setData({
        'ongoing.contestType': contestType,
        'ongoing.items': this.data.ongoing.items.concat(list),
        'ongoing.hasMore': !!hasMore,
        'ongoing.page': page + 1,
        'ongoing.loadingText': hasMore ? '上拉加载更多' : (this.data.ongoing.items.length ? '没有更多了' : '暂无数据')
      });

      if (reset) {
        try {
          const meRank = await api('/leaderboard/my-rank', 'GET', { contestId, scope });
          if (meRank && typeof meRank.rank === 'number') {
            this.setData({ 'ongoing.my': meRank });
          } else {
            this.setData({ 'ongoing.my': null });
          }
        } catch {
          this.setData({ 'ongoing.my': null });
        }

        // 与首次加载同逻辑：计算首屏并决定是否固定我的行
        this.updateFirstScreenCountAndVisibility();
      }
    } catch (e) {
      console.error(e);
      this.setData({ 'ongoing.loadingText': '加载失败' });
    }
  },

  /* --------- 首屏可见性判断（设备相关首屏条数） ---------- */
  reapplyFirstScreenLogic() {
    // 清零后重新测量并评估
    this.setData({ 'ongoing.showMyRow': false, 'ongoing.firstScreenCount': 0 }, () => {
      this.updateFirstScreenCountAndVisibility();
    });
  },

  updateFirstScreenCountAndVisibility() {
    wx.nextTick(() => {
      const q = wx.createSelectorQuery();
      q.select('.list').boundingClientRect();
      q.select('.rank-row').boundingClientRect(); // 用第一行高度推算行高
      q.exec(res => {
        const [listRect, rowRect] = res || [];
        let firstCount = 0;

        if (listRect && rowRect && rowRect.height > 0) {
          firstCount = Math.max(1, Math.floor(listRect.height / rowRect.height));
        } else {
          firstCount = 8; // 兜底
        }

        this.setData({ 'ongoing.firstScreenCount': firstCount }, () => {
          this.applyShowMyRowByViewport();
        });
      });
    });
  },

  applyShowMyRowByViewport() {
    const my = this.data.ongoing.my;
    const items = this.data.ongoing.items || [];
    const size = this.data.ongoing.size || 30;
    const firstCount = this.data.ongoing.firstScreenCount || 0;

    // 首屏逻辑只在首页数据范围内判定
    const isFirstPageData = items.length <= size;
    if (!isFirstPageData || !my || typeof my.rank !== 'number' || firstCount <= 0) {
      this.setData({ 'ongoing.showMyRow': false });
      return;
    }

    const includedInPage = items.some(x => x.rank === my.rank);
    const includedInViewport = my.rank <= firstCount;

    const show = !includedInViewport && isFirstPageData && (includedInPage || my.rank > size);
    this.setData({ 'ongoing.showMyRow': show });
  },

  /* --------- 任何滚动都取消固定行 ---------- */
  onOngoingScroll() {
    if (this.data.ongoing.showMyRow) {
      this.setData({ 'ongoing.showMyRow': false });
    }
  },

  /* ---------------- 已结束榜单（卡片） ---------------- */
  async loadEnded(reset = false) {
    if (reset) {
      this.setData({
        'ended.page': 1,
        'ended.items': [],
        'ended.hasMore': true,
        'ended.loadingText': '加载中...'
      });
    }
    if (!this.data.ended.hasMore) return;

    const { page, size } = this.data.ended;
    try {
      const r = await api('/contest/ended', 'GET', { page, size });
      const { items = [], hasMore = false } = r || {};

      this.setData({
        'ended.items': this.data.ended.items.concat(items),
        'ended.hasMore': !!hasMore,
        'ended.page': page + 1,
        'ended.loadingText': hasMore ? '上拉加载更多' : (this.data.ended.items.length ? '没有更多了' : '暂无数据')
      });
    } catch (e) {
      console.error(e);
      this.setData({ 'ended.loadingText': '加载失败' });
    }
  },

  loadMoreEnded() {
    if (this.data.seg !== 'ended') return;
    this.loadEnded();
  },

  async loadMeAndVip() {
    const me = await api('/me/getInfo', 'GET');
    const membership = await api('/membership/me', 'GET');
  
    const meta = VIP_META[membership?.tier || 'NONE'];
    const vip = {
      tier: membership?.tier || 'NONE',
      frame: VIP_ASSETS[membership?.tier] || '',
      class: membership?.tier?.toLowerCase?.() || '',
      name: meta.name,
      color: meta.color,
      badge: meta.badge,
      start: membership?.startAt ? fmtDate(membership.startAt) : '',
      end:   membership?.endAt ? fmtDate(membership.endAt) : '',
    };
  
    this.setData({ me, vip });
    app.globalData.joinCount = me.joinCount;
    this.setData({ 'modalHub.joinCount': me.joinCount });
  },

  /* ---------------- actions ---------------- */
  async claim(e){
    e.stopPropagation && e.stopPropagation();
    const contestId = Number(e.currentTarget.dataset.id);

    try{
      const r = await api('/reward/start','POST',{ contestId });
      const d = await api('/reward/detail','GET',{ claimId: r.claimId });

      this.setData({
        claim: {
          show: true,
          claimId: r.claimId,
          contestId,
          rank: r.rank,
          prizeTitle: d.prizeTitle,
          imageUrl: '/assets/prize_sample.jpg',
          taobaoLink: d.taobaoLink,
          csWeChatId: d.csWeChatId,
          orderNo: d.orderNo,
          waybillNo: d.waybillNo,
          stateHint: d.stateHint
        }
      });
    }catch(err){
      wx.showToast({ title: err?.message || '领取失败', icon:'none' });
    }
  },

  async viewPrize(e){
    e.stopPropagation && e.stopPropagation();
    const claimId = Number(e.currentTarget.dataset.claimId);
    if (!Number.isFinite(claimId)) {
      wx.showToast({ title: '缺少 claimId', icon: 'none' });
      return;
    }
    try{
      const d = await api('/reward/detail','GET',{ claimId });
      this.setData({
        claim: {
          show: true,
          claimId,
          contestId: d.contestId,
          rank: d.rank,
          prizeTitle: d.prizeTitle || '奖品',
          imageUrl: d.imageUrl || '/assets/prize_sample.jpg',
          taobaoLink: d.taobaoLink || '',
          csWeChatId: d.csWeChatId || '15786424201',
          orderNo: d.orderNo || '',
          waybillNo: d.waybillNo || '',
          stateHint: d.stateHint || ''
        }
      });
    }catch(err){
      wx.showToast({ title: err?.message || '加载失败', icon: 'none' });
    }
  },
  closeClaimModal(){ this.setData({ 'claim.show': false }); },

  goRanking(e) {
    const { id, type } = e.currentTarget?.dataset || {};
    if (!id) return;
    wx.setStorageSync('contestIdForLeaderboard', Number(id));
    wx.setStorageSync('contestTypeForLeaderboard', String(type || ''));
    this.setData({seg:'ongoing'});
    this.loadOngoing(true);
  },

  noop(){}
});

const VIP_ASSETS = {
  BRONZE: '/assets/my/VIP1.png',
  SILVER: '/assets/my/VIP2.png',  
  GOLD:   '/assets/my/VIP3.png',
};

const VIP_META = {
  NONE:   { name: '',      color: '#9aa0a6', badge: '' },
  BRONZE: { name: '青铜会员', color: '#AF6F59', badge: '青铜' },
  SILVER: { name: '白银会员', color: '#7AA7FF', badge: '白银' },
  GOLD:   { name: '黄金会员', color: '#F6A623', badge: '黄金' },
};

function fmtDate(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}.${dt.getMonth()+1}.${dt.getDate()}`;
}
