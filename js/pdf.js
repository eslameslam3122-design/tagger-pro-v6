// TAGGER PRO V6 - PDF Export

// ============================================================
// ====== تصدير الفاتورة كـ PDF ======
// ============================================================

async function exportInvoicePDF(invId) {
    const inv = allInvoices.find(i => i.id === invId);
    if (!inv) { showToast('⚠️ الفاتورة غير موجودة', 'error'); return; }
    
    const { data: items } = await sb.from('invoice_items').select('*').eq('invoice_id', invId);
    const customer = allCustomers.find(c => c.id === inv.customer_id);
    const storeName = localStorage.getItem('active_store_name') || 'المحل';
    
    // إنشاء نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    let itemsHtml = '';
    (items || []).forEach((item, i) => {
        itemsHtml += `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${i+1}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${item.product_name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:left;">${item.unit_price}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:left;font-weight:bold;">${(item.quantity * item.unit_price).toFixed(2)}</td>
        </tr>`;
    });
    
    const vatHtml = (inv.vat_amount > 0) ? `
        <tr><td colspan="4" style="padding:6px 8px;">ضريبة ${inv.vat_rate}%</td>
        <td style="padding:6px 8px;text-align:left;color:#d97706;">+${parseFloat(inv.vat_amount).toFixed(2)} ج.م</td></tr>` : '';
    
    printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>فاتورة ${inv.invoice_number || inv.id}</title>
        <style>
            body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: rtl; padding: 30px; color: #333; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #7c3aed; padding-bottom: 15px; }
            .header h1 { font-size: 24px; color: #7c3aed; margin: 0; }
            .header p { font-size: 12px; color: #666; margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th { background: #f3f4f6; padding: 10px 8px; border-bottom: 2px solid #d1d5db; font-size: 12px; text-align: right; }
            .totals { margin-top: 20px; text-align: left; }
            .totals div { padding: 4px 8px; font-size: 13px; }
            .totals .grand { font-size: 18px; font-weight: bold; color: #7c3aed; border-top: 2px solid #7c3aed; padding-top: 8px; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
            @media print { body { padding: 10px; } }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${storeName}</h1>
            <p>فاتورة رقم: ${inv.invoice_number || inv.id}</p>
            <p>التاريخ: ${new Date(inv.created_at).toLocaleString('ar-EG')}</p>
            <p>العميل: ${customer?.customer_name || 'عميل نقدي'}</p>
            <p>طريقة الدفع: ${PAYMENT_LABELS[inv.payment_type] || inv.payment_type || 'كاش'}</p>
        </div>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>المنتج</th>
                    <th style="text-align:center;">الكمية</th>
                    <th>السعر</th>
                    <th style="text-align:left;">الإجمالي</th>
                </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
        </table>
        <div class="totals">
            <div>الإجمالي: ${parseFloat(inv.total_amount).toFixed(2)} ج.م</div>
            ${parseFloat(inv.discount) > 0 ? `<div>الخصم: -${parseFloat(inv.discount).toFixed(2)} ج.م</div>` : ''}
            ${vatHtml}
            <div class="grand">الصافي: ${parseFloat(inv.final_amount).toFixed(2)} ج.م</div>
            ${parseFloat(inv.paid_amount) > 0 ? `<div>المدفوع: ${parseFloat(inv.paid_amount).toFixed(2)} ج.م</div>` : ''}
            ${parseFloat(inv.remaining_amount) > 0 ? `<div style="color:#dc2626;">المتبقي: ${parseFloat(inv.remaining_amount).toFixed(2)} ج.م</div>` : ''}
            ${inv.warranty && inv.warranty !== 'لا يوجد' ? `<div>🛡️ الضمان: ${inv.warranty}</div>` : ''}
        </div>
        <div class="footer">
            <p>شكراً لتعاملكم مع ${storeName} 🙏</p>
            <p>TAGGER PRO V6 — ${new Date().toLocaleString('ar-EG')}</p>
        </div>
        <script>window.onload = function() { window.print(); }<\/script>
    </body>
    </html>`);
    printWindow.document.close();
}