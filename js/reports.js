// TAGGER PRO V6 - Reports, Charts & Z-Report

// ============================================================
// ====== نظام التقارير ======
// ============================================================

function openReports() {
    if (!canViewReports()) { showToastPermission(); return; }
    document.getElementById('reportsTab').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    try { updateReports(); } catch(e) {
        ErrorBoundary.show('reportsTab', e, () => updateReports());
    }
}

function closeReports() {
    document.getElementById('reportsTab').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function switchReportTab(tab, el) {
    document.querySelectorAll('.report-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.className = 'tab-btn bg-[#0f1524] border-b-2 border-transparent text-slate-400 hover:text-white px-2 py-1.5 lg:px-4 lg:py-2 rounded-t-lg text-[8px] lg:text-xs font-bold transition whitespace-nowrap';
    });
    document.getElementById(tab + 'ReportTab').classList.remove('hidden');
    if(el) el.className = 'tab-btn active bg-[#0f1524] border-b-2 border-blue-500 text-blue-400 px-2 py-1.5 lg:px-4 lg:py-2 rounded-t-lg text-[8px] lg:text-xs font-bold transition whitespace-nowrap';
    setTimeout(() => {
        if(tab === 'daily') renderDailyChart();
        else if(tab === 'weekly') renderWeeklyChart();
        else if(tab === 'monthly') renderMonthlyChart();
        else if(tab === 'stock') renderStockReport();
    }, 100);
}

function renderStockReport() {
    const total = localProducts.length;
    const totalValue = localProducts.reduce((s, p) => s + (parseFloat(p.purchase_price || 0) * parseInt(p.stock || 0)), 0);
    const outOfStock = localProducts.filter(p => parseInt(p.stock || 0) === 0).length;
    const lowStock = localProducts.filter(p => parseInt(p.stock || 0) > 0 && parseInt(p.stock || 0) <= 5).length;
    document.getElementById('stockTotalProducts').textContent = total;
    document.getElementById('stockTotalValue').textContent = totalValue.toFixed(2) + ' ج.م';
    document.getElementById('stockOutOf').textContent = outOfStock;
    document.getElementById('stockLow').textContent = lowStock;
    const tbody = document.getElementById('stockReportTable');
    if(!tbody) return;
    const sorted = [...localProducts].sort((a, b) => parseInt(a.stock || 0) - parseInt(b.stock || 0));
    tbody.innerHTML = sorted.map((p, i) => {
        const stock = parseInt(p.stock || 0);
        const value = stock * parseFloat(p.purchase_price || 0);
        let status = '<span class="px-1.5 py-0.5 rounded text-[8px] font-bold" style="background: rgba(16,185,129,0.15); color: #10b981;">متوفر</span>';
        if(stock === 0) status = '<span class="px-1.5 py-0.5 rounded text-[8px] font-bold" style="background: rgba(239,68,68,0.15); color: #ef4444;">نفد</span>';
        else if(stock <= 5) status = '<span class="px-1.5 py-0.5 rounded text-[8px] font-bold" style="background: rgba(245,158,11,0.15); color: #f59e0b;">منخفض</span>';
        return `<tr class="border-b border-slate-800/60"><td class="p-2">${i+1}</td><td class="p-2 font-bold" style="color: var(--text-1);">${p.title || p.product_name}</td><td class="p-2 text-center">${stock}</td><td class="p-2 text-center" style="color: var(--text-3);">${parseFloat(p.purchase_price||0).toFixed(2)}</td><td class="p-2 text-center" style="color: var(--success);">${value.toFixed(2)}</td><td class="p-2 text-center">${status}</td></tr>`;
    }).join('');
}

function exportProductsCSV() {
    let csv = 'المنتج,الباركود,القسم,كمية,سعر الشراء,سعر البيع,المورد\n';
    localProducts.forEach(p => {
        const supplier = suppliers.find(s => s.id === p.supplier_id);
        csv += `"${p.title || p.product_name}","${p.barcode||''}","${p.category||''}",${p.stock||0},${p.purchase_price||0},${p.sell_price||p.price||0},"${supplier?.name||''}"\n`;
    });
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'products_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click(); URL.revokeObjectURL(url);
    showToast('📥 تم تصدير المنتجات', 'success');
}

function updateReports() {
    const totalSales = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.final_amount || 0), 0);
    const invoiceCount = allInvoices.length;
    const totalExpenses = financeTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netProfit = totalSales - totalExpenses;
    document.getElementById('reportTotalSales').innerText = totalSales.toFixed(2) + ' ج.م';
    document.getElementById('reportInvoiceCount').innerText = invoiceCount;
    document.getElementById('reportTotalExpenses').innerText = totalExpenses.toFixed(2) + ' ج.م';
    document.getElementById('reportNetProfit').innerText = netProfit.toFixed(2) + ' ج.م';
    const today = new Date().toISOString().split('T')[0];
    const todayInvoices = allInvoices.filter(inv => new Date(inv.created_at || inv.date).toISOString().split('T')[0] === today);
    const dailySales = todayInvoices.reduce((sum, inv) => sum + parseFloat(inv.final_amount || 0), 0);
    document.getElementById('dailySales').innerText = dailySales.toFixed(2) + ' ج.م';
    const todayExpenses = financeTransactions.filter(t => t.type === 'expense' && new Date(t.date).toISOString().split('T')[0] === today).reduce((s, t) => s + t.amount, 0);
    document.getElementById('dailyExpenses').innerText = todayExpenses.toFixed(2) + ' ج.م';
    document.getElementById('dailyNet').innerText = (dailySales - todayExpenses).toFixed(2) + ' ج.م';
    document.getElementById('dailyCount').innerText = todayInvoices.length;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekInvoices = allInvoices.filter(inv => new Date(inv.created_at || inv.date) >= weekAgo);
    const weeklySales = weekInvoices.reduce((sum, inv) => sum + parseFloat(inv.final_amount || 0), 0);
    document.getElementById('weeklySales').innerText = weeklySales.toFixed(2) + ' ج.م';
    const weekExpenses = financeTransactions.filter(t => t.type === 'expense' && new Date(t.date) >= weekAgo).reduce((s, t) => s + t.amount, 0);
    document.getElementById('weeklyExpenses').innerText = weekExpenses.toFixed(2) + ' ج.م';
    document.getElementById('weeklyNet').innerText = (weeklySales - weekExpenses).toFixed(2) + ' ج.م';
    document.getElementById('weeklyCount').innerText = weekInvoices.length;
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthInvoices = allInvoices.filter(inv => new Date(inv.created_at || inv.date) >= monthAgo);
    const monthlySales = monthInvoices.reduce((sum, inv) => sum + parseFloat(inv.final_amount || 0), 0);
    document.getElementById('monthlySales').innerText = monthlySales.toFixed(2) + ' ج.م';
    const monthExpenses = financeTransactions.filter(t => t.type === 'expense' && new Date(t.date) >= monthAgo).reduce((s, t) => s + t.amount, 0);
    document.getElementById('monthlyExpenses').innerText = monthExpenses.toFixed(2) + ' ج.م';
    document.getElementById('monthlyNet').innerText = (monthlySales - monthExpenses).toFixed(2) + ' ج.م';
    document.getElementById('monthlyCount').innerText = monthInvoices.length;
    document.getElementById('topProductsTable').innerHTML = `<tr><td colspan="4" class="text-center p-6 text-slate-500">جاري تحليل بيانات المنتجات...</td></tr>`;
    const customerSpending = {};
    allCustomers.forEach(c => { customerSpending[c.id] = { name: c.customer_name, total: 0, count: 0 }; });
    allInvoices.forEach(inv => {
        if(inv.customer_id && customerSpending[inv.customer_id]) {
            customerSpending[inv.customer_id].total += parseFloat(inv.final_amount || 0);
            customerSpending[inv.customer_id].count += 1;
        }
    });
    const sortedCustomers = Object.values(customerSpending).filter(c => c.total > 0).sort((a, b) => b.total - a.total).slice(0, 10);
    if(sortedCustomers.length === 0) {
        document.getElementById('topCustomersTable').innerHTML = `<tr><td colspan="4" class="text-center p-6 text-slate-500">لا توجد بيانات كافية</td></tr>`;
    } else {
        document.getElementById('topCustomersTable').innerHTML = sortedCustomers.map((c, i) => `
            <tr class="border-b border-slate-800/60">
                <td class="p-3">${i + 1}</td>
                <td class="p-3 font-bold text-slate-200">${c.name}</td>
                <td class="p-3 text-center">${c.count}</td>
                <td class="p-3 text-center text-emerald-400 font-bold">${c.total.toFixed(2)} ج.م</td>
            </tr>
        `).join('');
    }
    // ====== تقرير الموردين ======
    const totalSupplierDebt = suppliers.reduce((s, sup) => s + parseFloat(sup.debt || 0), 0);
    const totalPurchases = suppliers.reduce((s, sup) => s + parseFloat(sup.total_purchases || 0), 0);
    const reportTotalDebtEl = document.getElementById('reportTotalSupplierDebt');
    const reportTotalPurchasesEl = document.getElementById('reportTotalPurchases');
    const reportSupplierCountEl = document.getElementById('reportSupplierCount');
    if(reportTotalDebtEl) reportTotalDebtEl.innerText = totalSupplierDebt.toFixed(2) + ' ج.م';
    if(reportTotalPurchasesEl) reportTotalPurchasesEl.innerText = totalPurchases.toFixed(2) + ' ج.م';
    if(reportSupplierCountEl) reportSupplierCountEl.innerText = suppliers.length;
    const sortedSuppliers = [...suppliers].sort((a, b) => parseFloat(b.total_purchases || 0) - parseFloat(a.total_purchases || 0)).slice(0, 10);
    const topSuppliersTable = document.getElementById('topSuppliersTable');
    if(topSuppliersTable) {
        if(sortedSuppliers.length === 0) {
            topSuppliersTable.innerHTML = `<tr><td colspan="5" class="text-center p-6 text-slate-500">لا توجد بيانات كافية</td></tr>`;
        } else {
            topSuppliersTable.innerHTML = sortedSuppliers.map((s, i) => {
                const linkedProducts = localProducts.filter(p => p.supplier_id === s.id).length;
                const debt = s.debt || 0;
                return `
                    <tr class="border-b border-slate-800/60">
                        <td class="p-3">${i + 1}</td>
                        <td class="p-3 font-bold text-slate-200">${s.name}</td>
                        <td class="p-3 text-center text-emerald-400 font-bold">${parseFloat(s.total_purchases || 0).toFixed(2)} ج.م</td>
                        <td class="p-3 text-center ${debt > 0 ? 'text-red-400' : 'text-emerald-400'}">${debt > 0 ? debt.toFixed(2) + ' ج.م' : '0.00 ج.م'}</td>
                        <td class="p-3 text-center text-slate-400">${linkedProducts}</td>
                    </tr>
                `;
            }).join('');
        }
    }
    setTimeout(() => { renderDailyChart(); renderWeeklyChart(); renderMonthlyChart(); }, 200);
}

