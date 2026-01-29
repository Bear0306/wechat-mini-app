Component({
  properties: {
    show: { type: Boolean, value: false },
    contestId: { type: Number, value: 0 },
    joinCount: { type: Number, value: 3 }
  },
  data: {
    agreed: false
  },
  methods: {
    noop() {},
    stopScroll() {},
    toggleAgree() {
      this.setData({ agreed: !this.data.agreed });
    },
    close() {
      this.triggerEvent('close');
      this.setData({ agreed: false });
    },
    confirm() {
      if (!this.data.agreed) {
        wx.showToast({ title: '请先勾选同意', icon: 'none' });
        return;
      }
      this.triggerEvent('confirm', { contestId: this.properties.contestId });
      this.setData({ agreed: false });
    },
    goShare() {
      this.triggerEvent('goShare');
    }
  }
});
