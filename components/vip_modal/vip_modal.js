// components/vip_modal/vip_modal.js
Component({
  properties:{
    show:Boolean,
    products:Array,
    currentTier:String
  },
  data:{ footerNote:'月卡/年卡按所选计划计算' },
  methods:{
    noop(){},
    close(){ this.triggerEvent('close'); },
    onBuy(e){ this.triggerEvent('buy',{ planId: e.currentTarget.dataset.id }); }
  }
});

// // for wechat cloud
// Component({
//   properties: {
//     show:        { type: Boolean, value: false },
//     // [{ id, name, tier, price, period, originalPrice? }, ...]
//     products:    { type: Array,   value: [] },
//     // 'NONE' | 'VIP' | 'VIP_PLUS'
//     currentTier: { type: String,  value: 'NONE' }
//   },

//   data: {
//     footerNote: '月卡/年卡按所选计划计算',
//     viewPlans: [] // 规范化后的可展示计划
//   },

//   lifetimes: {
//     attached() { this._recompute(); }
//   },

//   observers: {
//     'products, currentTier, show': function () { this._recompute(); }
//   },

//   methods: {
//     noop() {},
//     close() { this.triggerEvent('close'); },

//     onBuy(e) {
//       const id = e?.currentTarget?.dataset?.id;
//       if (id == null || id === '') return;
//       this.triggerEvent('buy', { planId: id });
//     },

//     _recompute() {
//       const list = Array.isArray(this.data.products) ? this.data.products : [];
//       if (!list.length) {
//         this.setData({ viewPlans: [] });
//         return;
//       }

//       // 统一 shape & 计算最划算标签（按单价/天）
//       const normalized = list.map(p => {
//         const price = Number(p.price || 0);
//         const period = String(p.period || '').toUpperCase(); // 'MONTH' | 'YEAR' | 'DAY'
//         const days = period === 'YEAR' ? 365 : period === 'MONTH' ? 30 : 1;
//         const unit = price > 0 && days > 0 ? price / days : Infinity;

//         return {
//           id: p.id,
//           name: p.name || this._tierText(p.tier) || 'VIP',
//           tier: String(p.tier || 'VIP').toUpperCase(),
//           price,
//           period,
//           originalPrice: Number(p.originalPrice || 0),
//           unitCostPerDay: unit
//         };
//       });

//       // 找到最低日均价 → “最划算”
//       const minUnit = normalized.reduce((m, x) => Math.min(m, x.unitCostPerDay), Infinity);

//       const viewPlans = normalized.map(p => {
//         const best = p.unitCostPerDay === minUnit;
//         const disabled = this._compareTier(p.tier, this.data.currentTier) <= 0; // 低于或等于当前等级→禁用
//         const priceText = this._fmtPrice(p.price);
//         const periodText = this._fmtPeriod(p.period);
//         const original = p.originalPrice > p.price ? `原价¥${this._fmtPrice(p.originalPrice)}` : '';

//         return {
//           ...p,
//           best,
//           disabled,
//           priceText,
//           periodText,
//           original
//         };
//       });

//       this.setData({ viewPlans });
//     },

//     _fmtPrice(n) {
//       const x = Number(n || 0);
//       return x % 1 === 0 ? String(x) : x.toFixed(2);
//     },

//     _fmtPeriod(p) {
//       switch (String(p || '').toUpperCase()) {
//         case 'YEAR':  return '年卡';
//         case 'MONTH': return '月卡';
//         case 'DAY':   return '日卡';
//         default:      return '会员';
//       }
//     },

//     _tierText(t) {
//       switch (String(t || 'VIP').toUpperCase()) {
//         case 'VIP_PLUS': return '高级VIP';
//         case 'VIP':      return 'VIP';
//         default:         return 'VIP';
//       }
//     },

//     // > 0: a 高于 b；=0: 相等；<0: a 低于 b
//     _compareTier(a, b) {
//       const rank = { NONE: 0, VIP: 1, VIP_PLUS: 2 };
//       return (rank[String(a || 'NONE').toUpperCase()] || 0) - (rank[String(b || 'NONE').toUpperCase()] || 0);
//     }
//   }
// });