async function renderDailyChart() {
    await LazyLoader.load('chart');
    const ctx = document.getElementById('dailyChart');
    if(!ctx) return;
    if(dailyChartInstance) dailyChartInstance.destroy();
    const days = [];
    const salesData = [];
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    for(let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        days.push(dayNames[d.getDay()]);
        const dayTotal = allInvoices
            .filter(inv => new Date(inv.created_at || inv.date).toISOString().split('T')[0] === dateStr)
            .reduce((sum, inv) => sum + parseFloat(inv.final_amount || 0), 0);
        salesData.push(dayTotal);
    }
    dailyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: days, datasets: [{ label: 'المبيعات اليومية', data: salesData, backgroundColor: '#2563eb', borderRadius: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } }, scales: { y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }, x: { grid: { display: false }, ticks: { color: '#94a3b8' } } } }
    });
}

async function renderWeeklyChart() {
    await LazyLoader.load('chart');
    const ctx = document.getElementById('weeklyChart');
    if(!ctx) return;
    if(weeklyChartInstance) weeklyChartInstance.destroy();
    const weeks = [];
    const salesData = [];
    for(let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        weeks.push(`الأسبوع ${4 - i}`);
        const weekTotal = allInvoices
            .filter(inv => {
                const d = new Date(inv.created_at || inv.date);
                return d >= weekStart && d <= weekEnd;
            })
            .reduce((sum, inv) => sum + parseFloat(inv.final_amount || 0), 0);
        salesData.push(weekTotal);
    }
    weeklyChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: weeks, datasets: [{ label: 'المبيعات الأسبوعية', data: salesData, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } }, scales: { y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }, x: { grid: { display: false }, ticks: { color: '#94a3b8' } } } }
    });
}

