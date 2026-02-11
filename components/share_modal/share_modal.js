// components/share_modal/share_modal.js
const app = getApp();

const { api } = require('../../utils/api');

Component({
  properties: {
    show: { type: Boolean, value: false },
  },

  data: {
    displayImages: [
      // { id: '1', url: 'https://wechat-assets-cdn.b-cdn.net/cdn_assets/share/1.png' },
      // { id: '2', url: 'https://wechat-assets-cdn.b-cdn.net/cdn_assets/share/2.png' },
      // { id: '3', url: 'https://wechat-assets-cdn.b-cdn.net/cdn_assets/share/3.png' },
      // { id: '4', url: 'https://wechat-assets-cdn.b-cdn.net/cdn_assets/share/4.png' },
      // { id: '5', url: 'https://wechat-assets-cdn.b-cdn.net/cdn_assets/share/5.png' }
      { id: '1', url: 'https://btcdn.qiaq.online/ydcos/cdn_assets/share/1.jpg' },
      { id: '2', url: 'https://btcdn.qiaq.online/ydcos/cdn_assets/share/2.jpg' },
      { id: '3', url: 'https://btcdn.qiaq.online/ydcos/cdn_assets/share/3.jpg' },
      { id: '4', url: 'https://btcdn.qiaq.online/ydcos/cdn_assets/share/4.jpg' },
      { id: '5', url: 'https://btcdn.qiaq.online/ydcos/cdn_assets/share/5.jpg' }
    ],
    selectedId: '',
    selectedUrl: '',
    referralCode: '',
    shareQuery: ''
  },

  lifetimes: {
    attached() {
      // no await here — call async initializer
      app.afterLogin(async () => {
        this.initShareData();
      });
    }
  },

  methods: {
    async initShareData() {
      const imgs = this.data.displayImages || [];
      const first = imgs.length ? imgs[0] : null;

      const selectedId = first ? first.id : (this.data.selectedId || '');
      const found = imgs.find(x => x.id === selectedId);
      const selectedUrl = (found ? found.url : (first ? first.url : (this.data.selectedUrl || '')));

      try {
        const res = await api('/referral/code', 'GET');
        if (res && res.ok) {
          this.setData({
            referralCode: res.code,
            shareQuery: `?ref=${res.code}`,
            displayImages: imgs,
            selectedId,
            selectedUrl
          });
        } else {
          wx.showToast({ title: 'Failed to load referral code', icon: 'none' });
          this.setData({ displayImages: imgs, selectedId, selectedUrl });
        }
      } catch (err) {
        console.error('fetch referral code failed', err);
        wx.showToast({ title: 'Network error', icon: 'none' });
        this.setData({ displayImages: imgs, selectedId, selectedUrl });
      }
    },

    noop() {},

    onClose() {
      this.setData({ show: false });
    },

    onChoose(e) {
      const { id, url } = e.currentTarget.dataset || {};
      if (!id || !url) return;
      this.setData({ selectedId: id, selectedUrl: url });
    },
    
    setImages(images) {
      this.setData({ displayImages: images });
    }
  }
});
