// TAGGER PRO V6 - Skeleton Loading Components
const Skeleton = {
    cards(count = 6) {
        let html = '<div class="grid grid-cols-2 lg:grid-cols-3 gap-3">';
        for (let i = 0; i < count; i++) {
            html += `<div class="skeleton skeleton-card"></div>`;
        }
        return html + '</div>';
    },

    table(rows = 5, cols = 5) {
        let html = '<div class="space-y-2">';
        for (let i = 0; i < rows; i++) {
            html += '<div class="flex gap-2">';
            for (let j = 0; j < cols; j++) {
                html += `<div class="skeleton skeleton-text" style="flex:${j === 0 ? 2 : 1};height:16px;"></div>`;
            }
            html += '</div>';
        }
        return html + '</div>';
    },

    stats(count = 4) {
        let html = '<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">';
        for (let i = 0; i < count; i++) {
            html += `<div class="skeleton" style="height:80px;border-radius:16px;"></div>`;
        }
        return html + '</div>';
    },

    chart() {
        return '<div class="skeleton" style="height:250px;border-radius:16px;"></div>';
    },

    show(elementId, type = 'cards', options = {}) {
        const el = document.getElementById(elementId);
        if (!el) return;
        switch(type) {
            case 'cards': el.innerHTML = this.cards(options.count); break;
            case 'table': el.innerHTML = this.table(options.rows, options.cols); break;
            case 'stats': el.innerHTML = this.stats(options.count); break;
            case 'chart': el.innerHTML = this.chart(); break;
        }
    }
};