async function renderMonthlyChart() {
    await LazyLoader.load('chart');
    const ctx = document.getElementById('monthlyChart');
    if(!ctx) return;
    if(monthlyChartInstance) monthlyChartInstance.destroy();
    const months = [];
    const salesData = [];
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    for(let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(monthNames[d.getMonth()]);
        const monthTotal = allInvoices
            .filter(inv => {
                const invDate = new Date(inv.created_at || inv.date);
                return invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear();
            })
            .reduce((sum, inv) => sum + parseFloat(inv.final_amount || 0), 0);
        salesData.push(monthTotal);
    }
    monthlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: months, datasets: [{ label: 'المبيعات الشهرية', data: salesData, backgroundColor: '#8b5cf6', borderRadius: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } }, scales: { y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }, x: { grid: { display: false }, ticks: { color: '#94a3b8' } } } }
    });
}

// ============================================================
// ====== الميزة 4: تقارير P&L شهرية/سنوية ======
// ============================================================

function generatePnLReport(period = 'monthly') {
    const now = new Date();
    let labels = [], salesData = [], expenseData = [], profitData = [], cashData = [];
    if(period === 'monthly') {
        for(let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            const label = d.toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' });
            labels.push(label);
            const monthInvoices = allInvoices.filter(inv => {
                const id = new Date(inv.created_at || inv.date);
                return id >= d && id <= monthEnd;
            });
            const s = monthInvoices.reduce((sum, inv) => sum + parseFloat(inv.final_amount || 0), 0);
            const e = financeTransactions.filter(t => {
                const td = new Date(t.date || t.transaction_date || t.created_at);
                return td >= d && td <= monthEnd && t.type === 'expense';
            }).reduce((sum, t) => sum + t.amount, 0);
            const c = cashTransactions.filter(t => {
                const td = new Date(t.created_at);
                return td >= d && td <= monthEnd;
            });
            const cashIn = c.filter(t => t.transaction_type === 'deposit').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
            const cashOut = c.filter(t => t.transaction_type === 'withdraw').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
            salesData.push(s);
            expenseData.push(e);
            profitData.push(s - e + cashIn - cashOut);
            cashData.push(cashIn - cashOut);
        }
    } else {
        for(let i = 4; i >= 0; i--) {
            const year = now.getFullYear() - i;
            labels.push(year.toString());
            const yearInvoices = allInvoices.filter(inv => new Date(inv.created_at || inv.date).getFullYear() === year);
            const s = yearInvoices.reduce((sum, inv) => sum + parseFloat(inv.final_amount || 0), 0);
            const e = financeTransactions.filter(t => new Date(t.date || t.transaction_date || t.created_at).getFullYear() === year && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const c = cashTransactions.filter(t => new Date(t.created_at).getFullYear() === year);
            const cashIn = c.filter(t => t.transaction_type === 'deposit').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
            const cashOut = c.filter(t => t.transaction_type === 'withdraw').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
            salesData.push(s);
            expenseData.push(e);
            profitData.push(s - e + cashIn - cashOut);
            cashData.push(cashIn - cashOut);
        }
    }
    return { labels, salesData, expenseData, profitData, cashData };
}

async function renderPnLChart(period = 'monthly') {
    await LazyLoader.load('chart');
    const canvas = document.getElementById('pnlChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(window.pnlChartInstance) window.pnlChartInstance.destroy();
    const data = generatePnLReport(period);
    window.pnlChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                { label: 'المبيعات', data: data.salesData, backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 },
                { label: 'المصروفات', data: data.expenseData, backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 6 },
                { label: 'صافي الربح', data: data.profitData, backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 6 },
                { label: 'صافي الكاش', data: data.cashData, backgroundColor: 'rgba(168,85,247,0.7)', borderRadius: 6 }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Cairo' } } } },
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
            }
        }
    });
}

