function openQRMenu() {
    const storeName = localStorage.getItem('active_store_name') || 'TAGGER PRO';
    document.getElementById('qrMenuStoreName').textContent = storeName;

    generateQRMenu();
    renderQRMenuProducts();
    openModal('qrMenuTab');
}

function generateQRMenu() {
    const container = document.getElementById('qrCodeDisplay');
    if (!container) return;

    const storeId = currentStoreId;
    const menuUrl = window.location.origin + window.location.pathname.replace('dashboard1.html', '') + `menu.html?store=${storeId}`;

    container.innerHTML = '';

    try {
        const qrDiv = document.createElement('div');
        qrDiv.style.cssText = 'display:inline-block;padding:12px;background:#fff;border-radius:12px;';
        container.appendChild(qrDiv);

        if (typeof QRCode !== 'undefined') {
            new QRCode(qrDiv, {
                text: menuUrl,
                width: 160,
                height: 160,
                colorDark: '#1e1b4b',
                colorLight: '#ffffff'
            });
        } else {
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = 160;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(0, 0, 160, 160);
            ctx.fillStyle = '#1e1b4b';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('QR Code', 80, 85);
            ctx.fillText(menuUrl.substring(0, 30), 80, 100);
            qrDiv.appendChild(canvas);
        }

        const p = document.createElement('p');
        p.className = 'text-[9px] mt-2 text-center';
        p.style.color = '#666';
        p.textContent = 'امسح الكود لعرض القائمة على هاتفك';
        container.appendChild(p);
    } catch(e) {
        container.innerHTML = '<p class="text-xs" style="color:var(--text-3);">خطأ في إنشاء الكود</p>';
    }
}

function renderQRMenuProducts() {
    const container = document.getElementById('qrMenuProducts');
    if (!container) return;

    const categories = [...new Set(localProducts.map(p => p.category || 'بدون فئة'))];

    container.innerHTML = categories.map(cat => {
        const catProducts = localProducts.filter(p => (p.category || 'بدون فئة') === cat && p.stock > 0);
        if (catProducts.length === 0) return '';
        return `
        <div class="rounded-xl overflow-hidden" style="background:var(--bg-elevated);border:1px solid var(--border);">
            <div class="px-3 py-2 font-bold text-xs" style="background:var(--accent-soft);color:var(--accent);">${cat}</div>
            ${catProducts.map(p => `
                <div class="flex items-center justify-between px-3 py-2" style="border-top:1px solid var(--border);">
                    <div>
                        <p class="text-xs font-bold" style="color:var(--text-1);">${p.title || p.product_name}</p>
                        ${p.description ? `<p class="text-[9px]" style="color:var(--text-3);">${p.description}</p>` : ''}
                    </div>
                    <div class="text-left">
                        <p class="text-xs font-bold" style="color:var(--accent);">${(p.sell_price || 0).toFixed(2)}</p>
                        <p class="text-[9px]" style="color:var(--text-3);">${p.stock > 0 ? 'متوفر' : 'غير متوفر'}</p>
                    </div>
                </div>
            `).join('')}
        </div>`;
    }).filter(Boolean).join('');
}
