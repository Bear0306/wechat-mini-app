// components/zero_cta/zero_cta.js
Component({
  properties: {
    // Positioning & sizing
    right:     { type: Number, value: 10 },
    top:    { type: Number, value: 10 },
    btnHeight: { type: Number, value: 40 },
    stackGap:  { type: Number, value: 10 },
    panelGap:  { type: Number, value: 16 },

    // Keep expanded and suppress auto-collapse when true
    always: { type: Boolean, value: false }
  },

  data: {
    // IMPORTANT: defaultExpanded is DATA, not a property
    defaultExpanded: false,
    expanded: false
  },

  lifetimes: {
    attached() {
      // prevent duplicate timers across hot-reloads
      this._collapseTimer = null;

      // 1) Compute today’s first-load flag once
      const key = dailySeenKey();
      const seenToday = !!safeGet(key);
      const isFirstToday = !seenToday;

      // 2) Persist seen flag only if first time today
      if (isFirstToday) safeSet(key, 1);

      // 3) Record defaultExpanded into data (not a prop)
      this.setData({ defaultExpanded: isFirstToday });

      // 4) Derive initial expanded state
      const startExpanded = this.properties.always ? true : !!isFirstToday;
      this.setData({ expanded: startExpanded });

      // 5) Start/clear timer according to rules
      if (startExpanded && !this.properties.always) {
        this.startAutoCollapse();
      } else {
        this.clearCollapseTimer();
      }
    },
    detached() {
      this.clearCollapseTimer();
    }
  },

  observers: {
    // If `always` changes at runtime, reconcile state safely.
    always(val) {
      if (val) {
        // Force expanded; suppress timers
        this.clearCollapseTimer();
        if (!this.data.expanded) this.setData({ expanded: true });
      } else {
        // Re-enable daily behavior:
        // Expand if today’s first load; otherwise collapsed.
        const isFirstToday = !safeGet(dailySeenKey());
        // If it's truly the first time after turning off, mark seen.
        if (isFirstToday) safeSet(dailySeenKey(), 1);

        const nextExpanded = isFirstToday;
        this.setData({ defaultExpanded: isFirstToday, expanded: nextExpanded });

        if (nextExpanded) {
          this.startAutoCollapse();
        } else {
          this.clearCollapseTimer();
        }
      }
    }
  },

  methods: {
    // === Public methods (optional bindings in WXML) ===
    onExpand() {
      if (this.properties.always) {
        this.clearCollapseTimer();
        if (!this.data.expanded) this.setData({ expanded: true });
        return;
      }
      if (!this.data.expanded) this.setData({ expanded: true });
      this.startAutoCollapse();
    },

    onCollapse() {
      if (this.properties.always) return; // ignore manual collapse when pinned
      this.clearCollapseTimer();
      if (this.data.expanded) this.setData({ expanded: false });
    },

    onOpenQuota() {
      this.triggerEvent('openquota');
      if (this.properties.always) return;
      this.clearCollapseTimer();
      if (this.data.expanded) this.setData({ expanded: false });
    },

    // === Timer management ===
    startAutoCollapse() {
      if (this.properties.always) {
        this.clearCollapseTimer();
        return;
      }
      this.clearCollapseTimer();
      this._collapseTimer = setTimeout(() => {
        this._collapseTimer = null;
        // Only collapse if still allowed and still expanded
        if (!this.properties.always && this.data.expanded) {
          this.setData({ expanded: false });
        }
      }, 3000);
    },

    clearCollapseTimer() {
      if (this._collapseTimer) {
        clearTimeout(this._collapseTimer);
        this._collapseTimer = null;
      }
    },

    // === Utilities ===
    // For QA or if you need to simulate a new day without waiting:
    resetForNewDay() {
      try {
        wx.removeStorageSync(dailySeenKey());
      } catch {}
      // Re-run attach logic succinctly:
      const isFirstToday = true;
      this.setData({ defaultExpanded: isFirstToday, expanded: true });
      if (!this.properties.always) this.startAutoCollapse();
      safeSet(dailySeenKey(), 1);
    }
  }
});

/** Build a per-day key */
function dailySeenKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `zero_cta:firstSeen:${yyyy}-${mm}-${dd}`;
}

/** Storage wrappers to avoid exceptions breaking flow */
function safeGet(k) {
  try { return wx.getStorageSync(k); } catch { return ''; }
}
function safeSet(k, v) {
  try { wx.setStorageSync(k, v); } catch {}
}