function renderPnLSummary(period = 'monthly') {
    const data = generatePnLReport(period);
    const totalSales = data.salesData.reduce((a,b) => a+b, 0);
    const totalExpenses = data.expenseData.reduce((a,b) => a+b, 0);
    const totalProfit = data.profitData.reduce((a,b) => a+b, 0);
    const totalCashNet = data.cashData.reduce((a,b) => a+b, 0);
    const el = document.getElementById('pnlSummary');
    if(!el) return;
    el.innerHTML = `
        <div class="bg-[#090d16] rounded-xl p-3 text-center"><p class="text-[10px] text-slate-500">إجمالي المبيعات</p><p class="text-lg font-bold text-emerald-400">${totalSales.toFixed(2)} ج.م</p></div>
        <div class="bg-[#090d16] rounded-xl p-3 text-center"><p class="text-[10px] text-slate-500">إجمالي المصروفات</p><p class="text-lg font-bold text-red-400">${totalExpenses.toFixed(2)} ج.م</p></div>
        <div class="bg-[#090d16] rounded-xl p-3 text-center"><p class="text-[10px] text-slate-500">صافي الربح</p><p class="text-lg font-bold text-blue-400">${totalProfit.toFixed(2)} ج.م</p></div>
        <div class="bg-[#090d16] rounded-xl p-3 text-center"><p class="text-[10px] text-slate-500">صافي الكاش</p><p class="text-lg font-bold text-purple-400">${totalCashNet.toFixed(2)} ج.م</p></div>
    `;
}

