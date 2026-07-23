// TAGGER PRO V6 - Universal Pagination
const Pagination = {
    _instances: {},

    create(containerId, options = {}) {
        const config = {
            itemsPerPage: options.itemsPerPage || 20,
            currentPage: 1,
            totalItems: 0,
            onPageChange: options.onPageChange || function() {},
            ...options
        };
        this._instances[containerId] = config;
        return this;
    },

    update(containerId, totalItems) {
        const inst = this._instances[containerId];
        if (!inst) return;
        inst.totalItems = totalItems;
        if (inst.currentPage > this.getTotalPages(containerId)) {
            inst.currentPage = Math.max(1, this.getTotalPages(containerId));
        }
        this.render(containerId);
    },

    getTotalPages(containerId) {
        const inst = this._instances[containerId];
        return Math.max(1, Math.ceil(inst.totalItems / inst.itemsPerPage));
    },

    goTo(containerId, page) {
        const inst = this._instances[containerId];
        if (!inst) return;
        const total = this.getTotalPages(containerId);
        inst.currentPage = Math.max(1, Math.min(page, total));
        this.render(containerId);
        inst.onPageChange(inst.currentPage);
    },

    getPageData(containerId, allItems) {
        const inst = this._instances[containerId];
        if (!inst) return allItems;
        const start = (inst.currentPage - 1) * inst.itemsPerPage;
        return allItems.slice(start, start + inst.itemsPerPage);
    },

    render(containerId) {
        const inst = this._instances[containerId];
        const container = document.getElementById(containerId);
        if (!inst || !container) return;

        const total = this.getTotalPages(containerId);
        const current = inst.currentPage;

        if (total <= 1) { container.innerHTML = ''; return; }

        let html = '<div class="pagination">';
        html += `<button ${current <= 1 ? 'disabled' : ''} onclick="Pagination.goTo('${containerId}', ${current - 1})"><i class="fa-solid fa-chevron-right"></i></button>`;

        const range = [];
        for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) range.push(i);
        if (range[0] > 1) { html += `<button onclick="Pagination.goTo('${containerId}', 1)">1</button>`; if (range[0] > 2) html += '<button disabled>...</button>'; }
        range.forEach(p => { html += `<button class="${p === current ? 'active' : ''}" onclick="Pagination.goTo('${containerId}', ${p})">${p}</button>`; });
        if (range[range.length - 1] < total) { if (range[range.length - 1] < total - 1) html += '<button disabled>...</button>'; html += `<button onclick="Pagination.goTo('${containerId}', ${total})">${total}</button>`; }

        html += `<button ${current >= total ? 'disabled' : ''} onclick="Pagination.goTo('${containerId}', ${current + 1})"><i class="fa-solid fa-chevron-left"></i></button>`;
        html += `<span style="font-size:12px;color:var(--text-3);margin:0 8px;">${inst.totalItems} عنصر</span>`;
        html += '</div>';
        container.innerHTML = html;
    }
};
