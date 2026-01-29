Page({
  data: {
    agreed: false
  },

  onLoad() {
    // 检查是否已同意过规则
    const agreed = wx.getStorageSync('agreed_rules') || false;
    this.setData({ agreed });
  },

  // 用户点击“同意”按钮
  agree() {
    wx.setStorageSync('agreed_rules', true);
    this.setData({ agreed: true });

    wx.showToast({ title: '已同意', icon: 'success' });

    // 返回上一页
    wx.navigateBack();
  }
});

// // for wechat cloud
// Page({
//   data: {
//     agreed: false,
//     version: '1', // 可通过页面参数覆盖：?version=2
//   },

//   onLoad(options) {
//     const version = String(options?.version || this.data.version || '1');
//     const key = this._key(version);

//     // 已同意过则直接体现
//     const agreed = !!wx.getStorageSync(key);
//     this.setData({ version, agreed });
//   },

//   // —— 用户点击“同意” ——
//   agree() {
//     const { version } = this.data;
//     const key = this._key(version);

//     // 已同意则不重复写入
//     if (!wx.getStorageSync(key)) {
//       wx.setStorageSync(key, {
//         agreed: true,
//         at: Date.now(), // 记录时间戳
//         version,
//       });
//     }

//     this.setData({ agreed: true });
//     wx.showToast({ title: '已同意', icon: 'success' });

//     // 优先返回上一页；若无历史，则切到首页
//     wx.navigateBack({
//       fail: () => {
//         wx.switchTab({ url: '/pages/index/index' });
//       }
//     });
//   },

//   // 生成本地存储 Key（带版本）
//   _key(v) {
//     return `agreed_rules_v${v}`;
//   }
// });