// ============================================================
// الميزة الجديدة: تقرير نهاية اليوم (Z-Report)
// ============================================================

async function openZReport() {
    document.getElementById('zReportModal').classList.remove('hidden');
    document.getElementById('zReportModal').classList.add('flex');
    const content = document.getElementById('zReportContent');
    content.innerHTML = '<div class="text-center py-8" style="color: var(--text-3);"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i><p>جاري تحميل البيانات...</p></div>';

    try {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString();

        const invoices = allInvoices.filter(i => {
            const d = i.created_at || i.date || '';
            return i.store_id === currentStoreId && d >= today && d < tomorrow;
        });
        const cash = cashTransactions.filter(c => {
            const d = c.created_at || '';
            return c.store_id === currentStoreId && d >= today && d < tomorrow;
        });
        const finance = financeTransactions.filter(f => {
            const d = f.date || f.created_at || '';
            return f.store_id === currentStoreId && d >= today && d < tomorrow;
        });

        const totalSales = invoices.reduce((s, i) => s + parseFloat(i.final_amount || 0), 0);
        const totalCost = invoices.reduce((s, i) => s + parseFloat(i.total_amount || 0) - parseFloat(i.final_amount || 0), 0);
        const totalProfit = totalSales - totalCost;
        const totalDiscount = invoices.reduce((s, i) => s + parseFloat(i.discount || 0), 0);
        const invoiceCount = invoices.length;

        const cashIn = cash.filter(c => c.transaction_type === 'deposit').reduce((s, c) => s + parseFloat(c.amount || 0), 0);
        const cashOut = cash.filter(c => c.transaction_type === 'withdraw').reduce((s, c) => s + parseFloat(c.amount || 0), 0);

        const income = finance.filter(f => f.type === 'income').reduce((s, f) => s + parseFloat(f.amount || 0), 0);
        const expenses = finance.filter(f => f.type === 'expense').reduce((s, f) => s + parseFloat(f.amount || 0), 0);

        const cashSales = invoices.filter(i => i.payment_type === 'cash').reduce((s, i) => s + parseFloat(i.final_amount || 0), 0);
        const mobileSales = invoices.filter(i => i.payment_type !== 'cash' && i.payment_type !== 'later').reduce((s, i) => s + parseFloat(i.final_amount || 0), 0);
        const laterSales = invoices.filter(i => i.payment_type === 'later').reduce((s, i) => s + parseFloat(i.final_amount || 0), 0);

        content.innerHTML = `
            <div class="text-center mb-3 pb-3 border-b" style="border-color: var(--border);">
                <p class="text-[10px]" style="color: var(--text-3);">${new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p class="text-[9px] mt-1" style="color: var(--text-3);">التقرير يشمل يوم ${today}</p>
            </div>

            <div class="grid grid-cols-2 gap-2">
                <div class="p-2.5 rounded-xl text-center" style="background: var(--bg-elevated); border: 1px solid var(--border);">
                    <p class="text-lg font-black" style="color: var(--success);">${totalSales.toFixed(2)} ج.م</p>
                    <p class="text-[9px]" style="color: var(--text-3);">إجمالي المبيعات</p>
                </div>
                <div class="p-2.5 rounded-xl text-center" style="background: var(--bg-elevated); border: 1px solid var(--border);">
                    <p class="text-lg font-black" style="color: var(--accent);">${totalProfit.toFixed(2)} ج.م</p>
                    <p class="text-[9px]" style="color: var(--text-3);">صافي الربح</p>
                </div>
                <div class="p-2.5 rounded-xl text-center" style="background: var(--bg-elevated); border: 1px solid var(--border);">
                    <p class="text-lg font-black" style="color: var(--info);">${invoiceCount}</p>
                    <p class="text-[9px]" style="color: var(--text-3);">عدد الفواتير</p>
                </div>
                <div class="p-2.5 rounded-xl text-center" style="background: var(--bg-elevated); border: 1px solid var(--border);">
                    <p class="text-lg font-black" style="color: var(--warning);">${totalDiscount.toFixed(2)} ج.م</p>
                    <p class="text-[9px]" style="color: var(--text-3);">إجمالي الخصومات</p>
                </div>
            </div>

            <div class="p-2.5 rounded-xl space-y-1.5" style="background: var(--bg-elevated); border: 1px solid var(--border);">
                <p class="text-[10px] font-bold" style="color: var(--text-1);">طرق الدفع</p>
                <div class="flex justify-between text-[10px]"><span style="color: var(--text-3);">💵 كاش</span><span style="color: var(--success);">${cashSales.toFixed(2)} ج.م</span></div>
                <div class="flex justify-between text-[10px]"><span style="color: var(--text-3);">📱 محفظة/بنك</span><span style="color: var(--info);">${mobileSales.toFixed(2)} ج.م</span></div>
                <div class="flex justify-between text-[10px]"><span style="color: var(--text-3);">📝 آجل</span><span style="color: var(--warning);">${laterSales.toFixed(2)} ج.م</span></div>
            </div>

            <div class="p-2.5 rounded-xl space-y-1.5" style="background: var(--bg-elevated); border: 1px solid var(--border);">
                <p class="text-[10px] font-bold" style="color: var(--text-1);">المحفظة الإلكترونية</p>
                <div class="flex justify-between text-[10px]"><span style="color: var(--text-3);">💰 وارد</span><span style="color: var(--success);">${cashIn.toFixed(2)} ج.م</span></div>
                <div class="flex justify-between text-[10px]"><span style="color: var(--text-3);">💸 صادر</span><span style="color: var(--danger);">${cashOut.toFixed(2)} ج.م</span></div>
                <div class="flex justify-between text-[10px] font-bold border-t pt-1" style="border-color: var(--border);"><span style="color: var(--text-1);">الصافي</span><span style="color: ${cashIn - cashOut >= 0 ? 'var(--success)' : 'var(--danger)'};">${(cashIn - cashOut).toFixed(2)} ج.م</span></div>
            </div>

            <div class="p-2.5 rounded-xl space-y-1.5" style="background: var(--bg-elevated); border: 1px solid var(--border);">
                <p class="text-[10px] font-bold" style="color: var(--text-1);">العمليات المالية</p>
                <div class="flex justify-between text-[10px]"><span style="color: var(--text-3);">📥 إيرادات</span><span style="color: var(--success);">${income.toFixed(2)} ج.م</span></div>
                <div class="flex justify-between text-[10px]"><span style="color: var(--text-3);">📤 مصروفات</span><span style="color: var(--danger);">${expenses.toFixed(2)} ج.م</span></div>
            </div>

            <div class="p-2.5 rounded-xl text-center" style="background: var(--accent-soft); border: 1px solid var(--accent);">
                <p class="text-[10px] font-bold" style="color: var(--accent);">ملخص اليوم</p>
                <p class="text-sm font-black" style="color: var(--text-1);">الإجمالي: ${totalSales.toFixed(2)} ج.م | الربح: ${totalProfit.toFixed(2)} ج.م</p>
            </div>
        `;
    } catch(e) {
        content.innerHTML = `<div class="text-center py-8" style="color: var(--danger);"><i class="fa-solid fa-triangle-exclamation text-2xl mb-2"></i><p>خطأ في تحميل البيانات: ${e.message}</p></div>`;
    }
}

function printZReport() {
    const content = document.getElementById('zReportContent').innerHTML;
    const printWin = window.open('', '_blank', 'width=400,height=600');
    printWin.document.write(`
        <html><head><title>Z-Report</title><meta charset="utf-8">
        <style>body{font-family:'Cairo',sans-serif;direction:rtl;text-align:center;padding:15px;font-size:12px;background:#fff;color:#000;}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0;}
        .box{border:1px solid #ccc;border-radius:8px;padding:8px;}
        .big{font-size:16px;font-weight:900;}.bold{font-weight:900;}</style></head><body>
        <h2 style="border-bottom:2px solid #000;padding-bottom:8px;">TAGER PRO - Z-Report</h2>
        <p style="color:#555;">${new Date().toLocaleDateString('ar-EG')}</p>
        ${content}
        <hr style="margin-top:15px;"><p>شكراً لاستخدامك TAGGER PRO ❤️</p>
        </body></html>`);
    printWin.document.close();
    printWin.print();
}