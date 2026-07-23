// TAGGER PRO V6 - Error Boundary & Recovery
const ErrorBoundary = {
    show(containerId, error, retryFn) {
        const el = document.getElementById(containerId);
        if (!el) return;
        const retryId = 'retry_' + Date.now();
        el.innerHTML = `
            <div class="error-boundary">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>حدث خطأ</h3>
                <p>${typeof error === 'string' ? error : (error.message || 'خطأ غير معروف')}</p>
                <button id="${retryId}" style="margin-top:12px;padding:8px 24px;border-radius:10px;background:var(--accent);color:#fff;border:none;cursor:pointer;">
                    <i class="fa-solid fa-rotate-right"></i> إعادة المحاولة
                </button>
            </div>
        `;
        if (retryFn) {
            const btn = document.getElementById(retryId);
            if (btn) btn.onclick = () => { el.innerHTML = ''; retryFn(); };
        }
    },

    wrap(fn, containerId) {
        return async function() {
            try {
                return await fn.apply(this, arguments);
            } catch(err) {
                console.error('ErrorBoundary caught:', err);
                if (containerId) ErrorBoundary.show(containerId, err, fn.bind(this, ...arguments));
                if (typeof showToast === 'function') showToast('❌ خطأ: ' + err.message, 'error');
            }
        };
    }
};
