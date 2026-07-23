const LazyLoader = {
    _loaded: {},
    _loading: {},

    libs: {
        'chart': 'vendor/js/chart.min.js',
        'html2canvas': 'vendor/js/html2canvas.min.js',
        'jspdf': 'vendor/js/jspdf.umd.min.js',
        'qrcode': 'vendor/js/html5-qrcode.min.js'
    },

    async load(name) {
        if (this._loaded[name]) return true;
        if (this._loading[name]) return this._loading[name];

        if (!this.libs[name]) return false;

        this._loading[name] = new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = this.libs[name];
            script.onload = () => { this._loaded[name] = true; resolve(true); };
            script.onerror = () => { this._loading[name] = null; resolve(false); };
            document.head.appendChild(script);
        });

        return this._loading[name];
    },

    async loadAll(names) {
        return Promise.all(names.map(n => this.load(n)));
    },

    isLoaded(name) { return !!this._loaded[name]; }
};

function debounce(fn, ms) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    };
}
