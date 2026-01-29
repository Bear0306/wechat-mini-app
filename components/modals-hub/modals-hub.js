// If your api helper is elsewhere, adjust the require path:
const { api } = require('../../utils/api');
const { buildCurrentPath, buildCurrentQuery } = require('../../utils/path');
const { use_assets } = require('../../utils/use_assets');

Component({
  properties: {
    joinCount: {type: Number, value: 3},
    shareImageUrl: { type: String, value: '/assets/share/1.png' },
    viewShare: { type: Boolean, value: false},
    // Optional CTA overrides (layout/behavior)
    cta: { type: Object, value: {} }
  },

  data: {
    ready: false,
    // Mirrors your previous page data
    _joinCount: {type: Number, value: 3},
    quota: {
      show: false,
      count: 0,
      ads: { watched: 0, required: 3 },
      referrals: { invited: 0, toNext: 3 },
      membership: { tier: 'NONE' }
    },

    share: { show: false, imgId: '', imgUrl: '' }
    
  },

  lifetimes: {
    attached() {
    },
    ready(){
    }
  },
  observers: {
    'joinCount'(n) {
      this.setData({ _joinCount:n});
    },
    'viewShare'(val) {
      if (val){
        this.setData({'share.show': true});
      }
    }
  },

  methods: {
    // ========== PUBLIC API (Pages call these via selectComponent) ==========
    openShare() { this.setData({ 'share.show': true }); },
    closeAll() {
      this.setData({ 'quota.show': false, 'share.show': false });
    },

    // ========== INTERNAL WIRING ==========

    // From <zero-cta bind:openquota> ...
    openQuotaFromCta() { 
      try {
        this.setData({ 'quota.show': true });
      } catch (e) {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    },

    closeQuota() { this.setData({ 'quota.show': false }); },

    // Quota actions routeable upward
    startWatchAd() {
      this.triggerEvent('watchad');            // let page start ad flow if needed
      this.setData({ 'quota.show': false });
    },
    goInvite() {
      // Open share picker; page can also listen to 'openShare' if desired
      const assets = use_assets([
        'share1',
        'share2',
        'share3',
        'share4',
        'share5'
      ])
      const shareModal = this.selectComponent("#shareModal");
      shareModal.setImages([
        { id: '1', url: assets['share1'] },
        { id: '2', url: assets['share2'] },
        { id: '3', url: assets['share3'] },
        { id: '4', url: assets['share4'] },
        { id: '5', url: assets['share5'] }
      ]);
      this.setData({ 'share.show': true });
    },
    goMembership() {
      this.triggerEvent('buyMembership');      // page decides where to navigate
      this.setData({ 'quota.show': false });
    }
  }
});
