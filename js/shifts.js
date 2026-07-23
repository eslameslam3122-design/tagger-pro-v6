// TAGGER PRO V6 - Shifts

// ====== SHIFT REPORT ======
function showShiftReport() {
    if (!currentShift) return;
    updateShiftStats();

    const start = new Date(currentShift.start_time);
    const end = new Date();
    const duration = Math.round((end - start) / (1000 * 60));

    document.getElementById('reportShiftNumber').textContent = 'رقم ' + (currentShift.id || '').slice(-8);
    document.getElementById('rptSupervisor').textContent = currentShift.supervisor;
    document.getElementById('rptStartTime').textContent = start.toLocaleString('ar-EG');
    document.getElementById('rptEndTime').textContent = end.toLocaleString('ar-EG');
    document.getElementById('rptDuration').textContent = `${Math.floor(duration / 60)} ساعة ${duration % 60} دقيقة`;
    document.getElementById('rptSales').textContent = (currentShift.sales || 0).toFixed(2) + ' ج.م';
    document.getElementById('rptInvoiceCount').textContent = currentShift.invoice_count || 0;
    document.getElementById('rptExpenses').textContent = (currentShift.expenses || 0).toFixed(2) + ' ج.م';
    document.getElementById('rptRevenue').textContent = (currentShift.revenue || 0).toFixed(2) + ' ج.م';
    document.getElementById('rptCashOps').textContent = currentShift.cash_ops_count || 0;
    document.getElementById('rptCashFees').textContent = (currentShift.cash_fees || 0).toFixed(2) + ' ج.م';
    document.getElementById('rptCashIn').textContent = (currentShift.cash_in || 0).toFixed(2) + ' ج.م';
    document.getElementById('rptCashOut').textContent = (currentShift.cash_out || 0).toFixed(2) + ' ج.م';
    document.getElementById('rptCashProfit').textContent = (currentShift.cash_profit || 0).toFixed(2) + ' ج.م';
    document.getElementById('rptNet').textContent = (currentShift.net || 0).toFixed(2) + ' ج.م';

    const modal = document.getElementById('shiftReportModal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

function closeShiftReport() {
    const modal = document.getElementById('shiftReportModal');
    modal.classList.add('hidden');
    modal.style.display = 'none';
    loadShiftsData();
}

function printShiftReport() {
    const w = window.open('', '_blank', 'width=400,height=600');
    w.document.write(`<html><head><title>تقرير وردية</title>
    <style>body{font-family:'Cairo',sans-serif;direction:rtl;text-align:right;padding:15px;font-size:11px;color:#333;}
    .h{text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:8px;}
    .h h1{font-size:16px;margin:0;} .row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #ddd;}
    .total{text-align:center;font-size:16px;font-weight:bold;border-top:2px solid #000;padding-top:8px;margin-top:8px;color:#059669;}
    .label{color:#666;} .value{font-weight:bold;}</style></head><body>
    <div class="h"><h1>📊 TAGGER PRO</h1><p>تقرير الوردية</p></div>
    <div class="row"><span class="label">المشرف:</span><span class="value">${currentShift.supervisor}</span></div>
    <div class="row"><span class="label">المدة:</span><span class="value">${document.getElementById('rptDuration').textContent}</span></div>
    <div class="row"><span class="label">المبيعات:</span><span class="value">${document.getElementById('rptSales').textContent}</span></div>
    <div class="row"><span class="label">عدد الفواتير:</span><span class="value">${document.getElementById('rptInvoiceCount').textContent}</span></div>
    <div class="row"><span class="label">المصروفات:</span><span class="value">${document.getElementById('rptExpenses').textContent}</span></div>
    <div class="row"><span class="label">الايرادات:</span><span class="value">${document.getElementById('rptRevenue').textContent}</span></div>
    <div class="row"><span class="label">عمليات نقدية:</span><span class="value">${document.getElementById('rptCashOps').textContent}</span></div>
    <div class="row"><span class="label">عمولة:</span><span class="value">${document.getElementById('rptCashFees').textContent}</span></div>
    <div class="row"><span class="label">دخل:</span><span class="value">${document.getElementById('rptCashIn').textContent}</span></div>
    <div class="row"><span class="label">خروج:</span><span class="value">${document.getElementById('rptCashOut').textContent}</span></div>
    <div class="total">صافي الوردية: ${document.getElementById('rptNet').textContent}</div>
    <p style="text-align:center;font-size:9px;color:#999;margin-top:10px;">TAGGER PRO V6</p>
    <script>window.print();<\/script></body></html>`);
    w.document.close();
}

// ====== LOAD & TABLE ======
async function loadShiftsData() {
    try {
        let local = await SmartLoader.getLocalData('shifts');
        shifts = local.filter(s => s.store_id === currentStoreId)
            .sort((a, b) => (b.start_time || '').localeCompare(a.start_time || ''));
        currentShift = shifts.find(s => s.status === 'active') || null;
        if (shifts.length === 0 && SyncManager.isOnline) {
            await SmartLoader.syncTable('shifts', currentStoreId, true);
            local = await SmartLoader.getLocalData('shifts');
            shifts = local.filter(s => s.store_id === currentStoreId)
                .sort((a, b) => (b.start_time || '').localeCompare(a.start_time || ''));
            currentShift = shifts.find(s => s.status === 'active') || null;
        }
    } catch (err) {
        console.error('خطأ في تحميل الورديات:', err);
    }
    renderShiftsTable();
    updateShiftUI();
    updateShiftBadge();
    if (SyncManager.isOnline) {
        SmartLoader.syncTable('shifts', currentStoreId).then(synced => {
            if (synced.length > 0) {
                SmartLoader.getLocalData('shifts').then(full => {
                    shifts = full.filter(s => s.store_id === currentStoreId)
                        .sort((a, b) => (b.start_time || '').localeCompare(a.start_time || ''));
                    currentShift = shifts.find(s => s.status === 'active') || null;
                    renderShiftsTable();
                    updateShiftUI();
                    updateShiftBadge();
                });
            }
        });
    }
}

function openShifts() {
    if (!canViewShifts()) { showToastPermission(); return; }
    document.getElementById('shiftsTab').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderShiftsTable();
    updateShiftUI();
}

function closeShifts() {
    document.getElementById('shiftsTab').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function renderShiftsTable() {
    const tbody = document.getElementById('shiftsTableBody');
    const emptyMsg = document.getElementById('emptyShifts');
    if(!tbody) return;
    if(shifts.length === 0) { tbody.innerHTML = ''; emptyMsg.classList.remove('hidden'); return; }
    emptyMsg.classList.add('hidden');
    tbody.innerHTML = shifts.map((s, index) => {
        const start = new Date(s.start_time);
        const end = s.end_time ? new Date(s.end_time) : null;
        const duration = end ? Math.round((end - start) / (1000 * 60)) : null;
        const durationText = duration !== null ? `${Math.floor(duration / 60)}h ${duration % 60}m` : 'مستمرة';
        const statusText = s.status === 'active' ? '🟢 مفتوحة' : '🔴 مغلقة';
        const statusColor = s.status === 'active' ? 'text-emerald-400' : 'text-red-400';
        return `
            <tr class="border-b border-slate-800/60 hover:bg-slate-800/20 transition">
                <td class="p-3">${index + 1}</td>
                <td class="p-3 font-bold text-slate-200">${s.supervisor}</td>
                <td class="p-3 text-center text-emerald-400">${(s.sales || 0).toFixed(2)} ج.م</td>
                <td class="p-3 text-center text-red-400">${(s.expenses || 0).toFixed(2)} ج.م</td>
                <td class="p-3 text-center text-purple-400">${(s.revenue || 0) > 0 ? s.revenue.toFixed(2) + ' ج.م' : '—'}</td>
                <td class="p-3 text-center text-amber-400">${(s.cash_ops_count || 0) > 0 ? s.cash_ops_count + ' عملية' : '—'}</td>
                <td class="p-3 text-center text-blue-400 font-bold">${(s.net || 0).toFixed(2)} ج.م</td>
                <td class="p-3 text-center text-slate-400 text-[10px]">${start.toLocaleString('ar-EG')}</td>
                <td class="p-3 text-center text-slate-400 text-[10px]">${end ? end.toLocaleString('ar-EG') : '—'}</td>
                <td class="p-3 text-center text-slate-400">${durationText}</td>
                <td class="p-3 text-center text-slate-400">${s.invoice_count || 0}</td>
                <td class="p-3 text-center ${statusColor}">${statusText}</td>
            </tr>
        `;
    }).join('');
}

// ====== UI UPDATES ======
function updateShiftUI() {
    const statusEl = document.getElementById('shiftStatus');
    const supervisorEl = document.getElementById('shiftSupervisor');
    const startTimeEl = document.getElementById('shiftStartTime');
    const durationEl = document.getElementById('shiftDuration');
    const salesEl = document.getElementById('shiftSales');
    const expensesEl = document.getElementById('shiftExpenses');
    const revenueEl = document.getElementById('shiftRevenue');
    const cashOpsEl = document.getElementById('shiftCashOps');
    const cashFeesEl = document.getElementById('shiftCashFees');
    const cashProfitEl = document.getElementById('shiftCashProfit');
    const cashInEl = document.getElementById('shiftCashIn');
    const cashOutEl = document.getElementById('shiftCashOut');
    const netEl = document.getElementById('shiftNet');
    if(currentShift) {
        const start = new Date(currentShift.start_time);
        const now = new Date();
        const duration = Math.round((now - start) / (1000 * 60));
        statusEl.innerText = '🟢 مفعلة';
        statusEl.className = 'text-sm lg:text-lg font-bold text-emerald-400';
        supervisorEl.innerText = currentShift.supervisor;
        startTimeEl.innerText = start.toLocaleString('ar-EG');
        durationEl.innerText = `${Math.floor(duration / 60)}h ${duration % 60}m`;
        updateShiftStats();
        if(salesEl) salesEl.innerText = (currentShift.sales || 0).toFixed(2) + ' ج.م';
        if(expensesEl) expensesEl.innerText = (currentShift.expenses || 0).toFixed(2) + ' ج.م';
        if(revenueEl) revenueEl.innerText = (currentShift.revenue || 0).toFixed(2) + ' ج.م';
        if(cashOpsEl) cashOpsEl.innerText = (currentShift.cash_ops_count || 0) + ' عملية';
        if(cashFeesEl) cashFeesEl.innerText = (currentShift.cash_fees || 0).toFixed(2) + ' ج.م';
        if(cashProfitEl) cashProfitEl.innerText = (currentShift.cash_profit || 0).toFixed(2) + ' ج.م';
        if(cashInEl) cashInEl.innerText = (currentShift.cash_in || 0).toFixed(2) + ' ج.م';
        if(cashOutEl) cashOutEl.innerText = (currentShift.cash_out || 0).toFixed(2) + ' ج.م';
        if(netEl) netEl.innerText = (currentShift.net || 0).toFixed(2) + ' ج.م';
    } else {
        statusEl.innerText = '⭕ غير مفعلة';
        statusEl.className = 'text-sm lg:text-lg font-bold text-red-400';
        supervisorEl.innerText = '-';
        startTimeEl.innerText = '-';
        durationEl.innerText = '-';
        if(salesEl) salesEl.innerText = '0.00 ج.م';
        if(expensesEl) expensesEl.innerText = '0.00 ج.م';
        if(revenueEl) revenueEl.innerText = '0.00 ج.م';
        if(cashOpsEl) cashOpsEl.innerText = '0 عملية';
        if(cashFeesEl) cashFeesEl.innerText = '0.00 ج.م';
        if(cashProfitEl) cashProfitEl.innerText = '0.00 ج.م';
        if(cashInEl) cashInEl.innerText = '0.00 ج.م';
        if(cashOutEl) cashOutEl.innerText = '0.00 ج.م';
        if(netEl) netEl.innerText = '0.00 ج.م';
    }
}

function updateShiftBadge() {
    const count = shifts.filter(s => s.status === 'active').length;
    if (document.getElementById('shiftCount')) document.getElementById('shiftCount').innerText = count;
    if (document.getElementById('shiftBadge')) document.getElementById('shiftBadge').textContent = count;
}

// ====== START / END ======
async function startShift() {
    if(currentShift) { showToast('⚠️ هناك وردية مفتوحة حالياً', 'warning'); return; }
    const staffName = localStorage.getItem('active_staff_name') || 'الكاشير';
    try {
        const shiftData = {
            store_id: currentStoreId,
            supervisor: staffName,
            start_time: new Date().toISOString(),
            status: 'active',
            sales: 0, expenses: 0, net: 0, invoice_count: 0
        };
        let data;
        try {
            const result = await sb.from('shifts').insert([shiftData]).select().single();
            if (result.error) throw result.error;
            data = result.data;
        } catch (e) {
            data = { ...shiftData, id: 'offline_' + Date.now() };
            await SyncManager.enqueue('shifts', 'put', data);
        }
        shifts.unshift(data);
        currentShift = data;
        renderShiftsTable();
        updateShiftUI();
        updateShiftBadge();
        showToast('✅ تم فتح الوردية - ابدأ العمل!', 'success');
    } catch (err) {
        showToast('❌ خطأ: ' + err.message, 'error');
    }
}

async function endShift() {
    if (!currentShift) { showToast('⚠️ لا توجد وردية مفتوحة', 'warning'); return; }
    const confirmed = await showConfirm('هل انت متأكد من انهاء الوردية؟', 'انهاء الوردية', { warning: true });
    if (!confirmed) return;
    try {
        const shiftInvoices = allInvoices.filter(inv => inv.shift_id === currentShift.id);
        const sales = shiftInvoices.reduce((s, inv) => s + parseFloat(inv.final_amount || 0), 0);
        const shiftExpenses = financeTransactions
            .filter(t => t.shift_id === currentShift.id && t.type === 'expense')
            .reduce((s, t) => s + t.amount, 0);
        const shiftRevenue = financeTransactions
            .filter(t => t.shift_id === currentShift.id && t.type === 'revenue')
            .reduce((s, t) => s + t.amount, 0);
        const shiftCashOps = cashTransactions.filter(t => {
            if (t.shift_id && t.shift_id === currentShift.id) return true;
            const tDate = new Date(t.created_at);
            return tDate >= new Date(currentShift.start_time) && tDate <= new Date();
        });
        const cashFees = shiftCashOps.reduce((s, t) => s + parseFloat(t.fee || 0), 0);
        const cashProfit = shiftCashOps.reduce((s, t) => s + parseFloat(t.profit || 0), 0);
        const cashIn = shiftCashOps.filter(t => t.transaction_type === 'deposit').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
        const cashOut = shiftCashOps.filter(t => t.transaction_type === 'withdraw').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
        const finalNet = sales - shiftExpenses + cashIn - cashOut;
        const updateData = {
            end_time: new Date().toISOString(),
            status: 'closed',
            sales, expenses: shiftExpenses, net: finalNet,
            invoice_count: shiftInvoices.length,
            cash_ops_count: shiftCashOps.length,
            cash_fees: cashFees, cash_profit: cashProfit,
            revenue: shiftRevenue, cash_in: cashIn, cash_out: cashOut
        };
        try {
            await sb.from('shifts').update(updateData).eq('id', currentShift.id);
        } catch (e) {
            await SyncManager.enqueue('shifts', 'put', { id: currentShift.id, ...updateData });
        }
        await LocalDB.put('shifts', { ...currentShift, ...updateData });
        Object.assign(currentShift, updateData);
        renderShiftsTable();
        updateShiftUI();
        updateShiftBadge();
        closeShifts();
        showShiftReport();
        currentShift = null;
    } catch (err) {
        showToast('❌ خطأ: ' + err.message, 'error');
    }
}

// ====== REAL-TIME STATS ======
function updateShiftStats() {
    if (!currentShift) return;
    const shiftInvoices = allInvoices.filter(inv => inv.shift_id === currentShift.id);
    currentShift.sales = shiftInvoices.reduce((s, inv) => s + parseFloat(inv.final_amount || 0), 0);
    currentShift.invoice_count = shiftInvoices.length;
    currentShift.expenses = financeTransactions
        .filter(t => t.shift_id === currentShift.id && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
    currentShift.revenue = financeTransactions
        .filter(t => t.shift_id === currentShift.id && t.type === 'revenue')
        .reduce((s, t) => s + t.amount, 0);
    const shiftStart = new Date(currentShift.start_time);
    const shiftEnd = currentShift.end_time ? new Date(currentShift.end_time) : new Date();
    const cashOps = cashTransactions.filter(t => {
        if (t.shift_id && t.shift_id === currentShift.id) return true;
        const tDate = new Date(t.created_at);
        return tDate >= shiftStart && tDate <= shiftEnd;
    });
    currentShift.cash_ops_count = cashOps.length;
    currentShift.cash_fees = cashOps.reduce((s, t) => s + parseFloat(t.fee || 0), 0);
    currentShift.cash_profit = cashOps.reduce((s, t) => s + parseFloat(t.profit || 0), 0);
    currentShift.cash_in = cashOps.filter(t => t.transaction_type === 'deposit').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    currentShift.cash_out = cashOps.filter(t => t.transaction_type === 'withdraw').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    currentShift.net = currentShift.sales - currentShift.expenses + currentShift.cash_in - currentShift.cash_out;
}
