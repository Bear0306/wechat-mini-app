// utils/share.js
const { buildCurrentPath, buildCurrentQuery } = require('./path');

/** Put this into page.data via object spread */
const shareData = {
  share: { show: false, imgId: '', imgUrl: '', query:'' }
};

/** Call inside onLoad (keeps your existing onLoad logic intact) */
function applyShareOnLoad(ctx) {
  wx.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline']
  });
}

/** Spread these into your Page({...}) methods */
const shareMethods = {

  onShareAppMessage(options) {
    const urlFromBtn = options?.target?.dataset?.url || '';
    const queryFromBtn = options?.target?.dataset?.query || '';
    const imageUrl = this.data.share.imgUrl || urlFromBtn;
    const shareQuery = this.data.share.shareQuery || queryFromBtn;
    return {
      title: '一起加入运动竞赛!',
      imageUrl,
      path: buildCurrentPath() + shareQuery
    };
  },

  onShareTimeline() {
    const imageUrl = this.data.share.imgUrl;
    return {
      title: '一起加入运动竞赛！',
      imageUrl,
      query: buildCurrentQuery()
    };
  }
};

module.exports = { shareData, shareMethods, applyShareOnLoad };
