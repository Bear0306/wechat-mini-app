const { api } = require('../../utils/api');

Page({
  data: {
    status: ''
  },

  // 分享功能
  onShareAppMessage() {
    const app = getApp();
    const myId = app.globalData?.userId || 'ME_PLACEHOLDER';

    return {
      title: '一起参加运动竞赛！',
      path: '/pages/index/index?ref=' + myId
    };
  },

  // 检查当前邀请倍数
  async checkMultiplier() {
    try {
      const r = await api('/referral/multiplier', 'GET');
      this.setData({ status: '当前倍率 x' + r.multiplierX });
    } catch (e) {
      console.error('Multiplier error:', e);
      wx.showToast({ title: '获取倍率失败', icon: 'none' });
    }
  },

  // 购买 VIP
  async buyVip() {
    try {
      const r = await api('/membership/purchase', 'POST', {
        tier: 'VIP',
        months: 1
      });
      this.setData({ status: '已开通VIP，有效至 ' + r.membership.endAt });
    } catch (e) {
      console.error('Buy VIP error:', e);
      wx.showToast({ title: '购买失败', icon: 'none' });
    }
  },

  // 购买 高级VIP
  async buyVipPlus() {
    try {
      const r = await api('/membership/purchase', 'POST', {
        tier: 'VIP_PLUS',
        months: 1
      });
      this.setData({ status: '已开通高级VIP，有效至 ' + r.membership.endAt });
    } catch (e) {
      console.error('Buy VIP+ error:', e);
      wx.showToast({ title: '购买失败', icon: 'none' });
    }
  }
});

// // for wechat cloud
// const { api } = require('../../utils.js');

// Page({
//   data: {
//     status: ''
//   },

//   // 分享
//   onShareAppMessage() {
//     const app = getApp();
//     const myId = app?.globalData?.userId || 'ME_PLACEHOLDER';
//     return {
//       title: '一起参加运动竞赛！',
//       path: '/pages/index/index?ref=' + myId
//     };
//   },

//   // 统一请求封装（基于 utils.api 的 {statusCode,data,headers}）
//   async requestJSON(path, method = 'GET', data) {
//     const resp = await api(path, method, data);
//     const ok = resp && resp.statusCode >= 200 && resp.statusCode < 300;
//     if (!ok) {
//       console.warn('API non-2xx', path, resp?.statusCode, resp?.data);
//       const msg = (resp && resp.data && (resp.data.message || resp.data.msg)) || '请求失败';
//       throw new Error(msg);
//     }
//     return resp.data;
//   },

//   // 检查当前邀请倍数
//   async checkMultiplier() {
//     try {
//       const d = await this.requestJSON('/referral/multiplier', 'GET');
//       const x =
//         d?.multiplierX ??
//         d?.data?.multiplierX ??
//         d?.multiplier ??
//         1;
//       this.setData({ status: '当前倍率 x' + x });
//     } catch (e) {
//       console.error('Multiplier error:', e);
//       wx.showToast({ title: e?.message || '获取倍率失败', icon: 'none' });
//     }
//   },

//   // 购买 VIP
//   async buyVip() {
//     try {
//       const d = await this.requestJSON('/membership/purchase', 'POST', {
//         tier: 'VIP',
//         months: 1
//       });
//       const endAt = d?.membership?.endAt || d?.endAt || '';
//       this.setData({ status: '已开通VIP，有效至 ' + endAt });
//     } catch (e) {
//       console.error('Buy VIP error:', e);
//       wx.showToast({ title: e?.message || '购买失败', icon: 'none' });
//     }
//   },

//   // 购买 高级VIP
//   async buyVipPlus() {
//     try {
//       const d = await this.requestJSON('/membership/purchase', 'POST', {
//         tier: 'VIP_PLUS',
//         months: 1
//       });
//       const endAt = d?.membership?.endAt || d?.endAt || '';
//       this.setData({ status: '已开通高级VIP，有效至 ' + endAt });
//     } catch (e) {
//       console.error('Buy VIP+ error:', e);
//       wx.showToast({ title: e?.message || '购买失败', icon: 'none' });
//     }
//   }
// });
