let activityLog = [];

function logActivity(action, details, type) {
    const entry = {
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        timestamp: new Date().toISOString(),
        action: action,
        details: details,
        type: type || 'info',
        user: localStorage.getItem('active_staff_name') || 'النظام',
        store_id: currentStoreId
    };
    activityLog.unshift(entry);
    if (activityLog.length > 500) activityLog = activityLog.slice(0, 500);
    try { localStorage.setItem('activity_log_' + currentStoreId, JSON.stringify(activityLog)); } catch(e) {}
    updateActivityBadge();
}

function loadActivityLog() {
    try {
        const saved = localStorage.getItem('activity_log_' + currentStoreId);
        if (saved) activityLog = JSON.parse(saved);
    } catch(e) { activityLog = []; }
}

function renderActivityLog() {
    const tbody = document.getElementById('activityLogBody');
    const empty = document.getElementById('emptyActivityLog');
    if (!tbody) return;
    if (activityLog.length === 0) { tbody.innerHTML = ''; empty?.classList.remove('hidden'); return; }
    empty?.classList.add('hidden');

    const typeIcons = {
        'add': '<i class="fa-solid fa-plus" style="color:var(--success);"></i>',
        'edit': '<i class="fa-solid fa-pen" style="color:var(--info);"></i>',
        'delete': '<i class="fa-solid fa-trash" style="color:var(--danger);"></i>',
        'sale': '<i class="fa-solid fa-cart-shopping" style="color:var(--accent);"></i>',
        'payment': '<i class="fa-solid fa-money-bill" style="color:var(--warning);"></i>',
        'shift': '<i class="fa-solid fa-clock" style="color:var(--info);"></i>',
        'auth': '<i class="fa-solid fa-user" style="color:var(--text-2);"></i>',
        'info': '<i class="fa-solid fa-circle-info" style="color:var(--text-3);"></i>',
        'sync': '<i class="fa-solid fa-arrows-rotate" style="color:var(--success);"></i>',
        'warning': '<i class="fa-solid fa-triangle-exclamation" style="color:var(--warning);"></i>'
    };

    let filtered = activityLog;
    const searchVal = document.getElementById('activitySearch')?.value?.toLowerCase() || '';
    const typeFilter = document.getElementById('activityTypeFilter')?.value || 'all';
    if (searchVal) filtered = filtered.filter(e => e.action.toLowerCase().includes(searchVal) || e.details.toLowerCase().includes(searchVal));
    if (typeFilter !== 'all') filtered = filtered.filter(e => e.type === typeFilter);

    const pagContainer = document.getElementById('activityPagination');
    if (!pagContainer) {
        const p = document.createElement('div');
        p.id = 'activityPagination';
        p.className = 'mt-3';
        tbody.closest('table')?.parentNode?.insertBefore(p, tbody.closest('table').nextSibling);
    }
    if (!Pagination._instances['activityPagination']) Pagination.create('activityPagination', { itemsPerPage: 20 });
    Pagination.update('activityPagination', filtered.length);
    const pageItems = Pagination.getPageData('activityPagination', filtered);

    tbody.innerHTML = pageItems.map(e => {
        const time = new Date(e.timestamp).toLocaleString('ar-EG');
        return `<tr class="border-b border-slate-800/60 hover:bg-slate-800/20 transition">
            <td class="p-2 text-center">${typeIcons[e.type] || typeIcons.info}</td>
            <td class="p-2 font-bold text-xs" style="color:var(--text-1);">${e.action}</td>
            <td class="p-2 text-[10px]" style="color:var(--text-3);">${e.details}</td>
            <td class="p-2 text-[10px]" style="color:var(--text-2);">${e.user}</td>
            <td class="p-2 text-[9px] font-mono" style="color:var(--text-3);">${time}</td>
        </tr>`;
    }).join('');
}

function updateActivityBadge() {
    const badge = document.getElementById('activityBadge');
    if (badge) {
        const today = new Date().toISOString().split('T')[0];
        const todayCount = activityLog.filter(e => e.timestamp.startsWith(today)).length;
        badge.textContent = todayCount;
        badge.style.display = todayCount > 0 ? 'inline-block' : 'none';
    }
}

function openActivityLog() {
    document.getElementById('activityLogTab').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderActivityLog();
}

function closeActivityLog() {
    document.getElementById('activityLogTab').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function clearActivityLog() {
    activityLog = [];
    localStorage.removeItem('activity_log_' + currentStoreId);
    renderActivityLog();
    showToast('🗑️ تم مسح سجل النشاطات', 'success');
}

function exportActivityLog() {
    let csv = 'النشاط,التفاصيل,المستخدم,التاريخ\n';
    activityLog.forEach(e => {
        csv += `"${e.action}","${e.details}","${e.user}","${new Date(e.timestamp).toLocaleString('ar-EG')}"\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity_log_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 تم تصدير السجل', 'success');
}
