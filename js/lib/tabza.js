class Tabza {
  constructor(options) {
    this.container = document.querySelector(options.selector);
    this.triggers = this.container.querySelector(".tabza__triggers");
    this.panels = this.container.querySelector(".tabza__panels");
    this.listTrigger = [...this.triggers.querySelectorAll("[data-tab]")];
    this.listPanel = [...this.panels.querySelectorAll("[data-panel]")];

    this.localStorage = options.localStorage;
  }

  init() {
    if (this.localStorage) {
      const tabId = localStorage.getItem("tabza");
      if (tabId) {
        // Remove Active
        this.listTrigger.forEach((t) => t.classList.remove("active"));
        this.listPanel.forEach((p) => p.classList.remove("active"));

        // Tìm đúng Panel để Active lại
        const trigger = this.listTrigger.find((t) => t.dataset.tab === tabId);
        const panel = this.listPanel.find((p) => p.dataset.panel === tabId);

        if (trigger && panel) {
          trigger.classList.add("active");
          panel.classList.add("active");
        }
      }
    }

    this._handleActiveTab();
  }

  _handleActiveTab() {
    this.listTrigger.forEach((trigger) => {
      trigger.onclick = (e) => {
        const target = e.currentTarget;
        const tabId = target.dataset.tab;

        if (this.localStorage) {
          localStorage.setItem("tabza", tabId);
        }

        // Remove Active
        this.listTrigger.forEach((t) => t.classList.remove("active"));
        this.listPanel.forEach((panel) => panel.classList.remove("active"));

        // Add Active
        target.classList.add("active");
        const panel = this.listPanel.find((p) => p.dataset.panel === tabId);
        if (panel) {
          panel.classList.add("active");
        }
      };
    });
  }
}

export default Tabza;
