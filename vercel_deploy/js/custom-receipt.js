function generateCustomReceipt(invoice) {
    const settings = loadReceiptSettings();
    const storeName = settings.storeName || 'TAGGER PRO';
    const thankYou = settings.thankYou || 'شكراً لتعاملكم معنا';
    const phone = settings.phone || '';
    const color = settings.color || '#000000';

    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-EG');
    const timeStr = now.toLocaleTimeString('ar-EG');

    let itemsHtml = '';
    if (invoice.items) {
        itemsHtml = invoice.items.map(item => `
            <tr>
                <td style="text-align:right;padding:3px 0;font-size:11px;">${item.name}</td>
                <td style="text-align:center;padding:3px 0;font-size:11px;">${item.qty}</td>
                <td style="text-align:center;padding:3px 0;font-size:11px;">${(item.price || 0).toFixed(2)}</td>
                <td style="text-align:left;padding:3px 0;font-size:11px;font-weight:bold;">${((item.price || 0) * (item.qty || 1)).toFixed(2)}</td>
            </tr>
        `).join('');
    }

    const html = `
    <div style="font-family:monospace;direction:rtl;text-align:center;max-width:300px;margin:0 auto;padding:16px;color:${color};">
        <div style="border-bottom:2px solid ${color};padding-bottom:12px;margin-bottom:12px;">
            <h2 style="font-size:16px;font-weight:bold;margin:0;">${storeName}</h2>
            ${phone ? `<p style="font-size:10px;margin:4px 0 0;">📞 ${phone}</p>` : ''}
        </div>

        <div style="text-align:right;margin-bottom:12px;font-size:10px;">
            <p>التاريخ: ${dateStr}</p>
            <p>الوقت: ${timeStr}</p>
            ${invoice.id ? `<p>رقم الفاتورة: ${invoice.id.substring(0,8)}</p>` : ''}
            ${invoice.staff_name ? `<p>الكاشير: ${invoice.staff_name}</p>` : ''}
        </div>

        <table style="width:100%;border-collapse:collapse;border-bottom:1px dashed ${color};padding-bottom:8px;margin-bottom:8px;">
            <thead>
                <tr style="font-size:9px;border-bottom:1px solid ${color};">
                    <th style="text-align:right;padding:3px 0;">المنتج</th>
                    <th style="text-align:center;padding:3px 0;">الكمية</th>
                    <th style="text-align:center;padding:3px 0;">السعر</th>
                    <th style="text-align:left;padding:3px 0;">المبلغ</th>
                </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
        </table>

        <div style="text-align:left;font-size:12px;font-weight:bold;padding:8px 0;">
            <p>الإجمالي: ${(invoice.total || 0).toFixed(2)} ج.م</p>
            ${invoice.paid ? `<p style="font-size:10px;">المدفوع: ${invoice.paid.toFixed(2)} ج.م</p>` : ''}
        </div>

        <div style="border-top:2px solid ${color};padding-top:12px;margin-top:12px;">
            <p style="font-size:11px;font-weight:bold;">${thankYou}</p>
        </div>
    </div>`;

    return html;
}

function previewReceipt() {
    const settings = loadReceiptSettings();
    const testInvoice = {
        id: 'TEST-' + Date.now().toString(36),
        total: 150.00,
        paid: 200.00,
        staff_name: localStorage.getItem('active_staff_name') || 'كاشير',
        items: [
            { name: 'منتج تجريبي 1', qty: 2, price: 50 },
            { name: 'منتج تجريبي 2', qty: 1, price: 50 }
        ]
    };

    const html = generateCustomReceipt(testInvoice);
    document.getElementById('receiptPreviewContent').innerHTML = html;
    openModal('receiptPreviewModal');
}

function printReceiptPreview() {
    const content = document.getElementById('receiptPreviewContent')?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`<html><head><title>معاينة الإيصال</title><style>@page{size:80mm auto;margin:2mm;}body{margin:0;padding:0;font-family:monospace;}</style></head><body>${content}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
}
