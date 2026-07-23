function openCustomerStatement() {
    const sel = document.getElementById('csCustomerSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">اختر العميل...</option>' +
        allCustomers.map(c => `<option value="${c.id}">${c.name}${c.phone ? ' - ' + c.phone : ''}</option>`).join('');
    document.getElementById('customerStatementContent').innerHTML = '<div class="text-center py-10" style="color: var(--text-3);"><i class="fa-solid fa-user text-3xl opacity-20 mb-2 block"></i><p class="text-xs">اختر عميل لعرض كشف الحساب</p></div>';
    openModal('customerStatementTab');
}

function renderCustomerStatement() {
    const cid = document.getElementById('csCustomerSelect')?.value;
    const container = document.getElementById('customerStatementContent');
    if (!cid || !container) { container.innerHTML = '<div class="text-center py-10" style="color: var(--text-3);"><p class="text-xs">اختر عميل</p></div>'; return; }

    const customer = allCustomers.find(c => c.id == cid);
    if (!customer) return;

    const customerInvoices = allInvoices.filter(inv => inv.customer_id == cid);
    const customerPayments = cashTransactions.filter(t => t.customer_id == cid && t.type === 'payment');

    let totalPurchases = 0;
    let totalPaid = 0;

    let invoicesHtml = customerInvoices.map(inv => {
        const paid = customerPayments.filter(p => p.invoice_id === inv.id).reduce((sum, p) => sum + (p.amount || 0), 0);
        totalPurchases += inv.total || 0;
        totalPaid += paid;
        return `<tr class="border-b" style="border-color: var(--border);">
            <td class="p-2 text-[10px]">${new Date(inv.created_at).toLocaleDateString('ar-EG')}</td>
            <td class="p-2 text-[10px] font-mono" style="color:var(--text-2);">${inv.id.substring(0,8)}</td>
            <td class="p-2 text-[10px] text-center">${inv.items?.length || 0}</td>
            <td class="p-2 text-[10px] text-center font-bold" style="color:var(--accent);">${(inv.total || 0).toFixed(2)}</td>
            <td class="p-2 text-[10px] text-center" style="color:var(--success);">${paid.toFixed(2)}</td>
        </tr>`;
    }).join('');

    const balance = totalPurchases - totalPaid;

    container.innerHTML = `
    <div class="max-w-lg mx-auto space-y-4">
        <div class="p-4 rounded-xl text-center" style="background: var(--bg-elevated); border: 1px solid var(--border);">
            <div class="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-xl font-black" style="background:var(--accent-soft);color:var(--accent);">${customer.name.charAt(0)}</div>
            <h3 class="text-sm font-bold" style="color:var(--text-1);">${customer.name}</h3>
            ${customer.phone ? `<p class="text-[10px]" style="color:var(--text-3);">${customer.phone}</p>` : ''}
        </div>
        <div class="grid grid-cols-3 gap-2">
            <div class="p-3 rounded-xl text-center" style="background:var(--bg-elevated);border:1px solid var(--border);">
                <p class="text-lg font-black" style="color:var(--accent);">${totalPurchases.toFixed(2)}</p>
                <p class="text-[9px]" style="color:var(--text-3);">إجمالي المشتريات</p>
            </div>
            <div class="p-3 rounded-xl text-center" style="background:var(--bg-elevated);border:1px solid var(--border);">
                <p class="text-lg font-black" style="color:var(--success);">${totalPaid.toFixed(2)}</p>
                <p class="text-[9px]" style="color:var(--text-3);">إجمالي المدفوعات</p>
            </div>
            <div class="p-3 rounded-xl text-center" style="background:var(--bg-elevated);border:1px solid var(--border);">
                <p class="text-lg font-black" style="color:${balance > 0 ? 'var(--danger)' : 'var(--success)'};">${balance.toFixed(2)}</p>
                <p class="text-[9px]" style="color:var(--text-3);">${balance > 0 ? 'المتبقي' : 'الرصيد'}</p>
            </div>
        </div>
        <div class="rounded-xl overflow-hidden" style="background:var(--bg-elevated);border:1px solid var(--border);">
            <table class="w-full"><thead><tr class="text-[9px] font-bold" style="color:var(--text-3);border-bottom:1px solid var(--border);">
                <th class="p-2 text-right">التاريخ</th><th class="p-2 text-right">رقم الفاتورة</th><th class="p-2 text-center">المنتجات</th><th class="p-2 text-center">المبلغ</th><th class="p-2 text-center">المدفوع</th>
            </tr></thead><tbody>${invoicesHtml || '<tr><td colspan="5" class="p-4 text-center text-xs" style="color:var(--text-3);">لا توجد فواتير</td></tr>'}</tbody></table>
        </div>
    </div>`;
}

function printCustomerStatement() {
    const cid = document.getElementById('csCustomerSelect')?.value;
    if (!cid) { showToast('اختر عميل أولاً', 'error'); return; }
    const content = document.getElementById('customerStatementContent');
    if (!content) return;
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`<html><head><title>كشف حساب</title><style>body{font-family:sans-serif;direction:rtl;padding:20px;font-size:12px;}table{width:100%;border-collapse:collapse;}th,td{padding:6px;border-bottom:1px solid #eee;text-align:right;font-size:11px;}.total{font-weight:bold;color:#7c3aed;}</style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.print();
}
