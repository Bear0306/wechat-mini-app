// components/quota_modal/quota_modal.js
Component({
  properties:{
    show:{ type:Boolean, value:false },
    // stats
    count:{ type:Number, value:0 },
    ads:{ type:Object, value:{ watched:0, required:3 } },
    referrals:{ type:Object, value:{ invited:0, toNext:3 } },
    membership:{ type:Object, value:{ tier:'NONE' } },
  },
  data:{
    joinCount: { type:Number, value:0 }
  },
  observers:{
    'ads, referrals, membership': function(ads, refs, m){
      const watched = (ads && ads.watched) || 0;
      const req = (ads && ads.required) || 3;
      const invited = (refs && refs.invited) || 0;
      const toNext = Math.max(0, 3 - (invited % 3));
      this.setData({
        adsWatched: watched,
        adsReq: req,
        invited,
        refHint: toNext===0 ? '获得挑战机会1次' : ('还差'+toNext+'人'),
        tierText: this.tierToText(m && m.tier)
      });
    },
    count(val){
      this.setData({joinCount: val});
    }
  },
  methods:{
    noop(){},
    close(){ this.triggerEvent('close'); },
    onWatch(){ this.triggerEvent('watch'); this.triggerEvent('close');},
    onShare(){ this.triggerEvent('share');},
    onBuy(){ this.triggerEvent('buy'); this.triggerEvent('close');},
    tierToText(t){
      switch((t||'NONE').toUpperCase()){
        case 'VIP_PLUS': return '白金会员';
        case 'VIP': return '青铜会员';
        case 'NONE': default: return '非会员';
      }
    }
  }
});
