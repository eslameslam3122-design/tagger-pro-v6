// TAGGER PRO V6 - Finance, Expenses & Installments

// ============================================================
// ====== نظام المصروفات والإيرادات ======
// ============================================================

async function loadFinanceData() {
    try {
        const tbody = document.getElementById('financeTableBody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="6">' + Skeleton.table(5, 5) + '</td></tr>';
        let local = await SmartLoader.getLocalData('finance_transactions');
        financeTransactions = local.filter(t => t.store_id === currentStoreId)
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        if (financeTransactions.length === 0 && SyncManager.isOnline) {
            await SmartLoader.syncTable('finance_transactions', currentStoreId, true);
            local = await SmartLoader.getLocalData('finance_transactions');
            financeTransactions = local.filter(t => t.store_id === currentStoreId)
                .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        }
        renderFinanceTable();
        updateFinanceStats();
        if (SyncManager.isOnline) {
            SmartLoader.syncTable('finance_transactions', currentStoreId).then(synced => {
                if (synced.length > 0) {
                    SmartLoader.getLocalData('finance_transactions').then(full => {
                        financeTransactions = full.filter(t => t.store_id === currentStoreId)
                            .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
                        renderFinanceTable();
                        updateFinanceStats();
                    });
                }
            });
        }
    } catch(err) {
        console.error('خطأ في تحميل المالية:', err);
    }
}

function openFinance() {
    if (!canViewFinance()) { showToastPermission(); return; }
    document.getElementById('financeTab').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    try {
        renderFinanceTable();
        updateFinanceStats();
    } catch(e) {
        ErrorBoundary.show('financeTab', e, () => openFinance());
    }
}

function closeFinance() {
    document.getElementById('financeTab').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function openExpenseModal() {
    if (!canEdit()) { showToastPermission(); return; }
    document.getElementById('expenseTitle').value = '';
    document.getElementById('expenseAmount').value = '';
    const catSelect = document.getElementById('expenseCategory');
    if(catSelect) {
        catSelect.innerHTML = expenseCategories.map(c => `<option value="${c}">${c}</option>`).join('');
    }
    document.getElementById('expenseModal').classList.remove('hidden');
}

function openRevenueModal() {
    if (!canEdit()) { showToastPermission(); return; }
    document.getElementById('revenueTitle').value = '';
    document.getElementById('revenueAmount').value = '';
    document.getElementById('revenueModal').classList.remove('hidden');
}

async function saveExpense() {
    if (!requireShift()) return;
    if (!canEdit()) { showToastPermission(); return; }
    const title = document.getElementById('expenseTitle').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory')?.value || 'أخرى';
    if(!title || !amount || amount <= 0) { showToast('⚠️ يرجى إدخال البيانات بشكل صحيح', 'error'); return; }
    try {
        const txData = {
            store_id: currentStoreId,
            title: title,
            type: 'expense',
            amount: amount,
            category: category,
            date: new Date().toISOString(),
            shift_id: currentShift ? currentShift.id : null
        };
        try {
            const { error } = await sb.from('finance_transactions').insert([txData]);
            if(error) throw error;
        } catch(e) {
            await SyncManager.enqueue('finance_transactions', 'put', { ...txData, id: 'offline_' + Date.now() });
            console.warn('📦 المصروف حُفظ محلياً (أوفلاين)');
        }
        closeModal('expenseModal');
        await loadFinanceData();
        updateReports();
        showToast(`✅ تم تسجيل مصروف ${amount.toFixed(2)} ج.م`, 'success');
    } catch(err) {
        showToast('❌ خطأ: ' + err.message, 'error');
    }
}

async function saveRevenue() {
    if (!requireShift()) return;
    if (!canEdit()) { showToastPermission(); return; }
    const title = document.getElementById('revenueTitle').value.trim();
    const amount = parseFloat(document.getElementById('revenueAmount').value);
    if(!title || !amount || amount <= 0) { showToast('⚠️ يرجى إدخال البيانات بشكل صحيح', 'error'); return; }
    try {
        const txData = {
            store_id: currentStoreId,
            title: title,
            type: 'revenue',
            amount: amount,
            date: new Date().toISOString(),
            shift_id: currentShift ? currentShift.id : null
        };
        try {
            const { error } = await sb.from('finance_transactions').insert([txData]);
            if(error) throw error;
        } catch(e) {
            await SyncManager.enqueue('finance_transactions', 'put', { ...txData, id: 'offline_' + Date.now() });
            console.warn('📦 الإيراد حُفظ محلياً (أوفلاين)');
        }
        closeModal('revenueModal');
        await loadFinanceData();
        updateReports();
        showToast(`✅ تم تسجيل إيراد ${amount.toFixed(2)} ج.م`, 'success');
    } catch(err) {
        showToast('❌ خطأ: ' + err.message, 'error');
    }
}

function renderFinanceTable() {
    const tbody = document.getElementById('financeTableBody');
    const emptyMsg = document.getElementById('emptyFinance');
    if(!tbody) return;
    if(financeTransactions.length === 0) { tbody.innerHTML = ''; emptyMsg.classList.remove('hidden'); return; }
    emptyMsg.classList.add('hidden');
    tbody.innerHTML = financeTransactions.slice(0, 50).map((t, index) => {
        const typeIcon = t.type === 'expense' ? '🔴 مصروف' : '🟢 إيراد';
        const typeColor = t.type === 'expense' ? 'text-red-400' : 'text-emerald-400';
        const catBadge = t.category ? `<span class="px-1.5 py-0.5 rounded text-[8px] font-bold" style="background: var(--accent-soft); color: var(--accent);">${t.category}</span>` : '';
        return `
            <tr class="border-b border-slate-800/60 hover:bg-slate-800/20 transition">
                <td class="p-3">${index + 1}</td>
                <td class="p-3 font-bold text-slate-200">${t.title} ${catBadge}</td>
                <td class="p-3 text-center ${typeColor}">${typeIcon}</td>
                <td class="p-3 text-center ${typeColor} font-bold">${t.type === 'expense' ? '-' : '+'}${t.amount.toFixed(2)} ج.م</td>
                <td class="p-3 text-center text-slate-400 text-[10px]">${new Date(t.date).toLocaleString('ar-EG')}</td>
                <td class="p-3 text-center">
                    <button onclick="deleteFinanceTransaction('${t.id}')" class="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-2 py-1 rounded-lg text-[10px] transition">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function deleteFinanceTransaction(id) {
    if (!canEdit()) { showToastPermission(); return; }
    const confirmed = await showConfirm('هل أنت متأكد من حذف هذه المعاملة؟', 'حذف المعاملة', { danger: true });
    if(!confirmed) return;
    try {
        await sb.from('finance_transactions').delete().eq('id', id);
        await loadFinanceData();
        updateReports();
        showToast('🗑️ تم حذف المعاملة', 'success');
    } catch(err) {
        showToast('❌ خطأ: ' + err.message, 'error');
    }
}

function updateFinanceStats() {
    const totalRevenue = financeTransactions.filter(t => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = financeTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    document.getElementById('financeTotalRevenue').innerText = totalRevenue.toFixed(2) + ' ج.م';
    document.getElementById('financeTotalExpenses').innerText = totalExpenses.toFixed(2) + ' ج.م';
    document.getElementById('financeNetProfit').innerText = netProfit.toFixed(2) + ' ج.م';
    document.getElementById('financeTransactionCount').innerText = financeTransactions.length;
}

// ============================================================
// ====== تصنيفات المصروفات ======
// ============================================================

let expenseCategories = JSON.parse(localStorage.getItem('expenseCategories_' + currentStoreId) || '["إيجار","رواتب","فواتير","مشتريات","صيانة","تسويق","أخرى"]');

function openExpenseCategories() {
    document.getElementById('expenseCategoriesModal').classList.remove('hidden');
    document.getElementById('expenseCategoriesModal').classList.add('flex');
    renderExpenseCategories();
}

function renderExpenseCategories() {
    const list = document.getElementById('expenseCatList');
    list.innerHTML = expenseCategories.map((cat, i) => `
        <div class="flex items-center gap-2 p-2 rounded-lg" style="background: var(--bg-elevated); border: 1px solid var(--border);">
            <span class="flex-1 text-xs font-bold" style="color: var(--text-1);">${cat}</span>
            <button onclick="removeExpenseCategory(${i})" class="text-xs px-2 py-1 rounded-lg transition" style="background: var(--accent-soft); color: var(--danger);"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');
}

function addExpenseCategory() {
    const input = document.getElementById('newExpenseCat');
    const name = input.value.trim();
    if (!name) return;
    if (expenseCategories.includes(name)) { showToast('التصنيف موجود بالفعل', 'warning'); return; }
    expenseCategories.push(name);
    localStorage.setItem('expenseCategories_' + currentStoreId, JSON.stringify(expenseCategories));
    input.value = '';
    renderExpenseCategories();
    showToast('تمت إضافة التصنيف', 'success');
}

function removeExpenseCategory(index) {
    expenseCategories.splice(index, 1);
    localStorage.setItem('expenseCategories_' + currentStoreId, JSON.stringify(expenseCategories));
    renderExpenseCategories();
}

// ============================================================
// ====== نظام الأقساط (النسخة المطورة) ======
// ============================================================

let installments = [];
let installmentPayments = [];
let currentInstallmentFilter = 'all';

async function loadInstallmentsData() {
    try {
        let localInst = await SmartLoader.getLocalData('installments');
        installments = localInst.filter(i => i.store_id === currentStoreId);
        let localPay = await SmartLoader.getLocalData('installment_payments');
        installmentPayments = localPay.filter(p => p.store_id === currentStoreId);
        if (installments.length === 0 && SyncManager.isOnline) {
            await SmartLoader.syncTable('installments', currentStoreId, true);
            await SmartLoader.syncTable('installment_payments', currentStoreId, true);
            localInst = await SmartLoader.getLocalData('installments');
            installments = localInst.filter(i => i.store_id === currentStoreId);
            localPay = await SmartLoader.getLocalData('installment_payments');
            installmentPayments = localPay.filter(p => p.store_id === currentStoreId);
        }
        renderInstallmentsStats();
        renderInstallmentsTable();
        if (SyncManager.isOnline) {
            Promise.all([
                SmartLoader.syncTable('installments', currentStoreId),
                SmartLoader.syncTable('installment_payments', currentStoreId)
            ]).then(([inst, pays]) => {
                if (inst.length > 0 || pays.length > 0) {
                    SmartLoader.getLocalData('installments').then(full => {
                        installments = full.filter(i => i.store_id === currentStoreId);
                        SmartLoader.getLocalData('installment_payments').then(fullPay => {
                            installmentPayments = fullPay.filter(p => p.store_id === currentStoreId);
                            renderInstallmentsStats();
                            renderInstallmentsTable();
                        });
                    });
                }
            });
        }
    } catch(err) { console.error('خطأ في تحميل الأقساط:', err); }
}

function openInstallments() {
    document.getElementById('installmentsTab').classList.remove('hidden');
    document.getElementById('installmentsTab').classList.add('flex');
    document.body.style.overflow = 'hidden';
    loadInstallmentsData();
    populateInstallmentSelects();
}

function closeInstallments() {
    document.getElementById('installmentsTab').classList.add('hidden');
    document.getElementById('installmentsTab').classList.remove('flex');
    document.body.style.overflow = 'auto';
}

function filterInstallments(status) {
    currentInstallmentFilter = status;
    document.querySelectorAll('.inst-filter-btn').forEach(b => {
        b.style.background = b.dataset.status === status ? 'var(--accent)' : 'var(--bg-elevated)';
        b.style.color = b.dataset.status === status ? '#fff' : 'var(--text-2)';
    });
    renderInstallmentsTable();
}

function populateInstallmentSelects() {
    const custSel = document.getElementById('instCustomer');
    if (custSel) custSel.innerHTML = '<option value="">اختر العميل</option>' + allCustomers.map(c => `<option value="${c.id}">${c.customer_name}</option>`).join('');
    const invSel = document.getElementById('instInvoice');
    if (invSel) invSel.innerHTML = '<option value="">بدون فاتورة</option>' + allInvoices.filter(i => i.remaining_amount > 0).map(i => `<option value="${i.id}">${i.invoice_number || i.id} - متبقي: ${parseFloat(i.remaining_amount).toFixed(2)}</option>`).join('');
    const sd = document.getElementById('instStartDate');
    if (sd) sd.value = new Date().toISOString().split('T')[0];
}

function renderInstallmentsStats() {
    const el = document.getElementById('installmentStatsCards');
    if (!el) return;
    const active = installments.filter(i => i.status === 'active');
    const completed = installments.filter(i => i.status === 'completed');
    const overdue = installments.filter(i => i.status === 'active' && i.overdue_count > 0);
    const totalAmount = installments.reduce((s, i) => s + (parseFloat(i.final_amount || i.total_amount) || 0), 0);
    const paid = installments.reduce((s, i) => s + (parseFloat(i.paid_amount) || 0), 0);
    const remaining = totalAmount - paid;
    const totalPenalties = installments.reduce((s, i) => s + (parseFloat(i.penalty) || 0), 0);
    el.innerHTML = `
        <div class="rounded-xl p-3 text-center" style="background:var(--bg-card);border:1px solid var(--border);"><p class="text-[10px]" style="color:var(--text-3);">عقود نشطة</p><p class="text-lg font-bold" style="color:var(--accent);">${active.length}</p></div>
        <div class="rounded-xl p-3 text-center" style="background:var(--bg-card);border:1px solid var(--border);"><p class="text-[10px]" style="color:var(--text-3);">مكتملة</p><p class="text-lg font-bold" style="color:var(--info);">${completed.length}</p></div>
        <div class="rounded-xl p-3 text-center" style="background:var(--bg-card);border:1px solid var(--border);"><p class="text-[10px]" style="color:var(--text-3);">متأخرة</p><p class="text-lg font-bold" style="color:var(--danger);">${overdue.length}</p></div>
        <div class="rounded-xl p-3 text-center" style="background:var(--bg-card);border:1px solid var(--border);"><p class="text-[10px]" style="color:var(--text-3);">الإجمالي</p><p class="text-lg font-bold" style="color:var(--success);">${totalAmount.toFixed(0)} ج.م</p></div>
        <div class="rounded-xl p-3 text-center" style="background:var(--bg-card);border:1px solid var(--border);"><p class="text-[10px]" style="color:var(--text-3);">المدفوع</p><p class="text-lg font-bold" style="color:var(--info);">${paid.toFixed(0)} ج.م</p></div>
        <div class="rounded-xl p-3 text-center" style="background:var(--bg-card);border:1px solid var(--border);"><p class="text-[10px]" style="color:var(--text-3);">المتبقي</p><p class="text-lg font-bold" style="color:var(--danger);">${remaining.toFixed(0)} ج.م</p></div>
        ${totalPenalties > 0 ? `<div class="rounded-xl p-3 text-center" style="background:var(--bg-card);border:1px solid var(--danger);"><p class="text-[10px]" style="color:var(--danger);">غرامات</p><p class="text-lg font-bold" style="color:var(--danger);">${totalPenalties.toFixed(0)} ج.م</p></div>` : ''}
    `;
}

function renderInstallmentsTable() {
    const tbody = document.getElementById('installmentsTableBody');
    const empty = document.getElementById('emptyInstallments');
    if (!tbody) return;

    let filtered = [...installments];
    if (currentInstallmentFilter !== 'all') filtered = filtered.filter(i => i.status === currentInstallmentFilter);

    if (!filtered.length) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');

    tbody.innerHTML = filtered.map(inst => {
        const total = parseFloat(inst.final_amount || inst.total_amount) || 0;
        const paid = parseFloat(inst.paid_amount) || 0;
        const remaining = total - paid;
        const progress = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
        const statusMap = { active: 'نشط', completed: 'مكتمل', cancelled: 'ملغي', overdue: 'متأخر' };
        const colorMap = { active: 'var(--success)', completed: 'var(--info)', cancelled: 'var(--text-3)', overdue: 'var(--danger)' };
        const status = inst.overdue_count > 0 && inst.status === 'active' ? 'overdue' : inst.status;
        const payments = installmentPayments.filter(p => p.installment_id === inst.id);
        const paidCount = payments.filter(p => p.status === 'paid').length;
        const overduePayments = payments.filter(p => p.status === 'overdue');
        const nextPayment = payments.find(p => p.status === 'pending' || p.status === 'overdue');

        return `<tr class="border-b transition" style="border-color:var(--border);background:var(--bg-card);" onmouseover="this.style.background='var(--bg-elevated)'" onmouseout="this.style.background='var(--bg-card)'">
            <td class="p-2"><div class="w-full rounded-full h-1.5" style="background:var(--bg-elevated);"><div class="h-1.5 rounded-full" style="width:${progress}%;background:${colorMap[status]};"></div></div><span class="text-[9px]" style="color:var(--text-3);">${progress.toFixed(0)}%</span></td>
            <td class="p-2 font-bold" style="color:var(--text-1);">${inst.customer_name || '—'}</td>
            <td class="p-2 text-[10px]" style="color:var(--text-3);">${inst.invoice_number || '—'}</td>
            <td class="p-2 font-bold" style="color:var(--text-1);">${total.toFixed(0)} ج.م</td>
            <td class="p-2" style="color:var(--info);">${paidCount}/${payments.length} قسط</td>
            <td class="p-2 font-bold" style="color:${colorMap[status]};">${statusMap[status]}${inst.overdue_count > 0 ? ' ⚠️' : ''}</td>
            <td class="p-2 flex gap-1 flex-wrap">
                <button onclick="showInstallmentDetail('${inst.id}')" class="px-2 py-1 rounded-lg text-[10px] font-bold transition" style="background:var(--accent-soft);color:var(--accent);">تفاصيل</button>
                ${inst.status === 'active' ? `<button onclick="openPayInstallmentModal('${inst.id}')" class="px-2 py-1 rounded-lg text-[10px] font-bold transition" style="background:rgba(16,185,129,0.15);color:var(--success);">سداد</button>` : ''}
                <button onclick="sendInstallmentReminder('${inst.id}')" class="px-2 py-1 rounded-lg text-[10px] font-bold transition" style="background:rgba(34,197,94,0.15);color:#22c55e;">تذكير</button>
                <button onclick="printInstallmentContract('${inst.id}')" class="px-2 py-1 rounded-lg text-[10px] font-bold transition" style="background:rgba(168,85,247,0.15);color:#a855f7;">طباعة</button>
            </td>
        </tr>`;
    }).join('');
}

function openAddInstallmentModal() {
    document.getElementById('addInstallmentModal').classList.remove('hidden');
    document.getElementById('addInstallmentModal').classList.add('flex');
    populateInstallmentSelects();
    calcInstallmentPreview();
}

function calcInstallmentPreview() {
    const total = parseFloat(document.getElementById('instTotal').value) || 0;
    const paid = parseFloat(document.getElementById('instPaid').value) || 0;
    const months = parseInt(document.getElementById('instMonths').value) || 12;
    const rate = parseFloat(document.getElementById('instInterestRate').value) || 0;
    const afterPaid = total - paid;
    const interestAmt = afterPaid * (rate / 100);
    const finalAmount = afterPaid + interestAmt;
    const remaining = finalAmount;
    const monthly = months > 0 ? (remaining / months) : 0;
    const preview = document.getElementById('instPreview');
    if (preview && total > 0) {
        preview.classList.remove('hidden');
        preview.innerHTML = `
            <div class="grid grid-cols-2 gap-2 text-[10px]">
                <div style="color:var(--text-3);">المبلغ الأساسي</div><div class="font-bold" style="color:var(--text-1);">${total.toFixed(2)} ج.م</div>
                <div style="color:var(--text-3);">المدفوع مسبقاً</div><div class="font-bold" style="color:var(--info);">${paid.toFixed(2)} ج.م</div>
                <div style="color:var(--text-3);">المبلغ المتبقي</div><div class="font-bold" style="color:var(--text-1);">${afterPaid.toFixed(2)} ج.م</div>
                ${rate > 0 ? `<div style="color:var(--text-3);">فائدة ${rate}% على المتبقي</div><div class="font-bold" style="color:var(--danger);">+${interestAmt.toFixed(2)} ج.م</div>` : ''}
                <div style="color:var(--text-3);">الإجمالي النهائي</div><div class="font-bold" style="color:var(--accent);">${finalAmount.toFixed(2)} ج.م</div>
                <div style="color:var(--text-3);">القسط الشهري</div><div class="font-bold" style="color:var(--success);">${monthly.toFixed(2)} ج.م</div>
            </div>`;
    }
}

async function saveInstallment() {
    const customerId = document.getElementById('instCustomer').value;
    const invoiceId = document.getElementById('instInvoice').value || null;
    const total = parseFloat(document.getElementById('instTotal').value) || 0;
    const paid = parseFloat(document.getElementById('instPaid').value) || 0;
    const months = parseInt(document.getElementById('instMonths').value) || 12;
    const startDate = document.getElementById('instStartDate').value;
    const interestRate = parseFloat(document.getElementById('instInterestRate').value) || 0;
    const notes = document.getElementById('instNotes').value.trim();
    if (!customerId || total <= 0) { showToast('⚠️ اختر العميل وأدخل المبلغ', 'error'); return; }
    const customer = allCustomers.find(c => c.id === customerId);
    const invoice = invoiceId ? allInvoices.find(i => i.id === invoiceId) : null;
    const afterPaid = total - paid;
    const interestAmount = afterPaid * (interestRate / 100);
    const finalAmount = afterPaid + interestAmount;
    const remaining = finalAmount;
    const monthlyPayment = months > 0 ? remaining / months : 0;
    try {
        const instData = {
            store_id: currentStoreId,
            customer_id: customerId,
            customer_name: customer ? customer.customer_name : '',
            customer_phone: customer ? customer.phone : '',
            invoice_id: invoiceId,
            invoice_number: invoice ? invoice.invoice_number : '',
            total_amount: total,
            interest_rate: interestRate,
            interest_amount: interestAmount,
            final_amount: finalAmount,
            paid_amount: paid,
            remaining_amount: remaining,
            months: months,
            monthly_payment: monthlyPayment,
            start_date: startDate,
            next_due_date: startDate,
            status: 'active',
            overdue_count: 0,
            penalty: 0,
            notes: notes
        };
        let instId;
        try {
            const { data, error } = await sb.from('installments').insert([instData]).select().single();
            if (error) {
                console.error('❌ installments insert error:', error.message, error.details, error.hint);
                throw error;
            }
            instId = data.id;
        } catch (e) {
            console.error('⚠️ Falling back to offline:', e.message || e);
            showToast('⚠️ حفظ محلي فقط: ' + (e.message || e), 'error');
            instId = 'offline_inst_' + Date.now();
            await SyncManager.enqueue('installments', 'put', { ...instData, id: instId });
        }
        const schedule = [];
        for (let m = 1; m <= months; m++) {
            const due = new Date(startDate);
            due.setMonth(due.getMonth() + m);
            const isPaid = m === 1 && paid > 0;
            schedule.push({
                installment_id: instId,
                store_id: currentStoreId,
                month_number: m,
                amount: monthlyPayment,
                due_date: due.toISOString().split('T')[0],
                paid_date: isPaid ? startDate : null,
                paid_amount: isPaid ? Math.min(paid, monthlyPayment) : 0,
                status: isPaid ? 'paid' : 'pending',
                penalty: 0,
                notes: ''
            });
        }
        try {
            await sb.from('installment_payments').insert(schedule);
        } catch (e) {
            await SyncManager.enqueue('installment_payments', 'put', schedule);
        }
        await LocalDB.put('installments', { ...instData, id: instId });
        await LocalDB.bulkPut('installment_payments', schedule);
        closeModal('addInstallmentModal');
        await loadInstallmentsData();
        showToast('✅ تم إنشاء عقد الأقساط مع جدول السداد', 'success');
    } catch (err) { showToast('❌ خطأ: ' + err.message, 'error'); }
}

function showInstallmentDetail(instId) {
    const inst = installments.find(i => i.id === instId);
    if (!inst) return;
    const payments = installmentPayments.filter(p => p.installment_id === instId).sort((a, b) => a.month_number - b.month_number);
    const total = parseFloat(inst.final_amount || inst.total_amount) || 0;
    const paid = parseFloat(inst.paid_amount) || 0;
    const remaining = total - paid;
    const progress = total > 0 ? (paid / total * 100) : 0;
    const today = new Date();

    let scheduleHtml = payments.map(p => {
        const due = new Date(p.due_date);
        const isOverdue = p.status !== 'paid' && due < today;
        const statusIcon = p.status === 'paid' ? '✅' : isOverdue ? '❌' : '⏳';
        const statusText = p.status === 'paid' ? 'مدفوع' : isOverdue ? 'متأخر' : 'قريب';
        const rowStyle = p.status === 'paid' ? 'opacity:0.6;' : isOverdue ? 'background:rgba(239,68,68,0.08);' : '';
        return `<tr style="${rowStyle}">
            <td class="p-2 text-center">${p.month_number}</td>
            <td class="p-2 font-bold" style="color:var(--text-1);">${p.amount.toFixed(2)} ج.م</td>
            <td class="p-2 text-center" style="color:var(--text-3);">${p.due_date}</td>
            <td class="p-2 text-center">${statusIcon} ${statusText}</td>
            <td class="p-2 text-center" style="color:var(--info);">${p.paid_date || '—'}</td>
            <td class="p-2 text-center" style="color:var(--danger);">${p.penalty > 0 ? p.penalty.toFixed(2) + ' ج.م' : '—'}</td>
        </tr>`;
    }).join('');

    const modal = document.getElementById('installmentDetailModal');
    document.getElementById('instDetailContent').innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div class="rounded-xl p-3 text-center" style="background:var(--bg-elevated);"><p class="text-[10px]" style="color:var(--text-3);">العميل</p><p class="font-bold text-sm" style="color:var(--text-1);">${inst.customer_name || '—'}</p></div>
            <div class="rounded-xl p-3 text-center" style="background:var(--bg-elevated);"><p class="text-[10px]" style="color:var(--text-3);">الفاتورة</p><p class="font-bold text-sm" style="color:var(--text-1);">${inst.invoice_number || '—'}</p></div>
            <div class="rounded-xl p-3 text-center" style="background:var(--bg-elevated);"><p class="text-[10px]" style="color:var(--text-3);">الإجمالي</p><p class="font-bold text-sm" style="color:var(--accent);">${total.toFixed(2)} ج.م</p></div>
            <div class="rounded-xl p-3 text-center" style="background:var(--bg-elevated);"><p class="text-[10px]" style="color:var(--text-3);">المتبقي</p><p class="font-bold text-sm" style="color:var(--danger);">${remaining.toFixed(2)} ج.م</p></div>
        </div>
        ${inst.interest_rate > 0 ? `<div class="rounded-xl p-3 mb-4" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);"><span style="color:var(--danger);font-size:11px;">فائدة: ${inst.interest_rate}% = ${inst.interest_amount.toFixed(2)} ج.م</span></div>` : ''}
        <div class="mb-4">
            <div class="w-full rounded-full h-2" style="background:var(--bg-elevated);"><div class="h-2 rounded-full transition-all" style="width:${progress}%;background:var(--accent);"></div></div>
            <div class="flex justify-between text-[10px] mt-1" style="color:var(--text-3);"><span>${paid.toFixed(0)} مدفوع</span><span>${progress.toFixed(0)}%</span><span>${remaining.toFixed(0)} متبقي</span></div>
        </div>
        <h4 class="font-bold text-sm mb-2" style="color:var(--text-1);">جدول السداد الشهري</h4>
        <div class="overflow-x-auto">
            <table class="w-full text-right text-[10px]">
                <thead style="background:var(--bg-elevated);color:var(--text-3);"><tr>
                    <th class="p-2">الشهر</th><th class="p-2">المبلغ</th><th class="p-2">تاريخ الاستحقاق</th><th class="p-2">الحالة</th><th class="p-2">تاريخ الدفع</th><th class="p-2">غرامة</th>
                </tr></thead>
                <tbody>${scheduleHtml}</tbody>
            </table>
        </div>
        ${inst.notes ? `<div class="mt-3 p-2 rounded-xl text-[10px]" style="background:var(--bg-elevated);color:var(--text-2);">📝 ${inst.notes}</div>` : ''}`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function openPayInstallmentModal(instId) {
    const inst = installments.find(i => i.id === instId);
    if (!inst) return;
    const total = parseFloat(inst.final_amount || inst.total_amount) || 0;
    const paid = parseFloat(inst.paid_amount) || 0;
    const remaining = total - paid;
    const payments = installmentPayments.filter(p => p.installment_id === instId && p.status !== 'paid');
    const nextPayment = payments.sort((a, b) => a.month_number - b.month_number)[0];

    document.getElementById('payInstId').value = instId;
    document.getElementById('payInstCustomer').textContent = inst.customer_name || 'عميل';
    document.getElementById('payInstRemaining').textContent = remaining.toFixed(2) + ' ج.م';
    document.getElementById('payInstAmount').value = nextPayment ? nextPayment.amount.toFixed(2) : '';
    document.getElementById('payInstAmount').max = remaining;
    document.getElementById('payInstNote').value = '';

    const modal = document.getElementById('payInstallmentModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

async function confirmPayInstallment() {
    const instId = document.getElementById('payInstId').value;
    const amount = parseFloat(document.getElementById('payInstAmount').value) || 0;
    const note = document.getElementById('payInstNote').value.trim();
    if (!instId || amount <= 0) { showToast('⚠️ أدخل مبلغ صحيح', 'error'); return; }

    const inst = installments.find(i => i.id === instId);
    if (!inst) return;

    const newPaid = (parseFloat(inst.paid_amount) || 0) + amount;
    const total = parseFloat(inst.final_amount || inst.total_amount) || 0;
    const newRemaining = total - newPaid;
    const newStatus = newPaid >= total ? 'completed' : 'active';

    try {
        await sb.from('installments').update({
            paid_amount: newPaid,
            remaining_amount: Math.max(0, newRemaining),
            status: newStatus,
            last_payment_date: new Date().toISOString().split('T')[0]
        }).eq('id', instId);

        await LocalDB.put('installments', { ...inst, paid_amount: newPaid, remaining_amount: Math.max(0, newRemaining), status: newStatus, last_payment_date: new Date().toISOString().split('T')[0] });

        const pendingPayments = installmentPayments.filter(p => p.installment_id === instId && p.status !== 'paid').sort((a, b) => a.month_number - b.month_number);
        let remainingAmount = amount;
        for (const p of pendingPayments) {
            if (remainingAmount <= 0) break;
            const payThis = Math.min(remainingAmount, p.amount - (p.paid_amount || 0));
            const newPPStatus = (p.paid_amount || 0) + payThis >= p.amount ? 'paid' : 'partial';
            const newPPPaid = (p.paid_amount || 0) + payThis;
            try {
                await sb.from('installment_payments').update({
                    paid_amount: newPPPaid,
                    paid_date: new Date().toISOString().split('T')[0],
                    status: newPPStatus,
                    notes: note || ''
                }).eq('id', p.id);
            } catch (e) {}
            await LocalDB.put('installment_payments', { ...p, paid_amount: newPPPaid, paid_date: new Date().toISOString().split('T')[0], status: newPPStatus, notes: note || '' });
            remainingAmount -= payThis;
        }

        closeModal('payInstallmentModal');
        await loadInstallmentsData();
        showToast(`✅ تم تسجيل سداد ${amount.toFixed(2)} ج.م`, 'success');
    } catch (err) { showToast('❌ خطأ: ' + err.message, 'error'); }
}

async function checkOverdueInstallments() {
    const today = new Date().toISOString().split('T')[0];
    try {
        const { data: overdue } = await sb.from('installment_payments')
            .select('*').eq('store_id', currentStoreId)
            .in('status', ['pending', 'partial'])
            .lt('due_date', today);
        if (!overdue || !overdue.length) return;
        for (const p of overdue) {
            const daysLate = Math.floor((new Date(today) - new Date(p.due_date)) / (1000 * 60 * 60 * 24));
            const penalty = Math.round(p.amount * 0.02 * Math.ceil(daysLate / 30));
            try {
                await sb.from('installment_payments').update({ status: 'overdue', penalty }).eq('id', p.id);
            } catch (e) {}
            await LocalDB.put('installment_payments', { ...p, status: 'overdue', penalty });
        }
        const instIds = [...new Set(overdue.map(p => p.installment_id))];
        for (const instId of instIds) {
            const count = await sb.from('installment_payments').select('id', { count: 'exact', head: true })
                .eq('installment_id', instId).eq('status', 'overdue');
            const totalPenalty = await sb.from('installment_payments').select('penalty')
                .eq('installment_id', instId).eq('status', 'overdue');
            const penSum = (totalPenalty.data || []).reduce((s, r) => s + (parseFloat(r.penalty) || 0), 0);
            try {
                await sb.from('installments').update({
                    overdue_count: count.count || 0,
                    penalty: penSum
                }).eq('id', instId);
            } catch (e) {}
            const inst = installments.find(i => i.id === instId);
            if (inst) await LocalDB.put('installments', { ...inst, overdue_count: count.count || 0, penalty: penSum });
        }
    } catch (e) { console.error('خطأ فحص التأخيرات:', e); }
}

function sendInstallmentReminder(instId) {
    const inst = installments.find(i => i.id === instId);
    if (!inst) return;
    const total = parseFloat(inst.final_amount || inst.total_amount) || 0;
    const paid = parseFloat(inst.paid_amount) || 0;
    const remaining = total - paid;
    const payments = installmentPayments.filter(p => p.installment_id === instId && p.status !== 'paid');
    const nextPayment = payments.sort((a, b) => a.month_number - b.month_number)[0];
    const overdue = payments.filter(p => p.status === 'overdue');

    let msg = `مرحباً ${inst.customer_name || 'عميلنا'} 👋\n`;
    msg += `📋 تذكير بعقد الأقساط:\n`;
    msg += `💰 المتبقي: ${remaining.toFixed(2)} ج.م\n`;
    if (nextPayment) msg += `📅 القسط الجاي (${nextPayment.month_number}/${inst.months}): ${nextPayment.amount.toFixed(2)} ج.م بتاريخ ${nextPayment.due_date}\n`;
    if (overdue.length > 0) msg += `⚠️ ${overdue.length} أقساط متأخرة\n`;
    msg += `شكراً لتعاونكم 🙏`;

    const phone = inst.customer_phone || allCustomers.find(c => c.id === inst.customer_id)?.phone;
    if (phone) {
        window.open(`https://wa.me/${cleanPhoneForWA(phone)}?text=${encodeURIComponent(msg)}`, '_blank');
        showToast('📱 تم فتح واتساب', 'success');
    } else {
        showToast('⚠️ لا يوجد رقم هاتف', 'error');
    }
}

function printInstallmentContract(instId) {
    const inst = installments.find(i => i.id === instId);
    if (!inst) return;
    const total = parseFloat(inst.final_amount || inst.total_amount) || 0;
    const payments = installmentPayments.filter(p => p.installment_id === instId).sort((a, b) => a.month_number - b.month_number);
    const storeName = localStorage.getItem('active_store_name') || 'المحل';

    let scheduleRows = payments.map(p => {
        const icon = p.status === 'paid' ? '✅' : '⏳';
        return `<tr><td style="border:1px solid #ddd;padding:6px;text-align:center;">${p.month_number}</td><td style="border:1px solid #ddd;padding:6px;text-align:center;">${p.amount.toFixed(2)}</td><td style="border:1px solid #ddd;padding:6px;text-align:center;">${p.due_date}</td><td style="border:1px solid #ddd;padding:6px;text-align:center;">${p.paid_date || '—'}</td><td style="border:1px solid #ddd;padding:6px;text-align:center;">${icon}</td></tr>`;
    }).join('');

    const printContent = `
    <div style="direction:rtl;font-family:Arial,sans-serif;padding:20px;max-width:800px;margin:0 auto;">
        <h2 style="text-align:center;border-bottom:2px solid #333;padding-bottom:10px;">عقد أقساط - ${storeName}</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:15px 0;font-size:13px;">
            <div><strong>العميل:</strong> ${inst.customer_name || '—'}</div>
            <div><strong>رقم الفاتورة:</strong> ${inst.invoice_number || '—'}</div>
            <div><strong>المبلغ الأساسي:</strong> ${parseFloat(inst.total_amount).toFixed(2)} ج.م</div>
            <div><strong>نسبة الفائدة:</strong> ${inst.interest_rate || 0}% = ${inst.interest_amount || 0} ج.م</div>
            <div><strong>الإجمالي النهائي:</strong> ${total.toFixed(2)} ج.م</div>
            <div><strong>عدد الأشهر:</strong> ${inst.months}</div>
            <div><strong>القسط الشهري:</strong> ${inst.monthly_payment.toFixed(2)} ج.م</div>
            <div><strong>تاريخ البدء:</strong> ${inst.start_date}</div>
        </div>
        <h3 style="margin:15px 0 5px;">جدول السداد</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead><tr style="background:#f0f0f0;"><th style="border:1px solid #ddd;padding:6px;">الشهر</th><th style="border:1px solid #ddd;padding:6px;">المبلغ</th><th style="border:1px solid #ddd;padding:6px;">الاستحقاق</th><th style="border:1px solid #ddd;padding:6px;">الدفع</th><th style="border:1px solid #ddd;padding:6px;">الحالة</th></tr></thead>
            <tbody>${scheduleRows}</tbody>
        </table>
        <div style="margin-top:30px;font-size:11px;text-align:center;color:#666;">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</div>
    </div>`;

    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>عقد أقساط - ${inst.customer_name}</title></head><body onload="window.print();">${printContent}</body></html>`);
    win.document.close();
}

function exportInstallmentsCSV() {
    let csv = 'العميل,الفاتورة,الإجمالي,المدفوع,المتبقي,الأشهر,القسط الشهري,الحالة\n';
    installments.forEach(i => {
        const total = parseFloat(i.final_amount || i.total_amount) || 0;
        const remaining = total - (parseFloat(i.paid_amount) || 0);
        csv += `"${i.customer_name || ''}","${i.invoice_number || ''}",${total.toFixed(2)},${(parseFloat(i.paid_amount) || 0).toFixed(2)},${remaining.toFixed(2)},${i.months},${i.monthly_payment.toFixed(2)},"${i.status}"\n`;
    });
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `installments_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('📥 تم التصدير', 'success');
}

function searchInstallments(query) {
    const q = query.toLowerCase();
    const rows = document.querySelectorAll('#installmentsTableBody tr');
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
}
