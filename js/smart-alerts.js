function openSmartAlerts() {
    const container = document.getElementById('smartAlertsContent');
    if (!container) return;

    const MAX_ALERTS = 8;
    const alerts = generateSmartAlerts().slice(0, MAX_ALERTS);

    if (alerts.length === 0) {
        container.innerHTML = '<div class="text-center py-10" style="color: var(--text-3);"><i class="fa-solid fa-check-circle text-3xl mb-2 block" style="color:var(--success);"></i><p class="text-xs">لا توجد تنبيهات حالياً</p></div>';
        openModal('smartAlertsTab');
        return;
    }

    const icons = {
        danger: '<i class="fa-solid fa-circle-exclamation" style="color:var(--danger);"></i>',
        warning: '<i class="fa-solid fa-triangle-exclamation" style="color:var(--warning);"></i>',
        info: '<i class="fa-solid fa-circle-info" style="color:var(--info);"></i>',
        success: '<i class="fa-solid fa-circle-check" style="color:var(--success);"></i>'
    };

    container.innerHTML = alerts.map(a => `
        <div class="p-3 rounded-xl mb-2 flex items-start gap-3" style="background:var(--bg-elevated);border:1px solid var(--border);border-right:3px solid var(--${a.severity});">
            <div class="text-lg mt-0.5">${icons[a.severity] || icons.info}</div>
            <div class="flex-1">
                <p class="text-xs font-bold" style="color:var(--text-1);">${a.title}</p>
                <p class="text-[10px] mt-1" style="color:var(--text-3);">${a.message}</p>
                ${a.action ? `<button onclick="${a.action}" class="mt-2 px-3 py-1 rounded-lg text-[10px] font-bold" style="background:var(--accent-soft);color:var(--accent);">${a.actionLabel || 'عرض'}</button>` : ''}
            </div>
            <span class="text-[8px] whitespace-nowrap" style="color:var(--text-3);">${a.time}</span>
        </div>
    `).join('');

    openModal('smartAlertsTab');
}

function generateSmartAlerts() {
    const alerts = [];
    const now = new Date();

    // Low stock alerts
    const lowStockProducts = localProducts.filter(p => p.stock <= (p.min_stock || 5) && p.stock > 0);
    const outOfStock = localProducts.filter(p => p.stock <= 0);

    if (outOfStock.length > 0) {
        alerts.push({
            severity: 'danger',
            title: `🚫 ${outOfStock.length} منتج نفد من المخزون`,
            message: outOfStock.slice(0, 3).map(p => p.title || p.product_name).join('، ') + (outOfStock.length > 3 ? ` و ${outOfStock.length - 3} آخرين` : ''),
            action: "showSection('inventory')",
            actionLabel: 'عرض المخزون',
            time: 'الآن'
        });
    }

    if (lowStockProducts.length > 0) {
        alerts.push({
            severity: 'warning',
            title: `⚠️ ${lowStockProducts.length} منتج على وشك النفاد`,
            message: lowStockProducts.slice(0, 3).map(p => `${p.title || p.product_name} (${p.stock} متبقي)`).join('، ') + (lowStockProducts.length > 3 ? ` و ${lowStockProducts.length - 3} آخرين` : ''),
            action: "showSection('inventory')",
            actionLabel: 'عرض المخزون',
            time: 'الآن'
        });
    }

    // Debt alerts
    const debtCustomers = allCustomers.filter(c => c.debt > 0);
    if (debtCustomers.length > 0) {
        const totalDebt = debtCustomers.reduce((sum, c) => sum + (c.debt || 0), 0);
        alerts.push({
            severity: 'warning',
            title: `💰 ${debtCustomers.length} عميل لديهم ديون`,
            message: `إجمالي الديون: ${totalDebt.toFixed(2)} ج.م - أعلى دين: ${debtCustomers.sort((a, b) => b.debt - a.debt)[0]?.name || ''}`,
            action: "showSection('customers')",
            actionLabel: 'عرض العملاء',
            time: 'الآن'
        });
    }

    // Daily sales check
    const todayStr = now.toISOString().split('T')[0];
    const todayInvoices = allInvoices.filter(i => i.created_at && i.created_at.startsWith(todayStr));
    const todaySales = todayInvoices.reduce((sum, i) => sum + (i.final_amount || i.total_amount || 0), 0);
    const hour = now.getHours();

    if (hour >= 18 && todaySales === 0) {
        alerts.push({
            severity: 'info',
            title: '📊 لم تُسجّل أي مبيعات اليوم',
            message: 'لم يتم تسجيل أي فاتورة مبيعات حتى الآن. تأكد من عمل النظام بشكل صحيح.',
            time: `${hour}:00`
        });
    }

    // Profit check
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekInvoices = allInvoices.filter(i => i.created_at && new Date(i.created_at) >= weekAgo);
    const weekSales = weekInvoices.reduce((sum, i) => sum + (i.final_amount || i.total_amount || 0), 0);
    if (todayInvoices.length > 3 && todaySales < (weekSales / 7) * 0.5) {
        alerts.push({
            severity: 'info',
            title: '📉 المبيعات أقل من المعتاد',
            message: `مبيعات اليوم: ${todaySales.toFixed(2)} ج.م - المتوسط الأسبوعي: ${(weekSales / 7).toFixed(2)} ج.م`,
            action: "showSection('reports')",
            actionLabel: 'عرض التقارير',
            time: 'تحليل'
        });
    }

    // Maintenance alerts
    if (typeof maintenanceTickets !== 'undefined' && maintenanceTickets.length > 0) {
        const pending = maintenanceTickets.filter(m => m.status === 'waiting' || m.status === 'in_progress');
        if (pending.length > 0) {
            alerts.push({
                severity: 'warning',
                title: `🔧 ${pending.length} طلب صيانة في الانتظار`,
                message: pending.slice(0, 2).map(m => m.device_name + ' - ' + (m.customer_name || 'عميل')).join('، '),
                action: "showSection('maintenance')",
                actionLabel: 'عرض الصيانة',
                time: 'الآن'
            });
        }
    }

    // Shift check
    if (!currentShift) {
        alerts.push({
            severity: 'info',
            title: '🔄 لم يتم فتح وردية اليوم',
            message: 'افتح وردية جديدة لبدء تسجيل المبيعات',
            action: "showSection('shifts')",
            actionLabel: 'فتح وردية',
            time: 'الآن'
        });
    }

    return alerts;
}

function checkSmartAlertsOnLoad() {
    const alerts = generateSmartAlerts();
    const MAX_ALERTS = 8;
    const dangerCount = alerts.filter(a => a.severity === 'danger').length;
    if (dangerCount > 0) {
        const shown = alerts.slice(0, MAX_ALERTS);
        showToast(`⚠️ ${dangerCount} تنبيه مهم — اضغط 🔔 لعرض التفاصيل`, 'error');
    }
}
